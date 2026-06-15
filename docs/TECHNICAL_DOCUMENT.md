# 📚 Aprende+ — Documentação Técnica Completa

> **Versão:** 1.4.0 (Arquitetura de Segurança - Edge Functions)
> **Última atualização:** 15 de Junho de 2026
> **Mantenedores:** Equipe Aprende+

---

## Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Tecnologias e Dependências](#2-tecnologias-e-dependências)
3. [Arquitetura e Estrutura de Pastas](#3-arquitetura-e-estrutura-de-pastas)
4. [Banco de Dados — Supabase](#4-banco-de-dados--supabase)
5. [Autenticação e Gerenciamento de Sessão](#5-autenticação-e-gerenciamento-de-sessão)
6. [Perfis de Usuário e Controle de Acesso (RBAC)](#6-perfis-de-usuário-e-controle-de-acesso-rbac)
7. [Módulos e Páginas](#7-módulos-e-páginas)
8. [Fluxo de Dados — App.tsx como Hub Central](#8-fluxo-de-dados--apptsx-como-hub-central)
9. [O Ecossistema de Atividades (Etapa D.3)](#9-o-ecossistema-de-atividades-etapa-d3)
10. [Serviços — Camada de API](#10-serviços--camada-de-api)
11. [Modo Demo vs. Modo Real](#11-modo-demo-vs-modo-real)
12. [Sistema de Notificações](#12-sistema-de-notificações)
13. [Design System e Estilização](#13-design-system-e-estilização)
14. [Variáveis de Ambiente](#14-variáveis-de-ambiente)
15. [Como Rodar o Projeto](#15-como-rodar-o-projeto)
16. [Histórico de Evolução (Etapas)](#16-histórico-de-evolução-etapas)
17. [Problemas Conhecidos e Decisões Técnicas](#17-problemas-conhecidos-e-decisões-técnicas)
18. [Próximos Passos Planejados](#18-próximos-passos-planejados)

---

## 1. Visão Geral do Projeto

O **Aprende+** é uma plataforma educacional SaaS (Software as a Service) do tipo LMS (Learning Management System), desenvolvida para instituições de ensino (faculdades, escolas e cursinhos). O sistema permite que administradores gerenciem toda a instituição, professores criem e acompanhem atividades e avaliações, e alunos acessem e realizem suas tarefas com correção automática.

### Objetivo Principal

Criar um ecossistema educacional completo, moderno e premium que conecta:

- **Admin/Super Admin** → Gerencia a instituição, turmas, disciplinas e membros.
- **Professor** → Cria atividades e avaliações com correção automática, acompanha alunos.
- **Aluno** → Acessa materiais, realiza atividades e acompanha seu desempenho.

### Stack Resumido

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilização | TailwindCSS + CSS Variables |
| Animações | Framer Motion (motion/react) |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) |
| Ícones | Lucide React |
| Build | Vite |

---

## 2. Tecnologias e Dependências

### Principais

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "typescript": "^5.x",
  "vite": "^5.x",
  "@supabase/supabase-js": "^2.x",
  "motion": "^11.x",
  "lucide-react": "^0.x",
  "tailwindcss": "^3.x"
}
```

### Supabase

O projeto utiliza uma arquitetura de segurança moderna, separando operações regulares de operações privilegiadas:

| Método | Execução | Chave usada | Propósito |
|---------|---------|-------------|-----------|
| Cliente `supabase` | Frontend (`src/lib/supabase.ts`) | `VITE_SUPABASE_ANON_KEY` | Autenticação, navegação e operações limitadas pelo RLS (Row Level Security) |
| Edge Functions | Backend (Deno) | `SUPABASE_SERVICE_ROLE_KEY` | Criação de usuários, exclusão e ações que requerem privilégios elevados. A chave não fica exposta no frontend. |

> ✅ **Segurança:** O projeto removeu completamente a Service Role Key do frontend, migrando as funções de administração para Edge Functions do Supabase, garantindo que o cliente não tenha acesso direto para bypassar RLS.

---

## 3. Arquitetura e Estrutura de Pastas

```
aprende+gravity/
├── public/
│   └── logo.png                  # Logo da plataforma
├── docs/                         # Documentação técnica (este arquivo)
│   ├── TECHNICAL_DOCUMENT.md
│   ├── ROADMAP.md
│   └── planning/
│       ├── etapa_D1_D2.md
│       └── etapa_D3.md
├── src/
│   ├── main.tsx                  # Entry point React
│   ├── App.tsx                   # Componente raiz — orquestrador de estado global
│   ├── types.ts                  # Todos os tipos TypeScript do projeto
│   ├── constants.ts              # Dados mockados para o Modo Demo
│   ├── index.css                 # Design System global (variáveis CSS, glassmorphism)
│   │
│   ├── lib/                      # Camada de serviços
│   │   ├── auth.ts               # Funções de login/logout
│   │   ├── adminService.ts       # Serviços administrativos (chama Edge Functions e RLS)
│   │   ├── activityService.ts    # Lógica de atividades e provas
│   │
│   ├── pages/                    # Páginas principais (uma por rota/seção)
│   │   ├── LandingPage.tsx       # Tela inicial pública
│   │   ├── AuthPage.tsx          # Login / Cadastro
│   │   ├── ChangePassword.tsx    # Troca de senha obrigatória no 1º login
│   │   ├── InstitutionOnboarding.tsx  # Cadastro de nova instituição
│   │   ├── AdminDashboard.tsx    # Painel do Admin — gerencia tudo
│   │   ├── AdminPanel.tsx        # Aba de membros — CRUD de usuários e disciplinas
│   │   ├── TeacherDashboard.tsx  # Central do Professor
│   │   ├── Dashboard.tsx         # Central do Aluno
│   │   ├── Activities.tsx        # Lista de Atividades (aluno, professor, admin)
│   │   ├── ActivityCreator.tsx   # Criador premium de atividades (professor)
│   │   ├── ActivityDetail.tsx    # Resolução de atividade (aluno)
│   │   ├── Exams.tsx             # Lista de Provas
│   │   ├── Lessons.tsx           # Aulas gravadas
│   │   ├── Insights.tsx          # Análise de dados / Relatórios
│   │   ├── CalendarView.tsx      # Calendário acadêmico
│   │   ├── Members.tsx           # Lista de membros (view)
│   │   └── Settings.tsx          # Configurações de conta
│   │
│   ├── components/               # Componentes reutilizáveis
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx       # Menu lateral de navegação
│   │   │   └── Header.tsx        # Cabeçalho com notificações e perfil
│   │   ├── forms/
│   │   │   ├── ActivityForm.tsx  # Formulário legado de atividade (modal — descontinuado)
│   │   │   ├── ExamForm.tsx      # Formulário de criação de prova
│   │   │   └── LessonForm.tsx    # Formulário de criação de aula
│   │   └── ui/
│   │       └── ConfirmationModal.tsx  # Modal de confirmação genérico
│   │
│   └── utils/
│       └── dateUtils.ts          # Utilitários de datas (getTimeRemaining, formatDate)
│
├── .env                          # Variáveis de ambiente (NÃO commitar)
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 4. Banco de Dados — Supabase

### Esquema Relacional

```
institutions
    ↓ (1:N)
users ←→ classes (N:N via class_id no user)
    ↓
subjects (tem institution_id, class_id, teacher_id)
    ↓ (1:N)
subject_enrollments (student_id, subject_id) — tabela pivot
    ↓ (1:N)
activities (subject_id, teacher_id)
    ↓ (1:N)
activity_submissions (activity_id, student_id)

lessons (subject_id, teacher_id)

exams (subject_id, teacher_id)
exam_submissions (exam_id, student_id)
```

### Tabelas Detalhadas

#### `institutions`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador único |
| `name` | TEXT | Nome da instituição |
| `school_type` | TEXT | `faculdade`, `escola`, `cursinho` |
| `created_at` | TIMESTAMPTZ | Data de criação |

#### `users`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Referencia `auth.users(id)` |
| `institution_id` | UUID FK | Referencia `institutions` |
| `name` | TEXT | Nome completo |
| `email` | TEXT UNIQUE | Email de login |
| `role` | TEXT | `super_admin`, `admin`, `teacher`, `student` |
| `must_change_password` | BOOLEAN | Flag para troca obrigatória no 1º login |
| `class_id` | UUID FK | Turma base do aluno (opcional) |
| `created_at` | TIMESTAMPTZ | Data de criação |

#### `classes`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador único |
| `institution_id` | UUID FK | Referencia `institutions` |
| `name` | TEXT | Nome da turma (ex: "Turma A 2025") |
| `shift` | TEXT | `Manhã`, `Tarde`, `Noite`, `Integral` |
| `year` | TEXT | Ano letivo |

#### `subjects`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador único |
| `institution_id` | UUID FK | Referencia `institutions` |
| `class_id` | UUID FK | Turma associada |
| `teacher_id` | UUID FK | Professor responsável |
| `name` | TEXT | Nome da disciplina |
| `code` | TEXT | Código (ex: "MAT101") |

#### `subject_enrollments`
Tabela pivot que faz a relação N:N entre alunos e disciplinas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador único |
| `student_id` | UUID FK | Referencia `users` |
| `subject_id` | UUID FK | Referencia `subjects` |
| `class_id` | UUID FK | Turma no momento da matrícula |
| `enrolled_at` | TIMESTAMPTZ | Data da matrícula |
| **UNIQUE** | | `(student_id, subject_id)` — evita matrícula duplicada |

#### `activities`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador único |
| `subject_id` | UUID FK | Disciplina vinculada |
| `teacher_id` | UUID FK | Professor criador |
| `title` | TEXT | Título da atividade |
| `instructions` | TEXT | Instruções para o aluno |
| `questions` | JSONB | Array de questões (ver abaixo) |
| `total_points` | NUMERIC | Total de pontos |
| `deadline_date` | TIMESTAMPTZ | Prazo de entrega |
| `status` | TEXT | `draft` ou `published` |

**Estrutura do JSON `questions`:**
```json
[
  {
    "id": "q-1234567890",
    "type": "multiple_choice",
    "text": "Qual é a capital do Brasil?",
    "options": ["São Paulo", "Brasília", "Rio de Janeiro", "Salvador"],
    "correctAnswer": "Brasília",
    "points": 10
  },
  {
    "id": "q-0987654321",
    "type": "true_false",
    "text": "A água ferve a 100°C ao nível do mar.",
    "correctAnswer": "true",
    "points": 5
  },
  {
    "id": "q-1111111111",
    "type": "essay",
    "text": "Explique o processo de fotossíntese.",
    "points": 20
  }
]
```

#### `activity_submissions`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador único |
| `activity_id` | UUID FK | Atividade submetida |
| `student_id` | UUID FK | Aluno que submeteu |
| `answers` | JSONB | `{ "q-id": "resposta_do_aluno" }` |
| `auto_score` | NUMERIC | Nota calculada automaticamente |
| `manual_score` | NUMERIC | Nota atribuída manualmente (dissertativas) |
| `final_score` | NUMERIC | Nota final (auto + manual) |
| `teacher_feedback` | TEXT | Feedback do professor |
| `submitted_at` | TIMESTAMPTZ | Data/hora da submissão |
| `status` | TEXT | `submitted`, `graded` |

### Row Level Security (RLS)

RLS está habilitado em todas as tabelas. As políticas garantem:
- **Alunos:** Só visualizam atividades de disciplinas em que estão matriculados.
- **Professores:** Só visualizam/gerenciam atividades e submissões das suas disciplinas.
- **Admin/Edge Functions:** Acesso total via invocações no servidor (bypassa RLS com segurança).

---

## 5. Autenticação e Gerenciamento de Sessão

### Fluxo de Login

```
AuthPage (email/senha)
    ↓
authService.signIn()                    [src/lib/auth.ts]
    ↓
supabase.auth.signInWithPassword()      [Supabase Auth]
    ↓
Busca perfil em public.users
    ↓
Busca subjectIds/enrolledSubjectIds     [dependendo da role]
    ↓
Retorna AuthUser completo
    ↓
App.tsx: handleLogin() → finalizeLogin()
    ↓
loadInstitutionData()                   [busca turmas, disciplinas, atividades]
    ↓
Renderiza dashboard correto
```

### Recuperação de Sessão (F5 / Reload) e Expiração por Inatividade

O `App.tsx` usa `useEffect` de inicialização para verificar se a sessão foi expirada por inatividade antes de restaurar o estado:

1. **Verificação de Expiração**: O sistema checa se a diferença entre o tempo atual e o timestamp `last_active_time` (armazenado no `localStorage`) ultrapassa **24 horas**. Se ultrapassar, a sessão é encerrada (`supabase.auth.signOut()`) e o usuário é redirecionado para a tela de login.
2. **Recuperação de Sessão**: Caso o período de inatividade seja menor que 24 horas, o sistema tenta obter a sessão ativa do Supabase. Se bem-sucedido, o timestamp de atividade é atualizado e o estado do usuário é restaurado automaticamente.

```typescript
const lastActive = localStorage.getItem('last_active_time');
const now = Date.now();
if (lastActive && (now - parseInt(lastActive, 10) > 24 * 60 * 60 * 1000)) {
  await supabase.auth.signOut();
  localStorage.removeItem('last_active_time');
  setCurrentUser(null);
  setPublicScreen('landing');
} else {
  supabase.auth.getSession().then(...);
}
```

Isso garante o equilíbrio ideal (estilo Teams): manter a sessão aberta caso o navegador seja fechado e reaberto rapidamente, mas deslogar o usuário de forma segura se passar um dia inteiro inativo.

### Logout

Para evitar que o usuário fique "preso" no painel em caso de erros de rede ao chamar a API do Supabase, a função de logout é protegida com uma estrutura robusta:

```typescript
const handleLogout = async () => {
  try {
    await supabase.auth.signOut();  // Destrói o token na nuvem e localmente
  } catch (err) {
    console.error('Erro ao efetuar signOut no Supabase:', err);
  } finally {
    localStorage.removeItem('last_active_time'); // Limpa registro de inatividade
    setCurrentUser(null);
    setPublicScreen('landing');
    setShowLogoutModal(false);
    setActiveSection('dashboard');
    setNotifications([]);
  }
};
```

> ✅ **Segurança e Robustez:** A limpeza dos dados no `localStorage` e a redefinição de estado do React (`currentUser = null`) ocorrem dentro do bloco `finally`. Isso garante que o usuário de fato saia da conta visualmente e sua sessão expire localmente, independente de falhas ou timeouts de rede na chamada da API do Supabase.

### Troca Obrigatória de Senha

Qualquer usuário criado pelo admin tem a flag `must_change_password = true`. No primeiro login:
1. O sistema detecta a flag.
2. Renderiza a tela `ChangePassword.tsx` ao invés do dashboard.
3. Após trocar, o sistema atualiza a flag e prossegue normalmente.

---

## 6. Perfis de Usuário e Controle de Acesso (RBAC)

### Roles Disponíveis

| Role | Descrição | Acesso |
|------|-----------|--------|
| `super_admin` | Criador da instituição | Tudo + configurações da instituição |
| `admin` | Administrador escolar | Gerencia turmas, disciplinas, membros |
| `teacher` | Professor | Cria atividades, vê submissões das suas disciplinas |
| `student` | Aluno | Acessa e resolve atividades das suas disciplinas |

### Filtragem por Role no App.tsx

```typescript
const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
const isTeacher = currentUser?.role === 'teacher';
const isStudent = currentUser?.role === 'student';

// Atividades filtradas por contexto
const studentActivities = activities.filter(a => 
  (currentUser?.enrolledSubjectIds ?? []).includes(a.subjectId)
);
const teacherActivities = activities.filter(a => 
  a.teacherId === currentUser?.id
);
```

### Dashboard por Role

| Role | Componente | Conteúdo |
|------|-----------|----------|
| `admin` / `super_admin` | `AdminDashboard.tsx` | KPIs da instituição, criação de turmas/disciplinas |
| `teacher` | `TeacherDashboard.tsx` | Suas disciplinas, atividades criadas, atalhos de criação |
| `student` | `Dashboard.tsx` | Atividades pendentes, acesso rápido |

---

## 7. Módulos e Páginas

### `LandingPage.tsx`
- Página pública inicial da plataforma.
- Apresenta o produto e direciona para Login ou Cadastro de Instituição.

### `AuthPage.tsx`
- Modo `login`: Autenticação via Supabase Auth.
- Modo `register`: Cadastro de novo usuário (fluxo de aluno autoregistrado, se habilitado).
- Integra com `authService.signIn()`.

### `InstitutionOnboarding.tsx`
- Wizard de cadastro de nova instituição.
- Cria a instituição e o primeiro `super_admin`.
- Chama `adminService.createInstitutionAndAdmin()`.

### `AdminDashboard.tsx`
- **A tela mais complexa do sistema.**
- Gerencia: Turmas, Disciplinas, Membros (CRUD completo).
- KPIs em tempo real (total de alunos, professores, turmas, disciplinas).
- Ao criar uma turma → a turma aparece no banco `classes`.
- Ao criar uma disciplina → salva em `subjects` com `institution_id`, `class_id`, `teacher_id`.
- Ao adicionar aluno a uma turma → insere em `subject_enrollments` para todas as disciplinas da turma.

### `AdminPanel.tsx`
- Aba específica de membros dentro do Admin.
- CRUD de Professores e Alunos.
- Ao criar usuário → chama `adminService.createUser()` que:
  1. Cria o auth user no Supabase Auth (com `admin.createUser`).
  2. Insere o perfil em `public.users`.
  3. Retorna a senha temporária para exibição ao admin.

### `TeacherDashboard.tsx`
- Central do Professor.
- KPIs reais: Total de Alunos únicos (sem duplicatas entre disciplinas), Disciplinas Ativas, Atividades Criadas.
- Atalhos rápidos: Nova Atividade, Nova Prova, Nova Aula.
- **Contagem de alunos usa `Set` para deduplicar** alunos que estão em múltiplas disciplinas do professor.

### `Dashboard.tsx`
- Central do Aluno.
- Lista atividades pendentes filtradas pelas disciplinas do aluno.
- Atalho direto para iniciar a atividade mais urgente.

### `ActivityCreator.tsx` ⭐ (Etapa D.3)
- **Nova experiência premium de criação de atividades.**
- Substituiu o formulário modal antigo (`ActivityForm.tsx`).
- Permite ao professor:
  - Definir título, disciplina, prazo (data + hora), instruções.
  - Adicionar questões de 3 tipos: Múltipla Escolha, Verdadeiro/Falso, Dissertativa.
  - Definir gabarito para correção automática.
  - Definir pontuação por questão.
- Ao salvar → chama `adminService.createActivity()` que insere em `activities` com `status: 'published'`.

### `ActivityDetail.tsx` ⭐ (Etapa D.3)
- Tela de resolução de atividade pelo aluno.
- Renderiza as questões dinamicamente a partir do JSON salvo no banco.
- Detecta se o aluno já submeteu → mostra resultado em vez de permitir nova tentativa.
- Detecta entrega em atraso → alerta visual "Enviado com Atraso".
- Ao finalizar → calcula nota automática (questões objetivas) e chama `adminService.submitActivity()`.

### `Activities.tsx`
- Lista de atividades filtrada por role.
- Tabs: Pendentes / Concluídas.
- Admin/Teacher: Vê por disciplina (drill-down).
- Aluno: Vê apenas atividades das suas disciplinas.
- Botão "Criar Atividade" → navega para `ActivityCreator.tsx` (não abre modal).

### `Lessons.tsx`
- Gerenciamento de aulas gravadas.
- Suporte a YouTube, PDF e vídeo direto.
- Professor pode adicionar novas aulas via `LessonForm.tsx`.

### `Exams.tsx`
- Gerenciamento de provas.
- Funciona de forma similar às atividades (usa `ExamForm.tsx` como modal).
- Os dados de provas ainda usam armazenamento local (não persistido em BD, próxima etapa).

### `Insights.tsx`
- Dashboard analítico.
- Gráficos e KPIs de desempenho por disciplina/turma/aluno.

### `Settings.tsx`
- Configurações de conta (nome, email, tema).

---

## 8. Fluxo de Dados — App.tsx como Hub Central

O `App.tsx` funciona como o **orquestrador central** do estado global da aplicação usando `useState`.

### Estado Global Mantido

```typescript
// Autenticação
const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

// Navegação
const [activeSection, setActiveSection] = useState('dashboard');
const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
const [selectedExam, setSelectedExam] = useState<string | null>(null);

// Dados da Instituição (carregados do banco)
const [activities, setActivities] = useState<Activity[]>([]);
const [exams, setExams] = useState<Exam[]>([]);
const [classes, setClasses] = useState<SchoolClass[]>([]);
const [subjects, setSubjects] = useState<Subject[]>([]);
const [lessons, setLessons] = useState<Lesson[]>([]);
const [schoolMembers, setSchoolMembers] = useState<SchoolMember[]>([]);

// UI
const [notifications, setNotifications] = useState<Notification[]>([]);
const [isDarkMode, setIsDarkMode] = useState(true);
```

### `loadInstitutionData(user)` — A Função de Carga

Chamada após o login bem-sucedido, ela:
1. Busca todos os `users` da instituição → preenche `schoolMembers`.
2. Busca todas as `classes` → preenche `classes`.
3. Busca todas as `subjects` → preenche `subjects`.
4. Busca todos os `subject_enrollments` → popula `studentIds` em cada `Subject`.
5. Atualiza `enrolledSubjectIds` (aluno) ou `subjectIds` (professor) no `currentUser`.
6. Busca todas as `activities` das disciplinas da instituição → preenche `activities`.
7. Se for aluno, busca suas `activity_submissions` para marcar atividades já concluídas.

---

## 9. O Ecossistema de Atividades (Etapa D.3)

Esta foi a etapa mais complexa do projeto até o momento. Ela implementou o motor de aprendizado do sistema.

### Fluxo Completo

```
PROFESSOR
    │
    ▼
ActivityCreator.tsx
    │  Seleciona disciplina, define prazo
    │  Adiciona questões (múltipla escolha, V/F, dissertativa)
    │  Define gabarito para cada questão
    │
    ▼
adminService.createActivity()
    │  status: 'published'  ← importante! (ver nota abaixo)
    │
    ▼
Supabase: INSERT INTO activities
    │
    ▼
App.tsx: loadInstitutionData() busca as atividades
    │  Mapeia status 'published' → 'Pendente' no frontend
    │
    ▼
ALUNO (filtrado pela sua matrícula)
    │
    ▼
Activities.tsx lista a atividade como "Pendente"
Dashboard.tsx lista como prioridade
    │
    ▼
ActivityDetail.tsx — aluno resolve
    │  Verifica se já há submissão → bloqueia nova tentativa
    │  Calcula nota automática nas objetivas
    │  Detecta se está atrasado vs deadline
    │
    ▼
adminService.submitActivity()
    │
    ▼
Supabase: INSERT INTO activity_submissions
    │  answers: { "q-id": "resposta" }
    │  auto_score: X (calculado no frontend)
    │  status: 'submitted' ou 'late'
```

### Nota Importante — Status da Atividade

O banco de dados tem um CHECK constraint na tabela `activities`:
```sql
status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published'))
```

O frontend usa termos em português (`Pendente`, `Concluída`), então há um mapeamento:

| Banco de Dados | Frontend |
|----------------|----------|
| `published` | `Pendente` |
| `draft` | não usado ainda |
| *(sem submissão do aluno)* | `Pendente` |
| *(com submissão do aluno)* | `Concluída` |

### Correção Automática

A lógica de correção roda no frontend em `ActivityDetail.tsx` no momento do envio:

```typescript
// Para cada questão objetiva, compara a resposta do aluno com o gabarito
questions.forEach(q => {
  if (q.type === 'multiple_choice' || q.type === 'true_false') {
    if (answers[q.id] === q.correctAnswer) {
      score += q.points;
    }
  }
  // Dissertativas não são corrigidas automaticamente
});
```

---

## 10. Serviços — Camada de API

### `src/lib/auth.ts` — `authService`

| Método | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `signIn(email, password)` | `string, string` | `{ user, error, mustChangePassword }` | Login completo com busca de perfil e disciplinas |
| `signOut()` | — | `void` | Logout no Supabase |

### `src/lib/adminService.ts` — `adminService`

| Método | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `createInstitutionAndAdmin({...})` | schoolName, adminEmail... | `{ user, error }` | Cria instituição + super admin (via Edge Functions) |
| `createUser({...})` | name, email, role, institutionId... | `{ user, error, tempPassword }` | Cria professor ou aluno (via Edge Functions) |

### `src/lib/activityService.ts` — `activityService`

| Método | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `createActivity({...})` | subjectId, teacherId, title, questions... | `{ data, error }` | Cria atividade no banco |
| `submitActivity({...})` | activityId, studentId, answers, score... | `{ data, error }` | Registra submissão do aluno |

---

## 11. Modo Demo vs. Modo Real

O sistema possui dois modos de operação:

### Modo Real (padrão)
- Ativado ao fazer login com uma conta real.
- Todos os dados vêm do Supabase.
- `finalizeLogin(user, false)` → limpa arrays, chama `loadInstitutionData()`.
- Nenhum dado falso/mockado é exibido.

### Modo Demo
- Ativado a partir da `LandingPage` com o botão "Demo".
- Usa dados estáticos de `src/constants.ts`.
- `finalizeLogin(user, true)` → restaura todos os arrays mockados.
- Ideal para apresentações sem banco de dados real.

```typescript
// constants.ts contém:
export const INITIAL_ACTIVITIES: Activity[] = [...];
export const INITIAL_EXAMS: Exam[] = [...];
export const MOCK_SUBJECTS: Subject[] = [...];
export const MOCK_CLASSES: SchoolClass[] = [...];
export const MOCK_LESSONS: Lesson[] = [...];
export const MOCK_SCHOOL_MEMBERS: SchoolMember[] = [...];
```

> ⚠️ Os dados do Modo Demo **nunca** são salvos no banco de dados. São apenas visuais.

---

## 12. Sistema de Notificações

O sistema de notificações é local (em memória, não persistido no banco):

```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'activity' | 'exam' | 'system' | 'lesson';
  read: boolean;
}
```

| Função | Descrição |
|--------|-----------|
| `addNotification(title, message, type)` | Adiciona notificação ao topo da lista |
| `removeNotification(id)` | Remove notificação permanentemente |
| `markNotificationAsRead(id)` | Marca como lida (não remove) |

O sino de notificações é exibido no `Header.tsx` e acessível de todas as páginas via `commonHeaderProps`.

---

## 13. Design System e Estilização

### Abordagem

O projeto usa uma combinação de:
- **TailwindCSS** para utilitários de layout e espaçamento.
- **CSS Variables** (definidas em `index.css`) para o sistema de cores e temas.
- **Glassmorphism** como linguagem visual principal.

### Variáveis CSS Principais

```css
:root {
  --bg-body: #0a0a0f;          /* Fundo geral (dark) */
  --bg-sidebar: #0d0d14;       /* Sidebar */
  --border: rgba(255,255,255,0.06);  /* Bordas sutis */
  --text-main: #f4f4f5;        /* Texto principal */
  --text-muted: #71717a;       /* Texto secundário */
  --orange-primary: #f97316;   /* Cor de destaque */
}
```

### Classes Customizadas

| Classe | Efeito |
|--------|--------|
| `.glass` | Glassmorphism — `background: rgba(255,255,255,0.03)` + `backdrop-filter: blur` |
| `.sidebar-grad` | Gradiente laranja característico do botão principal |
| `.mesh-gradient` | Gradiente mesh para o Hero Card do dashboard |
| `.custom-scrollbar` | Scrollbar customizada (slim, alaranjada) |

### Fontes

- **Display/Títulos:** Syne (importada via Google Fonts)
- **Corpo:** Inter

### Paleta de Cores

| Cor | Uso |
|-----|-----|
| `orange-500` (`#f97316`) | Ações primárias, destaques |
| `emerald-500` | Sucesso, conclusão |
| `blue-500` | Informações secundárias |
| `red-500` | Erros, exclusão |
| `zinc-*` | Escala de cinzas para backgrounds |

---

## 14. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

> ⚠️ **JAMAIS** commite o arquivo `.env` no repositório. Adicione ao `.gitignore`.

---

## 15. Como Rodar o Projeto

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase com projeto configurado

### Instalação

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd aprende+gravity

# 2. Instale as dependências
npm install

# 3. Configure o ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# 4. Configure o banco de dados
# Execute o arquivo docs/planning/supabase_schema.sql no Supabase SQL Editor

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:5173`.

### Build de Produção

```bash
npm run build
npm run preview  # Para testar o build localmente
```

### Configuração do Supabase

Após criar o projeto no Supabase:
1. Vá em **SQL Editor** → Execute o `supabase_schema.sql` completo.
2. Vá em **Authentication → Settings** → Desabilite email confirmation para desenvolvimento.
3. Vá em **API** → Copie as chaves para o `.env`.

---

## 16. Histórico de Evolução (Etapas)

### 🏗️ Fase A — Fundação Visual (Concluída)
- Criação do design system premium (glassmorphism, dark mode, gradientes).
- Protótipo funcional com dados mockados.
- Todas as páginas principais com UI completa.
- Modo Demo funcional.

### 🔐 Fase B — Autenticação Real (Concluída)
- Integração completa com Supabase Auth.
- Fluxo de login seguro com recuperação de sessão.
- Tela de troca de senha obrigatória.
- Sistema de roles (Admin, Professor, Aluno).

### 🏛️ Fase C — Onboarding de Instituições (Concluída)
- Wizard de cadastro de nova escola/faculdade.
- Criação do primeiro Super Admin.
- Isolamento por `institution_id` em todo o banco.

### 📊 Fase D.1 + D.2 — Estrutura Acadêmica Real (Concluída)
- **D.1:** CRUD de Turmas e Disciplinas no `AdminDashboard`.
- **D.2:** Matrícula de alunos em disciplinas via `subject_enrollments`.
- Professores associados a disciplinas.
- Dados reais carregados do Supabase ao logar.

### 🎯 Fase D.3 — Motor de Atividades (Concluída)
- Criador premium de atividades (`ActivityCreator.tsx`).
- Tipos de questões: Múltipla Escolha, V/F, Dissertativa.
- Correção automática de questões objetivas.
- Persistência de atividades no Supabase (`activities`).
- Resolução pelo aluno com submissão ao banco (`activity_submissions`).
- Detecção de entrega em atraso (Late Submission).
- Bloqueio de segunda tentativa.
- Filtragem de atividades por disciplina do usuário logado.

---

## 17. Problemas Conhecidos e Decisões Técnicas

### 17.1 Exposição da Service Role Key (RESOLVIDO)

**Status:** ✅ Resolvido

No passado, a `VITE_SUPABASE_SERVICE_ROLE_KEY` ficava exposta no cliente. Isso foi **completamente resolvido**. As operações de administração foram migradas para Supabase Edge Functions, e a chave de Service Role foi removida do frontend.

### 17.2 Exames não Persistidos no Banco

Os `Exams` (provas) ainda usam armazenamento local. Ao dar F5, as provas criadas pelo modal `ExamForm.tsx` são perdidas. A próxima etapa do roadmap (Fase D.4) endereçará isso com um fluxo similar ao que foi feito para Atividades.

### 17.3 Status Mapping (activities)

O banco usa `status IN ('draft', 'published')` enquanto o frontend usa `'Pendente'` e `'Concluída'`. Isso é tratado com um mapeamento explícito em `loadInstitutionData()`:

```typescript
let studentStatus = a.status === 'published' ? 'Pendente' : a.status;
```

### 17.4 Evolução das Políticas de RLS

O sistema passou de operações totalmente baseadas em Service Role para um modelo baseado em Row Level Security (RLS). Ainda existem algumas policies para refinar, mas a arquitetura já não depende de clientes privilegiados no frontend.

---

## 18. Próximos Passos Planejados

Veja o arquivo `docs/ROADMAP.md` para o detalhamento completo das próximas etapas.

**Resumo das próximas fases:**

| Fase | Nome | Descrição |
|------|------|-----------|
| D.4 | Provas com Temporizador | Criar ExamCreator, persistir provas no banco, timer de execução |
| D.5 | Portal do Professor | Tela de visualização de submissões e correção manual de dissertativas |
| E.1 | Aulas no Banco | Persistir aulas gravadas no Supabase |
| E.2 | Notificações Push | Sistema de notificações real com Supabase Realtime |
| F.1 | Segurança Backend | Mover Service Role para Edge Functions |
| F.2 | RLS Completo | Configurar todas as políticas de Row Level Security |
| G.1 | App Mobile | React Native ou PWA para acesso mobile |

---

*Este documento é mantido pela equipe Aprende+ e deve ser atualizado a cada nova etapa concluída.*
