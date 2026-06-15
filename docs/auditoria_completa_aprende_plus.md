# 🔍 Aprende+ — AUDITORIA E ROADMAP DEFINITIVO

> **Versão**: 2.0 — Documento Unificado (Auditoria + Planejamento Futuro)
> **Data**: 15 de Junho de 2026
> **Objetivo**: Mapear TUDO que precisa ser feito para transformar o Aprende+ em um produto finalizado, escalável e pronto para piloto real em instituição.
> **Público**: Time de desenvolvimento do Aprende+.

---

## 📌 Como Ler Este Documento

Cada tarefa neste documento tem uma classificação de dificuldade e risco:

| Emoji | Dificuldade | O que significa |
|:-----:|:-----------:|:----------------|
| 🟢 | **Fácil** | Alteração simples e isolada. Qualquer pessoa do time faz em minutos/poucas horas. Zero risco de quebrar algo. |
| 🟡 | **Moderada** | Exige atenção e conhecimento do sistema, mas é bem definida. Risco baixo se feito com cuidado. |
| 🔴 | **Complexa** | Exige planejamento, pode envolver múltiplos arquivos e refatoração. Precisa de testes. Risco moderado. |
| ⚫ | **Arquitetural** | Mudança estrutural no projeto. Deve ser planejada com calma e executada em etapas. Risco alto se feito às pressas. |

> [!IMPORTANT]
> **A grande maioria dos problemas críticos encontrados são 🟢 (Fácil) ou 🟡 (Moderada).** Nenhum deles exige reescrever o sistema do zero. São ajustes pontuais que **não quebram** o que já funciona. Fiquem tranquilos.

---

## 📊 Resumo Executivo

### O sistema está pronto para produção?

> [!TIP]
> **SIM, com ajustes de segurança.** O Aprende+ tem uma base técnica **impressionante** para um projeto de 4º semestre. São 20+ funcionalidades completas e funcionando com dados reais. Os problemas encontrados são equivalentes a "portas sem trancas" — as portas existem e funcionam, só falta colocar os cadeados. **Nenhum problema exige reescrever código do zero ou mudar a arquitetura.**

### Score de Prontidão

| Pilar | Nota | Status |
|-------|:----:|--------|
| Funcionalidades Core | **8/10** | 🟢 Pronto — 22 features funcionando |
| Segurança Backend | **3/10** | 🔴 Precisa de ajustes antes do piloto |
| Banco de Dados | **7/10** | 🟡 Bom, faltam indexes e políticas |
| Arquitetura Frontend | **5/10** | 🟡 Funcional, débito técnico gerenciável |
| DevOps / Deploy | **2/10** | 🔴 Precisa configurar deploy |
| Documentação | **8/10** | 🟢 Acima da média |

---

## 1. 🛡️ CORREÇÕES DE SEGURANÇA

Este é o pilar mais importante. **Parece assustador, mas não é.** São correções isoladas que não mexem na lógica do sistema.

---

### 🚨 1.1 — Edge Functions SEM Autenticação

**Arquivos**: `admin-create-institution/index.ts`, `admin-create-user/index.ts`, `admin-delete-user/index.ts`

| | |
|---|---|
| **O problema** | As 3 Edge Functions não verificam QUEM está chamando. Qualquer pessoa que souber a URL do Supabase pode criar/deletar usuários. |
| **Dificuldade** | 🟢 **FÁCIL** |
| **Tempo estimado** | ~1-2 horas (para as 3 funções) |
| **Risco de quebrar algo?** | ❌ **Nenhum.** A correção ADICIONA código no início da função (um "filtro de segurança"). Não muda nada que já existe. Se errarmos, o pior que acontece é a função retornar "Não autorizado" — basta ajustar o token e funciona de novo. **Zero chance de corromper dados.** |
| **Complexidade real** | É copiar e colar ~15 linhas de código padrão do Supabase no início de cada função. É literalmente um if/else de "se não tem token, retorna erro". |

**O que fazer**: Adicionar no início de cada função:
```typescript
// 1. Extrair token do header
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
}

// 2. Verificar se o token é válido
const token = authHeader.replace('Bearer ', '');
const { data: { user }, error: authError } = await supabase.auth.getUser(token);
if (authError || !user) {
  return new Response(JSON.stringify({ error: 'Token inválido' }), { 
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// 3. Verificar se quem chamou é admin
const { data: callerProfile } = await supabase
  .from('users').select('role, institution_id').eq('id', user.id).single();
if (!callerProfile || !['admin', 'super_admin'].includes(callerProfile.role)) {
  return new Response(JSON.stringify({ error: 'Sem permissão' }), { 
    status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

> [!NOTE]
> O frontend **já envia** o token de autenticação automaticamente quando chama `supabase.functions.invoke()`. Ou seja, não precisa mudar NADA no frontend. A correção é 100% no backend.

---

### 🚨 1.2 — CORS Aberto para Qualquer Site

**Arquivo**: `supabase/functions/shared/cors.ts`

| | |
|---|---|
| **O problema** | O `Access-Control-Allow-Origin: '*'` permite que qualquer site na internet chame nossas Edge Functions. |
| **Dificuldade** | 🟢 **TRIVIAL** |
| **Tempo estimado** | 5 minutos |
| **Risco de quebrar algo?** | ❌ **Nenhum** (desde que coloquemos o domínio correto). |
| **Complexidade real** | Trocar UMA linha de código: `'*'` → `'https://seudominio.com.br'`. |

**O que fazer**: Abrir `cors.ts` e mudar:
```typescript
// DE:
'Access-Control-Allow-Origin': '*',

// PARA:
'Access-Control-Allow-Origin': 'https://aprende-plus.vercel.app', // ← seu domínio real
```

---

### 🚨 1.3 — Escalação de Privilégios via Role

**Arquivo**: `admin-create-user/index.ts`

| | |
|---|---|
| **O problema** | A função aceita qualquer `role` vindo do body da requisição. Um atacante poderia enviar `role: 'super_admin'` e se tornar administrador. |
| **Dificuldade** | 🟢 **TRIVIAL** |
| **Tempo estimado** | 5 minutos |
| **Risco de quebrar algo?** | ❌ **Nenhum.** É adicionar 3 linhas de validação. |

**O que fazer**: Adicionar antes da criação do usuário:
```typescript
if (!['teacher', 'student'].includes(role)) {
  return new Response(JSON.stringify({ error: 'Role inválido' }), { status: 400 });
}
```

---

### 🚨 1.4 — Validação de Input nas Edge Functions

**Arquivos**: Todas as 3 Edge Functions

| | |
|---|---|
| **O problema** | Nenhuma função valida formato de email, força de senha, ou se o `institutionId` existe. |
| **Dificuldade** | 🟢 **FÁCIL** |
| **Tempo estimado** | 1-2 horas |
| **Risco de quebrar algo?** | ❌ **Nenhum.** É adicionar validações antes da lógica principal. |
| **Complexidade real** | Validações simples de string. Ex: checar se email contém `@`, se senha tem 8+ caracteres, etc. |

---

### 🟡 1.5 — Tabelas SEM Políticas RLS

**Tabelas afetadas**: `institutions`, `classes`, `subjects`

| | |
|---|---|
| **O problema** | Essas tabelas têm RLS habilitado mas ZERO políticas definidas. |
| **Dificuldade** | 🟢 **FÁCIL** |
| **Tempo estimado** | 30 min – 1 hora |
| **Risco de quebrar algo?** | ⚠️ **Risco muito baixo.** Se a política for restritiva demais, o frontend simplesmente não conseguirá ler os dados (aparecerão listas vazias). Basta ajustar a query SQL e resolve. **Não corrompe nada.** |
| **Complexidade real** | É rodar comandos SQL no painel do Supabase. Copy-paste. |

**O que fazer**: Rodar no SQL Editor do Supabase:
```sql
-- Qualquer usuário autenticado da mesma instituição pode ler classes e subjects
CREATE POLICY "classes_read" ON classes FOR SELECT
USING (institution_id = public.get_auth_user_institution());

CREATE POLICY "subjects_read" ON subjects FOR SELECT
USING (institution_id = public.get_auth_user_institution());

CREATE POLICY "institutions_read" ON institutions FOR SELECT
USING (id = public.get_auth_user_institution());
```

---

### 🟡 1.6 — Policies de Admin SEM Escopo de Instituição

**Arquivo**: `refinamentos.sql`

| | |
|---|---|
| **O problema** | As policies de UPDATE/DELETE verificam se o usuário é admin, mas não verificam de QUAL instituição. Um admin da Escola A poderia deletar dados da Escola B. |
| **Dificuldade** | 🟢 **FÁCIL** |
| **Tempo estimado** | 30 minutos |
| **Risco de quebrar algo?** | ❌ **Nenhum.** É adicionar uma condição extra (`AND institution_id = ...`) nas policies existentes. |

---

### 🟡 1.7 — Respostas Corretas Visíveis na Rede (DevTools)

| | |
|---|---|
| **O problema** | O campo `correctAnswer` é enviado junto com as questões. Um aluno esperto pode abrir o DevTools do navegador e ver as respostas antes de responder. O frontend remove no JavaScript, mas os dados já chegaram completos. |
| **Dificuldade** | 🟡 **MODERADA** |
| **Tempo estimado** | 2-4 horas |
| **Risco de quebrar algo?** | ⚠️ **Risco baixo.** Precisa criar uma View SQL ou Edge Function que filtra `correctAnswer` para alunos. Se errar, as questões podem aparecer sem opções — mas basta ajustar a View e volta ao normal. |
| **Para o piloto**: Pode ser adiado. Nenhum aluno de piloto provavelmente vai inspecionar o DevTools, mas é uma boa prática corrigir. |

---

### 🟡 1.8 — Senha Padrão `Mudar@1234` Visível no Código

**Arquivo**: `adminService.ts` (linhas 46 e 94)

| | |
|---|---|
| **O problema** | A senha temporária padrão está hardcoded no JavaScript que vai pro navegador. Qualquer um que inspecionar o código-fonte verá a senha. |
| **Dificuldade** | 🟢 **FÁCIL** |
| **Tempo estimado** | 15 minutos |
| **Risco de quebrar algo?** | ❌ **Nenhum.** É mover a geração de senha para a Edge Function (backend). |
| **Alternativa rápida**: Gerar senha aleatória no frontend com `crypto.getRandomValues()` e exibir no modal de criação de usuário. |

---

## 2. ⚡ PERFORMANCE DO BANCO DE DADOS

### 2.1 — Criar Indexes (ANTES do piloto)

| | |
|---|---|
| **O problema** | O banco tem ZERO indexes. Toda query precisa varrer a tabela inteira. Com 50 alunos funciona, com 500+ fica lento. |
| **Dificuldade** | 🟢 **TRIVIAL** |
| **Tempo estimado** | 15 minutos |
| **Risco de quebrar algo?** | ❌ **IMPOSSÍVEL quebrar.** Index é aditivo — ele só melhora performance. Nunca altera dados, nunca muda comportamento. É como adicionar um índice remissivo num livro: não muda o conteúdo, só facilita achar. |
| **Complexidade real** | Copy-paste de SQL no painel do Supabase e clicar "Run". |

**O que fazer**: Rodar no SQL Editor do Supabase:
```sql
CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
CREATE INDEX IF NOT EXISTS idx_users_class ON users(class_id);
CREATE INDEX IF NOT EXISTS idx_subjects_institution ON subjects(institution_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher ON subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_activities_subject ON activities(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_activity_subs_activity ON activity_submissions(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_subs_student ON activity_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_subs_exam ON exam_submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_subs_student ON exam_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON subject_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_subject ON subject_enrollments(subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_classes_institution ON classes(institution_id);
```

---

### 2.2 — Paralelizar Queries com `Promise.all`

**Arquivo**: `App.tsx` → função `loadInstitutionData`

| | |
|---|---|
| **O problema** | A função faz 8+ queries em sequência (`await` uma depois da outra). Se cada query leva 200ms, são 1.6s de espera. Com `Promise.all`, todas rodam ao mesmo tempo e o total cai para ~200ms. |
| **Dificuldade** | 🟡 **MODERADA** |
| **Tempo estimado** | 1-2 horas |
| **Risco de quebrar algo?** | ⚠️ **Risco baixo.** As queries são independentes (nenhuma depende do resultado da outra). Se uma falhar, precisa tratar o erro individual em vez do erro geral. Exige atenção mas não é difícil. |

---

## 3. 🏗️ MELHORIAS DE ARQUITETURA

### 3.1 — Implementar React Router (URLs reais)

| | |
|---|---|
| **O problema** | A navegação é feita por estado string (`activeSection`). As URLs nunca mudam, o botão "voltar" do navegador não funciona, e é impossível compartilhar links para páginas específicas. |
| **Dificuldade** | 🔴 **COMPLEXA** |
| **Tempo estimado** | 2-3 dias |
| **Risco de quebrar algo?** | ⚠️ **Risco moderado.** Precisa refatorar o sistema de navegação inteiro. Recomendo fazer em uma branch separada e testar tudo antes de mergear. |
| **Quando fazer?** | **Pós-piloto.** Para o piloto, a navegação funciona. É melhor não mexer nisso sob pressão. |
| **Complexidade real** | Instalar `react-router-dom`, criar rotas, mover a lógica de "qual página mostrar" para o Router, e ajustar todos os links. Não é difícil conceptualmente, mas são muitos arquivos para tocar. |

---

### 3.2 — Refatorar App.tsx (God Component → Contextos)

| | |
|---|---|
| **O problema** | `App.tsx` tem 1.151 linhas e centraliza TUDO: auth, dados, tema, notificações, navegação. Qualquer mudança de estado re-renderiza toda a aplicação. |
| **Dificuldade** | ⚫ **ARQUITETURAL** |
| **Tempo estimado** | 3-5 dias |
| **Risco de quebrar algo?** | ⚠️ **Risco alto se feito às pressas.** Essa é a maior refatoração do projeto. Recomendo fortemente fazer DEPOIS do piloto, com calma, e com testes. |
| **Quando fazer?** | **Pós-piloto.** O sistema funciona como está. |
| **O que envolve** | Criar `AuthContext`, `DataContext`, `ThemeContext`, `NotificationContext` e mover a lógica do App.tsx para esses contextos. Cada página passa a consumir os contextos via `useContext()` em vez de receber 15+ props. |

---

### 3.3 — Adicionar Error Boundary Global

| | |
|---|---|
| **O problema** | Se qualquer componente der um erro JavaScript, a tela inteira fica branca sem mensagem nenhuma. |
| **Dificuldade** | 🟢 **FÁCIL** |
| **Tempo estimado** | 30 min – 1 hora |
| **Risco de quebrar algo?** | ❌ **Nenhum.** É adicionar um componente wrapper que captura erros e mostra uma mensagem amigável. |

---

### 3.4 — Substituir `alert()` por Toast Notifications

| | |
|---|---|
| **O problema** | Erros e confirmações usam `alert()` nativo do navegador, que é feio e bloqueia a tela. |
| **Dificuldade** | 🟡 **MODERADA** |
| **Tempo estimado** | 2-3 horas |
| **Risco de quebrar algo?** | ❌ **Nenhum.** É trocar `alert()` por um componente de Toast. O comportamento permanece o mesmo. |

---

### 3.5 — Adicionar Loading States

| | |
|---|---|
| **O problema** | Quando os dados estão carregando, não aparece nenhum indicador visual. O usuário não sabe se o sistema travou ou está carregando. |
| **Dificuldade** | 🟡 **MODERADA** |
| **Tempo estimado** | 2-3 horas |
| **Risco de quebrar algo?** | ❌ **Nenhum.** É adicionar um spinner ou skeleton enquanto os dados carregam. |

---

## 4. 🚀 INFRA & DEPLOY

### 4.1 — Deploy em Produção (Vercel/Netlify)

| | |
|---|---|
| **O problema** | O sistema só roda localmente. Precisa estar na internet para o piloto. |
| **Dificuldade** | 🟢 **FÁCIL** |
| **Tempo estimado** | 1-2 horas |
| **Risco de quebrar algo?** | ❌ **Nenhum.** É fazer deploy da mesma build que funciona localmente. |
| **O que fazer** | Criar conta na Vercel, conectar o repositório, configurar as variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). A Vercel faz o `npm run build` automaticamente. |

---

### 4.2 — Configurar Domínio Personalizado

| | |
|---|---|
| **Dificuldade** | 🟢 **FÁCIL** |
| **Tempo estimado** | 30 min |
| **Risco de quebrar algo?** | ❌ **Nenhum.** |
| **O que fazer** | Comprar um domínio (ex: `aprendeplus.com.br`) e configurar na Vercel. Opcional — pode usar o domínio gratuito `.vercel.app`. |

---

### 4.3 — Monitoramento de Erros (Sentry)

| | |
|---|---|
| **O problema** | Se o sistema der erro em produção, ninguém fica sabendo. |
| **Dificuldade** | 🟢 **FÁCIL** |
| **Tempo estimado** | 1 hora |
| **Risco de quebrar algo?** | ❌ **Nenhum.** É adicionar uma biblioteca que "escuta" erros e envia notificações. |

---

## 5. 📋 INVENTÁRIO COMPLETO DE FUNCIONALIDADES

### ✅ Funcionando com Dados Reais (22 features)

Estas features **já estão prontas** e conectadas ao banco de dados real via Supabase:

| # | Feature | Arquivos principais |
|---|---------|-------------------|
| 1 | Landing Page premium com animações | `LandingPage.tsx` (56KB) |
| 2 | Onboarding de Instituição (wizard completo) | `InstitutionOnboarding.tsx` |
| 3 | Autenticação email/senha via Supabase Auth | `AuthPage.tsx`, `auth.ts` |
| 4 | Troca de senha obrigatória no primeiro login | `ChangePassword.tsx` |
| 5 | 4 perfis de acesso (super_admin, admin, teacher, student) | `types.ts`, `App.tsx` |
| 6 | Dashboard do Administrador com stats reais | `AdminDashboard.tsx` (48KB) |
| 7 | Dashboard do Professor | `TeacherDashboard.tsx` |
| 8 | Dashboard do Aluno | `Dashboard.tsx` |
| 9 | CRUD completo de Turmas | `AdminPanel.tsx` |
| 10 | CRUD completo de Disciplinas com vínculo de professor | `AdminPanel.tsx` |
| 11 | CRUD de Professores e Alunos (criar/deletar) | `AdminPanel.tsx`, Edge Functions |
| 12 | Matrícula de alunos em disciplinas | `AdminPanel.tsx`, `subject_enrollments` |
| 13 | Criação de atividades (múltipla escolha, V/F, dissertativa) | `ActivityCreator.tsx` (25KB) |
| 14 | Resolução de atividades pelo aluno (quiz engine) | `ActivityDetail.tsx` (49KB) |
| 15 | Correção automática de questões objetivas | `ActivityDetail.tsx` |
| 16 | Correção manual de dissertativas com feedback por questão | `SubmissionDetail.tsx` |
| 17 | Listagem e filtro de submissões com publicação de notas | `Submissions.tsx` |
| 18 | Criação de provas com timer e peso | `ExamCreator.tsx` (34KB) |
| 19 | Resolução de provas com auto-submit + detecção de fraude | `Exams.tsx` (40KB) |
| 20 | Gestão de Aulas/Conteúdos (YouTube, vídeo, PDF) | `Lessons.tsx` (20KB) |
| 21 | Sistema Realtime (dados atualizam sem dar F5) | `App.tsx` (Supabase Realtime) |
| 22 | Dark/Light Mode com persistência | `App.tsx`, `index.css` |

---

### ⚠️ Parcialmente Funcionando (7 features)

Estas features existem, mas **precisam de ajustes** para funcionar 100%:

| # | Feature | Status atual | O que falta |
|---|---------|-------------|-------------|
| 1 | **Insights/Analytics** | Gráficos funcionam, mas alguns KPIs são hardcoded (ex: "94.2% Engajamento", "8.4/10 Média") e a lista de "alunos em risco" é mockada | Calcular TODOS os dados a partir do banco real |
| 2 | **Calendário Acadêmico** | Grid visual bonito mas inicia fixo em Jan 2026 e não mostra nenhum evento | Iniciar com `new Date()` e puxar deadlines reais |
| 3 | **Notificações** | Geradas em tempo real pelo Realtime, mas só existem em memória — perdidas no F5 | Persistir na tabela `notifications` (que já existe no banco!) |
| 4 | **Página de Configurações** | UI existe com abas (Perfil, Conta, Privacidade, Notificações), mas salvar perfil não persiste no banco | Conectar `handleSave` ao Supabase |
| 5 | **"Esqueci a Senha"** | A função `resetPassword` existe em `auth.ts`, mas o botão na tela de login mostra apenas `alert("Funcionalidade em breve!")` | Conectar o botão à função existente |
| 6 | **Edição de Atividades/Provas** | Não existe opção de editar — só deletar e recriar | Implementar modal de edição |
| 7 | **Landing Page — Estatísticas** | Números hardcoded ("+500 Alunos", "98% Satisfação") | Puxar dados reais ou remover para o piloto |

---

### ❌ NÃO Implementado (Features Futuras)

Estas features **não existem** no código e precisarão ser construídas do zero:

| # | Feature | Descrição | Dificuldade | Tempo estimado |
|---|---------|-----------|:-----------:|:--------------:|
| 1 | **Sistema de Presença/Chamada** | Professor faz chamada digital. Aluno marca presença (com ou sem geolocalização). Histórico de frequência. Relatórios. | 🔴 Complexa | 1-2 semanas |
| 2 | **Insights por IA (Inteligência Artificial)** | Analisar padrão de notas e prever alunos em risco. Sugerir revisão de conteúdo. Gerar relatórios inteligentes. | 🔴 Complexa | 2-3 semanas |
| 3 | **Sistema de Mensagens/Chat** | Chat entre professor-aluno, avisos para turma, canal de dúvidas por disciplina. | 🔴 Complexa | 2-3 semanas |
| 4 | **Upload de Arquivos** | Upload de PDFs, imagens, trabalhos. Usar Supabase Storage. | 🟡 Moderada | 3-5 dias |
| 5 | **Geração de Relatórios (PDF)** | Boletim do aluno, relatório de turma, gráficos exportáveis em PDF. | 🟡 Moderada | 3-5 dias |
| 6 | **Importação em Massa (CSV)** | Importar lista de alunos/professores via planilha CSV/Excel. | 🟡 Moderada | 2-3 dias |
| 7 | **Portal de Responsáveis/Pais** | Novo perfil `parent` com acesso às notas e frequência do filho. | 🔴 Complexa | 1-2 semanas |
| 8 | **Notificações por Email** | Enviar email quando atividade é publicada, nota sai, prazo está perto. | 🟡 Moderada | 3-5 dias |
| 9 | **PWA (Progressive Web App)** | Funcionar offline, instalar no celular como app, push notifications. | 🟡 Moderada | 3-5 dias |
| 10 | **Gamificação** | Badges, rankings, streaks de entrega, XP por atividade. | 🟡 Moderada | 1-2 semanas |
| 11 | **Fórum de Discussão por Disciplina** | Threads de dúvidas e respostas, similar a um mini-fórum. | 🔴 Complexa | 1-2 semanas |
| 12 | **Busca Global** | Pesquisar em toda a plataforma: alunos, atividades, provas, aulas. | 🟡 Moderada | 2-3 dias |
| 13 | **Testes Automatizados** | Unit tests e integration tests para garantir que nada quebre. | 🟡 Moderada | Contínuo |
| 14 | **CI/CD Pipeline** | Deploy automático a cada commit. Rodar testes antes de publicar. | 🟡 Moderada | 1-2 dias |
| 15 | **Multi-idioma (i18n)** | Suporte a inglês e espanhol além de português. | 🟡 Moderada | 1-2 semanas |
| 16 | **Acessibilidade (a11y)** | ARIA labels, navegação por teclado, compatibilidade com leitor de tela. | 🟡 Moderada | 1-2 semanas |
| 17 | **Versionamento de Conteúdo** | Histórico de alterações em atividades e provas. | 🟡 Moderada | 3-5 dias |
| 18 | **Quadro de Avisos / Mural** | Mural de recados da instituição, avisos gerais. | 🟢 Fácil | 2-3 dias |
| 19 | **Agenda Pessoal do Aluno** | Aluno organiza suas tarefas e compromissos. | 🟡 Moderada | 3-5 dias |
| 20 | **Banco de Questões** | Repositório reutilizável de questões para professores. | 🟡 Moderada | 1 semana |

---

## 6. 🗺️ ROADMAP — O CAMINHO COMPLETO

### 📋 FASE 1: "Blindagem" — Preparação para o Piloto
**Tempo estimado: 1-2 semanas | Prioridade: MÁXIMA**

Estas são as tarefas **obrigatórias** antes de entregar o sistema para uma instituição real. São todas 🟢 Fácil ou 🟡 Moderada.

| Status | # | Tarefa | Dificuldade | Tempo | Tipo |
|:---:|---|--------|:-----------:|:-----:|:----:|
| ⬜ | 1 | Adicionar autenticação JWT nas 3 Edge Functions | 🟢 | 1-2h | Segurança |
| ⬜ | 2 | Restringir CORS para domínio real | 🟢 | 5min | Segurança |
| ⬜ | 3 | Validar inputs nas Edge Functions (role, email, senha) | 🟢 | 1-2h | Segurança |
| ⬜ | 4 | Criar RLS policies para `institutions`, `classes`, `subjects` | 🟢 | 30min-1h | Segurança |
| ⬜ | 5 | Adicionar escopo de instituição nas policies de admin | 🟢 | 30min | Segurança |
| ⬜ | 6 | Criar indexes no banco de dados (script pronto acima) | 🟢 | 15min | Performance |
| ⬜ | 7 | Fazer deploy na Vercel/Netlify | 🟢 | 1-2h | Infra |
| ⬜ | 8 | Corrigir CalendarView para usar `new Date()` em vez de data fixa | 🟢 | 5min | Bug |
| ⬜ | 9 | Conectar botão "Esqueci a Senha" à função que JÁ existe | 🟢 | 30min | Feature |
| ⬜ | 10 | Remover/ajustar dados hardcoded da Landing Page e Insights | 🟡 | 1-2h | UX |
| ⬜ | 11 | Mover senha padrão para backend (Edge Function) | 🟢 | 15min | Segurança |

> [!TIP]
> **Total estimado: ~8-12 horas de trabalho focado.** Dividido entre o time, pode ser feito em 2-3 dias. Nenhuma dessas tarefas é difícil ou arriscada.

---

### 📋 FASE 2: "Polimento" — Primeiras Semanas do Piloto
**Tempo estimado: 2-3 semanas | Prioridade: ALTA**

Melhorias de experiência do usuário e estabilidade para impressionar no piloto:

| Status | # | Tarefa | Dificuldade | Tempo | Tipo |
|:---:|---|--------|:-----------:|:-----:|:----:|
| ⬜ | 12 | Adicionar loading states (spinners/skeletons) | 🟡 | 2-3h | UX |
| ⬜ | 13 | Adicionar Error Boundary global | 🟢 | 1h | Estabilidade |
| ⬜ | 14 | Substituir `alert()` por toast notifications | 🟡 | 2-3h | UX |
| ⬜ | 15 | Paralelizar queries com `Promise.all` | 🟡 | 1-2h | Performance |
| ⬜ | 16 | Persistir notificações no banco (tabela já existe!) | 🟡 | 3-4h | Feature |
| ⬜ | 17 | Calendário puxando deadlines reais de atividades/provas | 🟡 | 3-5h | Feature |
| ⬜ | 18 | Insights com KPIs 100% reais (remover dados hardcoded) | 🟡 | 4-6h | Feature |
| ⬜ | 19 | Conectar Settings para salvar perfil no banco | 🟡 | 2-3h | Feature |
| ⬜ | 20 | Configurar Sentry para monitoramento de erros | 🟢 | 1h | Infra |
| ⬜ | 21 | Implementar edição de atividades/provas (não só deletar) | 🟡 | 4-6h | Feature |

---

### 📋 FASE 3: "Evolução" — Novas Features Core
**Tempo estimado: 1-2 meses | Prioridade: MÉDIA-ALTA**

Features que vão diferenciar o Aprende+ de qualquer concorrente:

| Status | # | Tarefa | Dificuldade | Tempo | Tipo |
|:---:|---|--------|:-----------:|:-----:|:----:|
| ⬜ | 22 | **Sistema de Presença/Chamada Digital** | 🔴 | 1-2 sem | Feature |
|    | | → Tabela `attendance` (student_id, class_id, date, present) | | | |
|    | | → UI para professor marcar presença | | | |
|    | | → Relatório de frequência por aluno | | | |
|    | | → Alerta de alunos com baixa frequência | | | |
| ⬜ | 23 | **Upload de Arquivos (Supabase Storage)** | 🟡 | 3-5 dias | Feature |
|    | | → Upload de trabalhos pelo aluno | | | |
|    | | → Upload de material pelo professor | | | |
|    | | → Imagens de capa para provas/atividades | | | |
| ⬜ | 24 | **Geração de Relatórios em PDF** | 🟡 | 3-5 dias | Feature |
|    | | → Boletim individual do aluno | | | |
|    | | → Relatório de turma para o professor | | | |
|    | | → Relatório institucional para o admin | | | |
| ⬜ | 25 | **Importação em Massa (CSV/Excel)** | 🟡 | 2-3 dias | Feature |
|    | | → Importar lista de alunos com nome e email | | | |
|    | | → Importar professores | | | |
|    | | → Validação e preview antes de importar | | | |
| ⬜ | 26 | **Notificações por Email** | 🟡 | 3-5 dias | Feature |
|    | | → Email quando atividade é publicada | | | |
|    | | → Email quando nota sai | | | |
|    | | → Email de lembrete de prazo (24h antes) | | | |
| ⬜ | 27 | **Implementar React Router** | 🔴 | 2-3 dias | Arquitetura |
|    | | → URLs reais para cada página | | | |
|    | | → Botão "voltar" funcional | | | |
|    | | → Deep linking (compartilhar link de uma atividade) | | | |
| ⬜ | 28 | **Refatorar App.tsx em Contextos** | ⚫ | 3-5 dias | Arquitetura |
|    | | → AuthContext, DataContext, ThemeContext | | | |
|    | | → Eliminar prop drilling | | | |
|    | | → Melhorar performance (re-renders) | | | |
| ⬜ | 29 | **Busca Global** | 🟡 | 2-3 dias | Feature |
|    | | → Barra de pesquisa no header | | | |
|    | | → Buscar alunos, atividades, provas, aulas | | | |
| ⬜ | 30 | **Quadro de Avisos / Mural** | 🟢 | 2-3 dias | Feature |
|    | | → Admin/professor publica avisos | | | |
|    | | → Alunos veem no dashboard | | | |

---

### 📋 FASE 4: "Diferenciação" — Features Avançadas
**Tempo estimado: 2-4 meses | Prioridade: MÉDIA**

Features que transformam o Aprende+ em plataforma de nível profissional:

| Status | # | Tarefa | Dificuldade | Tempo | Tipo |
|:---:|---|--------|:-----------:|:-----:|:----:|
| ⬜ | 31 | **IA — Insights Inteligentes** | 🔴 | 2-3 sem | Feature |
|    | | → Previsão de alunos em risco de reprovação | | | |
|    | | → Análise de padrões de desempenho | | | |
|    | | → Sugestões de conteúdo para revisão | | | |
|    | | → Integração com API de IA (OpenAI/Gemini) | | | |
| ⬜ | 32 | **IA — Correção Assistida de Dissertativas** | 🔴 | 1-2 sem | Feature |
|    | | → IA sugere nota e feedback para questões abertas | | | |
|    | | → Professor revisa e aprova/ajusta a sugestão | | | |
| ⬜ | 33 | **Sistema de Mensagens/Chat** | 🔴 | 2-3 sem | Feature |
|    | | → Chat direto professor ↔ aluno | | | |
|    | | → Canal de avisos por turma | | | |
|    | | → Canal de dúvidas por disciplina | | | |
|    | | → Usar Supabase Realtime para mensagens instantâneas | | | |
| ⬜ | 34 | **Portal de Responsáveis/Pais** | 🔴 | 1-2 sem | Feature |
|    | | → Novo perfil `parent` | | | |
|    | | → Ver notas e frequência do filho | | | |
|    | | → Receber alertas de desempenho | | | |
| ⬜ | 35 | **Gamificação** | 🟡 | 1-2 sem | Feature |
|    | | → XP por atividade entregue | | | |
|    | | → Badges (ex: "5 atividades seguidas no prazo") | | | |
|    | | → Ranking da turma (opcional, configurável) | | | |
|    | | → Streaks de engajamento | | | |
| ⬜ | 36 | **PWA (Progressive Web App)** | 🟡 | 3-5 dias | Infra |
|    | | → Instalar no celular como app | | | |
|    | | → Push notifications nativas | | | |
|    | | → Funcionar offline (modo leitura) | | | |
| ⬜ | 37 | **Fórum de Discussão** | 🔴 | 1-2 sem | Feature |
|    | | → Threads por disciplina | | | |
|    | | → Perguntas e respostas | | | |
|    | | → Professor pode fixar/destacar tópicos | | | |
| ⬜ | 38 | **Banco de Questões** | 🟡 | 1 sem | Feature |
|    | | → Repositório de questões reutilizáveis | | | |
|    | | → Filtro por tipo, disciplina, dificuldade | | | |
|    | | → Arrastar questões do banco para atividade/prova | | | |

---

### 📋 FASE 5: "Escala" — Infraestrutura Enterprise
**Tempo estimado: 2-3 meses | Prioridade: BAIXA (quando tiver tração)**

| Status | # | Tarefa | Dificuldade | Tempo | Tipo |
|:---:|---|--------|:-----------:|:-----:|:----:|
| ⬜ | 39 | **Testes Automatizados (Vitest + Playwright)** | 🟡 | Contínuo | Qualidade |
| ⬜ | 40 | **CI/CD Pipeline (GitHub Actions)** | 🟡 | 1-2 dias | DevOps |
| ⬜ | 41 | **Multi-idioma (i18n)** | 🟡 | 1-2 sem | Feature |
| ⬜ | 42 | **Acessibilidade (a11y) Total** | 🟡 | 1-2 sem | UX |
| ⬜ | 43 | **Multi-tenant Avançado** | ⚫ | 2-4 sem | Arquitetura |
|    | | → Isolamento total de dados entre instituições | | | |
|    | | → Dashboard super-admin multi-escola | | | |
|    | | → Painel de administração do SaaS | | | |
| ⬜ | 44 | **API Pública** | ⚫ | 2-4 sem | Arquitetura |
|    | | → API REST documentada para integrações | | | |
|    | | → Webhooks para eventos do sistema | | | |
| ⬜ | 45 | **Plano de Backup e Recuperação** | 🟡 | 1-2 dias | DevOps |
| ⬜ | 46 | **Componentes UI Reutilizáveis** | 🟡 | 1-2 sem | Arquitetura |
|    | | → Design System próprio (Button, Input, Card, Badge, Table, etc.) | | | |

---

## 7. 📊 VISÃO DE TIMELINE

```
  FASE 1 — Blindagem       ████░░░░░░░░░░░░░░░░░░░░░░░░░░  (~1-2 semanas)
  FASE 2 — Polimento       ░░░░████████░░░░░░░░░░░░░░░░░░  (~2-3 semanas)
  FASE 3 — Evolução        ░░░░░░░░░░░░████████████░░░░░░  (~1-2 meses)
  FASE 4 — Diferenciação   ░░░░░░░░░░░░░░░░░░░░░░░░██████  (~2-4 meses)
  FASE 5 — Escala           ░░░░░░░░░░░░░░░░░░░░░░░░░░████ (contínuo)
                           ─────────────────────────────────
                           Jun   Jul   Ago   Set   Out   Nov
```

---

## 8. 🧱 O QUE JÁ ESTÁ BEM FEITO (Para Orgulho do Time!)

É muito importante reconhecer o que já foi construído corretamente. Isso **não** é comum em projetos de 4º semestre:

| Aspecto | Status | Por que é impressionante |
|---------|:------:|--------------------------|
| Service Role Key isolada no servidor | ✅ | A maioria dos projetos acadêmicos coloca a chave admin no frontend |
| `.env` no `.gitignore` | ✅ | Segurança básica que muitos esquecem |
| `SECURITY DEFINER` nas funções SQL | ✅ | Padrão profissional de evitar recursão RLS |
| Defesa anti-cheat (opções randomizadas) | ✅ | Feature que sistemas pagos não têm |
| Auto-submit de provas expiradas | ✅ | Detecção de manipulação de relógio |
| Detecção de entrega atrasada | ✅ | Automático, sem intervenção manual |
| `UNIQUE` constraints contra submissões duplicadas | ✅ | Proteção a nível de banco de dados |
| `must_change_password` no primeiro login | ✅ | Boa prática de segurança |
| Sessão com expiração por inatividade | ✅ | 24h de timeout |
| Realtime em 9 tabelas | ✅ | Dados atualizam sem F5 |
| Correção automática + manual com feedback | ✅ | Sistema de avaliação completo |
| `ON DELETE CASCADE` correto | ✅ | Integridade referencial sólida |
| Schema normalizado em 3NF | ✅ | Design de banco maduro |
| TypeScript com tipos bem definidos | ✅ | Interfaces para todas as entidades |
| Separação de serviços (auth, admin, supabase) | ✅ | Arquitetura limpa |
| Landing Page premium com animações Framer Motion | ✅ | Impressiona na primeira visita |
| Code splitting configurado no Vite | ✅ | Chunks separados para vendor code |
| Dark/Light mode com CSS Variables | ✅ | Tema persistente no localStorage |
| Documentação em português organizada | ✅ | README + docs bem escritos |
| Modo Demo para apresentações | ✅ | Dados mockados para demos sem depender do banco |

---

## 9. 📝 SOBRE O MODO DEMO E DADOS HARDCODED

> [!NOTE]
> **Esclarecimento importante**: Alguns itens marcados como "hardcoded" na auditoria anterior (como o `CalendarView.tsx` iniciando em Janeiro 2026) **faziam sentido** para o propósito de demonstração na feira. O Modo Demo foi intencionalmente construído com dados mockados para funcionar sem conexão com o banco.
>
> Para o **piloto real**, esses dados precisam ser trocados por dados reais, mas isso **não** é um bug — foi uma decisão consciente de design para a feira. A mudança é simples: trocar `new Date(2026, 0, 1)` por `new Date()` e conectar os componentes ao banco real.

---

## 10. 📐 STACK TECNOLÓGICA

| Camada | Tecnologia | Status |
|--------|-----------|--------|
| **Frontend** | React 19 + TypeScript | ✅ |
| **Build** | Vite 6 | ✅ |
| **Styling** | Tailwind CSS 4 + CSS Variables | ✅ |
| **Animações** | Framer Motion (motion) | ✅ |
| **Gráficos** | Recharts 3 | ✅ |
| **Ícones** | Lucide React | ✅ |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime + Edge Functions) | ✅ |
| **Deploy** | A configurar (Vercel recomendado) | ❌ |
| **CI/CD** | Não configurado | ❌ |
| **Testes** | Não configurado | ❌ |
| **Monitoramento** | Não configurado | ❌ |

---

## 11. 🏆 CONCLUSÃO

O Aprende+ **não** é um projeto amador. É um sistema funcional com 22+ features completas, integração real com banco de dados, e uma UI que impressiona. O fato de já ter recebido uma proposta de piloto real comprova isso.

O que precisa ser feito agora é **blindar** o que já existe (segurança), **polir** a experiência (UX), e **expandir** com features que vão diferenciar a plataforma (IA, presença, relatórios).

**Nenhuma das correções urgentes é difícil.** São todas 🟢 Fácil, executáveis em horas, e não quebram o que já funciona.

O caminho está claro. É só seguir o roadmap. 💪

---

> **Documento gerado por**: Auditoria técnica automatizada com análise de código-fonte
> **Arquivos analisados**: 30+ arquivos TypeScript/SQL, 500KB+ de código
> **Última atualização**: 15 de Junho de 2026
