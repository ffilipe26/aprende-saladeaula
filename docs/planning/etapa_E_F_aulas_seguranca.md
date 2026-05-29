# 📋 Planejamento — Fase E: Aulas, Notificações e Segurança

> **Status:** 🔲 Planejado
> **Dependências:** Fases D.3, D.4 e D.5

---

## Fase E.1 — Aulas Persistidas no Banco de Dados

### Contexto

Atualmente, as aulas criadas pelo professor via `LessonForm.tsx` são salvas **apenas na memória local** (array React). Ao dar F5, somem. O banco já tem a tabela `lessons`, mas não está sendo usada para persistência.

### O Que Precisa Ser Feito

#### Backend
- [ ] Confirmar que a tabela `public.lessons` está criada com as colunas corretas:
  ```sql
  CREATE TABLE lessons (
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
  ```
- [ ] Adicionar `adminService.createLesson()`:
  ```typescript
  async createLesson({ subjectId, teacherId, title, description, type, url, duration })
  ```
- [ ] Adicionar `adminService.deleteLesson()`.

#### Frontend
- [ ] **Atualizar** `src/components/forms/LessonForm.tsx`
  - Ao salvar, chamar `adminService.createLesson()` em vez de apenas chamar `onAddLesson` local.
  - Tratar loading e erros.

- [ ] **Atualizar** `src/App.tsx — loadInstitutionData()`
  - Adicionar busca das aulas: `FROM lessons WHERE subject_id IN (...)`.
  - Popular o state `lessons`.

- [ ] **Atualizar** `src/pages/Lessons.tsx`
  - Adicionar botão de deletar aula (para professor e admin).
  - Atualizar o estado ao deletar.

### Plano de Verificação
1. Professor cria uma aula com link do YouTube.
2. Dá F5 → aula ainda aparece.
3. Aluno matriculado na disciplina acessa Aulas → vê a aula.
4. Aluno de outra disciplina → não vê a aula.

---

## Fase E.2 — Notificações em Tempo Real (Supabase Realtime)

### Contexto

Atualmente, as notificações são apenas locais (em memória). Precisamos de notificações persistidas e em tempo real para fechar o ciclo pedagógico.

### Eventos que devem gerar notificações

| Evento | Quem notifica | Quem recebe |
|--------|--------------|-------------|
| Professor publica nova atividade | Sistema | Todos os alunos matriculados na disciplina |
| Aluno submete atividade | Sistema | Professor da disciplina |
| Professor corrige submissão | Sistema | Aluno que submeteu |
| Admin adiciona novo membro | Sistema | Novo membro (bem-vindo) |

### O Que Precisa Ser Feito

#### Backend
- [ ] Criar tabela `notifications` no banco:
  ```sql
  CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,  -- 'activity', 'submission', 'grade', 'system'
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Criar INSERT de notificações nas funções do `adminService`.

#### Frontend
- [ ] **Atualizar** `src/App.tsx`
  - Em `loadInstitutionData()`, buscar notificações do usuário atual.
  - Configurar `supabase.channel()` para escutar novas notificações em tempo real.
  - Ao receber nova notificação via Realtime, adicionar ao estado local.

- [ ] **Atualizar** `src/components/layout/Header.tsx`
  - Indicador visual de novas notificações (badge vermelho).

---

## Fase F.1 — Segurança de Produção

### Contexto

> ⚠️ **Crítico para produção real.** Atualmente, a `SERVICE_ROLE_KEY` do Supabase está exposta no bundle do Vite, tornando possível que qualquer pessoa com acesso ao site execute operações administrativas no banco de dados.

### O Que Precisa Ser Feito

#### Supabase Edge Functions
- [ ] Criar Edge Function `create-user` (cria professor/aluno):
  ```typescript
  // supabase/functions/create-user/index.ts
  serve(async (req) => {
    const { name, email, role, institutionId, classId } = await req.json();
    // Validar JWT do admin na request
    // Usar Service Role internamente (nunca exposta ao cliente)
    // INSERT em auth.users + public.users
  });
  ```
- [ ] Criar Edge Function `create-institution`.
- [ ] Criar Edge Function `delete-user`.
- [ ] Remover `VITE_SUPABASE_SERVICE_ROLE_KEY` do `.env` do frontend.
- [ ] Remover `src/lib/adminSupabase.ts`.
- [ ] Atualizar `adminService.ts` para chamar as Edge Functions via `supabase.functions.invoke()`.

---

## Fase F.2 — RLS Completo

### Contexto

RLS está habilitado nas tabelas mas as policies detalhadas não foram configuradas. Isso significa que o acesso está sendo controlado apenas no nível do código (Service Role bypassa tudo). Para uma segurança real, as policies são essenciais.

### Policies a Configurar

```sql
-- ACTIVITIES

-- Alunos veem atividades das suas disciplinas
CREATE POLICY "students_see_enrolled_activities"
ON activities FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM subject_enrollments se
    WHERE se.subject_id = activities.subject_id
    AND se.student_id = auth.uid()
  )
);

-- Professores veem e gerenciam suas atividades
CREATE POLICY "teachers_manage_own_activities"
ON activities FOR ALL TO authenticated
USING (teacher_id = auth.uid());

-- ACTIVITY_SUBMISSIONS

-- Alunos gerenciam suas próprias submissões
CREATE POLICY "students_own_submissions"
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

-- SUBJECTS

-- Alunos veem disciplinas em que estão matriculados
CREATE POLICY "students_see_enrolled_subjects"
ON subjects FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM subject_enrollments se
    WHERE se.subject_id = id
    AND se.student_id = auth.uid()
  )
);

-- Professores veem suas disciplinas
CREATE POLICY "teachers_see_own_subjects"
ON subjects FOR SELECT TO authenticated
USING (teacher_id = auth.uid());

-- E assim por diante para todas as tabelas...
```

### Impacto

Após implementar o RLS completo:
- O `adminSupabase` (Service Role) se tornará desnecessário para a maioria das operações.
- Cada usuário, com seu próprio JWT, só terá acesso ao que lhe pertence.
- Elimina a necessidade de filtrar dados no código do frontend por role.

---

*Planejado em: Maio de 2026 — Equipe Aprende+*
