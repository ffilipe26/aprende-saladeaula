# Aprende+

O **Aprende+** é uma plataforma educacional desenvolvida como projeto acadêmico. Seu objetivo é fornecer um ecossistema completo para gestão de instituições de ensino, conectando administradores, professores e alunos em um ambiente moderno, escalável e focado em avaliações.

A plataforma permite a criação de contas institucionais gratuitas, gestão de turmas, elaboração de provas anti-fraude, acompanhamento de notas em tempo real e visualização de dashboards gerenciais.

---

## 📚 Documentação Completa

Para manter a organização do repositório, a documentação técnica foi dividida em áreas de interesse na pasta `/docs`:

- 🏗️ **[Arquitetura e Tecnologias](docs/architecture.md)**: Detalha as escolhas de stack (React, Supabase, Deno) e o funcionamento do sistema.
- 🗄️ **[Esquema de Banco de Dados](docs/database_schema.md)**: Explica a relação entre as tabelas, permissões (RLS) e regras de negócio.
- 🛠️ **[Registro de Engenharia e Segurança](docs/engineering_log.md)**: Dossiê técnico das resoluções de problemas (Bypass de Auth, Prevenção de Exploits, Race Conditions).
- 🚀 **[Roadmap e Próximos Passos](docs/roadmap.md)**: Planejamento das próximas features a serem implementadas.

---

## 💻 Como Rodar o Projeto Localmente

Se você é um desenvolvedor colaborador (ou quer avaliar o projeto), siga os passos abaixo para configurar o ambiente.

### 1. Pré-requisitos
- Ter o [Node.js](https://nodejs.org/) instalado.
- Ter o [Git](https://git-scm.com/) instalado.
- Uma conta no [Supabase](https://supabase.com/) com um projeto criado.
- Opcional, porém recomendado: Ter a [Supabase CLI](https://supabase.com/docs/guides/cli) instalada.

### 2. Clonando e Instalando Dependências
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd aprende-gravity
npm install
```

### 3. Configurando Variáveis de Ambiente
Você não deve ter acesso ao arquivo `.env` oficial do servidor por motivos de segurança. Para rodar na sua máquina, você precisa conectar o projeto ao seu banco de dados ou solicitar acesso ao banco oficial ao dono do projeto.

1. Faça uma cópia do arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```
2. Abra o novo arquivo `.env` e preencha com as suas chaves do Supabase (encontradas em *Project Settings > API* no painel do Supabase).

### 4. Rodando o Front-end
```bash
npm run dev
```
O projeto estará disponível em `http://localhost:5173`.

### 5. (Backend) Configurando as Edge Functions
O sistema de criação de contas e bypass de segurança depende de **Edge Functions** rodando na nuvem. Se você está utilizando um banco Supabase próprio para testes, você precisa fazer o deploy dessas funções:

```bash
# 1. Faça login na sua conta do Supabase no terminal
npx supabase login

# 2. Conecte ao seu projeto
npx supabase link --project-ref SEU_PROJECT_ID

# 3. Configure a Chave Mestra de Serviço (NUNCA coloque no .env local!)
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# 4. Envie as funções para a nuvem
npx supabase functions deploy admin-create-institution
npx supabase functions deploy admin-create-user
npx supabase functions deploy admin-delete-user
```
