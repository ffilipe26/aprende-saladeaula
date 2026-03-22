# Aprende+ - Plataforma Acadêmica Inteligente

Uma plataforma moderna e intuitiva para gestão de atividades, provas e acompanhamento acadêmico, construída com React, Tailwind CSS e Framer Motion.

## 🚀 Funcionalidades Principais

- **Dashboard Central**: Visão geral do progresso, atalhos rápidos e atividades prioritárias.
- **Gestão de Atividades**: Sistema completo para realização de tarefas com feedback instantâneo.
- **Sistema de Provas**: Exames cronometrados com interface focada e correção automática.
- **Notificações em Tempo Real**: Alertas sobre novas atividades e provas criadas.
- **Modo Desenvolvedor (Professor)**: Ferramentas integradas para simular a criação de conteúdo acadêmico.
- **Personalização**: Suporte a temas claro/escuro e perfil de usuário editável.

## 🛠️ Stack Tecnológica

- **Frontend**: [React 18+](https://reactjs.org/) com [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **IA**: [Google Gemini API](https://ai.google.dev/) (Pronto para integração)

## 📦 Como Rodar o Projeto Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) (Versão 18 ou superior recomendada)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

### Passo a Passo

1. **Clonar o Repositório**
   ```bash
   git clone https://github.com/seu-usuario/aprende-mais.git
   cd aprende-mais
   ```

2. **Instalar Dependências**
   ```bash
   npm install
   ```

3. **Configurar Variáveis de Ambiente**
   - Crie um arquivo `.env` na raiz do projeto:
     ```bash
     touch .env
     ```
   - Adicione as seguintes variáveis (veja `.env.example`):
     ```env
     VITE_GEMINI_API_KEY="SUA_CHAVE_AQUI"
     VITE_APP_URL="http://localhost:3000"
     ```

4. **Iniciar o Servidor**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000` no seu navegador.

## 📤 Como Subir para o GitHub (Guia para Iniciantes)

Para garantir que você suba apenas os arquivos necessários e mantenha o repositório limpo:

1. **Verifique o `.gitignore`**
   - Certifique-se de que `node_modules/`, `dist/`, `.env` e outros arquivos temporários estão listados.

2. **Inicialize o Git (se ainda não fez)**
   ```bash
   git init
   ```

3. **Adicione os Arquivos**
   ```bash
   git add .
   ```

4. **Crie o Primeiro Commit**
   ```bash
   git commit -m "feat: Versão inicial da plataforma Aprende+"
   ```

5. **Conecte ao Repositório Remoto**
   ```bash
   git remote add origin https://github.com/seu-usuario/aprende-mais.git
   git branch -M main
   ```

6. **Envie para o GitHub**
   ```bash
   git push -u origin main
   ```

## 🤝 Guia de Colaboração (Multi-Membros)

Para manter a organização em equipe:

1. **Sempre use Branches**: Nunca trabalhe diretamente na `main`.
   - `git checkout -b feature/nome-da-feature`
2. **Commits Semânticos**: Use prefixos como `feat:`, `fix:`, `docs:`, `style:`.
3. **Pull Requests**: Antes de unir o código, abra um PR para revisão dos outros membros.
4. **Sincronização**: Antes de começar o dia, dê um `git pull origin main` na sua branch.

## ⚠️ Segurança

- **NUNCA** commite o arquivo `.env`.
- **NUNCA** exponha chaves de API em arquivos públicos.
- Use o `.env.example` como guia para novos membros configurarem seus ambientes.

---
