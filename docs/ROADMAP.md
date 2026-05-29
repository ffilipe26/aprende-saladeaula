# Roadmap e Próximos Passos

Embora o Aprende+ já seja um ecossistema completamente funcional e estruturado, a sua fundação foi desenhada para permitir rápida escalabilidade. 

## 🗺️ O que já temos
- **Multitenancy Sólido**: Múltiplas escolas/faculdades convivendo no mesmo banco com vazamento zero de dados (RLS).
- **CRUD e Autenticação C-Level**: Professores e Diretores criam cadastros sem interrupção de fluxo logado.
- **Ecossistema de Avaliação Blindado**: As provas suportam tempo contínuo, restrição de acesso e defesa contra hackers de *DevTools* na resposta das alternativas.

## 🔜 O que vamos implementar no Futuro (Próximas Fases)

### Fase 1: Gamificação e Estímulo
- **Sistema de Moedas (Coins/XP)**: Os alunos ganharão experiência e "AprendeCoins" ao enviarem tarefas no prazo e gabaritarem questões, criando engajamento na sala de aula.
- **Leaderboards (Ranking)**: Um ranking interno de escola (e turma) atualizado em tempo real utilizando os *Realtime Channels* do Supabase.

### Fase 2: Gestão de Mídia Avançada
- **Upload de Materiais**: Permitir que professores anexem PDFs, vídeos, e podcasts nas `Activities`. Os arquivos serão salvos de forma segura via *Supabase Storage*, amarrados ao `institution_id`.
- **Provas Multimídia**: Múltipla escolha com embasamento em imagens hospedadas no bucket do banco de dados.

### Fase 3: Analytics em Tempo Real para Educadores
- **Dashboard de Desempenho (Professores)**: Telas gerando gráficos de absorção e curvas de Gauss de acertos nas provas baseadas no histórico.
- **Avisos de Risco (Evasão)**: Uma query robusta que puxa a lista de "Alunos Ausentes" sistematicamente e avisa o diretor/professor em um painel lateral, antes de haver evasão definitiva.
