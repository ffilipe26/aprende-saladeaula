# Autópsia Técnica: Projeto Aprende+
**Documento de Referência para Engenharia e Arquitetura**

Este documento serve como o "Porto Seguro" técnico para o projeto Aprende+. Ele detalha a infraestrutura, a filosofia de design, a anatomia dos componentes e o planejamento para evoluções futuras.

---

## 1. Inventário Técnico Detalhado

### 1.1. Core Framework & Runtime
*   **React 19**: A biblioteca base para construção da interface. A versão 19 traz melhorias de performance e novos hooks que otimizam a renderização.
*   **TypeScript 5.8**: Vital para a robustez do projeto. O TypeScript não é apenas um "adicional", ele é a **espinha dorsal** que garante que os dados (Atividades, Provas, Usuários) sigam contratos rigorosos, evitando erros de "undefined" em tempo de execução e facilitando o refactoring.
*   **Vite 6**: O build tool e dev server. Escolhido pela velocidade extrema de HMR (Hot Module Replacement) e configuração simplificada.

### 1.2. Estilização e Design System
*   **Tailwind CSS 4**: Framework de utilitários CSS. Permite estilização rápida diretamente no JSX, garantindo consistência visual e eliminando a necessidade de arquivos CSS gigantescos e difíceis de manter.
*   **Motion (Framer Motion)**: Biblioteca de animações. Utilizada para criar a sensação de "fluidez" e "premium" através de micro-interações, transições de página e efeitos de entrada (staggering).
*   **Lucide React**: Conjunto de ícones SVG consistentes e leves.

### 1.3. Utilitários de Arquitetura
*   **clsx & tailwind-merge**: Essenciais para a manipulação dinâmica de classes Tailwind. O `tailwind-merge` resolve conflitos de especificidade, permitindo que componentes sejam altamente reutilizáveis e customizáveis.
*   **Recharts**: Biblioteca de gráficos baseada em React, utilizada para a visualização de dados na seção de Insights.
*   **Date Utilities**: Centralização da lógica de formatação de data e cálculo de tempo restante em `src/utils/dateUtils.ts`.

---

## 2. Dicionário da Estrutura de Pastas

A organização segue o padrão de **Component-Based Architecture** (Arquitetura Baseada em Componentes), priorizando a modularidade.

*   **`/src`**: O coração da aplicação.
    *   **`/components`**: Contém todos os blocos de construção da UI.
        *   *Filosofia*: Cada arquivo aqui é uma unidade funcional independente. Separamos componentes de layout (`Sidebar`, `Header`) de componentes de domínio (`Activities`, `Exams`).
        *   **`ConfirmationModal.tsx`**: Componente reutilizável para diálogos de confirmação, substituindo o `confirm()` nativo.
    *   **`/utils`**: Funções utilitárias compartilhadas.
        *   **`dateUtils.ts`**: Padronização de datas para o formato brasileiro (DD/MM/AAAA HH:MM).
    *   **`constants.ts`**: Centralização de dados iniciais e constantes do sistema.
    *   **`App.tsx`**: O **Orquestrador Central**. Ele detém o estado global da aplicação (usuário, tema, navegação) e decide qual componente renderizar.
    *   **`types.ts`**: O **Contrato de Dados**. Centraliza todas as interfaces TypeScript.
    *   **`index.css`**: Define o **Design System Global**. Aqui estão as variáveis de cores (CSS Variables) para Dark/Light mode e as configurações base do Tailwind.
    *   **`main.tsx`**: O ponto de entrada técnico que monta o React no DOM do navegador.

---

## 3. Lógica e Anatomia dos Componentes

### 3.1. O Fluxo de Estado (Pai para Filho)
O projeto utiliza o padrão de **Lifting State Up**.
*   **Exemplo**: O `App.tsx` possui o estado `userName`. Ele passa esse dado via *props* para o `Dashboard`, que por sua vez o repassa para o `Header`.
*   **Eventos**: Quando o usuário salva o nome em `Settings`, ele dispara uma função de callback (`setUserName`) definida no pai (`App.tsx`), fechando o ciclo de atualização de dados.

### 3.2. Acoplamento CSS (Tailwind)
O CSS está **intrinsecamente ligado** à estrutura HTML através de classes utilitárias. Isso evita o "CSS Global Leak" (onde um estilo de uma página quebra outra). Usamos o conceito de **Glassmorphism** (efeito de vidro) através de classes como `glass`, `backdrop-blur-xl` e bordas semitransparentes.

### 3.3. Interfaces (Types)
A interface `Activity` em `types.ts` define exatamente o que uma atividade precisa ter (id, título, questões, status). Isso permite que o componente `ActivityDetail` saiba exatamente como renderizar cada questão sem precisar validar se os dados existem a cada linha.

---

## 4. Roteiro de Estudo do Código (Roadmap de Retomada)

Se você ficar meses sem mexer, siga esta ordem para recuperar o contexto:

1.  **`src/types.ts`**: Entenda o modelo de dados. O que é uma Atividade? O que é um Exame?
2.  **`src/App.tsx`**: Veja como a navegação funciona e como o estado global está organizado.
3.  **`src/index.css`**: Relembre as variáveis de cores e o tema visual.
4.  **`src/components/Sidebar.tsx`**: Entenda as seções da plataforma.
5.  **`src/components/Dashboard.tsx`**: Veja como a "Home" do aluno é montada.
6.  **`src/components/ActivityDetail.tsx`**: Analise a lógica mais complexa de execução de tarefas e cálculo de notas.

---

## 5. Preparação para o Supabase (Próximo Passo)

### 5.1. Onde Injetar a Camada de Serviço?
Criaremos uma nova pasta: **`/src/services`**.
*   **`supabaseClient.ts`**: Para configurar a conexão.
*   **`activityService.ts`**: Para funções como `getActivities()`, `updateActivityStatus()`.

### 5.2. O que precisará de Refatoração?
1.  **`App.tsx`**: Atualmente, os dados estão centralizados em `src/constants.ts`. Precisaremos substituir o `useState` inicial por um `useEffect` que busca os dados no Supabase ao carregar a página.
2.  **`ActivityDetail.tsx`**: A função `onFinish` precisará disparar uma chamada de API para salvar a nota do aluno permanentemente no banco de dados.
3.  **`Settings.tsx`**: As alterações de perfil (nome/email) deverão ser persistidas na tabela `profiles` do Supabase.

---
