# Arquitetura e Tecnologias

A plataforma Aprende+ foi construída visando alta performance, reatividade e facilidade de deploy. A arquitetura segue o modelo de **Single Page Application (SPA)** no Front-end acoplada a um **BaaS (Backend as a Service)**, o que dispensa a necessidade de gerenciar servidores Node.js tradicionais.

## 🛠️ Stack Tecnológico

### Front-end
- **React.js**: Biblioteca principal para construção das interfaces.
- **TypeScript**: Superset de JavaScript para adicionar tipagem forte, garantindo que objetos complexos (provas, notas, usuários) sejam devidamente checados em tempo de compilação.
- **Vite**: Bundler super veloz que otimiza o ciclo de desenvolvimento local.
- **Tailwind CSS**: Framework utilitário para estilização dinâmica e construção do "Glassmorphism" (efeito translúcido do layout).
- **Framer Motion**: Utilizado para animações complexas, como as transições de tela no login institucional e efeitos de hover nos dashboards.

### Back-end
- **Supabase**: Plataforma open-source alternativa ao Firebase. Responsável por todo o "peso" do backend.
- **PostgreSQL**: Banco de dados relacional robusto que armazena os dados de todas as instituições de forma isolada via constraints de segurança.
- **Supabase Auth**: Módulo de autenticação que lida com o gerenciamento de sessões JWT (JSON Web Tokens) e criptografia de senhas.
- **Deno (Edge Functions)**: Runtime responsável por executar funções serverless para ações privilegiadas (como cadastro de novos professores sem derrubar a sessão do atual diretor).

## 🧩 Como a Aplicação se Comunica

A aplicação não utiliza rotas tradicionais REST (`/api/users`). Em vez disso, a comunicação ocorre majoritariamente através da **biblioteca oficial do supabase-js**, que estabelece uma ponte direta do cliente React para a API do banco de dados (via PostgREST).

1. **Leitura (Selects)** e **Escritas Comuns**: Feitas diretamente do Frontend. O Supabase utiliza RLS (Row Level Security) para garantir que um aluno não consiga forçar um `update` na tabela de notas.
2. **Operações Críticas**: Realizadas por Edge Functions na nuvem, acionadas via RPC (Remote Procedure Call). 

### Exemplo do Fluxo de Cadastro de Instituição
1. O Front-end valida o formulário.
2. O Front-end chama `supabase.functions.invoke('admin-create-institution')`.
3. A Edge Function recebe os dados no servidor da nuvem (Deno).
4. O servidor Deno, usando a chave Mestra (`SERVICE_ROLE_KEY`), acessa as tabelas do PostgreSQL e contorna o bloqueio de sessão para forçar a criação de um novo usuário.
5. O servidor devolve `status 200` com os dados da instituição criada ou mensagens de erro claras, lidas nativamente pelo React para notificar o usuário.
