-- ==============================================================================
-- SCHEMA COMPLETO — APRENDE+
-- Versão: 1.3.0 (Fase D.3 concluída)
-- Última atualização: Maio de 2026
--
-- INSTRUÇÕES:
-- Execute este script no SQL Editor do Supabase para configurar o banco de dados.
-- Recomenda-se executar em um projeto limpo (tabelas novas).
-- ==============================================================================

-- Extensão necessária para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. INSTITUIÇÕES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    school_type TEXT NOT NULL CHECK (school_type IN ('faculdade', 'escola', 'cursinho')),
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 2. USUÁRIOS
-- Espelha o auth.users do Supabase Auth
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,                          -- mesmo ID do auth.users
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'teacher', 'student')),
    must_change_password BOOLEAN DEFAULT true,
    class_id UUID,                                -- turma base (para alunos)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 3. TURMAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    shift TEXT DEFAULT 'Manhã' CHECK (shift IN ('Manhã', 'Tarde', 'Noite', 'Integral')),
    year TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar FK de users.class_id para classes após criar a tabela
ALTER TABLE users ADD CONSTRAINT users_class_id_fkey
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;

-- ==============================================================================
-- 4. DISCIPLINAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 5. MATRÍCULAS (Tabela Pivot Aluno ↔ Disciplina)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS subject_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_id)                -- impede duplicata
);

-- ==============================================================================
-- 6. AULAS (Materiais do Professor)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('youtube', 'pdf', 'video')),
    url TEXT NOT NULL,
    duration TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 7. ATIVIDADES
-- As questões são armazenadas como JSONB:
-- [{ "id": "q-...", "type": "multiple_choice", "text": "...", "options": [...], "correctAnswer": "...", "points": 10 }]
-- ==============================================================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    instructions TEXT,
    questions JSONB NOT NULL DEFAULT '[]',
    total_points NUMERIC DEFAULT 0,
    deadline_date TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    max_attempts INTEGER DEFAULT 1,
    shuffle_questions BOOLEAN DEFAULT false,
    allow_review BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 8. PROVAS
-- Similar às Atividades, mas com campos adicionais (peso, duração)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    instructions TEXT,
    questions JSONB NOT NULL DEFAULT '[]',
    total_points NUMERIC DEFAULT 0,
    weight NUMERIC DEFAULT 1.0,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    deadline_date TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    max_attempts INTEGER DEFAULT 1,
    shuffle_questions BOOLEAN DEFAULT false,
    allow_review BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 9. SUBMISSÕES DE ATIVIDADES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS activity_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}',          -- { "q-id": "resposta_do_aluno" }
    auto_score NUMERIC DEFAULT 0,                 -- Calculado automaticamente no envio
    manual_score NUMERIC,                         -- Atribuído pelo professor (dissertativas)
    final_score NUMERIC,                          -- auto_score + manual_score
    teacher_feedback TEXT,                        -- Feedback textual do professor
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'graded')),
    UNIQUE(activity_id, student_id)               -- Um aluno só pode enviar uma vez
);

-- ==============================================================================
-- 10. SUBMISSÕES DE PROVAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS exam_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}',
    auto_score NUMERIC DEFAULT 0,
    manual_score NUMERIC,
    final_score NUMERIC,
    teacher_feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'graded')),
    UNIQUE(exam_id, student_id)
);

-- ==============================================================================
-- 11. NOTIFICAÇÕES (Fase E.2 - Planejado)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('activity', 'exam', 'grade', 'system', 'lesson')),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Habilitar RLS em todas as tabelas
-- ==============================================================================
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA (RLS Policies)
-- Nota: Para o MVP, o acesso é feito via Service Role (bypassa RLS).
-- As policies abaixo serão ativadas na Fase F.2.
-- ==============================================================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "users_see_own_profile"
ON users FOR SELECT TO authenticated
USING (id = auth.uid());

-- Alunos veem submissões próprias
CREATE POLICY "students_manage_own_activity_submissions"
ON activity_submissions FOR ALL TO authenticated
USING (student_id = auth.uid());

-- Professores veem submissões das suas atividades
CREATE POLICY "teachers_see_activity_submissions"
ON activity_submissions FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM activities a
        WHERE a.id = activity_submissions.activity_id
        AND a.teacher_id = auth.uid()
    )
);

-- Professores podem atualizar submissões das suas atividades (para correção)
CREATE POLICY "teachers_grade_activity_submissions"
ON activity_submissions FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM activities a
        WHERE a.id = activity_submissions.activity_id
        AND a.teacher_id = auth.uid()
    )
);

-- Alunos veem atividades das disciplinas em que estão matriculados
CREATE POLICY "students_see_enrolled_activities"
ON activities FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM subject_enrollments se
        WHERE se.subject_id = activities.subject_id
        AND se.student_id = auth.uid()
    )
);

-- Professores gerenciam suas atividades
CREATE POLICY "teachers_manage_own_activities"
ON activities FOR ALL TO authenticated
USING (teacher_id = auth.uid());

-- Usuários veem notificações próprias
CREATE POLICY "users_see_own_notifications"
ON notifications FOR ALL TO authenticated
USING (user_id = auth.uid());

-- ==============================================================================
-- FIM DO SCHEMA
-- ==============================================================================
