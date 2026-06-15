# 🚀 Roadmap Completo — Aprende+
### *Rumo à Perfeição — Planejamento Estratégico de Evolução*

> **Stack:** React + TypeScript + Vite + Supabase (Auth, RLS, Edge Functions, Realtime, Storage)
> **Documento vivo** — atualizado conforme o projeto evolui.

---

## 📊 Estado Atual (Baseline)

| Funcionalidade | Status |
|---|---|
| Autenticação real (Supabase Auth + RLS) | ✅ Funcionando |
| Criação de instituição, admin, professores e alunos | ✅ Funcionando |
| Criação de atividades e provas com questões | ✅ Funcionando |
| Submissão e correção de atividades/provas | ✅ Funcionando |
| Aulas em vídeo (YouTube/link externo) | ✅ Funcionando |
| Light Mode + Dark Mode em todas as telas | ✅ Funcionando |
| Landing Page premium com efeito aurora boreal | ✅ Funcionando |
| Painéis separados: Admin, Professor e Aluno | ✅ Funcionando |
| Edge Functions seguras (Service Role protegida) | ✅ Funcionando |
| Persistência e Exclusão de Aulas (Fase 1.1) | ✅ Concluído |

---

## 🔴 FASE 1 — Correções Críticas e Polimento
> Gaps que afetam o uso real hoje. Prioridade máxima antes de qualquer nova feature.

### 1.1 — Persistência e Deleção de Aulas — ✅ Concluído
- **Problema:** Aulas criadas sumiam ao recarregar a página (só existiam no estado React) e não havia interface ou endpoint para excluir aulas.
- **Solução:** Criada persistência completa conectando a tabela `lessons` ao `adminService.createLesson()`. Implementado `adminService.deleteLesson()` e adicionado botão de lixeira seguro nos cards com `ConfirmationModal` em `Lessons.tsx`.
- **Status:** Concluído com sucesso.
- **Impacto:** 🔴 Alto — professores perdem todo o conteúdo ao recarregar.

### 1.2 — CalendarView: Dados Reais de Prazos
- **Problema:** O calendário exibe dados estáticos e fictícios.
- **Solução:** Popular cruzando `activities[]` e `exams[]` com suas datas reais. Marcar dias com cores por tipo (atividade = laranja, prova = vermelho, aula = azul).
- **Impacto:** 🔴 Alto — o calendário é inútil sem dados reais.

### 1.3 — Sistema de Notificações Real (Persistente)
- **Problema:** Notificações são mock e não persistem entre sessões.
- **Solução:** Tabela `notifications` no Supabase com triggers automáticos para: nova atividade/prova criada, prazo se aproximando (24h e 1h antes), nota publicada, novo aviso da turma.
- **Impacto:** 🔴 Alto — o sino de notificação é decorativo sem isso.

### 1.4 — Recuperação de Senha + Verificação de E-mail
- **Problema:** "Esqueceu a senha?" não faz nada. Além disso, qualquer e-mail pode ser cadastrado sem verificação.
- **Solução (implementar juntos):**
  1. Ativar verificação de e-mail no Supabase Auth para novos cadastros.
  2. Integrar `supabase.auth.resetPasswordForEmail()` com tela de confirmação.
  3. Criar rota `/reset-password` que recebe o token e permite definir nova senha.
- **Nota:** Os dois itens andam juntos — verificação de e-mail torna o sistema consistente e seguro antes de habilitar recuperação de senha.
- **Impacto:** 🟠 Médio-Alto — crítico para uso real em instituições.

### 1.5 — Validação Client-Side nos Formulários
- **Problema:** Alguns formulários enviam com dados incompletos sem feedback claro.
- **Nota Importante:** Criar uma disciplina **sem professor atribuído é um fluxo válido** — o professor pode ser vinculado depois conforme o calendário da instituição. A validação deve bloquear apenas campos verdadeiramente obrigatórios (título, código, datas).
- **Solução:** Mensagens de erro inline abaixo de campos inválidos, sem `alert()`. Borda vermelha + texto descritivo.
- **Impacto:** 🟡 Médio.

---

## 🟠 FASE 2 — Experiência Completa do Aluno
> O aluno é o usuário mais frequente. Sua experiência precisa ser impecável.

### 2.1 — Dashboard do Aluno com Métricas Reais
- **Problema:** `Dashboard.tsx` mostra dados mockados.
- **Solução:** Calcular: taxa de conclusão, média de notas das submissões corrigidas, próximo prazo, streak de dias ativos.
- **Impacto:** 🔴 Alto — primeira tela que o aluno vê.

### 2.2 — Revisão de Atividade Corrigida (com Gabarito)
- **Problema:** Após correção, o aluno não vê suas respostas comparadas ao gabarito.
- **Solução:** Visão de revisão em `ActivityDetail.tsx` quando nota for publicada: resposta do aluno vs. correta, pontuação por questão, feedback do professor, ícone ✅/❌.
- **Impacto:** 🔴 Alto — aprender com os erros é o coração da educação.

### 2.3 — Resultado de Prova (Pós-Submissão)
- **Problema:** Após submeter, aluno só vê "Concluída" — sem nota ou detalhamento.
- **Regra de Negócio:** Aluno **só vê nota e gabarito após o professor publicar a devolutiva** — mesmo em questões objetivas, pois o professor pode querer aguardar todos fazerem antes de liberar o gabarito.
- **Solução:** Tela de espera: *"Prova entregue — aguardando correção do professor."* Após publicação: nota final animada, acertos/erros, comparação com média da turma.
- **Impacto:** 🔴 Alto.

### 2.4 — Histórico de Notas Consolidado
- **Problema:** Sem visão unificada de todas as notas.
- **Solução:** Seção em `Insights.tsx` (aluno) com tabela de todas as atividades/provas corrigidas, nota vs. total, data, disciplina e indicador de aprovação (≥ 60%).
- **Impacto:** 🔴 Alto.

### 2.5 — Busca e Filtros nas Aulas
- Input de busca por título + pills de filtro por tipo (`YouTube`, `PDF`, `Vídeo`) e por disciplina.
- **Impacto:** 🟡 Médio — escala mal sem isso.

---

## 🟡 FASE 3 — Central de Correções para Professores *(Nova Seção — Alta Prioridade)*
> Seção própria na sidebar, dando controle total ao professor sobre o processo de correção e devolutiva.

### Motivação
Hoje o professor precisa entrar em cada atividade individualmente para ver submissões. Em uso real, isso é ineficiente. A inspiração é o fluxo do Microsoft Teams Education / Google Classroom: visão centralizada, correção fluida e publicação em lote.

### 3.1 — Nova Seção "Correções" na Sidebar
- Novo item exclusivo para professores: **"Correções"** (ícone: `ClipboardCheck`)
- Lista unificada de todas atividades e provas com submissões pendentes
- Cards com: nome, disciplina, contador *"12 de 28 entregaram"*, barra de progresso, status (`Aguardando Entregas` / `Em Correção` / `Pronto para Publicar` / `Publicado`), botão de acesso rápido.

### 3.2 — Devolutiva em Lote (Publicação de Notas)
- Botão **"Publicar Devolutiva para Todos"** após concluir as correções
- Modal de confirmação: *"Você está prestes a liberar as notas para X alunos. Esta ação não pode ser desfeita."*
- Ao publicar, todos os alunos recebem notificação automática
- Funciona tanto para atividades quanto para provas
- **Inspiração:** Fluxo de devolução do Microsoft Teams

### 3.3 — Correção Individual Aprimorada
- Visão lado a lado: resposta do aluno × gabarito
- Feedback por questão (não só nota final)
- Ajuste manual de pontuação por questão (resposta parcialmente correta)
- Navegação entre alunos: *"← Anterior | Próximo →"*
- Indicador de progresso: *"Corrigindo 7 de 28"*

### 3.4 — UI de Correção com IA *(Front Preparatório)*
- Front completo já implementado, mesmo sem integração real de IA ainda
- Botão **"✨ Sugestão da IA"** ao lado do campo de nota em questões dissertativas
- Painel lateral: análise do texto, nota sugerida (ex: 7.5/10), justificativa
- Professor pode aceitar, editar ou ignorar a sugestão
- Badge *"Beta — IA em teste"* para sinalizar que é experimental
- **Objetivo:** Quando integração com Gemini/OpenAI for feita, o front já está pronto

### 3.5 — Filtros e Estatísticas na Tela de Correções
- Filtrar por disciplina, status, data de entrega
- Painel de estatísticas: média da turma, taxa de entrega, ausentes
- Exportar lista de notas em CSV

---

## 🟢 FASE 4 — Gestão Avançada para Admin e Professor

### 4.1 — Imagens em Questões de Atividades e Provas *(Alta Prioridade)*
- **Motivação:** Muitas disciplinas exigem imagens — diagramas UML em Engenharia de Software, gráficos em Matemática, mapas em Geografia, circuitos em Eletrônica. Sem isso, disciplinas técnicas ficam impossíveis de usar.
- **Solução:** Campo de upload de imagem por questão em `ActivityCreator.tsx` e `ExamCreator.tsx`:
  - Upload via **Supabase Storage** (bucket `question-images`)
  - Preview dentro do criador antes de salvar
  - Na tela da prova/atividade, imagem aparece acima do enunciado da questão
  - Formatos suportados: JPG, PNG, SVG, PDF (página única)
  - Limite recomendado: 5MB por imagem
- **Impacto:** 🔴 Alto.

### 4.2 — Edição de Atividades e Provas
- **Problema:** Só é possível deletar e recriar — sem edição.
- **Solução:** Modo edição em `ActivityCreator` e `ExamCreator` com ID como prop, pré-populando campos. Salvar com `UPDATE`.
- **Impacto:** 🔴 Alto.

### 4.3 — Edição de Membros (Admin)
- Modal de edição: atualizar nome, e-mail, turma e disciplinas vinculadas.
- **Impacto:** 🟡 Médio.

### 4.4 — Banco de Questões Reutilizável
- Tabela `question_bank` no Supabase
- Interface para salvar questões ao criar e importar questões anteriores (filtradas por disciplina e tipo)
- **Impacto:** 🟠 Alto — economiza tempo imensamente.

### 4.5 — Duplicar Atividade / Prova
- Botão "Duplicar" que clona com todas as questões e abre em modo edição.
- **Impacto:** 🟡 Médio.

### 4.6 — Estatísticas Reais no AdminDashboard
- **Problema:** `AdminDashboard.tsx` exibe números hardcoded.
- **Solução:** Calcular em tempo real: alunos ativos, média de notas por turma, taxa de entrega, professores e disciplinas.
- **Impacto:** 🔴 Alto.

### 4.7 — Relatório de Turma em PDF
- Gerar PDF com: lista de alunos e notas, média por disciplina, taxa de entrega.
- Biblioteca: `jsPDF` ou `react-pdf`.
- **Impacto:** 🟡 Médio.

---

## 🔵 FASE 5 — Insights com Dados Reais e IA Pedagógica

### 5.1 — Métricas Reais (Admin/Professor)
- Substituir todos os dados fictícios por queries reais
- Taxa de conclusão por disciplina, alunos em risco (< 60% de entregas), média por questão

### 5.2 — Evolução de Notas (Gráfico de Linha)
- Aluno visualiza evolução ao longo do semestre
- Professor visualiza evolução da turma por atividade
- Implementar com `Recharts`

### 5.3 — Integração com IA Generativa (Gemini / OpenAI)
- Comentários personalizados: *"Você teve dificuldade com Recursividade. Recomendamos rever o Módulo 3."*
- Sugestões ao professor: *"40% dos alunos erraram a questão 3. Considere revisitar o tópico X."*
- Correção automática de dissertativas (front já estará pronto na Fase 3.4)
- **Impacto:** Diferencial competitivo — é literalmente o "+" do Aprende+.

---

## 🟣 FASE 6 — Comunicação e Colaboração em Tempo Real

### 6.1 — Mural da Turma / Avisos
- Professor publica avisos; alunos veem no Dashboard e recebem notificação
- Supabase Realtime para atualização ao vivo

### 6.2 — Fórum de Dúvidas por Disciplina
- Perguntas e respostas por disciplina; marcar como "Resolvida"
- Supabase Realtime + tabela `messages`

### 6.3 — Progresso da Prova em Tempo Real
- Professor vê contador ao vivo: *"X de Y alunos já entregaram"*
- Supabase Realtime subscriptions

### 6.4 — Notificações Push (Browser / Mobile)
- Web Push API + Service Worker para notificações com o app fechado

---

## ⚫ FASE 7 — Desempenho, Escalabilidade e Segurança

### 7.1 — Paginação nas Tabelas
- `AdminPanel`, `Submissions`, `Activities`, `Exams` carregam todos os registros de uma vez
- Implementar paginação (20 por página) com `range()` do Supabase

### 7.2 — Upload de Materiais para Aulas
- Supabase Storage para PDFs e vídeos; progress bar durante upload

### 7.3 — Lazy Loading de Páginas
- `React.lazy()` + `Suspense` para reduzir bundle de ~920KB para ~300KB

### 7.4 — Otimização de Queries
- `auth.ts` faz 3 queries no login — consolidar em 1 com join

### 7.5 — Auditoria de Ações (Logs)
- Tabela `audit_logs`: quem deletou quem, quando nota foi alterada

### 7.6 — Sessão Persistente e Refresh Token
- Garantir renovação automática de tokens para evitar logout inesperado

---

## 🌟 FASE 8 — Funcionalidades Premium

### 8.1 — Gamificação
- Pontos por entrega no prazo e nota alta; conquistas (badges); ranking optativo da turma

### 8.2 — App Mobile (PWA)
- `manifest.json` + Service Worker; instalável no celular sem App Store; notificações push

### 8.3 — Geração de Questões com IA
- Professor descreve o tema → IA gera questões → professor revisa e publica
- API Gemini ou OpenAI

### 8.4 — Videoconferência Integrada
- Botão "Aula ao Vivo" via Jitsi Meet (open-source); gravação automática como Lição

### 8.5 — Boletim Digital Oficial
- PDF com identidade visual da instituição; nota por disciplina, frequência, situação

### 8.6 — Multi-Instituição / White-label
- Subdomínio por instituição; customização de logo e cores; modelo SaaS

---

## 📋 Tabela de Prioridades

| # | Fase | Impacto | Esforço | Prioridade |
|---|---|---|---|---|
| 1 | Correções Críticas | 🔴 Alto | 🟢 Baixo | **Imediata** |
| 2 | Experiência do Aluno | 🔴 Alto | 🟡 Médio | **Alta** |
| 3 | Central de Correções | 🔴 Alto | 🟡 Médio | **Alta** |
| 4 | Gestão Avançada + Imagens | 🔴 Alto | 🟡 Médio | **Alta** |
| 5 | Insights com IA | 🟠 Alto | 🔴 Alto | **Média** |
| 6 | Comunicação RT | 🟡 Médio | 🟡 Médio | **Média** |
| 7 | Escalabilidade | 🟡 Médio | 🟢 Baixo | **Média** |
| 8 | Premium | 🟢 Alto LP | 🔴 Alto | **Longo Prazo** |

---

## 💡 Próximos Passos Imediatos Recomendados

Três frentes para começar em paralelo:

1. **Fase 1.1** — Persistência de Aulas no banco (simples, alto impacto imediato)
2. **Fase 1.2** — Calendário com dados reais (cruza datas já existentes no sistema)
3. **Fase 4.1** — Imagens em questões (fundamental para disciplinas técnicas)

---

*Documento criado e mantido junto ao projeto Aprende+ — atualizar conforme etapas forem concluídas.*
