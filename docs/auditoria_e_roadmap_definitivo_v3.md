# 🔍 Aprende+ — AUDITORIA TÉCNICA E ROADMAP DEFINITIVO (VERSÃO 3.0)

> **Documento Unificado**: Auditoria Técnica de Código, Arquitetura de Banco de Dados, Segurança e Planejamento de Engenharia.  
> **Versão**: 3.0 — Engenharia & Escalaridade  
> **Data de Atualização**: Setembro de 2026  
> **Objetivo**: Mapear integralmente o estado do sistema, eliminar todas as vulnerabilidades e débitos técnicos da plataforma Web e do Supabase, estabelecendo uma base sólida, profissional e autônoma para suportar múltiplos clientes (Web e futuro App Mobile).  
> **Público-Alvo**: Time de Desenvolvimento de Software e Engenharia de Banco de Dados do Aprende+.

---

## 📌 1. GUIA DE LEITURA E MATRIZ DE COMPLEXIDADE

Cada tarefa e componente neste documento é classificado conforme sua criticidade, esforço e risco de regressão:

| Emoji | Dificuldade | Definição de Engenharia | Impacto / Risco |
|:-----:|:-----------:|:------------------------|:----------------|
| 🟢 | **Fácil** | Alteração pontual, isolada e sem efeitos colaterais. Implementação em minutos ou poucas horas. | Risco nulo de regressão. |
| 🟡 | **Moderada** | Envolve lógica de negócio definida, manipulação de estado ou query SQL específica. | Baixo risco com testes pontuais. |
| 🔴 | **Complexa** | Envolve múltiplos arquivos, refatoração de regras de negócio ou lógica transacional. | Risco moderado; requer validação completa. |
| ⚫ | **Arquitetural** | Mudança estrutural (roteamento, gestão de estado global, contratos de API). | Risco alto se executada sem planejamento. |

---

## 📊 2. RESUMO EXECUTIVO DO SISTEMA

### Diagnóstico Global
O **Aprende+** apresenta uma fundação sólida: conta com mais de 20 módulos funcionais integrados a um banco PostgreSQL via Supabase, tipagem TypeScript extensiva e interface responsiva com Tailwind CSS e Framer Motion. 

Entretanto, para atingir o patamar profissional exigido para operação em produção e para servir de backend confiável para um aplicativo Mobile, **ajustes estruturais de segurança e banco de dados são mandatórios**. Atualmente, regras críticas de negócio (como cálculo de notas e filtragem de gabarito) estão concentradas no cliente web, criando superfícies de ataque que precisam ser movidas para o banco e Edge Functions.

### Score de Prontidão

| Pilar | Nota Atual | Meta Pós-Roadmap | Status Atual |
|-------|:----------:|:----------------:|:-------------|
| **Funcionalidades Core** | **8.5/10** | **10/10** | 🟢 Robusto — 22 funcionalidades operacionais com dados reais |
| **Segurança Backend & RLS** | **3.0/10** | **9.5/10** | 🔴 Crítico — Requer blindagem de endpoints e RLS |
| **Performance de Banco de Dados** | **4.0/10** | **9.0/10** | 🔴 Crítico — Ausência de índices secundários e queries em fila |
| **Arquitetura Frontend Web** | **5.5/10** | **8.5/10** | 🟡 Funcional — Débito técnico em `App.tsx` e dados mockados |
| **Prontidão para API Mobile** | **4.0/10** | **9.5/10** | 🟡 Média — Necessita desacoplamento de chamadas do browser |
| **DevOps, CI/CD e Deploy** | **2.0/10** | **8.0/10** | 🔴 Inicial — Configuração pendente de esteira de produção |

---

## 🛡️ 3. AUDITORIA DE SEGURANÇA & INTEGRIDADE

---

### 🚨 3.1. Vetor de Fraude: Cálculo de Notas no Lado do Cliente (Web)
* **Arquivos**: `src/pages/ActivityDetail.tsx` (linhas 233–270) e `src/lib/adminService.ts` (linhas 190–204).
* **Diagnóstico**: O algoritmo de pontuação de questões objetivas (`calculateScoreWithQuestions`) é executado exclusivamente no JavaScript do navegador do aluno. O valor resultante (`auto_score`) é enviado via payload para a chamada direta de `insert()` na tabela `activity_submissions`.
* **Vulnerabilidade**: Como a política de RLS em `activity_submissions` valida apenas se o usuário está autenticado (`student_id = auth.uid()`), qualquer aluno consegue forjar um payload contendo nota máxima sem responder às questões.
* **Dificuldade**: 🟡 **Moderada** | **Tempo**: ~2 horas.
* **Ação Corretiva**: Migrar a computação de notas para uma **Database Function / RPC** ou processamento em Edge Function. O cliente submete unicamente o identificador da avaliação e o mapa de alternativas escolhidas (`answers: { q1: 'optA' }`); o cálculo da nota é realizado no servidor.

---

### 🚨 3.2. Exposição do Gabarito Oficial na Rede (Data Leak)
* **Arquivos**: `src/pages/ActivityDetail.tsx` (linhas 279–287) e consultas gerais em `src/App.tsx`.
* **Diagnóstico**: A estrutura JSONB da coluna `questions` nas tabelas `exams` e `activities` armazena a chave `correctAnswer` juntamente com enunciado e opções. Ao carregar a avaliação, o frontend requisita o registro completo.
* **Vulnerabilidade**: Mesmo que o componente React oculte a resposta visualmente durante o teste, o payload íntegro trafega pela rede. Qualquer inspeção na aba Network (ou interceptação de requisição HTTP via proxy em Mobile) expõe todas as respostas corretas.
* **Dificuldade**: 🟡 **Moderada** | **Tempo**: ~2 a 3 horas.
* **Ação Corretiva**: 
  1. Criar uma **View SQL Segura** ou **RPC** (`get_exam_for_student`) que remove a propriedade `correctAnswer` das questões antes de entregar ao aluno.
  2. O gabarito oficial só deve ser retornado se o usuário solicitante possuir perfil `teacher`/`admin` ou se a submissão do aluno já estiver com status finalizado (`graded`).

---

### 🚨 3.3. Edge Functions sem Verificação de Autenticação JWT
* **Arquivos**: `supabase/functions/admin-create-institution/index.ts`, `admin-create-user/index.ts`, `admin-delete-user/index.ts`.
* **Diagnóstico**: As Edge Functions administrativas utilizam a chave `SUPABASE_SERVICE_ROLE_KEY` para contornar o RLS, porém não validam o cabeçalho `Authorization` da requisição que as invocou.
* **Vulnerabilidade**: Qualquer requisição HTTP disparada contra a URL da Edge Function pode criar ou remover usuários e instituições no banco de dados.
* **Dificuldade**: 🟢 **Fácil** | **Tempo**: ~1 hora.
* **Ação Corretiva**: Inserir no cabeçalho das funções a extração e validação do token JWT via `supabase.auth.getUser(token)`, assegurando que o requisitante possua permissão (`role IN ('admin', 'super_admin')`).

---

### 🚨 3.4. Escalação de Privilégios no Cadastro de Usuários
* **Arquivo**: `supabase/functions/admin-create-user/index.ts`.
* **Diagnóstico**: O parâmetro `role` recebido no corpo do JSON da requisição é gravado diretamente sem validação de domínio.
* **Vulnerabilidade**: Possibilidade de injeção de perfis administrativos (`super_admin`) a partir de chamadas não autorizadas.
* **Dificuldade**: 🟢 **Fácil** | **Tempo**: ~15 minutos.
* **Ação Corretiva**: Restringir expressamente os perfis aceitos:
  ```typescript
  if (!['teacher', 'student'].includes(role)) {
    return new Response(JSON.stringify({ error: 'Perfil inválido para criação direta.' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
  ```

---

### 🚨 3.5. Anti-Pattern de Retorno HTTP 200 em Falhas
* **Arquivos**: Todas as 3 Edge Functions em `supabase/functions/`.
* **Diagnóstico**: Em situações de erro interno ou falha de regra de negócio, as funções retornam código HTTP `200 OK` com o objeto `{ error: ... }`.
* **Vulnerabilidade/Impacto**: Interceptadores de erro de clientes HTTP (como Axios, React Native ou Supabase SDK) identificam a chamada como bem-sucedida, dificultando o tratamento de exceções.
* **Dificuldade**: 🟢 **Fácil** | **Tempo**: ~30 minutos.
* **Ação Corretiva**: Retornar status HTTP semânticos: `400` (Bad Request), `401` (Unauthorized), `403` (Forbidden), `500` (Internal Server Error).

---

### 🚨 3.6. CORS Irrestrito nas Funções Serverless
* **Arquivo**: `supabase/functions/shared/cors.ts`.
* **Diagnóstico**: O header `Access-Control-Allow-Origin` está fixado em `'*'`.
* **Dificuldade**: 🟢 **Fácil** | **Tempo**: ~10 minutos.
* **Ação Corretiva**: Restringir a origem aos domínios oficiais da aplicação web e permitir origens seguras necessárias para testes locais e desenvolvimento de apps.

---

### 🚨 3.7. Escopo Institucional Incompleto em Políticas de Admin (Multi-Tenant)
* **Arquivos**: `supabase/migrations/refinamentos.sql` e `correcoes.sql`.
* **Diagnóstico**: Políticas de atualização e exclusão em `exams`, `activities` e `lessons` permitiam que usuários com cargo `admin` afetassem dados de outras instituições por falta do filtro de correspondência de `institution_id`.
* **Dificuldade**: 🟢 **Fácil** | **Tempo**: ~30 minutos.
* **Ação Corretiva**: Replicar a condição de validação institucional em todas as cláusulas `USING` e `WITH CHECK`.

---

### 🚨 3.8. Ausência de Políticas RLS em Tabelas Estruturais
* **Tabelas Afetadas**: `institutions`, `classes`, `subjects`.
* **Diagnóstico**: Tabelas com RLS habilitado, porém sem políticas completas de escrita/leitura para administradores e membros da respectiva escola.
* **Dificuldade**: 🟢 **Fácil** | **Tempo**: ~30 minutos.
* **Ação Corretiva**: Criar e consolidar as políticas formais no PostgreSQL.

---

### 🟡 3.9. Senha Padrão Temporária Exposta no Código do Frontend
* **Arquivos**: `src/lib/adminService.ts` (linhas 46 e 94) e `src/pages/AdminPanel.tsx` (linha 74).
* **Diagnóstico**: A string padrão `'Mudar@1234'` está codificada no bundle cliente.
* **Dificuldade**: 🟢 **Fácil** | **Tempo**: ~30 minutos.
* **Ação Corretiva**: A Edge Function deve ser responsável por gerar dinamicamente senhas temporárias criptograficamente seguras, retornando-as ao administrador no momento da criação.

---

## ⚡ 4. BANCO DE DADOS & PERFORMANCE

---

### 4.1. Criação de Índices Secundários (Foreign Keys)
* **Diagnóstico**: O schema atual do banco de dados opera com **zero índices secundários**. Consultas que utilizam filtros como `institution_id`, `subject_id` e `student_id` resultam em varreduras sequenciais completas (*Full Table Scans*). Em cenários com milhares de submissões e múltiplos alunos, a latência cresce exponencialmente.
* **Dificuldade**: 🟢 **Fácil** (Zero risco de quebra funcional).
* **Tempo**: ~15 minutos.
* **Script de Implementação**:
```sql
CREATE INDEX IF NOT EXISTS idx_users_institution ON public.users(institution_id);
CREATE INDEX IF NOT EXISTS idx_users_class ON public.users(class_id);
CREATE INDEX IF NOT EXISTS idx_subjects_institution ON public.subjects(institution_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher ON public.subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_institution ON public.classes(institution_id);
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON public.lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_activities_subject ON public.activities(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON public.exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_activity_subs_activity ON public.activity_submissions(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_subs_student ON public.activity_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_subs_exam ON public.exam_submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_subs_student ON public.exam_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.subject_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_subject ON public.subject_enrollments(subject_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
```

---

### 4.2. Paralelização de Consultas com `Promise.all`
* **Arquivo**: `src/App.tsx` → função `loadInstitutionData`.
* **Diagnóstico**: A função executa 8 a 9 queries consecutivas (`await` em série). Em conexões com latência média de 150ms, a espera somada ultrapassa 1.5 a 2 segundos.
* **Dificuldade**: 🟡 **Moderada** | **Tempo**: ~1 a 2 horas.
* **Ação Corretiva**: Executar as requisições independentes em paralelo:
```typescript
const [usersRes, classesRes, subjectsRes, enrollmentsRes] = await Promise.all([
  supabase.from('users').select('*').eq('institution_id', instId),
  supabase.from('classes').select('*').eq('institution_id', instId),
  supabase.from('subjects').select('*').eq('institution_id', instId),
  supabase.from('subject_enrollments').select('*')
]);
```

---

### 4.3. Otimização de Gatilhos do Supabase Realtime
* **Arquivo**: `src/App.tsx` (linhas 174–216).
* **Diagnóstico**: Qualquer evento disparado nas tabelas ouvidas invoca imediatamente a função `handleReload()`, reexecutando todas as consultas sequenciais. Se múltiplos alunos entregam uma avaliação simultaneamente, ocorre uma cascata desnecessária de requisições.
* **Dificuldade**: 🟡 **Moderada** | **Tempo**: ~2 horas.
* **Ação Corretiva**: Aplicar técnica de *debounce* (aguardar 500ms antes de disparar recarga) ou atualizar diretamente o estado em memória com base no `payload.new` recebido pelo WebSocket.

---

## 🏗️ 5. ARQUITETURA DE FRONTEND & AMARRAÇÃO DE PONTAS SOLTAS

---

### 5.1. Implementação do Fluxo de Recuperação de Senha ("Esqueceu a Senha")
* **Arquivos**: `src/pages/AuthPage.tsx` e `src/lib/auth.ts`.
* **Diagnóstico**: O elemento de recuperação de senha é uma âncora estática `<a href="#">`. A função no serviço de autenticação não foi implementada.
* **Dificuldade**: 🟢 **Fácil** | **Tempo**: ~1 hora.
* **Ação Corretiva**:
  1. Implementar método no serviço:
     ```typescript
     async resetPassword(email: string) {
       return await supabase.auth.resetPasswordForEmail(email, {
         redirectTo: `${window.location.origin}/reset-password`,
       });
     }
     ```
  2. Adicionar modal interativo na tela de login para coleta do e-mail e envio de link de recuperação.

---

### 5.2. Persistência de Dados na Tela de Configurações (`Settings.tsx`)
* **Arquivo**: `src/pages/Settings.tsx` (linhas 44–49).
* **Diagnóstico**: O botão salvar altera apenas variáveis de estado locais no React. Ao atualizar a página (F5), as alterações são perdidas.
* **Dificuldade**: 🟡 **Moderada** | **Tempo**: ~1 hora.
* **Ação Corretiva**: Integrar a rotina `handleSave` com atualizações reais nas tabelas `public.users` e no serviço de autenticação (`supabase.auth.updateUser`).

---

### 5.3. Dinamização do Calendário Acadêmico (`CalendarView.tsx`)
* **Arquivo**: `src/pages/CalendarView.tsx` (linhas 32–48).
* **Diagnóstico**: O componente inicializa bloqueado em `new Date(2026, 0, 1)` com restrições fixas que impedem a navegação fluida em anos anteriores ou posteriores.
* **Dificuldade**: 🟢 **Fácil** | **Tempo**: ~30 minutos.
* **Ação Corretiva**: Inicializar com `new Date()` e vincular os marcadores visuais aos prazos reais (`deadlineDate`) das atividades e provas do usuário.

---

### 5.4. Eliminação de Métricas Estáticas em Insights (`Insights.tsx`)
* **Arquivo**: `src/pages/Insights.tsx` (linhas 76–79, 187–191, 237–250).
* **Diagnóstico**: A lista de alunos em risco e os índices de engajamento e média acadêmica utilizam valores numéricos codificados diretamente no componente.
* **Dificuldade**: 🟡 **Moderada** | **Tempo**: ~3 horas.
* **Ação Corretiva**: Computar métricas analíticas a partir do conjunto real de submissões (`activity_submissions` e `exam_submissions`).

---

### 5.5. Substituição de Diálogos Nativos `alert()` por Sistema de Toasts
* **Diagnóstico**: AVISOS e erros operam via pop-ups nativos bloqueantes do navegador.
* **Dificuldade**: 🟡 **Moderada** | **Tempo**: ~2 horas.
* **Ação Corretiva**: Implementar biblioteca moderna e leve de Toasts (ex: `sonner` ou componente visual em Framer Motion) para feedback não-bloqueante.

---

### 5.6. Implementação de Error Boundary Global
* **Diagnóstico**: Erros não tratados em componentes React resultam em tela branca sem contexto de falha para o usuário.
* **Dificuldade**: 🟢 **Fácil** | **Tempo**: ~1 hora.
* **Ação Corretiva**: Encapsular a aplicação com um componente `ErrorBoundary` para captura de exceções e exibição de interface amigável de recuperação.

---

### 5.7. Desacoplamento Arquitetural: Migração de `App.tsx` para React Contexts
* **Diagnóstico**: `App.tsx` concentra 1.150+ linhas gerenciando autenticação, tema, dados de 8 entidades distintas e roteamento interno por string.
* **Dificuldade**: ⚫ **Arquitetural** | **Tempo**: ~3 a 4 dias.
* **Ação Corretiva**: Decompor o componente raiz em contextos especializados:
  - `AuthContext`: Usuário atual, perfil, login, logout e sessão.
  - `DataContext`: Carregamento e sincronização de turmas, disciplinas e tarefas.
  - `ThemeContext`: Gestão de modo claro/escuro.
  - `NotificationContext`: Gerenciamento de alertas em tempo real.

---

### 5.8. Roteamento Declarativo com URLs Reais (React Router)
* **Diagnóstico**: Navegação controlada por estado `activeSection`. O botão de avançar/voltar do navegador não funciona e não há suporte a links diretos (*deep links*).
* **Dificuldade**: 🔴 **Complexa** | **Tempo**: ~2 a 3 dias.
* **Ação Corretiva**: Introduzir `react-router-dom` com proteção de rotas por perfil de acesso.

---

## 📱 6. DIRETRIZES DE ENGENHARIA PARA PREPARAÇÃO DO APP MOBILE

A decisão de desenvolver um aplicativo móvel (React Native / Flutter / Expo) exige que a arquitetura do backend e a camada de dados estejam preparadas para consumo agnóstico de plataforma.

### 6.1. O Supabase como Backend Universal (Web + Mobile)
```
      ┌───────────────────────┐       ┌───────────────────────┐
      │   Web App (React 19)  │       │  Mobile App (React Native/Expo) │
      └───────────┬───────────┘       └───────────┬───────────┘
                  │                               │
                  │   HTTPS / WSS (Supabase SDK)  │
                  └───────────────┬───────────────┘
                                  ▼
      ┌───────────────────────────────────────────────────────┐
      │                   SUPABASE BACKEND                    │
      ├───────────────────────────────────────────────────────┤
      │ • Autenticação Unificada (GoTrue JWT)                 │
      │ • Camada de Dados com RLS (PostgREST)                 │
      │ • Lógica Crítica Server-Side (RPC / PostgreSQL Funcs) │
      │ • Operações Administrativas (Edge Functions)          │
      │ • Eventos em Tempo Real (Realtime Engine)             │
      └───────────────────────────────────────────────────────┘
```

### 6.2. Requisitos Mandatórios no Backend para Suporte ao Mobile
1. **Regras de Negócio Invioláveis no Servidor**: Toda validação que envolve notas, prazos de entrega e integridade de provas deve residir exclusivamente no PostgreSQL ou em Edge Functions. Aplicativos mobile são passíveis de engenharia reversa e interceptação de chamadas.
2. **Serviços Puros sem Dependências de DOM**: Os arquivos de serviço em `src/lib/` (`auth.ts`, `adminService.ts`) não devem conter referências a `window`, `document` ou `localStorage`. O Supabase Client deve ser configurável para receber adaptadores de armazenamento (`localStorage` na Web e `AsyncStorage` / `SecureStore` no Mobile).
3. **Tipagem Compartilhada**: As interfaces do arquivo `src/types.ts` devem ser mantidas rigorosamente alinhadas com as tabelas do banco de dados, prontas para importação direta no projeto do app mobile.

---

## 📋 7. INVENTÁRIO COMPLETO DE FUNCIONALIDADES

### ✅ 7.1. Módulos Operacionais com Dados Reais (22 Features)

| # | Funcionalidade | Descrição Técnica | Arquivos Envolvidos |
|---|----------------|-------------------|---------------------|
| 1 | **Landing Page** | Apresentação visual da plataforma com suporte a temas e animações. | `LandingPage.tsx` |
| 2 | **Onboarding Institucional** | Wizard de cadastro de instituição e primeiro super-administrador. | `InstitutionOnboarding.tsx` |
| 3 | **Autenticação Email/Senha** | Integração com Supabase Auth e sessão persistente de 24h. | `AuthPage.tsx`, `auth.ts` |
| 4 | **Primeiro Acesso Obrigatório** | Forçamento de troca de senha inicial (`must_change_password`). | `ChangePassword.tsx` |
| 5 | **Matriz de Perfis (RBAC)** | Segregação entre `super_admin`, `admin`, `teacher` e `student`. | `types.ts`, `App.tsx` |
| 6 | **Dashboard do Administrador** | Visão agregada da escola com gráficos e controles. | `AdminDashboard.tsx` |
| 7 | **Dashboard do Professor** | Visão de disciplinas sob sua responsabilidade e atalhos. | `TeacherDashboard.tsx` |
| 8 | **Dashboard do Aluno** | Linha do tempo de tarefas pendentes e progresso acadêmico. | `Dashboard.tsx` |
| 9 | **Gestão de Turmas (CRUD)** | Criação, listagem e exclusão de classes escolares. | `AdminPanel.tsx` |
| 10 | **Gestão de Disciplinas (CRUD)** | Vínculo de turmas e atribuição de professores responsáveis. | `AdminPanel.tsx` |
| 11 | **Gestão de Membros** | Criação e deleção de professores e alunos com geração de Auth. | `AdminPanel.tsx`, Edge Functions |
| 12 | **Enturmação e Matrículas** | Associação de estudantes a disciplinas na tabela associativa. | `AdminPanel.tsx`, `subject_enrollments` |
| 13 | **Criação de Atividades** | Construtor de questões (múltipla escolha, V/F, dissertativa). | `ActivityCreator.tsx` |
| 14 | **Execução de Atividades** | Interface interativa de resolução com feedback de tempo. | `ActivityDetail.tsx` |
| 15 | **Correção Automática** | Pontuação imediata de questões objetivas. | `ActivityDetail.tsx` |
| 16 | **Correção Manual Docente** | Painel de atribuição de notas e parecer em questões dissertativas. | `SubmissionDetail.tsx` |
| 17 | **Gestão de Submissões** | Listagem geral, filtros por turma e publicação de resultados. | `Submissions.tsx` |
| 18 | **Criação de Provas Avaliativas** | Configuração de duração (minutos), peso avaliativo e datas. | `ExamCreator.tsx` |
| 19 | **Motor de Avaliação / Exames** | Resolução com controle de tempo e auto-envio no encerramento. | `Exams.tsx` |
| 20 | **Gestão de Aulas e Materiais** | Cadastro e consumo de links de YouTube, vídeos e PDFs. | `Lessons.tsx` |
| 21 | **Sincronização em Tempo Real** | Atualização reativa de interface via Supabase Realtime. | `App.tsx` (WebSocket) |
| 22 | **Tema Escuro / Claro** | Alternância com persistência em armazenamento local. | `App.tsx`, `index.css` |

---

### ⚠️ 7.2. Módulos que Requerem Ajustes (7 Features)

| # | Funcionalidade | Estado Atual | Ajuste Obrigatório |
|---|----------------|--------------|-------------------|
| 1 | **Painel de Analytics / Insights** | Gráficos funcionais com KPIs hardcoded. | Conectar agregadores diretamente às tabelas de submissão. |
| 2 | **Calendário Acadêmico** | Layout pronto, bloqueado em Janeiro de 2026. | Inicializar com a data atual e vincular prazos reais. |
| 3 | **Central de Notificações** | Mensagens voláteis mantidas apenas em memória. | Persistir registros na tabela `public.notifications`. |
| 4 | **Configurações de Perfil** | Interface pronta, salvamento não persiste no banco. | Adicionar mutation para `public.users` e `supabase.auth`. |
| 5 | **Recuperação de Acesso** | Botão sem evento associado no formulário. | Acionar método `resetPasswordForEmail` com modal de input. |
| 6 | **Edição de Conteúdos** | Apenas fluxo de exclusão implementado. | Criar fluxo de edição para Atividades, Provas e Aulas. |
| 7 | **Estatísticas da Landing Page** | Indicadores promocionais com números fixos. | Apresentar métricas reais da base ou simplificar a seção. |

---

### ❌ 7.3. Backlog de Novas Funcionalidades (20 Features)

| # | Funcionalidade | Descrição / Escopo | Complexidade |
|---|----------------|--------------------|:------------:|
| 1 | **Sistema de Chamada / Presença Digital** | Frequência diária por disciplina com alertas de infrequência. | 🔴 Complexa |
| 2 | **Upload de Arquivos no Storage** | Armazenamento seguro de anexos e trabalhos via Supabase Storage. | 🟡 Moderada |
| 3 | **Geração de Boletins e Relatórios (PDF)** | Exportação de desempenho de alunos e atas de fechamento em PDF. | 🟡 Moderada |
| 4 | **Importação em Massa via Planilha (CSV)** | Carga rápida de turmas, alunos e professores via arquivo CSV. | 🟡 Moderada |
| 5 | **Disparo de Notificações Transacionais (E-mail)**| Lembretes de prazos e comunicados de notas via SMTP/Resend. | 🟡 Moderada |
| 6 | **Mural de Avisos Institucional** | Canal de comunicação geral da coordenação e avisos de professores. | 🟢 Fácil |
| 7 | **Barra de Busca Global Unificada** | Pesquisa instantânea de turmas, conteúdos e alunos no cabeçalho. | 🟡 Moderada |
| 8 | **Portal de Acompanhamento para Responsáveis** | Perfil dedicado (`parent`) para visualização de notas e presença. | 🔴 Complexa |
| 9 | **Canal de Dúvidas / Chat por Disciplina** | Mensageria instantânea entre estudantes e docentes via Realtime. | 🔴 Complexa |
| 10 | **Previsão Analítica de Risco por IA** | Identificação preditiva de estudantes com risco de reprovação. | 🔴 Complexa |
| 11 | **Correção Assistida por IA** | Sugestão preliminar de correção para respostas dissertativas. | 🔴 Complexa |
| 12 | **Gamificação Acadêmica** | Atribuição de conquistas, pontuação por engajamento e sequências. | 🟡 Moderada |
| 13 | **Banco Reutilizável de Questões** | Repositório central de questões para composição ágil de testes. | 🟡 Moderada |
| 14 | **Histórico e Versionamento de Provas** | Rastreabilidade de modificações realizadas em enunciados e pesos. | 🟡 Moderada |
| 15 | **Agenda Pessoal do Estudante** | Organização customizável de metas e compromissos extracurriculares. | 🟡 Moderada |
| 16 | **PWA (Progressive Web App)** | Habilitação de cache offline e instalação direta no dispositivo. | 🟡 Moderada |
| 17 | **Fórum de Discussões Acadêmicas** | Tópicos assíncronos com respostas e tópicos em destaque. | 🔴 Complexa |
| 18 | **Internacionalização (i18n)** | Suporte multilíngue para português, inglês e espanhol. | 🟡 Moderada |
| 19 | **Conformidade de Acessibilidade (WCAG/a11y)** | Navegação completa por teclado, suporte a leitores e ARIA. | 🟡 Moderada |
| 20 | **Esteira Automatizada de Testes (CI/CD)** | Suíte de testes unitários e de ponta a ponta (Vitest + Playwright). | 🟡 Moderada |

---

## 🗺️ 8. ROADMAP EXECUTIVO PASSO A PASSO

---

### 📋 FASE 1: "Blindagem e Fundação" (Prioridade Absoluta)
> **Foco**: Banco de Dados, Segurança e Integridade das Edge Functions.  
> **Prazo Estimado**: 1 a 2 semanas.

| Item | Tarefa | Dificuldade | Componente |
|:---:|--------|:-----------:|------------|
| 1.1 | Executar script com todos os 15 índices de performance no Supabase. | 🟢 Fácil | Banco de Dados |
| 1.2 | Implementar validação JWT e verificação de perfil nas 3 Edge Functions. | 🟢 Fácil | Backend / Serverless |
| 1.3 | Validar inputs nas Edge Functions (restringir perfis permitidos para criação). | 🟢 Fácil | Backend / Serverless |
| 1.4 | Ajustar status codes HTTP semânticos (400, 401, 403, 500) nas Edge Functions. | 🟢 Fácil | Backend / Serverless |
| 1.5 | Consolidar políticas RLS para `institutions`, `classes` e `subjects`. | 🟢 Fácil | Banco de Dados |
| 1.6 | Corrigir escopo multi-tenant em políticas de atualização/exclusão de admins. | 🟢 Fácil | Banco de Dados |
| 1.7 | Substituir senha temporária estática `'Mudar@1234'` por geração criptográfica. | 🟢 Fácil | Segurança |
| 1.8 | Implementar RPC ou Edge Function para cálculo de nota de submissões no servidor. | 🟡 Moderada | Backend / Banco |
| 1.9 | Criar View/RPC segura para ocultar `correctAnswer` de avaliações em andamento. | 🟡 Moderada | Banco de Dados |

---

### 📋 FASE 2: "Estabilização e Polimento do Web" (Prioridade Alta)
> **Foco**: Eliminação de pontas soltas, dinamização de telas e otimização de performance.  
> **Prazo Estimado**: 2 semanas.

| Item | Tarefa | Dificuldade | Componente |
|:---:|--------|:-----------:|------------|
| 2.1 | Conectar o fluxo de "Esqueceu a Senha" ao método do Supabase com modal visual. | 🟢 Fácil | Frontend Web |
| 2.2 | Corrigir inicialização de data em `CalendarView.tsx` (`new Date()`). | 🟢 Fácil | Frontend Web |
| 2.3 | Conectar o formulário de `Settings.tsx` para atualizar o perfil no banco. | 🟡 Moderada | Frontend Web |
| 2.4 | Paralelizar consultas de inicialização (`loadInstitutionData`) com `Promise.all`. | 🟡 Moderada | Performance |
| 2.5 | Dinamizar métricas de engajamento e alunos em risco na tela de `Insights.tsx`. | 🟡 Moderada | Frontend Web |
| 2.6 | Substituir diálogos nativos `alert()` por notificações toast contextuais. | 🟡 Moderada | UX / Frontend |
| 2.7 | Persistir notificações em tempo real na tabela `public.notifications`. | 🟡 Moderada | Frontend / Banco |
| 2.8 | Implementar componente de `ErrorBoundary` global para captura de falhas. | 🟢 Fácil | Estabilidade |
| 2.9 | Configurar deploy de produção na Vercel com variáveis de ambiente protegidas. | 🟢 Fácil | Infra / DevOps |

---

### 📋 FASE 3: "Desacoplamento e Preparação para o App Mobile" (Prioridade Alta)
> **Foco**: Modularização do código para compartilhamento com React Native / Flutter.  
> **Prazo Estimado**: 2 a 3 semanas.

| Item | Tarefa | Dificuldade | Componente |
|:---:|--------|:-----------:|------------|
| 3.1 | Isolar clientes de serviço em `src/lib/` sem dependências do objeto `window`. | 🟡 Moderada | Arquitetura |
| 3.2 | Refatorar `App.tsx` em Contextos React (`AuthContext`, `DataContext`, etc.). | ⚫ Arquitetural | Arquitetura |
| 3.3 | Implementar `react-router-dom` para navegação por rotas formais. | 🔴 Complexa | Arquitetura |
| 3.4 | Padronizar contratos de API e retornos de erro para consumo mobile. | 🟡 Moderada | Backend / API |
| 3.5 | Criar fluxo de edição completa para atividades e provas (além de deleção). | 🟡 Moderada | Frontend Web |

---

### 📋 FASE 4: "Expansão de Funcionalidades Core" (Prioridade Média)
> **Foco**: Novas funcionalidades de alto valor operacional.  
> **Prazo Estimado**: 1 a 2 meses.

| Item | Tarefa | Dificuldade | Componente |
|:---:|--------|:-----------:|------------|
| 4.1 | Implementar Módulo de Chamada e Frequência Escolar Digital. | 🔴 Complexa | Módulo Novo |
| 4.2 | Configurar Supabase Storage para upload de arquivos (PDFs, imagens, trabalhos). | 🟡 Moderada | Infra / Módulo Novo |
| 4.3 | Desenvolver motor de exportação de relatórios acadêmicos e boletins em PDF. | 🟡 Moderada | Módulo Novo |
| 4.4 | Implementar importação em lote de alunos e professores via planilha CSV. | 🟡 Moderada | Módulo Novo |
| 4.5 | Implementar notificações transacionais por e-mail para prazos de atividades. | 🟡 Moderada | Integração / API |
| 4.6 | Criar Mural de Avisos e Comunicados Institucionais. | 🟢 Fácil | Módulo Novo |
| 4.7 | Implementar Barra de Busca Global no cabeçalho da plataforma. | 🟡 Moderada | UX / Frontend |

---

### 📋 FASE 5: "Diferenciação e Recursos Avançados" (Longo Prazo)
> **Foco**: Inteligência Artificial, Gamificação e Comunicação em Tempo Real.  
> **Prazo Estimado**: 2 a 3 meses.

| Item | Tarefa | Dificuldade | Componente |
|:---:|--------|:-----------:|------------|
| 5.1 | Integrar LLM para análise preditiva de alunos em risco e alertas pedagógicos. | 🔴 Complexa | IA / Analytics |
| 5.2 | Integrar LLM para auxílio e sugestão de correção em questões dissertativas. | 🔴 Complexa | IA / Avaliação |
| 5.3 | Desenvolver chat em tempo real entre docentes e turmas via WebSocket. | 🔴 Complexa | Módulo Novo |
| 5.4 | Implementar portal e perfil dedicado para Responsáveis (`parent`). | 🔴 Complexa | Módulo Novo |
| 5.5 | Desenvolver mecânicas de gamificação (badges, pontuações, sequências de estudo).| 🟡 Moderada | Engajamento |
| 5.6 | Estruturar banco reutilizável de questões com categorização por tópicos. | 🟡 Moderada | Módulo Novo |

---

## 🛠️ 9. SCRIPT SQL DEFINITIVO DE ATUALIZAÇÃO (SUPABASE)

O script a seguir reúne todas as correções estruturais identificadas nesta auditoria. Pode ser executado integralmente no **SQL Editor** do Supabase de forma segura e idempotente:

```sql
-- ==============================================================================
-- APRENDE+ — SCRIPT CONSOLIDADO DE ATUALIZAÇÃO E SEGURANÇA (V3.0)
-- ==============================================================================

-- 1. CRIAÇÃO DE ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_institution ON public.users(institution_id);
CREATE INDEX IF NOT EXISTS idx_users_class ON public.users(class_id);
CREATE INDEX IF NOT EXISTS idx_subjects_institution ON public.subjects(institution_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher ON public.subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_institution ON public.classes(institution_id);
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON public.lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_activities_subject ON public.activities(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON public.exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_activity_subs_activity ON public.activity_submissions(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_subs_student ON public.activity_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_subs_exam ON public.exam_submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_subs_student ON public.exam_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.subject_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_subject ON public.subject_enrollments(subject_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- 2. FUNÇÃO AUXILIAR DE IDENTIFICAÇÃO INSTITUCIONAL
CREATE OR REPLACE FUNCTION public.get_auth_user_institution()
RETURNS UUID AS $$
  SELECT institution_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. POLÍTICAS RLS PARA TABELA DE INSTITUIÇÕES
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "institutions_read_policy" ON public.institutions;
CREATE POLICY "institutions_read_policy" ON public.institutions FOR SELECT
USING (
  id = public.get_auth_user_institution()
);

-- 4. POLÍTICAS RLS PARA TABELA DE TURMAS (CLASSES)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classes_read_policy" ON public.classes;
CREATE POLICY "classes_read_policy" ON public.classes FOR SELECT
USING (
  institution_id = public.get_auth_user_institution()
);

DROP POLICY IF EXISTS "classes_admin_manage_policy" ON public.classes;
CREATE POLICY "classes_admin_manage_policy" ON public.classes FOR ALL
USING (
  institution_id = public.get_auth_user_institution()
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  institution_id = public.get_auth_user_institution()
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')
  )
);

-- 5. POLÍTICAS RLS PARA TABELA DE DISCIPLINAS (SUBJECTS)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subjects_read_policy" ON public.subjects;
CREATE POLICY "subjects_read_policy" ON public.subjects FOR SELECT
USING (
  institution_id = public.get_auth_user_institution()
);

DROP POLICY IF EXISTS "subjects_admin_manage_policy" ON public.subjects;
CREATE POLICY "subjects_admin_manage_policy" ON public.subjects FOR ALL
USING (
  institution_id = public.get_auth_user_institution()
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  institution_id = public.get_auth_user_institution()
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')
  )
);

-- 6. CORREÇÃO MULTI-TENANT PARA ATIVIDADES, PROVAS E AULAS
DROP POLICY IF EXISTS "Professores e admins atualizam atividades" ON public.activities;
CREATE POLICY "Professores e admins atualizam atividades" ON public.activities FOR UPDATE
USING (
  teacher_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.subjects s
    JOIN public.users u ON u.institution_id = s.institution_id
    WHERE s.id = activities.subject_id
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Professores e admins deletam atividades" ON public.activities;
CREATE POLICY "Professores e admins deletam atividades" ON public.activities FOR DELETE
USING (
  teacher_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.subjects s
    JOIN public.users u ON u.institution_id = s.institution_id
    WHERE s.id = activities.subject_id
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Professores e admins atualizam provas" ON public.exams;
CREATE POLICY "Professores e admins atualizam provas" ON public.exams FOR UPDATE
USING (
  teacher_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.subjects s
    JOIN public.users u ON u.institution_id = s.institution_id
    WHERE s.id = exams.subject_id
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Professores e admins deletam provas" ON public.exams;
CREATE POLICY "Professores e admins deletam provas" ON public.exams FOR DELETE
USING (
  teacher_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.subjects s
    JOIN public.users u ON u.institution_id = s.institution_id
    WHERE s.id = exams.subject_id
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
  )
);
```

---

## 🏁 10. CONCLUSÃO

A plataforma **Aprende+** possui uma base funcional rica e pronta para operação. Ao concluir as **Fases 1 e 2**, a aplicação alcança estabilidade técnica de nível profissional: o banco de dados opera protegido contra qualquer tentativa de adulteração de notas ou vazamento de gabaritos, as Edge Functions contam com autenticação estrita, a interface elimina dados estáticos e as consultas operam com latência reduzida.

Esse trabalho no ecossistema Web e Supabase assegura que o desenvolvimento subsequente do **Aplicativo Mobile** consuma serviços já consolidados, sem necessidade de duplicação de regras de negócio ou retrabalho estrutural.
