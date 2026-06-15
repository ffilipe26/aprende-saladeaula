# 🔍 Auditoria Técnica Completa — Aprende+

> **Objetivo**: Avaliar a prontidão do sistema para um projeto-piloto em uma instituição real.
> **Data**: 13 de Junho de 2026
> **Escopo**: Segurança, Arquitetura, Código, Banco de Dados, DevOps e Plano de Ação.

---

## 📊 Veredicto Geral: O sistema está pronto para o piloto?

> [!IMPORTANT]
> **Resposta curta: SIM, com ressalvas.**
> O Aprende+ tem uma base técnica sólida e impressionante para um projeto de 4º semestre. As funcionalidades core (autenticação, turmas, disciplinas, atividades, provas, correção automática) **funcionam**. Porém, existem **vulnerabilidades de segurança críticas** que precisam ser corrigidas **antes** de colocar o sistema na mão de usuários reais. Nenhuma delas é impossível de resolver — são correções pontuais e bem definidas.

### Score de Prontidão por Pilar

| Pilar | Nota | Status |
|-------|------|--------|
| Funcionalidades Core | 8/10 | 🟢 Pronto para piloto |
| Segurança Backend | 3/10 | 🔴 Requer correções urgentes |
| Banco de Dados (Schema) | 7/10 | 🟡 Bom, precisa de ajustes |
| Arquitetura Frontend | 4/10 | 🟡 Funciona, mas tem débito técnico |
| Qualidade de Código | 4/10 | 🟡 Funcional, com bad smells |
| DevOps / Deploy | 2/10 | 🔴 Praticamente inexistente |
| Documentação | 8/10 | 🟢 Acima da média |

---

## 1. 🛡️ SEGURANÇA E VULNERABILIDADES

Este é o pilar mais crítico. Identifiquei problemas que **precisam ser resolvidos antes do piloto**.

### 🚨 CRÍTICO — Corrigir ANTES do piloto

#### 1.1 Edge Functions SEM Autenticação (Risco: Catastrófico)

As 3 Edge Functions (`admin-create-institution`, `admin-create-user`, `admin-delete-user`) **não verificam quem está chamando**. Qualquer pessoa que conheça a URL do Supabase pode:

- **Criar instituições falsas** sem estar logado
- **Criar usuários com qualquer role** (incluindo `super_admin`) em qualquer instituição
- **Deletar qualquer usuário** do sistema inteiro passando o `userId`

**Como corrigir**: Adicionar verificação de JWT + role em cada função:

```typescript
// Extrair e verificar o token do chamador
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
}

// Criar um cliente com a anon key para verificar o token
const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
const { data: { user }, error } = await anonClient.auth.getUser(
  authHeader.replace('Bearer ', '')
);
if (error || !user) {
  return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401 });
}

// Verificar role no banco
const { data: callerProfile } = await supabase
  .from('users').select('role, institution_id').eq('id', user.id).single();
if (!callerProfile || !['admin', 'super_admin'].includes(callerProfile.role)) {
  return new Response(JSON.stringify({ error: 'Sem permissão' }), { status: 403 });
}
```

---

#### 1.2 CORS Aberto para Qualquer Origem (Risco: Alto)

O arquivo `cors.ts` usa `Access-Control-Allow-Origin: '*'`. Qualquer site na internet pode chamar as Edge Functions.

**Como corrigir**:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://seudominio.com.br', // ← domínio real
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
```

---

#### 1.3 Escalação de Privilégios via `admin-create-user`

A função aceita o campo `role` diretamente do body da requisição sem validar. Um atacante pode enviar `role: 'super_admin'` para criar contas de administrador em qualquer instituição.

**Como corrigir**: Validar que o `role` é apenas `'teacher'` ou `'student'`:
```typescript
if (!['teacher', 'student'].includes(role)) {
  return new Response(JSON.stringify({ error: 'Role inválido' }), { status: 400 });
}
```

---

#### 1.4 Sem Validação de Input nas Edge Functions

Nenhuma das 3 funções valida:
- Formato do email
- Força da senha
- Valores válidos para `schoolType`, `role`
- Se `institutionId` existe e pertence ao chamador

**Solução**: Adicionar validação básica no início de cada função.

---

### 🟡 IMPORTANTE — Corrigir logo após o piloto começar

#### 1.5 Tabelas `institutions`, `classes` e `subjects` sem Políticas RLS

Essas tabelas têm RLS habilitado mas **zero políticas definidas**. Isso significa que queries diretas do frontend (como em `App.tsx` que consultam `classes` e `subjects`) podem falhar silenciosamente retornando dados vazios ou funcionar por causa de políticas configuradas manualmente no dashboard do Supabase.

**Solução**: Criar políticas explícitas:
```sql
-- Classes: leitura para todos da instituição
CREATE POLICY "classes_read_institution" ON classes FOR SELECT
USING (institution_id = public.get_auth_user_institution());

-- Subjects: leitura para todos da instituição
CREATE POLICY "subjects_read_institution" ON subjects FOR SELECT
USING (institution_id = public.get_auth_user_institution());
```

#### 1.6 Políticas de UPDATE/DELETE em `lessons`, `exams`, `activities` sem escopo de instituição

As políticas em `refinamentos.sql` verificam apenas se o usuário é admin — mas não verificam de **qual instituição**. Um admin da Instituição A poderia, em teoria, deletar provas da Instituição B.

#### 1.7 `correctAnswer` Visível na Rede

O frontend remove `correctAnswer` das questões antes de exibir ao aluno, mas os dados **completos com respostas** são trafegados pela rede. Um aluno com DevTools aberto pode interceptar e ver as respostas corretas antes da remoção no JavaScript.

**Solução ideal**: Criar uma View no PostgreSQL que omite `correctAnswer` para alunos, ou fazer o stripping na Edge Function.

#### 1.8 Senha Padrão `Mudar@1234` Hardcoded no Bundle

Em `adminService.ts`, a senha padrão é visível no código-fonte do navegador. Qualquer pessoa que inspecionar o JavaScript saberá a senha temporária.

---

### ✅ O Que JÁ Está Bem Feito em Segurança

| Aspecto | Status |
|---------|--------|
| Service Role Key isolada no servidor (Edge Functions) | ✅ Correto |
| `.env` no `.gitignore` | ✅ Correto |
| `.env.example` com avisos de segurança | ✅ Excelente |
| Defesa anti-cheat em múltipla escolha | ✅ Implementado |
| Defesa contra double-submit (race condition) | ✅ Implementado |
| Defesa contra manipulação de relógio | ✅ Implementado |
| `UNIQUE` constraints impedindo submissões duplicadas | ✅ Correto |
| SECURITY DEFINER para evitar recursão RLS | ✅ Padrão profissional |
| `must_change_password` para primeiro login | ✅ Boa prática |
| Sessão com expiração por inatividade | ✅ Implementado |

---

## 2. 🏗️ ARQUITETURA E ESCALABILIDADE

### O Backend (Supabase) Está Bem Escolhido?

> [!TIP]
> **Sim.** A escolha do Supabase como BaaS (Backend-as-a-Service) é excelente para um MVP/piloto. Ele fornece PostgreSQL, Auth, Realtime, Edge Functions e Storage — tudo gerenciado. Não precisa se preocupar com servidores, balanceamento de carga ou infraestrutura.

**Para um piloto de 1-2 turmas (50-200 alunos), o Supabase no plano gratuito/Pro suporta tranquilamente.**

### Onde Vai Gargalar?

| Ponto de Gargalo | Severidade | Quando Vai Doer |
|-----------------|------------|-----------------|
| **Zero indexes no banco** | 🔴 Alta | Com 500+ alunos, as queries RLS com sub-selects em `subjects` e `users` vão ficar lentas |
| **`handleReload` recarrega TUDO** | 🔴 Alta | A cada evento Realtime, TODOS os dados da instituição são re-buscados (8+ queries sequenciais) |
| **Queries sequenciais (waterfall)** | 🟡 Média | `loadInstitutionData` faz 8 `await` em sequência em vez de usar `Promise.all` |
| **Sem paginação** | 🟡 Média | Todas as queries buscam TODOS os registros (`SELECT *`) — com 1000+ atividades, isso vai ser lento |
| **Bundle de 920KB sem code-splitting** | 🟡 Média | Primeiro carregamento lento em conexões lentas |

### O Que Precisa Mudar Para Escalar?

**Para o piloto** (urgente):
1. Criar indexes nas colunas de FK mais usadas
2. Trocar queries sequenciais por `Promise.all` no `loadInstitutionData`

**Para crescimento futuro** (pós-piloto):
3. Implementar React Query/TanStack Query para caching
4. Adicionar paginação nas listagens
5. Lazy loading com React.lazy() para code-splitting

---

## 3. 🏛️ ARQUITETURA FRONTEND

### App.tsx — O "God Component" (Componente Deus)

O `App.tsx` tem **1.151 linhas** e concentra:

- **25+ estados** (`useState`)
- **Toda a lógica de autenticação**
- **Todo o carregamento de dados** (275 linhas só em `loadInstitutionData`)
- **Todo o roteamento** (switch manual com strings)
- **Todas as subscrições Realtime**
- **Todo o gerenciamento de tema**
- **Todo o sistema de notificações**

Isso funciona, mas cria problemas:
- Qualquer mudança de estado re-renderiza toda a árvore de componentes
- Prop drilling massivo (10-20 props para cada página)
- Impossível testar em isolamento

### Páginas Monolíticas

| Arquivo | Tamanho | Problema |
|---------|---------|----------|
| `LandingPage.tsx` | 56KB | Hero, Metodologia, Pricing, FAQ tudo junto |
| `ActivityDetail.tsx` | 49KB | Quiz, timer, auto-submit, review, correção |
| `AdminDashboard.tsx` | 48KB | 3 visões diferentes em um componente |
| `AdminPanel.tsx` | 42KB | 3 tabelas, 2 modals, CRUD, filtros |
| `Exams.tsx` | 40KB | Listagem + detalhes + filtros |

### Sem Roteamento Real

Não existe React Router. A navegação é feita via estado string (`activeSection`):
- ❌ URLs não mudam (impossível bookmarkar/compartilhar links)
- ❌ Botão "voltar" do navegador não funciona
- ❌ Sem deep linking
- ❌ Histórico perdido no refresh

### Apenas 6 Componentes Reutilizáveis

Dos 26 arquivos `.tsx`, apenas 6 são componentes compartilhados. Não existe: Button, Input, Card, Badge, Table, Toast, Loading — componentes base que são re-implementados manualmente em cada página.

> [!NOTE]
> **Para o piloto, isso NÃO é bloqueante.** O sistema funciona. Mas conforme o projeto crescer, essa arquitetura vai se tornar cada vez mais difícil de manter. Planejar a refatoração para Contextos React + React Router é uma das melhorias pós-piloto mais impactantes.

---

## 4. 🧹 QUALIDADE DE CÓDIGO E BOAS PRÁTICAS

### Code Smells Identificados

| Smell | Onde | Impacto |
|-------|------|---------|
| **Código duplicado** | Lógica de questões duplicada entre `ExamCreator.tsx` e `ActivityForm.tsx` | Manutenção dobrada |
| **Magic strings** | Navegação usa strings hardcoded (`'dashboard'`, `'activities'`) | Erros de digitação = bugs silenciosos |
| **`as any` em excesso** | `App.tsx` | Perde segurança de tipos |
| **`alert()` para erros** | Vários arquivos | UX ruim |
| **`console.error` sem feedback ao usuário** | `loadInstitutionData` - 7 pontos | Falhas silenciosas |
| **`Date.now().toString()` para IDs** | `App.tsx` | Pode colidir |
| **Sem Error Boundary** | Global | Crash = tela branca |
| **Sem loading states** | `loadInstitutionData` faz 8+ calls sem indicar carregamento | UX confusa |
| **Ternários de dark mode copiados** | Centenas de ocorrências de `${isDarkMode ? '...' : '...'}` | Deveria usar CSS Variables |
| **`CalendarView.tsx` hardcoded** | Inicia em Jan 2026 em vez de `new Date()` | Bug |
| **`Members.tsx` é código morto** | Nunca renderizado | Arquivo desnecessário |

### O Que Está BEM Feito em Qualidade

| Aspecto | Status |
|---------|--------|
| TypeScript com tipos bem definidos em `types.ts` | ✅ |
| Interfaces claras para todas as entidades de domínio | ✅ |
| Separação de serviços (auth.ts, adminService.ts, supabase.ts) | ✅ |
| Comentários em português organizados por seção | ✅ |
| Organização de pastas (pages/, components/, lib/, utils/) | ✅ |
| CSS Variables para tema | ✅ |
| Animações com Framer Motion | ✅ |

---

## 5. 🗃️ BANCO DE DADOS

### Schema — O Que Está BOM

O schema está **bem normalizado (3NF)**:
- ✅ UUIDs como primary keys em todas as tabelas
- ✅ Foreign keys com `ON DELETE CASCADE` e `ON DELETE SET NULL`
- ✅ `UNIQUE` constraints impedindo duplicatas
- ✅ `CHECK` constraints em enums
- ✅ Separação de scores auto e manual
- ✅ 11 tabelas com relacionamentos coerentes

### Schema — O Que FALTA

| Item | Impacto | Prioridade |
|------|---------|------------|
| **Zero `CREATE INDEX`** em todo o projeto | 🔴 Performance vai degradar | Urgente para piloto |
| **Sem `updated_at`** em nenhuma tabela | 🟡 Impossível auditar alterações | Pós-piloto |
| **`lessons.duration` é TEXT** | 🟡 Deveria ser INTEGER (minutos) | Baixa |
| **Sem soft delete** | 🟡 CASCADE deleta tudo permanentemente | Pós-piloto |
| **JSONB sem validação de schema** | 🟡 Aceita payloads arbitrários | Pós-piloto |

### Indexes Recomendados (Criar ANTES do piloto)

```sql
-- Performance: indexes nas colunas mais usadas em RLS e queries
CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
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

## 6. 📦 INVENTÁRIO DE FUNCIONALIDADES

### ✅ Implementado e Funcionando (20 features)

1. Onboarding de instituição (wizard completo)
2. Autenticação email/senha via Supabase Auth
3. 4 roles (super_admin, admin, teacher, student)
4. CRUD de Turmas e Disciplinas
5. Matrícula de alunos em disciplinas
6. Criação de atividades (múltipla escolha, V/F, dissertativa) e provas com timer
7. Resolução de atividades/provas pelo aluno
8. Correção automática (objetivas) e manual (dissertativas)
9. Publicação de notas (individual e em lote)
10. Detecção de entrega atrasada e auto-submit de provas
11. Sistema Realtime (sem F5)
12. Gestão de aulas (YouTube, PDF, vídeo)
13. Dashboards, Insights e Landing page

### ⚠️ Funcionalidades com Ressalvas

| Feature | Status |
|---------|--------|
| Calendário | Dados estáticos/fictícios |
| Notificações | Só em memória (não persistem entre sessões) |
| Dashboard stats do Admin | Números parcialmente hardcoded |
| "Esqueceu a senha?" | Não funcional |

---

## 7. 🚀 PLANO DE AÇÃO PRIORIZADO

### 📋 ANTES do Piloto (Bloqueante — ~1-2 semanas)

| # | Item | Esforço | Tipo |
|---|------|---------|------|
| 1 | **Adicionar autenticação nas Edge Functions** | 2-3h cada | 🔴 Segurança |
| 2 | **Restringir CORS para o domínio real** | 15min | 🔴 Segurança |
| 3 | **Validar input nas Edge Functions** (role, email, senha) | 1-2h cada | 🔴 Segurança |
| 4 | **Criar RLS policies para `institutions`, `classes`, `subjects`** | 1h | 🔴 Segurança |
| 5 | **Criar indexes no banco** (script acima) | 30min | 🔴 Performance |
| 6 | **Adicionar escopo de instituição nas policies de UPDATE/DELETE** | 1h | 🟡 Segurança |
| 7 | **Deploy em um domínio real** (Vercel/Netlify) | 1-2h | 🔴 Infra |

> [!CAUTION]
> Os itens 1-4 são **obrigatórios**. Sem eles, qualquer pessoa na internet pode criar, alterar e deletar dados no sistema.

---

### 📋 PRIMEIRAS SEMANAS do Piloto (Importante — ~2-4 semanas)

| # | Item | Esforço | Tipo |
|---|------|---------|------|
| 8 | **Implementar "Esqueceu a senha?"** via Supabase Auth | 2-3h | 🟡 Feature |
| 9 | **Adicionar loading states** no carregamento de dados | 2h | 🟡 UX |
| 10 | **Adicionar Error Boundary global** | 1h | 🟡 Estabilidade |
| 11 | **Paralelizar queries** com `Promise.all` em `loadInstitutionData` | 1h | 🟡 Performance |

---

### 📋 PÓS-PILOTO (Melhoria Contínua — ~1-3 meses)

| # | Item | Esforço | Tipo |
|---|------|---------|------|
| 12 | **Implementar React Router** (URLs, back button, deep linking) | 1-2 dias | Arquitetura |
| 13 | **Extrair App.tsx em Contexts** (Auth, Data, Theme, Notifications) | 2-3 dias | Arquitetura |
| 14 | **Componentizar** (criar Button, Input, Card, Table reutilizáveis) | 3-5 dias | Manutenibilidade |
| 15 | **Paginação** nas listagens de alunos, atividades, submissões | 2-3 dias | Escalabilidade |
| 16 | **CI/CD pipeline** (GitHub Actions → Vercel) | 1 dia | DevOps |

---

## 8. 💡 PONTOS POSITIVOS — O Que Vocês Fizeram MUITO Bem

> [!TIP]
> O avaliador da feira tem boas razões para ter gostado. Aqui está o que diferencia o Aprende+ de um projeto estudantil comum:

1. **Documentação excepcional**: O `engineering_log.md` documenta problemas de segurança reais e maduros.
2. **Anti-cheat em provas**: Defesas contra manipulação de respostas, double-submit, e relógio.
3. **Arquitetura de segurança pensada**: Service Role Key isolada no servidor, SECURITY DEFINER functions.
4. **Multi-tenancy funcional**: O modelo de dados com `institution_id` é o padrão correto para SaaS.
5. **Sistema Realtime**: Atualizações sem refresh é um diferencial competitivo.

---

## 9. 📌 RESUMO EXECUTIVO

### Para a reunião de segunda-feira:

O sistema tem **todas as funcionalidades core** necessárias para um piloto. O que precisa ser feito antes é um **hardening de segurança focado** (autenticação nas Edge Functions + CORS + indexes), que representa cerca de **8-12 horas de trabalho**.

Vocês podem dizer ao avaliador:
> *"O sistema tem a base funcional completa para o piloto. Estamos fazendo um hardening de segurança e deploy em servidor definitivo antes de liberar para uso real. Estimamos ter isso pronto em 1-2 semanas."*

**O sistema não é "apenas um backend pra ver login funcionando". É um MVP funcional com potencial real.**
