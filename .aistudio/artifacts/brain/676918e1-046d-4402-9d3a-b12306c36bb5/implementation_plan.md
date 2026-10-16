# Novo Tema Executivo "GAPP-NEW" — ERP Apuração do Boi

Criação do tema **"GAPP-NEW"** integrado ao seletor de temas do sistema, reproduzindo fielmente a arquitetura espacial, divisões de cards, paleta de cores (verde-floresta profundo `#113829`, verde-lima `#b5e550` e superfícies claras `#f4f6f4`) e componentes analíticos da imagem de referência, alimentados em tempo real pelos dados de Boi, Cortes, Suíno e das 16 Filiais.

---

### Revisão do Usuário & Decisões Confirmadas

> [!IMPORTANT]
> As decisões abaixo foram confirmadas e guiarão toda a construção do tema **GAPP-NEW** sem alterar o funcionamento dos temas existentes (*Moderno Claro*, *Moderno Escuro* e *GAPP Classic*).

- **Ativação pelo Seletor de Temas**: O sistema mantém o tema atual como padrão ao iniciar, disponibilizando o **"GAPP-NEW"** no menu seletor de temas em todos os cabeçalhos para alternância instantânea e persistência em `localStorage`.
- **Dados Reais do ERP**: Todos os gráficos, cartões de KPI, visão analítica, calendário operacional e lista de lançamentos refletirão os números reais da Planilha de Compras, Estoque das Câmaras, Rendimento de Desossa e Lotes das 16 Lojas.
- **Barra Lateral Fixa e Escopo Completo**: A estrutura com barra lateral esquerda fixa e cabeçalho executivo permanece ativa durante a navegação por todas as abas (Dashboard, Planilha de Compras, Estoque & Câmaras, Rendimento & Desossa, Histórico, Parâmetros, Backup e Dispositivos), aplicando a identidade visual **GAPP-NEW** em todo o ecossistema.

---

### 1. Visão Geral & Conceito Central

- **O Que Faz**: Oferece uma experiência SaaS executiva inspirada no layout de referência (*Hope Pro Dashboard*), unindo navegação vertical rápida, busca global com atalho de teclado, painel Bento Grid de 4 colunas e acesso direto a todas as ferramentas de compra, relatórios e auditoria.
- **Público-Alvo**: Diretoria Comercial, Gerência de Carnes (Patrick Pessoa) e Controladoria do Grupo GAPP.
- **Valor Principal**: Combina a leitura visual imediata de indicadores críticos (Pedido do Boi, Giro de Vendas, Sugestão, Cortes e Suíno) com navegação fluida em tela cheia (`1440px+`).

---

### 2. Experiência do Usuário & Design Visual

#### Fluxo de Uso e Estrutura Espacial
1. **Barra Lateral Esquerda Fixa (`260px`)**:
   - **Topo da Marca**: Emblema circular verde-floresta (`G`), título **GAPP**, selo verde-lima `Pro v10.7` e indicador `Matriz Privada`.
   - **Saudação Contextual**: Trilha de navegação (`Início > Dashboard`) e saudação personalizada (`Bem-vindo de volta, Patrick Pessoa`).
   - **Seção `MENU PRINCIPAL` (Expansível)**: Botões em formato cápsula com destaque verde-floresta (`#113829`) para o item ativo, cobrindo *Dashboard*, *Planilha de Compras*, *Estoque & Câmaras*, *Rendimento & Desossa*, *Cotações RJ & Brasil* e *Histórico de Lotes*.
   - **Seção `AJUDA & CONFIGURAÇÕES` (Expansível)**: Acesso direto a *Parâmetros & Lojas*, *Dispositivos / Portal*, *Backup em Nuvem*, *Relatório do Pedido (PDF)* e *Fechar Pedido de Compra*.
   - **Card Inferior de Ação Rápida**: Card em verde-floresta texturizado no rodapé da barra lateral para abrir rapidamente o **Fechamento de Pedido de Compra** ou **Portal de Membros**.

2. **Barra Superior Contextual**:
   - **Campo de Busca Global**: Barra arredondada (`Pesquisar filial, corte ou ferramenta...` com indicador `⌘S`), permitindo filtrar lojas ou saltar rapidamente para módulos do sistema.
   - **Ações Executivas & Perfil**: Botão escuro de destaque (`GAPP Assistência / Pedido Rápido`), seletor rápido de temas (`Tema: GAPP-NEW`), ícone de notificações/sincronização e perfil do usuário logado com nome, e-mail e menu de conta.

3. **Painel Principal "Bento Grid" (Divisões Idênticas à Imagem)**:
   - **Linha Superior — 4 Cards de KPI**:
     1. **Card 1 (Verde-Floresta `#113829` com gráfico de área verde-lima)**: *Total Pedido do Boi* (cabeças pedidas + Boi Calc no mês).
     2. **Card 2 (Branco com gráfico de barras tracejadas)**: *Filiais Ativas & Giro de Venda* (16 lojas conectadas, total de bois à venda e variação percentual).
     3. **Card 3 (Branco com colunas verticais e tooltip escuro)**: *Sugestão & Trânsito* (saldo de sugestão consolidada e peças em trânsito).
     4. **Card 4 (Branco com avatares de gerentes e barras verticais)**: *Pedido Suíno & Cortes* (total de bandas suínas, pedido de alcatrão e costela G).
   - **Bloco Central Esquerdo — Card "Visão Analítica (Analytic View)"**:
     - Indicador percentual principal de eficiência/participação + 3 linhas de distribuição com marcadores (*Dianteiro & Traseiro*, *Alcatrão & Costela G*, *Linha Suína*).
     - Gráfico de 3 blocos hachurados proporcionais (cinza claro, verde-lima `#b5e550` e verde-floresta `#113829`) com card flutuante escuro detalhando os volumes.
     - Sub-cards inferiores em cinza suave: **Resumo Operacional (Overview)** à esquerda, e **Rendimento & Margem** + **Plano de Ação de Compras** (com botão escuro `Ver Relatório`) empilhados à direita.
   - **BlocoInferior Esquerdo — 2 Cards Lado a Lado**:
     - **Card Proporção Câmara vs. Pedido (100%)**: Barra bipartida verde-lima (`% Estoque Câmara`) vs. cinza (`% Necessidade Pedido`) com marcador central vertical.
     - **Card "Filial Destaque / Top Participação" (Verde-Floresta `#113829`)**: Cabeçalho com a filial líder de giro, card branco interno com 4 indicadores circulares (*Bois Pedidos*, *Cortes Pç*, *Suíno Bandas*, *Peso Total*) e botões inferiores de ação em verde-lima e verde-escuro.
   - **Coluna Direita — Calendário & Lista de Filiais**:
     - **Calendário Mensal Interativo**: Navegação de mês (`<` `>`), grade de dias circulares com destaque verde-lima no dia atual e dias hachurados indicando datas com lotes/pedidos registrados.
     - **Lista de Lançamentos por Filial (Data Selecionada)**: Cards horizontais exibindo as filiais e seus encarregados, status do pedido em pílula verde-floresta, quantidade de bois/suínos e atalho direto para inspecionar a loja na planilha.

#### Identidade Visual & Tokens de Cores
- **Paleta de Cores**:
  - Superfície de Fundo: Cinza-esverdeado suave (`#eff2ef`)
  - Superfícies de Cards e Barra Lateral: Branco puro (`#ffffff`) com bordas suaves (`#e4e9e5`)
  - Cor Primária (Destaque Escuro): Verde-Floresta GAPP (`#113829` e `#0b291e`)
  - Cor de Acento (Destaque Vibrante): Verde-Lima (`#b5e550` e `#a3e635`)
  - Tipografia Numérica: `tabular-nums` e `JetBrains Mono` para alinhamento perfeito de tabelas e indicadores.

---

### 3. Decisões de Produto & Trade-Offs

- **Decisão 1: Integração Nativa ao `ThemeContext`**
  - *Abordagem Escolhida*: Expandir o tipo `Theme` para `'solidcon' | 'light' | 'dark' | 'gapp-new'`, adicionando a flag `isGappNew`.
  - *Por quê*: Garante transição imediata sem recarregar a página, mantendo 100% do estado da planilha, filtros e modais abertos.
- **Decisão 2: Layout Persistente para Todas as Abas no Tema GAPP-NEW**
  - *Abordagem Escolhida*: Quando `theme === 'gapp-new'`, o container raiz renderiza a Barra Lateral Fixa + Barra Superior do GAPP-NEW. Na aba `dashboard`, exibe o novo painel inspirado na imagem com dados reais (e opção de alternar para os gráficos clássicos/cotações); nas demais abas (`sheet`, `inventory`, `yield`, `history`, `parameters`, `backup`, `devices`), exibe a ferramenta correspondente envolvida pela moldura visual e paleta de cores do GAPP-NEW.
  - *Por quê*: Cumpre o requisito de manter a barra lateral fixa e todas as funcionalidades acessíveis sem quebrar a experiência visual.

---

### 4. Arquitetura Técnica & Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ThemeContext ('gapp-new')                        │
│     Alternância via ThemeSwitcher • Persistência em localStorage        │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     GappNewLayout (Container Raiz)                      │
├─────────────────────────┬───────────────────────────────────────────────┤
│   GappNewSidebar Fixa   │              GappNewTopBar                    │
│  • Logo GAPP Pro        │  • Busca Global de Filiais/Módulos (⌘S)       │
│  • Saudação Usuário     │  • Botão GAPP Assistência / Pedido de Compra  │
│  • Menu Principal       │  • Seletor de Tema + Notificações + Perfil    │
│  • Ajuda & Configs      ├───────────────────────────────────────────────┤
│  • Card Inferior Ação   │         Viewport Principal Dinâmico           │
│                         │                                               │
│                         │  ┌─────────────────────────────────────────┐  │
│                         │  │ Aba Dashboard: GappNewDashboardView     │  │
│                         │  │ • 4 KPI Cards (Boi, Venda, Sug, Suíno)  │  │
│                         │  │ • Analytic View (Blocos Hachurados)     │  │
│                         │  │ • Proporção 100% + Card Top Filial      │  │
│                         │  │ • Calendário Interativo + Lista Lojas   │  │
│                         │  └─────────────────────────────────────────┘  │
│                         │  ┌─────────────────────────────────────────┐  │
│                         │  │ Demais Abas (Planilha, Estoque, Desossa,│  │
│                         │  │ Histórico, Parâmetros, Backup, Portal)  │  │
│                         │  │ estilizadas com a paleta GAPP-NEW       │  │
│                         │  └─────────────────────────────────────────┘  │
└─────────────────────────┴───────────────────────────────────────────────┘
```

#### Mapeamento de Interações e Estado
- **Busca Global na Barra Superior**: Filtra filiais em tempo real ou permite navegar diretamente para qualquer módulo ou modal (Relatório em PDF, Pedido de Compra, Calculadora Rápida).
- **Cards de KPI e Analytic View**: Conectados diretamente ao `calculateSheetTotals(sheetRows)` e `batches`, recalculando instantaneamente sempre que qualquer célula da Planilha de Compras ou Estoque for editada.
- **Calendário e Lista Lateral de Filiais**: Permite clicar em um dia do mês ou em uma das 16 filiais listadas para abrir a linha da filial diretamente na Planilha de Compras ou abrir o Relatório Executivo de Pedido.
