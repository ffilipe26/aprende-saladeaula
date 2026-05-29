# 📋 Planejamento — Fase D.4: Provas com Temporizador

> **Status:** 🔲 Planejado — Aguardando início
> **Dependências:** Fase D.3 (Motor de Atividades) ✅ Concluída
> **Prioridade:** Alta

---

## Contexto

Com a Fase D.3 concluída, o sistema já suporta a criação e resolução de **Atividades** com persistência completa no Supabase. A Fase D.4 completa esse ecossistema adicionando **Provas** formais com características específicas que as diferenciam das atividades normais:

- **Cronômetro Regressivo** — prazo dentro da própria tela, com envio automático ao expirar.
- **Peso na Nota** — fator multiplicador na nota final.
- **Embaralhamento de Questões** — para reduzir fraude.
- **Data de Início Controlada** — prova abre em horário específico.

---

## Problema Atual

Atualmente, as provas criadas pelo modal `ExamForm.tsx` **NÃO são salvas no banco de dados**. Ao dar F5, todas as provas somem. O sistema ainda usa armazenamento local (array React) para provas.

---

## Decisões de Design

### 1. ExamCreator.tsx — Separado ou Unificado com ActivityCreator?

**Decisão:** Criar um `ExamCreator.tsx` **separado**, com campos específicos de provas.

**Justificativa:** As provas têm campos exclusivos (duração, peso, data de início, configurações de segurança) que poluiriam o `ActivityCreator.tsx`.

### 2. Resolução — Mesmo ActivityDetail ou ExamDetail separado?

**Decisão:** Criar `ExamDetail.tsx` separado para a experiência de prova.

**Justificativa:** O fluxo de prova é fundamentalmente diferente:
- Timer regressivo visível e urgente.
- Sem possibilidade de sair e voltar (ou com alerta grave).
- Envio automático ao expirar.
- Não pode rever questões após finalizar (dependendo da config).

---

## O Que Precisa Ser Feito

### Backend

- [ ] Confirmar que a tabela `public.exams` está com as colunas corretas (o schema já existe).
- [ ] Confirmar que a tabela `public.exam_submissions` está com as colunas corretas.
- [ ] Adicionar `adminService.createExam()` em `src/lib/adminService.ts`.
- [ ] Adicionar `adminService.submitExam()` em `src/lib/adminService.ts`.

### Frontend — Criação

- [ ] **Criar** `src/pages/ExamCreator.tsx`
  - Campo: Título da Prova
  - Campo: Disciplina (select das disciplinas do professor)
  - Campo: Data de Início (datetime-local)
  - Campo: Data Limite / Fim (datetime-local)
  - Campo: Duração em Minutos (input numérico)
  - Campo: Peso na Nota (ex: 2.0 = vale o dobro)
  - Campo: Instruções para o aluno
  - Toggle: Embaralhar Questões
  - Toggle: Permitir Revisão após finalizar
  - Construtor de Questões (reutiliza a mesma lógica do ActivityCreator)
  - Ao salvar: `adminService.createExam()` → INSERT em `public.exams`

### Frontend — Resolução

- [ ] **Criar** `src/pages/ExamDetail.tsx`
  - Busca os dados do exame pelo ID
  - Verifica se já existe submissão → mostra resultado se sim
  - Verifica se está dentro do período (`start_date` a `deadline_date`) → bloqueia se não
  - Exibe **cronômetro regressivo** em destaque (MM:SS)
  - Ao expirar: envia automaticamente o que foi respondido até o momento
  - Ao finalizar manualmente: confirma com modal e envia
  - Questões embaralhadas se `shuffle_questions = true`
  - Ao enviar: `adminService.submitExam()` → INSERT em `public.exam_submissions`

### Frontend — Listagem e Navegação

- [ ] **Atualizar** `src/pages/Exams.tsx`
  - Botão "Criar Nova Prova" → navega para `ExamCreator.tsx` (não abre modal)
  - Remover o uso do `ExamForm.tsx` como modal

- [ ] **Atualizar** `src/App.tsx`
  - Adicionar `case 'exam_creator'` no `renderContent()`
  - Buscar exames do banco em `loadInstitutionData()` (similar às atividades)
  - Tratar seleção de exame → renderizar `ExamDetail.tsx`
  - Passar `onNavigate={setActiveSection}` para `<Exams />`

- [ ] **Atualizar** `src/pages/TeacherDashboard.tsx`
  - Botão "Nova Prova" → navega para `exam_creator`

---

## Estrutura do Timer

```typescript
// Em ExamDetail.tsx
const [timeLeft, setTimeLeft] = useState<number>(exam.duration_minutes * 60); // em segundos

useEffect(() => {
  if (timeLeft <= 0) {
    handleAutoSubmit(); // Envio automático
    return;
  }
  const timer = setInterval(() => {
    setTimeLeft(prev => prev - 1);
  }, 1000);
  return () => clearInterval(timer);
}, [timeLeft]);

// Exibição
const minutes = Math.floor(timeLeft / 60);
const seconds = timeLeft % 60;
const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

// Cor do timer muda conforme urgência
const timerColor = timeLeft < 300 ? 'text-red-500' : timeLeft < 600 ? 'text-orange-500' : 'text-white';
```

---

## Schema do Banco (Referência)

A tabela `exams` já existe no schema:

```sql
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    instructions TEXT,
    questions JSONB NOT NULL DEFAULT '[]',
    total_points NUMERIC DEFAULT 0,
    weight NUMERIC DEFAULT 1.0,
    duration_minutes INTEGER NOT NULL,
    deadline_date TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    max_attempts INTEGER DEFAULT 1,
    shuffle_questions BOOLEAN DEFAULT false,
    allow_review BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Plano de Verificação

1. **Como Professor:** Criar uma prova com duração de 5 minutos, 3 questões e prazo para hoje.
2. **Como Aluno:** Acessar a prova, verificar que o timer aparece e conta regressivamente.
3. **Teste de Auto-Submit:** Deixar o timer expirar sem responder → verificar que o sistema envia automaticamente.
4. **Teste de Segunda Tentativa:** Tentar acessar novamente → deve mostrar o resultado.
5. **F5 Test:** Dar F5 depois de criar a prova → prova deve ainda estar listada (banco de dados).
6. **Aluno Errado:** Logar com aluno de outra turma → prova não deve aparecer.

---

*Planejado em: Maio de 2026 — Equipe Aprende+*
