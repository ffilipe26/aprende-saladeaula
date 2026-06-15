# 📋 Planejamento — Fase D.5: Portal de Correção do Professor

> **Status:** 🔲 Planejado — Aguardando início
> **Dependências:** Fase D.3 ✅ e idealmente D.4 🔲
> **Prioridade:** Alta

---

## Contexto

Com as atividades sendo submetidas no banco via `activity_submissions`, o próximo passo é fechar o ciclo pedagógico: dar ao professor uma forma de **visualizar e corrigir** as submissões dos alunos.

Dois cenários existem:
1. **Questões Objetivas:** A nota já foi calculada automaticamente. O professor precisa apenas visualizar.
2. **Questões Dissertativas:** A nota ainda está pendente. O professor precisa ler, atribuir nota e dar feedback.

---

## Problema Atual

- O campo "Para Corrigir" no `TeacherDashboard.tsx` mostra `0` (os dados mockados foram removidos).
- Não existe nenhuma tela para o professor ver as submissões dos alunos.
- Questões dissertativas ficam sem nota indefinidamente.

---

## O Que Precisa Ser Feito

### Backend

- [ ] Garantir que `activity_submissions` tem as colunas corretas para correção manual:
  ```sql
  manual_score NUMERIC,
  final_score NUMERIC,
  teacher_feedback TEXT,
  graded_at TIMESTAMPTZ
  ```
- [ ] Adicionar `adminService.gradeSubmission()` em `adminService.ts`:
  ```typescript
  async gradeSubmission({
    submissionId,
    manualScore,
    teacherFeedback
  }: {
    submissionId: string;
    manualScore: number;
    teacherFeedback?: string;
  })
  ```
  Deve fazer UPDATE em `activity_submissions` com `manual_score`, `final_score` (auto + manual), `teacher_feedback`, `status = 'graded'`, `graded_at = NOW()`.

### Frontend — Nova Página: Submissions.tsx

- [ ] **Criar** `src/pages/Submissions.tsx`

  **Visão do Professor:**
  - Lista de atividades criadas pelo professor (como seletor/drill-down)
  - Para cada atividade: lista de alunos que submeteram
  - Exibição: nome do aluno, data de submissão, status (Submetida / Corrigida / Enviada com Atraso), nota automática
  - Botão "Corrigir" para abrir a submissão detalhada
  - Filtro por status: Aguardando Correção / Já Corrigidas
  - Indicador de quantas dissertativas precisam de nota manual

  **Estrutura visual sugerida:**
  ```
  [Seletor de Atividade ▼]
  
  Atividade: "Prova Final de Cálculo" — 12 submissões — 3 aguardando correção
  
  ┌─────────────────────────────────────────────────────┐
  │ Ana Silva         │ Hoje 14:23  │ 85/100  │ ✅ Corrigida │
  │ Lucas Oliveira    │ Ontem 23:55 │ 70/100  │ ⏳ Pendente  │  ← tem dissertativa
  │ Beatriz Santos    │ Atrasado    │ 60/100  │ ✅ Corrigida │
  └─────────────────────────────────────────────────────┘
  ```

### Frontend — Nova Página: SubmissionDetail.tsx

- [ ] **Criar** `src/pages/SubmissionDetail.tsx`

  **Visão do Professor:**
  - Cabeçalho: Nome do aluno, atividade, data de envio, status de atraso
  - Para cada questão:
    - **Objetivas:** Exibe resposta do aluno + resposta correta + pontos ganhos (auto-corrigido)
    - **Dissertativas:** Exibe resposta do aluno + campo input para nota + campo de feedback
  - Seção de totais: Nota automática / Nota manual / Nota final
  - Botão "Salvar Correção" → chama `adminService.gradeSubmission()`
  - Feedback de sucesso ao salvar

### Frontend — Atualização: TeacherDashboard.tsx

- [ ] **Atualizar** o KPI "Para Corrigir" para buscar o número real:
  - Em `loadInstitutionData()`, buscar count de submissions com `status = 'submitted'` das atividades do professor
  - Ou buscar esse dado dentro do componente com `useEffect` + `adminSupabase.from('activity_submissions').select().eq()`

### Frontend — Atualização: App.tsx

- [ ] Adicionar rotas `submissions` e `submission_detail` no `renderContent()`.
- [ ] Passar props necessários para as novas telas.

---

## Fluxo de Correção

```
TeacherDashboard.tsx
  "Para Corrigir: 5" → clica
    ↓
Submissions.tsx
  Lista de atividades → clica em "Prova Final de Cálculo"
    → Lista de alunos que submeteram
    → Lucas Oliveira — "Pendente" → clica em "Corrigir"
      ↓
SubmissionDetail.tsx
  Questão 1 (Múltipla Escolha): ✅ 10/10
  Questão 2 (V/F): ❌ 0/5
  Questão 3 (Dissertativa): "Explique..." → [Input: 7] [Feedback: "Boa explicação, faltou mencionar..."]
  
  Total Automático: 10/15
  Total Manual: 7/20
  Nota Final: 17/35
  
  [Salvar Correção] → adminService.gradeSubmission()
    → UPDATE activity_submissions SET manual_score=7, final_score=17, status='graded'
```

---

## Considerações

### Notificar o Aluno

Após corrigir, o aluno deve saber que a nota foi liberada. Opções:
1. **Simples:** Na próxima vez que o aluno logar e visualizar a atividade, a nota já aparece.
2. **Com Notificação:** Adicionar notificação in-app (quando abrir o app, aparece "Sua prova foi corrigida").
3. **Push Notification:** Apenas na Fase E.2.

**Decisão recomendada para agora:** Opção 1 (mais simples, funcional).

### Score Calculation

```typescript
// final_score = auto_score + manual_score
// Mas manual_score só pode se aplicar a questões dissertativas

// Ao corrigir uma submissão:
const finalScore = submission.auto_score + manualScore;
```

---

## Plano de Verificação

1. **Setup:** Professor cria atividade com 1 objetiva e 1 dissertativa.
2. **Aluno resolve:** Responde as 2 questões e envia.
3. **Professor abre Submissions:** KPI "Para Corrigir" deve mostrar 1.
4. **Professor abre SubmissionDetail:** Deve ver a dissertativa pendente, a objetiva já corrigida.
5. **Professor corrige:** Atribui nota à dissertativa, adiciona feedback, clica "Salvar".
6. **Aluno retorna à atividade:** Deve ver status "Corrigida" e nota final exibida.

---

*Planejado em: Maio de 2026 — Equipe Aprende+*
