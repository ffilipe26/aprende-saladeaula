# Estrutura do Banco de Dados

O Aprende+ utiliza um banco de dados relacional (PostgreSQL via Supabase). A segurança estrutural é desenhada em torno do conceito de Multi-Tenancy (múltiplos inquilinos) por meio do uso da tabela `institutions` como nó raiz.

## 📊 Principais Tabelas e Lógica de Relacionamento

### 1. Institutions (`institutions`)
Armazena a raiz do ecossistema de cada escola.
- **Campos Importantes**: `id`, `name`, `school_type`.
- Todo e qualquer dado inserido a partir deste ponto (Alunos, Turmas, Notas) está obrigatoriamente acorrentado ao `institution_id` da escola a qual pertence.

### 2. Users (`users`)
O Supabase possui uma tabela nativa e invisível chamada `auth.users` (onde ficam as senhas seguras). Para uso na plataforma, espelhamos o ID dessa tabela nativa na nossa tabela pública `users`.
- **Campos Importantes**: `id` (Referência ao Auth), `institution_id`, `role` (super_admin, admin, teacher, student), `class_id` (se for aluno).
- **Lógica de Segurança**: As `Edge Functions` garantem que os usuários sejam criados de forma segura nas duas tabelas simultaneamente, permitindo que o Diretor matricule centenas de alunos sem perder sua sessão ativa na tela.

### 3. Classes (`classes`) e Subjects (`subjects`)
A lógica escolar.
- Uma escola tem várias `classes` (Turmas: Manhã, Tarde).
- Uma escola tem várias `subjects` (Matemática, História).
- **Cruzamento M-N**: Utilizamos uma tabela pivô chamada `subject_enrollments` para matricular um aluno (user) em várias disciplinas (subjects).

### 4. Activities e Exams
Tabelas separadas para distinguir tipos de tarefas escolares.
- As provas (`exams`) contam com campos extras de segurança (como janelas restritas de tempo - `start_date` e `deadline_date`).
- As perguntas da prova são salvas em um array JSONB ou tabela associativa, contendo a lógica de gabaritos nativos.

### 5. Submissions (`submissions`)
Registra as respostas enviadas pelo aluno.
- **Status da prova**: Possui status estritos verificados no banco (`submitted`, `late`, `graded`).
- **Segurança de Fluxo**: Ao invés de atualizar as respostas no banco a cada caractere digitado (o que explodiria a taxa de consumo de banda e leitura do servidor), a aplicação usa *LocalStorage* (`draftKey`) para rascunhos. A submissão oficial faz apenas um único `INSERT` ao banco no final.
