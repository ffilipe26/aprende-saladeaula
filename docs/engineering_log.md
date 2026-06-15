# Registro de Engenharia e Bug Fixes

Este documento lista as auditorias avançadas e as refatorações de arquitetura para resolver bloqueios pesados do Supabase e consertar brechas na segurança das funcionalidades de prova. O Aprende+ está implementado com sistemas defensivos rigorosos.

## O Desafio do CRUD Administrativo

**O Problema**: No Supabase (e Firebase), a biblioteca de front-end entende que há apenas "um" usuário logado por navegador. Quando um Diretor acessava o painel e tentava criar uma nova conta para um Aluno, o comando `signUp` nativo substituía o cookie do navegador, "deslogando" o diretor e jogando a conta do aluno na tela ativa.
**A Solução Híbrida**: Para contornar isso e permitir que um administrador crie usuários em massa, foi deletado o código de cadastro do front-end e transferido integralmente para o servidor Deno na pasta `supabase/functions/`. Essas funções operam em "Modo Deus" (Service Role Key) que não afeta os cookies do navegador.

## Dossiê de Correções (Auditoria de Segurança)

### 1. Prevenção de Inconsistência de Schema
Em atualizações passadas, tentamos enviar campos (`city` e `registration_number`) pelo JSON do cadastro institucional que não existiam no schema SQL oficial do banco. Além disso, o campo `school_type` sofreu descasamento de nomenclatura (`type` vs `school_type`). 
**Refatoração**: O Payload das *Edge Functions* foi perfeitamente calibrado para o schema atual. Inserimos `200 OK` manual como resposta padrão da API para impedir a mordaça de Erros 400 da biblioteca Supabase, que mascarava os logs no console.

### 2. Defesa Anti-Cheat na Múltipla Escolha
Na primeira iteração da correção automática (`calcAutoScore`), o sistema validava a prova checando se as opções enviadas pelo aluno continham a opção certa. Alunos poderiam modificar o pacote de rede via DevTools para enviar uma Array contendo *todas* as opções (`['a', 'b', 'c', 'd']`), e o algoritmo pontuaria como "Correto".
**Fix**: Inserido um mecanismo que cruza o tamanho da Array enviada versus o número de respostas certas, invalidando a questão automaticamente (Nota 0) se houverem adulterações no tamanho da resposta.

### 3. Defesa de "Double Submit" e Condições de Corrida
Se o aluno clicasse no botão "Finalizar Prova" diversas vezes num lag de internet, ele registrava submissões duplicadas no banco de dados. Adicionalmente, quando o timer zerava, uma requisição silenciosa disparava o *auto-submit*.
**Fix**: Trava de estado booleana (`isSubmitting`) injetada de ponta a ponta na UI. No *auto-submit*, a limpeza de rascunhos locais (`localStorage.removeItem`) é executada *antes* da requisição tentar o envio, fechando a janela de race condition entre abas múltiplas do navegador.

### 4. Bloqueio de Manipulação Temporal
Como a web roda no computador cliente, modificar a hora do Windows retrocedia o relógio local e impedia que a função temporal de prazo da prova encerrasse a submissão, permitindo que a prova ficasse acessível para sempre.
**Fix**: O timer usa deltas matemáticos restritivos. Se a diferença temporal entre os *ticks* do cronômetro mostrar que o tempo andou para trás, o cronômetro trava no menor valor alcançado, impedindo ganhos de tempo fraudulentos.

### 5. Expiração de Sessão por Inatividade (Estilo Teams) e Robustez no Logout
**O Problema**: O cliente Supabase armazena a sessão no `localStorage` por padrão por tempo indeterminado. Se um usuário logasse e reabrisse o localhost 2 dias depois, continuava logado na mesma tela. Alterar o cliente para usar `sessionStorage` causaria logouts instantâneos ao fechar qualquer aba de navegação, quebrando o comportamento desejado estilo Microsoft Teams (que retém o login caso o navegador seja fechado e reaberto logo após). Além disso, a chamada direta a `supabase.auth.signOut()` no logout podia falhar devido a instabilidades de rede e impedir que os estados React fossem resetados, deixando o usuário preso no painel.
**A Solução**: Implementou-se uma lógica baseada em inatividade (timestamp `last_active_time` no `localStorage`). No login e durante a navegação entre seções da Sidebar, o timestamp é atualizado. No carregamento do app, se a inatividade for superior a 24 horas, o sistema executa o logout automático limpando o `localStorage`. O `handleLogout` foi reforçado com um bloco `try-catch-finally` para forçar a limpeza dos estados do React (`currentUser = null`, `activeSection = dashboard`, etc.) mesmo que a requisição de API com o Supabase retorne erro.

### 6. Persistência de Aulas e Deleção Segura (Fase 1.1 do Roadmap)
**O Problema**: Embora o banco de dados já possuísse suporte para aulas, a criação estava acoplada inline no frontend e não existia nenhuma maneira de excluir aulas criadas por professores ou administradores.
**A Solução**: Centralizou-se a criação em `adminService.createLesson()` e adicionou-se a funcionalidade `adminService.deleteLesson()` utilizando o cliente regular do Supabase. No frontend, adicionou-se um ícone de lixeira nos cards de aula em `Lessons.tsx` (visível apenas para perfis autorizados) integrado com o `ConfirmationModal` para deleções acidentais e disparo automático de notificações internas do sistema.

