-- ==============================================================================
-- REFINAMENTOS DE BANCO DE DADOS: CRIAÇÃO DA TABELA DE AULAS (LESSONS) E AJUSTES DE RLS
-- Execute este script no SQL Editor do Supabase para atualizar a infraestrutura.
-- ==============================================================================

-- 1. CRIAÇÃO DA TABELA DE AULAS (LESSONS)
-- Armazena o material complementar de vídeo ou PDF publicado pelos professores.
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('youtube', 'pdf', 'video')),
    url TEXT NOT NULL,
    duration TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativa RLS para a tabela de aulas
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS DE RLS PARA A TABELA LESSONS
DROP POLICY IF EXISTS "Leitura de aulas para todos da instituição" ON public.lessons;
CREATE POLICY "Leitura de aulas para todos da instituição"
ON public.lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.institution_id = (SELECT institution_id FROM public.subjects s WHERE s.id = lessons.subject_id)
  )
);

DROP POLICY IF EXISTS "Professores e admins gerenciam suas aulas" ON public.lessons;
CREATE POLICY "Professores e admins gerenciam suas aulas"
ON public.lessons FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'super_admin')
  )
  OR teacher_id = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'super_admin')
  )
  OR teacher_id = auth.uid()
);

-- 3. AJUSTE DE POLÍTICAS DE RLS PARA EXAMES (EXAMS) - BLOQUEIO DE ESCRITA DE OUTROS PROFESSORES
DROP POLICY IF EXISTS "Professores e admins gerenciam provas" ON public.exams;

-- Inserção permitida para professores/admins da mesma instituição da disciplina
CREATE POLICY "Professores e admins inserem provas"
ON public.exams FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.institution_id = (SELECT institution_id FROM public.subjects s WHERE s.id = exams.subject_id)
    AND u.role IN ('teacher', 'admin', 'super_admin')
  )
);

-- Atualização e deleção limitadas ao criador da prova ou aos administradores
CREATE POLICY "Professores e admins atualizam provas"
ON public.exams FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'super_admin')
  )
  OR teacher_id = auth.uid()
);

CREATE POLICY "Professores e admins deletam provas"
ON public.exams FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'super_admin')
  )
  OR teacher_id = auth.uid()
);

-- 4. AJUSTE DE POLÍTICAS DE RLS PARA ATIVIDADES (ACTIVITIES) - BLOQUEIO DE ESCRITA DE OUTROS PROFESSORES
DROP POLICY IF EXISTS "Professores e admins gerenciam atividades" ON public.activities;

CREATE POLICY "Professores e admins inserem atividades"
ON public.activities FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.institution_id = (SELECT institution_id FROM public.subjects s WHERE s.id = activities.subject_id)
    AND u.role IN ('teacher', 'admin', 'super_admin')
  )
);

CREATE POLICY "Professores e admins atualizam atividades"
ON public.activities FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'super_admin')
  )
  OR teacher_id = auth.uid()
);

CREATE POLICY "Professores e admins deletam atividades"
ON public.activities FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'super_admin')
  )
  OR teacher_id = auth.uid()
);

-- 5. ADICIONAR COLUNAS DE FEEDBACK POR QUESTÃO NAS SUBMISSÕES
ALTER TABLE public.activity_submissions ADD COLUMN IF NOT EXISTS question_feedback JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.exam_submissions ADD COLUMN IF NOT EXISTS question_feedback JSONB DEFAULT '{}'::jsonb;
