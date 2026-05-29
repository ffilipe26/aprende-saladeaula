-- ==============================================================================
-- CORREÇÕES DE RLS (SEGURANÇA) E REALTIME (SISTEMA REATIVO)
-- Execute este script no SQL Editor do Supabase.
-- ==============================================================================

-- 1. HABILITAR REALTIME PARA O SISTEMA FICAR REATIVO SEM F5
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'activities'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE activities;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'exams'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE exams;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'activity_submissions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE activity_submissions;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'exam_submissions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE exam_submissions;
    END IF;
  END
  $$;
COMMIT;

-- 2. CORREÇÃO DE POLÍTICAS (RLS) DAS PROVAS E SUBMISSÕES

-- ATIVAR RLS (Por segurança)
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_submissions ENABLE ROW LEVEL SECURITY;

-- REDEFINIR CONSTRAINTS DE STATUS DE SUBMISSÃO
-- Garante que os valores permitidos sejam exatamente os que o frontend envia ('submitted', 'late', 'graded')
ALTER TABLE public.exam_submissions DROP CONSTRAINT IF EXISTS exam_submissions_status_check;
ALTER TABLE public.exam_submissions ADD CONSTRAINT exam_submissions_status_check CHECK (status IN ('submitted', 'late', 'graded'));

ALTER TABLE public.activity_submissions DROP CONSTRAINT IF EXISTS activity_submissions_status_check;
ALTER TABLE public.activity_submissions ADD CONSTRAINT activity_submissions_status_check CHECK (status IN ('submitted', 'late', 'graded'));

-- ------------------------------------------------------------------------------
-- 1.5 USUÁRIOS (Evitando recursão e liberando visualização interna da instituição)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_auth_user_institution()
RETURNS UUID AS $$
  SELECT institution_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "Permitir leitura de usuários da mesma instituição" ON public.users;
CREATE POLICY "Permitir leitura de usuários da mesma instituição"
ON public.users FOR SELECT
USING (
  institution_id = public.get_auth_user_institution()
);

-- ------------------------------------------------------------------------------
-- EXAMES (exams)
-- ------------------------------------------------------------------------------
-- Remove as políticas atuais para recriar
DROP POLICY IF EXISTS "Leitura de provas para todos da instituição" ON public.exams;
DROP POLICY IF EXISTS "Professores e admins gerenciam provas" ON public.exams;
DROP POLICY IF EXISTS "Permitir leitura de provas da instituição" ON public.exams;
DROP POLICY IF EXISTS "Professores podem criar provas" ON public.exams;
DROP POLICY IF EXISTS "Professor pode atualizar suas provas" ON public.exams;
DROP POLICY IF EXISTS "Professor pode deletar suas provas" ON public.exams;

-- Qualquer usuário (aluno, prof, admin) pode ler provas da sua instituição
CREATE POLICY "Leitura de provas para todos da instituição" 
ON public.exams FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.institution_id = (SELECT institution_id FROM public.subjects s WHERE s.id = exams.subject_id)
  )
);

-- Professores e Admins podem Inserir, Atualizar e Deletar provas da sua instituição
CREATE POLICY "Professores e admins gerenciam provas" 
ON public.exams FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.institution_id = (SELECT institution_id FROM public.subjects s WHERE s.id = exams.subject_id)
    AND u.role IN ('teacher', 'admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.institution_id = (SELECT institution_id FROM public.subjects s WHERE s.id = exams.subject_id)
    AND u.role IN ('teacher', 'admin', 'super_admin')
  )
);

-- ------------------------------------------------------------------------------
-- SUBMISSÕES DE EXAMES (exam_submissions)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Leitura de submissões de provas" ON public.exam_submissions;
DROP POLICY IF EXISTS "Alunos inserem submissão de prova" ON public.exam_submissions;
DROP POLICY IF EXISTS "Professores e admins atualizam submissões de provas" ON public.exam_submissions;
DROP POLICY IF EXISTS "Alunos podem criar submissão de prova" ON public.exam_submissions;
DROP POLICY IF EXISTS "Professores e admins podem atualizar submissões" ON public.exam_submissions;
DROP POLICY IF EXISTS "Professor pode deletar suas provas" ON public.exam_submissions;

-- Aluno pode ler as suas próprias; Prof da prova e Admins da instituição também
CREATE POLICY "Leitura de submissões de provas" 
ON public.exam_submissions FOR SELECT 
USING (
  student_id = auth.uid()
  OR 
  EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_submissions.exam_id
    AND e.teacher_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.exams e
    JOIN public.subjects s ON s.id = e.subject_id
    WHERE e.id = exam_submissions.exam_id
    AND s.institution_id = public.get_auth_user_institution()
    AND EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  )
);

-- Alunos inserem suas próprias submissões
CREATE POLICY "Alunos inserem submissão de prova" 
ON public.exam_submissions FOR INSERT 
WITH CHECK (
  student_id = auth.uid()
);

-- Professores e admins atualizam (para dar notas, etc)
CREATE POLICY "Professores e admins atualizam submissões de provas" 
ON public.exam_submissions FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_submissions.exam_id
    AND e.teacher_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.exams e
    JOIN public.subjects s ON s.id = e.subject_id
    WHERE e.id = exam_submissions.exam_id
    AND s.institution_id = public.get_auth_user_institution()
    AND EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  )
);

-- ------------------------------------------------------------------------------
-- SUBMISSÕES DE ATIVIDADES (activity_submissions)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Leitura de submissões" ON public.activity_submissions;
DROP POLICY IF EXISTS "Alunos podem criar submissão" ON public.activity_submissions;
DROP POLICY IF EXISTS "Professores podem atualizar submissões" ON public.activity_submissions;
DROP POLICY IF EXISTS "Professores e admins atualizam submissões de atividades" ON public.activity_submissions;
DROP POLICY IF EXISTS "Alunos inserem submissão de atividade" ON public.activity_submissions;
DROP POLICY IF EXISTS "Leitura de submissões de atividades" ON public.activity_submissions;

-- Aluno pode ler as suas próprias; Prof da atividade e Admins da instituição também
CREATE POLICY "Leitura de submissões de atividades" 
ON public.activity_submissions FOR SELECT 
USING (
  student_id = auth.uid()
  OR 
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = activity_submissions.activity_id
    AND a.teacher_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.activities a
    JOIN public.subjects s ON s.id = a.subject_id
    WHERE a.id = activity_submissions.activity_id
    AND s.institution_id = public.get_auth_user_institution()
    AND EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  )
);

-- Alunos inserem suas próprias submissões
CREATE POLICY "Alunos inserem submissão de atividade" 
ON public.activity_submissions FOR INSERT 
WITH CHECK (
  student_id = auth.uid()
);

-- Professores e admins atualizam (para dar notas, etc)
CREATE POLICY "Professores e admins atualizam submissões de atividades" 
ON public.activity_submissions FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = activity_submissions.activity_id
    AND a.teacher_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.activities a
    JOIN public.subjects s ON s.id = a.subject_id
    WHERE a.id = activity_submissions.activity_id
    AND s.institution_id = public.get_auth_user_institution()
    AND EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  )
);
