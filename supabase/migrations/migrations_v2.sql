-- ==============================================================================
-- MIGRATIONS V2 — APRENDE+ — PLANO 2.0 DE PROVAS
-- Execute este script COMPLETO no SQL Editor do Supabase (painel online).
-- É seguro rodar múltiplas vezes (idempotente).
-- ==============================================================================

-- ==============================================================================
-- PARTE 1: CONSTRAINTS DE STATUS
-- Garante que 'submitted', 'late' e 'graded' são todos aceitos.
-- ==============================================================================

-- Provas
ALTER TABLE public.exam_submissions DROP CONSTRAINT IF EXISTS exam_submissions_status_check;
ALTER TABLE public.exam_submissions ADD CONSTRAINT exam_submissions_status_check 
  CHECK (status IN ('submitted', 'late', 'graded'));

-- Atividades  
ALTER TABLE public.activity_submissions DROP CONSTRAINT IF EXISTS activity_submissions_status_check;
ALTER TABLE public.activity_submissions ADD CONSTRAINT activity_submissions_status_check 
  CHECK (status IN ('submitted', 'late', 'graded'));

-- ==============================================================================
-- PARTE 2: HABILITAR REALTIME (para sistema reativo sem F5)
-- ==============================================================================

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

-- ==============================================================================
-- PARTE 3: FUNÇÃO AUXILIAR ANTI-RECURSÃO (para RLS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_user_institution()
RETURNS UUID AS $$
  SELECT institution_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ==============================================================================
-- PARTE 4: ATIVAR RLS
-- ==============================================================================

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_submissions ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- PARTE 5: POLÍTICAS (RLS) — USUÁRIOS
-- ==============================================================================

DROP POLICY IF EXISTS "Permitir leitura de usuários da mesma instituição" ON public.users;
CREATE POLICY "Permitir leitura de usuários da mesma instituição"
ON public.users FOR SELECT
USING (
  institution_id = public.get_auth_user_institution()
);

-- ==============================================================================
-- PARTE 6: POLÍTICAS (RLS) — EXAMS
-- ==============================================================================

DROP POLICY IF EXISTS "Leitura de provas para todos da instituição" ON public.exams;
DROP POLICY IF EXISTS "Professores e admins gerenciam provas" ON public.exams;
DROP POLICY IF EXISTS "Permitir leitura de provas da instituição" ON public.exams;
DROP POLICY IF EXISTS "Professores podem criar provas" ON public.exams;
DROP POLICY IF EXISTS "Professor pode atualizar suas provas" ON public.exams;
DROP POLICY IF EXISTS "Professor pode deletar suas provas" ON public.exams;

-- Todos da instituição podem ler provas
CREATE POLICY "Leitura de provas para todos da instituição"
ON public.exams FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.institution_id = (SELECT institution_id FROM public.subjects s WHERE s.id = exams.subject_id)
  )
);

-- Professores e admins gerenciam provas (INSERT, UPDATE, DELETE)
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

-- ==============================================================================
-- PARTE 7: POLÍTICAS (RLS) — EXAM_SUBMISSIONS
-- ==============================================================================

DROP POLICY IF EXISTS "Leitura de submissões de provas" ON public.exam_submissions;
DROP POLICY IF EXISTS "Alunos inserem submissão de prova" ON public.exam_submissions;
DROP POLICY IF EXISTS "Professores e admins atualizam submissões de provas" ON public.exam_submissions;
DROP POLICY IF EXISTS "Alunos podem criar submissão de prova" ON public.exam_submissions;
DROP POLICY IF EXISTS "Professores e admins podem atualizar submissões" ON public.exam_submissions;

-- Leitura: aluno vê as suas + professor da prova + admins da instituição
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

-- Alunos inserem suas submissões
CREATE POLICY "Alunos inserem submissão de prova"
ON public.exam_submissions FOR INSERT
WITH CHECK (
  student_id = auth.uid()
);

-- Professores e admins atualizam (para dar notas)
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

-- ==============================================================================
-- PARTE 8: POLÍTICAS (RLS) — ACTIVITIES
-- ==============================================================================

DROP POLICY IF EXISTS "Leitura de atividades" ON public.activities;
DROP POLICY IF EXISTS "Professores e admins gerenciam atividades" ON public.activities;

CREATE POLICY "Leitura de atividades"
ON public.activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.institution_id = (SELECT institution_id FROM public.subjects s WHERE s.id = activities.subject_id)
  )
);

CREATE POLICY "Professores e admins gerenciam atividades"
ON public.activities FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.institution_id = (SELECT institution_id FROM public.subjects s WHERE s.id = activities.subject_id)
    AND u.role IN ('teacher', 'admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.institution_id = (SELECT institution_id FROM public.subjects s WHERE s.id = activities.subject_id)
    AND u.role IN ('teacher', 'admin', 'super_admin')
  )
);

-- ==============================================================================
-- PARTE 9: POLÍTICAS (RLS) — ACTIVITY_SUBMISSIONS
-- ==============================================================================

DROP POLICY IF EXISTS "Leitura de submissões de atividades" ON public.activity_submissions;
DROP POLICY IF EXISTS "Alunos inserem submissão de atividade" ON public.activity_submissions;
DROP POLICY IF EXISTS "Professores e admins atualizam submissões de atividades" ON public.activity_submissions;
DROP POLICY IF EXISTS "Leitura de submissões" ON public.activity_submissions;
DROP POLICY IF EXISTS "Alunos podem criar submissão" ON public.activity_submissions;
DROP POLICY IF EXISTS "Professores podem atualizar submissões" ON public.activity_submissions;

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

CREATE POLICY "Alunos inserem submissão de atividade"
ON public.activity_submissions FOR INSERT
WITH CHECK (
  student_id = auth.uid()
);

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

-- ==============================================================================
-- PARTE 10: SUBJECT_ENROLLMENTS — garantir leitura para professores
-- (necessário para Submissions.tsx mostrar alunos ausentes)
-- ==============================================================================

ALTER TABLE public.subject_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de matrículas" ON public.subject_enrollments;
CREATE POLICY "Leitura de matrículas"
ON public.subject_enrollments FOR SELECT
USING (
  -- Aluno vê suas próprias matrículas
  student_id = auth.uid()
  OR
  -- Professor vê matrículas das suas disciplinas
  EXISTS (
    SELECT 1 FROM public.subjects s
    WHERE s.id = subject_enrollments.subject_id
    AND s.teacher_id = auth.uid()
  )
  OR
  -- Admin vê matrículas da instituição
  EXISTS (
    SELECT 1 FROM public.subjects s
    WHERE s.id = subject_enrollments.subject_id
    AND s.institution_id = public.get_auth_user_institution()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  )
);

-- ==============================================================================
-- FIM DO SCRIPT
-- Após executar, volte ao app e teste!
-- ==============================================================================
