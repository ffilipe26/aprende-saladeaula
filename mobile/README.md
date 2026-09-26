# 📱 Aprende+ — Aplicativo Mobile (React Native / Expo)

> **Central do Aluno • Versão 1.0.0**  
> Documentação técnica da aplicação móvel da plataforma educacional **Aprende+**, desenvolvida com **React Native**, **Expo** e integrada ao ecossistema **Supabase**.

---

## 📌 1. Visão Geral

O aplicativo mobile do **Aprende+** foi projetado para oferecer aos estudantes uma experiência ágil, moderna e fluida diretamente de seus smartphones (Android e iOS) ou via Web. 

A aplicação foca na jornada acadêmica essencial do aluno:
* Autenticação e identificação institucional.
* Painel de controle acadêmico (Dashboard de matérias e prazos).
* Gestão e filtro de avaliações (Atividades e Provas).
* Motor de resolução interativa de exercícios com pontuação em tempo real.
* Perfil do estudante e vínculo institucional.

---

## 🛠️ 2. Stack Tecnológica

| Camada | Tecnologia | Propósito |
| :--- | :--- | :--- |
| **Framework Base** | **React Native 0.86** + **React 19** | Estrutura de componentes nativos para dispositivos móveis. |
| **Plataforma / Tooling** | **Expo SDK 57** (Managed Workflow) | Build, empacotamento, testes via Expo Go e suporte Web universal. |
| **Linguagem** | **TypeScript 5.x** | Tipagem estática rigorosa compartilhada com o ecossistema backend. |
| **Ícones & UI** | **Lucide React Native** + **React Native SVG** | Pacote de ícones vetoriais modernos e leves. |
| **Navegação** | **React Navigation 7** | Gestão de rotas por abas (Bottom Tabs) e telas empilhadas (Stack). |
| **Armazenamento Local** | **Async Storage** | Persistência segura de sessão do usuário no dispositivo. |
| **Backend & Dados** | **Supabase JS Client** | Autenticação GoTrue, PostgREST e sincronização de dados. |

---

## 📁 3. Estrutura de Arquitetura de Pastas

```text
mobile/
├── assets/                     # Imagens estáticas (logo.png, ícones, splash)
├── src/
│   ├── data/                   # Dataset base e fallback offline resiliente
│   │   └── mockData.ts         # Dados de inicialização e matérias curriculares
│   ├── lib/                    # Configurações de serviços externos
│   │   └── supabase.ts         # Inicialização do Supabase Client com AsyncStorage
│   ├── screens/                # Módulos e Telas da aplicação
│   │   ├── LoginScreen.tsx     # Tela de autenticação e boas-vindas
│   │   ├── HomeScreen.tsx      # Dashboard do estudante com métricas e matérias
│   │   ├── ActivitiesScreen.tsx# Listagem com abas (Pendentes/Concluídas) e filtros
│   │   ├── ActivityDetailScreen.tsx # Motor de resolução de exercícios e feedback
│   │   └── ProfileScreen.tsx   # Perfil institucional e controle de sessão
│   ├── theme/                  # Design System e Tokens visuais
│   │   └── colors.ts           # Paleta oficial (Dark Theme com acentos Laranja)
│   └── types/                  # Interfaces de domínio e contratos de dados
│       └── index.ts            # Tipos de Usuário, Disciplina, Atividade e Questão
├── App.tsx                     # Ponto de entrada, roteamento principal e tabs
├── app.json                    # Manifesto e metadados de configuração do Expo
├── package.json                # Gerenciamento de dependências e scripts
└── tsconfig.json               # Configurações do compilador TypeScript
```

---

## 🎨 4. Design System & Identidade Visual

O aplicativo replica o padrão visual consagrado na versão Web da plataforma **Aprende+**, priorizando alto contraste, ergonomia para uso prolongado e legibilidade:

### Tokens de Cores (`src/theme/colors.ts`)
* **Background Primário**: `#09090b` (*Zinc 950* — Preto profundo para máxima imersão em telas OLED).
* **Superfícies / Cards**: `#18181b` (*Zinc 900*) e `#27272a` (*Zinc 800*).
* **Cor Primária (Brand)**: `#f97316` (*Orange 500* — Laranja enérgico característico).
* **Feedback de Sucesso**: `#10b981` (*Emerald 500* — Para tarefas entregues e acertos).
* **Feedback de Atenção/Erro**: `#eab308` (*Yellow 500*) e `#ef4444` (*Red 500*).
* **Tipografia**: `#fafafa` (*Texto Principal*) e `#a1a1aa` (*Texto Secundário/Muted*).

---

## 📱 5. Especificação Técnica das Telas

### 1. `LoginScreen.tsx` (Autenticação)
* **Branding**: Exibição da logo oficial de alta resolução do **Aprende+**.
* **Segurança**: Inputs com máscara de senha e alternância de visibilidade (*show/hide password*).
* **Conexão Híbrida**:
  - Integração com `supabase.auth.signInWithPassword`.
  - Fallback de **Acesso de Demonstração (1-Clique)** para testes imediatos sem dependência de rede externa.

### 2. `HomeScreen.tsx` (Dashboard do Aluno)
* **Saudação Contextual**: Nome do estudante e selo de vínculo da instituição de ensino.
* **Cards de Métricas Rápidas**: Contadores dinâmicos de atividades pendentes, tarefas concluídas e média acadêmica.
* **Próximas Entregas**: Lista ordenada por urgência com selos de prazo e pontuação.
* **Carrossel de Disciplinas**: Visualização horizontal das matérias ativas com seus respectivos códigos e docentes responsáveis.

### 3. `ActivitiesScreen.tsx` (Central de Atividades & Provas)
* **Navegação Segmentada**: Abas para alternar entre tarefas **Pendentes** e **Concluídas**.
* **Filtros por Disciplina**: Pílulas horizontais para isolar atividades de matérias específicas (*Português, Matemática, História, etc.*).
* **Cards Informativos**: Identificação de tipo (*Atividade* vs *Prova*), data limite de entrega e pontuação máxima.

### 4. `ActivityDetailScreen.tsx` (Motor de Resolução de Exercícios)
* **Interface de Foco**: Ocultação de elementos distratores, exibindo enunciado e alternativas.
* **Seleção Interativa**: Opções de múltipla escolha e verdadeiro/falso com feedback tátil e visual (destaque em laranja).
* **Validação de Envio**: Alerta de confirmação caso o estudante tente submeter com questões em branco.
* **Cálculo Imediato de Pontuação**: Correção automatizada instantânea com transição de status para *"Concluída"*.

### 5. `ProfileScreen.tsx` (Perfil Acadêmico)
* **Identificação**: Nome completo, e-mail institucional e selo de perfil de estudante.
* **Dados Institucionais**: Card com o nome da escola/faculdade vinculada e período letivo.
* **Controle de Sessão**: Botão de encerramento seguro de sessão com limpeza de estado e retorno imediato ao menu inicial.

---

## 🚀 6. Como Executar o Projeto

### Pré-requisitos
* **Node.js** versão 20 ou superior instalado.
* Aplicativo **Expo Go** instalado no seu celular ([Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) ou [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)).

### Instalação e Execução

1. Acesse o diretório do aplicativo mobile:
   ```bash
   cd mobile
   ```

2. Caso necessário, certifique-se de que os pacotes estão instalados:
   ```bash
   npm install
   ```

3. Inicie o servidor Metro Bundler do Expo:
   ```bash
   npx expo start
   ```

4. **Para testar no Smartphone**:
   * Aponte a câmera do seu celular (iOS) ou abra o leitor de QR Code do aplicativo **Expo Go** (Android) e escaneie o código gerado no terminal.

5. **Para testar no Navegador Web**:
   * Com o terminal ativo, pressione a tecla **`w`** para abrir a versão web do aplicativo no seu navegador padrão.

---

## 🔒 7. Integração com Banco de Dados (Supabase)

O aplicativo mobile compartilha as mesmas estruturas de tabelas do portal Web:
* `users`: Consulta e identificação do perfil de aluno.
* `institutions`: Vínculo institucional do estudante.
* `subjects`: Matérias nas quais o aluno está enturmado.
* `activities`: Tarefas, enunciados e pontuações.
* `activity_submissions`: Registro de entregas e notas obtidas.

A camada de acesso em `src/lib/supabase.ts` está configurada com persistência via `@react-native-async-storage/async-storage`, garantindo que tokens JWT de acesso permaneçam salvos mesmo se o aplicativo for fechado.
