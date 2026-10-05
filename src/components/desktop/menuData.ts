import { NavigationTab } from '../Navigation';
import {
  FileSpreadsheet,
  LayoutDashboard,
  Scissors,
  DollarSign,
  Boxes,
  ShoppingCart,
  Bone,
  SlidersHorizontal,
  Plus,
  Download,
  Printer,
  RotateCcw,
  Calculator,
  Scale,
  Truck,
  ArrowRightLeft,
  Warehouse,
  TrendingUp,
  FileText,
  ShieldCheck,
  HelpCircle,
  Keyboard,
  Info,
  Layers,
  Database,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  Smartphone,
  Power,
  Cloud
} from 'lucide-react';

export interface ERPMenuItem {
  id: string;
  name: string;
  division: string;
  code: string;
  shortcut?: string;
  badge?: string;
  description: string;
  icon: any;
  actionType: 'tab' | 'action' | 'modal';
  targetTab?: NavigationTab;
  actionId?: string;
}

export interface ERPMenuCategory {
  id: string;
  label: string;
  accessKey: string;
  divisionArea: string;
  items: ERPMenuItem[];
}

export const getERPMenuCategories = (
  onTabChange: (tab: NavigationTab) => void,
  onReset: () => void,
  onExportCSV: () => void,
  onOpenQuickCalc: () => void,
  onPrint: () => void,
  onToggleDesktop: () => void,
  onOpenAbout: () => void,
  onOpenShortcuts: () => void,
  onOpenDiagnostics: () => void,
  storeCount: number = 16,
  onExportXLSX?: () => void
): ERPMenuCategory[] => [
  {
    id: 'arquivo',
    label: 'Arquivo',
    accessKey: 'A',
    divisionArea: 'Sistema e Operações Gerais',
    items: [
      {
        id: 'arq-novo-lote',
        name: 'Novo Lote de Compra de Gado (NF)',
        division: 'Suprimentos & Compras',
        code: 'CMP-01',
        shortcut: 'Ctrl+N',
        badge: 'Operacional',
        description: 'Lançamento de lote de boi, peso vivo, balança e frigorífico',
        icon: Plus,
        actionType: 'tab',
        targetTab: 'purchases'
      },
      {
        id: 'arq-matriz',
        name: 'Planilha Matriz da Direção v10.1',
        division: 'Diretoria Executiva',
        code: 'DIR-01',
        shortcut: 'Alt+2',
        badge: `${storeCount} Lojas`,
        description: 'Matriz consolidada oficial com distribuição das 16 filiais',
        icon: FileSpreadsheet,
        actionType: 'tab',
        targetTab: 'sheet'
      },
      {
        id: 'arq-painel',
        name: 'Painel Geral de Indicadores (Dashboard)',
        division: 'Controladoria & Gestão',
        code: 'GER-01',
        shortcut: 'Alt+1',
        description: 'Visão executiva consolidada de margens, compras e estoques',
        icon: LayoutDashboard,
        actionType: 'tab',
        targetTab: 'dashboard'
      },
      {
        id: 'arq-pedido-compra',
        name: 'Gerar Pedido de Compra Padrão (16 Lojas)',
        division: 'Suprimentos & Logística',
        code: 'CMP-02',
        shortcut: 'Alt+G',
        badge: 'Operacional',
        description: 'Emissão oficial de pedido de compra por loja com quantidades e valores',
        icon: ShoppingCart,
        actionType: 'action',
        actionId: 'purchaseOrder'
      },
      {
        id: 'arq-exportar-xlsx',
        name: 'Exportar para Excel (.xlsx estruturado com fórmulas)',
        division: 'Controladoria & Diretoria',
        code: 'EXP-02',
        shortcut: 'Alt+X',
        badge: 'Excel Oficial',
        description: 'Gera pasta de trabalho XLSX com abas Matriz v10.1, Rendimento e DRE formatadas',
        icon: Download,
        actionType: 'action',
        actionId: 'exportXLSX'
      },
      {
        id: 'arq-exportar',
        name: 'Exportar Matriz Rápida (CSV)',
        division: 'Dados & Relatórios',
        code: 'EXP-01',
        shortcut: 'Ctrl+E',
        description: 'Exportação tabular de todos os pedidos e custos das filiais em CSV',
        icon: Download,
        actionType: 'action',
        actionId: 'exportCSV'
      },
      {
        id: 'arq-imprimir',
        name: 'Imprimir Relatório Executivo (PDF)',
        division: 'Diretoria & Auditoria',
        code: 'REL-01',
        shortcut: 'Ctrl+P',
        badge: 'A4',
        description: 'Espelho impresso com assinaturas, DRE e resumo de compras',
        icon: Printer,
        actionType: 'action',
        actionId: 'print'
      },
      {
        id: 'arq-calc',
        name: 'Calculadora Rápida de Desossa e @',
        division: 'Utilidades',
        code: 'UTL-01',
        shortcut: 'F4',
        description: 'Conversão rápida de arroba viva, quilo limpo e margens',
        icon: Calculator,
        actionType: 'action',
        actionId: 'quickCalc'
      },
      {
        id: 'arq-backup-online',
        name: 'Central de Backup Online & Agendamento',
        division: 'Segurança & Firestore',
        code: 'BKP-01',
        shortcut: 'Alt+9',
        badge: 'Nuvem',
        description: 'Geração e monitoramento de backups online no Firestore com horários definidos',
        icon: Cloud,
        actionType: 'tab',
        targetTab: 'backup'
      },
      {
        id: 'arq-restaurar',
        name: 'Restaurar Matriz Oficial v10.1',
        division: 'Administração do Sistema',
        code: 'SYS-01',
        shortcut: 'F5',
        badge: 'Oficial',
        description: 'Restaura a base padrão de compra oficial da direção',
        icon: RotateCcw,
        actionType: 'action',
        actionId: 'reset'
      },
      {
        id: 'arq-sair',
        name: 'Sair do Sistema e Fechar Navegador',
        division: 'Sistema & Segurança',
        code: 'SYS-99',
        shortcut: 'Alt+F4',
        badge: 'Saída',
        description: 'Encerra a sessão de trabalho e fecha a janela do navegador',
        icon: Power,
        actionType: 'action',
        actionId: 'exit'
      }
    ]
  },
  {
    id: 'cadastro',
    label: 'Cadastro',
    accessKey: 'C',
    divisionArea: 'Cadastros Básicos & Tabelas Centrais',
    items: [
      {
        id: 'cad-produtos',
        name: 'Módulo 1: Produtos e Cortes Nobres',
        division: 'Zootecnia & Açougue',
        code: 'CAD-01',
        badge: 'Etapa 4',
        description: 'Cadastro de carnes nobres: Picanha, Alcatra, Contrafilé, Dianteiro',
        icon: Scissors,
        actionType: 'tab',
        targetTab: 'parameters'
      },
      {
        id: 'cad-filiais',
        name: `Filiais e Lojas da Rede (${storeCount} Lojas Ativas)`,
        division: 'Operações de Varejo',
        code: 'CAD-02',
        badge: 'Etapa 6',
        description: 'Configuração de lojas, capacidade de câmaras frias e gerentes',
        icon: Warehouse,
        actionType: 'tab',
        targetTab: 'parameters'
      },
      {
        id: 'cad-parametros-boi',
        name: 'Parâmetros Zootécnicos do Boi & Pesos Padrão',
        division: 'Pecuária & Abate',
        code: 'CAD-03',
        badge: 'Etapa 2',
        description: 'Peso vivo, peso de carcaça, rendimento de gancho e perdas',
        icon: Scale,
        actionType: 'tab',
        targetTab: 'parameters'
      },
      {
        id: 'cad-fornecedores',
        name: 'Cadastro de Frigoríficos & Fornecedores (Inclusão, Edição, Exclusão, Impressão)',
        division: 'Suprimentos & Originação',
        code: 'CAD-04',
        shortcut: 'Alt+F',
        badge: 'Completo',
        description: 'Gestão completa de fornecedores parceiros, inclusão de novos, exclusão, edição e impressão de ficha cadastral',
        icon: Building2,
        actionType: 'action',
        actionId: 'suppliers'
      },
      {
        id: 'cad-graxaria',
        name: 'Graxarias e Compradores de Subprodutos',
        division: 'Descarte & Quebras',
        code: 'CAD-05',
        description: 'Tabela de preços de venda para sebo bovino e osso limpo',
        icon: Bone,
        actionType: 'tab',
        targetTab: 'waste'
      },
      {
        id: 'cad-assistente',
        name: 'Assistente de Parâmetros Globais (7 Etapas)',
        division: 'Administração',
        code: 'CAD-06',
        badge: 'Completo',
        description: 'Configuração integral dos parâmetros de apuração do sistema',
        icon: SlidersHorizontal,
        actionType: 'tab',
        targetTab: 'parameters'
      }
    ]
  },
  {
    id: 'preco',
    label: 'Preço',
    accessKey: 'P',
    divisionArea: 'Comercial & Precificação Estratégica',
    items: [
      {
        id: 'prc-custo-limpo',
        name: 'Formação de Preço de Venda e Custo Limpo',
        division: 'Comercial & Desossa',
        code: 'PRC-01',
        badge: 'Calculado',
        description: 'Apuração do custo real por quilo desossado e preço sugerido',
        icon: DollarSign,
        actionType: 'tab',
        targetTab: 'yield'
      },
      {
        id: 'prc-markup',
        name: 'Simulador de Markup Sugerido vs Praticado',
        division: 'Controladoria Comercial',
        code: 'PRC-02',
        description: 'Análise de margens brutas e percentuais de markup da rede',
        icon: TrendingUp,
        actionType: 'tab',
        targetTab: 'results'
      },
      {
        id: 'prc-tabela-filiais',
        name: `Tabela de Preços Mínimos por Filial (${storeCount} Lojas)`,
        division: 'Varejo & Filiais',
        code: 'PRC-03',
        description: 'Preços de venda praticados no balcão e no atacado por loja',
        icon: FileSpreadsheet,
        actionType: 'tab',
        targetTab: 'sheet'
      },
      {
        id: 'prc-conversor',
        name: 'Conversor Rápido Arroba (@) para Quilo (Kg)',
        division: 'Calculadora',
        code: 'PRC-04',
        shortcut: 'F4',
        description: 'Cálculo instantâneo de preço da carcaça e conversão para Kg',
        icon: Calculator,
        actionType: 'action',
        actionId: 'quickCalc'
      }
    ]
  },
  {
    id: 'compra',
    label: 'Compra',
    accessKey: 'O',
    divisionArea: 'Suprimentos & Originação de Gado',
    items: [
      {
        id: 'cmp-lotes',
        name: 'Entrada de Lotes de Bois & Notas Fiscais',
        division: 'Compras Frigorífico',
        code: 'CMP-01',
        shortcut: 'Ctrl+N',
        badge: 'Ativo',
        description: 'Lançamento de romaneios, peso bruto, fretes e descontos de abate',
        icon: ShoppingCart,
        actionType: 'tab',
        targetTab: 'purchases'
      },
      {
        id: 'cmp-matriz-direcao',
        name: 'Planilha de Compra da Direção Geral (Oficial)',
        division: 'Diretoria de Compras',
        code: 'CMP-02',
        shortcut: 'F2',
        description: 'Distribuição oficial de pedidos semanais para as 16 lojas',
        icon: FileSpreadsheet,
        actionType: 'tab',
        targetTab: 'sheet'
      },
      {
        id: 'cmp-custo-arroba',
        name: 'Apuração do Custo Efetivo da @ com Frete',
        division: 'Controladoria de Compras',
        code: 'CMP-03',
        description: 'Custo final por arroba limpa entregue nas câmaras frias',
        icon: Scale,
        actionType: 'tab',
        targetTab: 'yield'
      },
      {
        id: 'cmp-historico',
        name: 'Histórico de Cotações e Lotes Comprados',
        division: 'Suprimentos',
        code: 'CMP-04',
        description: 'Acompanhamento do histórico de preços médios negociados',
        icon: Database,
        actionType: 'tab',
        targetTab: 'purchases'
      }
    ]
  },
  {
    id: 'venda',
    label: 'Venda',
    accessKey: 'V',
    divisionArea: 'Comercial & Faturamento de Lojas',
    items: [
      {
        id: 'vnd-dre',
        name: 'DRE Gerencial de Vendas e Margens Brutas',
        division: 'Controladoria Financeira',
        code: 'VND-01',
        badge: 'DRE',
        description: 'Demonstrativo completo de receita de vendas, custos e lucro',
        icon: TrendingUp,
        actionType: 'tab',
        targetTab: 'results'
      },
      {
        id: 'vnd-desempenho-lojas',
        name: `Desempenho de Vendas por Filial (${storeCount} Lojas)`,
        division: 'Operações de Loja',
        code: 'VND-02',
        description: 'Volume comercializado e faturamento previsto por loja',
        icon: FileSpreadsheet,
        actionType: 'tab',
        targetTab: 'sheet'
      },
      {
        id: 'vnd-ranking-cortes',
        name: 'Ranking de Margem de Contribuição por Corte',
        division: 'Comercial',
        code: 'VND-03',
        description: 'Cortes com maior rentabilidade: Alcatra, Contrafilé e Picanha',
        icon: Scissors,
        actionType: 'tab',
        targetTab: 'yield'
      },
      {
        id: 'vnd-painel-metas',
        name: 'Painel Executivo Geral de Metas e Faturamento',
        division: 'Diretoria',
        code: 'VND-04',
        shortcut: 'F3',
        description: 'Indicadores consolidados em tempo real da apuração de vendas',
        icon: LayoutDashboard,
        actionType: 'tab',
        targetTab: 'dashboard'
      }
    ]
  },
  {
    id: 'transferencia',
    label: 'Transferência',
    accessKey: 'T',
    divisionArea: 'Logística & Distribuição Interna',
    items: [
      {
        id: 'trf-interfiliais',
        name: 'Transferência de Peças e Carnes entre Filiais',
        division: 'Logística de Abastecimento',
        code: 'TRF-01',
        badge: 'Logística',
        description: 'Remessa de quartos e cortes nobres entre as 16 filiais',
        icon: ArrowRightLeft,
        actionType: 'tab',
        targetTab: 'inventory'
      },
      {
        id: 'trf-transito',
        name: 'Rastreabilidade de Peças e Cargas em Trânsito',
        division: 'Transporte Frigorífico',
        code: 'TRF-02',
        description: 'Monitoramento de caminhões e cargas em rota para as lojas',
        icon: Truck,
        actionType: 'tab',
        targetTab: 'inventory'
      },
      {
        id: 'trf-rateio-matriz',
        name: 'Rateio e Distribuição Programada da Matriz',
        division: 'Distribuição Central',
        code: 'TRF-03',
        shortcut: 'F2',
        description: 'Grade programada de distribuição semanal de quartos dianteiro/traseiro',
        icon: FileSpreadsheet,
        actionType: 'tab',
        targetTab: 'sheet'
      },
      {
        id: 'trf-central-desossa',
        name: 'Remessa para Central de Desossa',
        division: 'Açougue Industrial',
        code: 'TRF-04',
        description: 'Envio de quartos inteiros para desossa centralizada da rede',
        icon: Scissors,
        actionType: 'tab',
        targetTab: 'yield'
      }
    ]
  },
  {
    id: 'estoque',
    label: 'Estoque',
    accessKey: 'E',
    divisionArea: 'Armazenagem & Câmaras Frias',
    items: [
      {
        id: 'est-camaras',
        name: `Controle de Câmaras Frias das ${storeCount} Filiais`,
        division: 'Armazenamento Frigorífico',
        code: 'EST-01',
        badge: 'Câmaras',
        description: 'Capacidade ocupada, saldo em quilos e temperatura das lojas',
        icon: Warehouse,
        actionType: 'tab',
        targetTab: 'inventory'
      },
      {
        id: 'est-fisico-osso',
        name: 'Estoque Físico de Peças com Osso vs Desossadas',
        division: 'Controle de Saldo',
        code: 'EST-02',
        description: 'Quilos em estoque divididos por corte e tipo de carcaça',
        icon: Boxes,
        actionType: 'tab',
        targetTab: 'inventory'
      },
      {
        id: 'est-descarte',
        name: 'Controle de Descarte & Graxaria (Sebo e Osso)',
        division: 'Subprodutos & Quebras',
        code: 'EST-03',
        badge: 'Graxaria',
        description: 'Registro de quebras de desossa, ossos limpos e sebo bovino',
        icon: Bone,
        actionType: 'tab',
        targetTab: 'waste'
      },
      {
        id: 'est-quebra-resfriamento',
        name: 'Balanço de Quebras de Desossa e Resfriamento',
        division: 'Auditoria de Estoque',
        code: 'EST-04',
        description: 'Comparativo de pesagem de entrada vs peso líquido de carnes',
        icon: Scale,
        actionType: 'tab',
        targetTab: 'yield'
      }
    ]
  },
  {
    id: 'consulta',
    label: 'Consulta',
    accessKey: 'N',
    divisionArea: 'Consultas Rápidas & Auditoria',
    items: [
      {
        id: 'cns-matriz-oficial',
        name: 'Planilha Oficial da Direção v10.1 (Matriz)',
        division: 'Diretoria Geral',
        code: 'CNS-01',
        shortcut: 'F2',
        description: 'Consulta tabular aos pedidos e valores totais das 16 filiais',
        icon: FileSpreadsheet,
        actionType: 'tab',
        targetTab: 'sheet'
      },
      {
        id: 'cns-dashboard',
        name: 'Painel Executivo Geral (Dashboard)',
        division: 'Gestão Executiva',
        code: 'CNS-02',
        shortcut: 'F3',
        description: 'Resumo gráfico de indicadores, faturamento e compras',
        icon: LayoutDashboard,
        actionType: 'tab',
        targetTab: 'dashboard'
      },
      {
        id: 'cns-ficha-rendimento',
        name: 'Ficha Zootécnica de Rendimento por Peça',
        division: 'Técnica de Carnes',
        code: 'CNS-03',
        description: 'Tabela oficial com percentuais padrão de rendimento de carcaça',
        icon: Scissors,
        actionType: 'tab',
        targetTab: 'yield'
      },
      {
        id: 'cns-dre',
        name: 'Demonstrativo DRE e Margens por Loja',
        division: 'Financeiro',
        code: 'CNS-04',
        description: 'Consulta aprofundada de resultados e markups praticados',
        icon: TrendingUp,
        actionType: 'tab',
        targetTab: 'results'
      },
      {
        id: 'cns-calculadora',
        name: 'Calculadora Rápida de Apuração',
        division: 'Utilidades',
        code: 'CNS-05',
        shortcut: 'F4',
        description: 'Simulação instantânea de conversões e preços de arroba',
        icon: Calculator,
        actionType: 'action',
        actionId: 'quickCalc'
      }
    ]
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    accessKey: 'R',
    divisionArea: 'Controladoria & Emissão de Relatórios',
    items: [
      {
        id: 'rel-impressao-pdf',
        name: 'Relatório Executivo Oficial de Apuração (PDF / Imprimir)',
        division: 'Diretoria & Auditoria',
        code: 'REL-01',
        shortcut: 'Ctrl+P',
        badge: 'Oficial',
        description: 'Documento impresso formal com cabeçalho GRUPO GAPP e DRE',
        icon: Printer,
        actionType: 'action',
        actionId: 'print'
      },
      {
        id: 'rel-export-csv',
        name: 'Exportar Base Completa em Planilha Excel (CSV)',
        division: 'Exportação de Dados',
        code: 'REL-02',
        shortcut: 'Ctrl+E',
        description: 'Gera arquivo CSV para auditoria externa e controladoria',
        icon: Download,
        actionType: 'action',
        actionId: 'exportCSV'
      },
      {
        id: 'rel-dre-consolidado',
        name: 'DRE Gerencial Consolidado da Rede',
        division: 'Controladoria Financeira',
        code: 'REL-03',
        description: 'Demonstrativo completo de receitas, custos e margem por corte',
        icon: TrendingUp,
        actionType: 'tab',
        targetTab: 'results'
      },
      {
        id: 'rel-extrato-desossa',
        name: 'Extrato Técnico de Rendimento de Desossa',
        division: 'Zootecnia & Açougue',
        code: 'REL-04',
        description: 'Relatório de eficiência zootécnica e quebras de carcaça',
        icon: Scissors,
        actionType: 'tab',
        targetTab: 'yield'
      },
      {
        id: 'rel-graxaria-perdas',
        name: 'Relatório de Graxaria, Sebo e Osso Bovino',
        division: 'Subprodutos',
        code: 'REL-05',
        description: 'Volume financeiro e quilos comercializados de descarte',
        icon: Bone,
        actionType: 'tab',
        targetTab: 'waste'
      }
    ]
  },
  {
    id: 'manutencao',
    label: 'Manutenção',
    accessKey: 'M',
    divisionArea: 'Configurações & Administração do Sistema',
    items: [
      {
        id: 'mnt-parametros-7passos',
        name: 'Módulo 1: Cadastro de Parâmetros (7 Etapas)',
        division: 'Configuração Central',
        code: 'MNT-01',
        badge: '7 Etapas',
        description: 'Configuração dos dados do boi, custos, rendimentos e filiais',
        icon: SlidersHorizontal,
        actionType: 'tab',
        targetTab: 'parameters'
      },
      {
        id: 'mnt-recalcular',
        name: `Recalcular Distribuição e Sugestões (${storeCount} Lojas)`,
        division: 'Processamento de Dados',
        code: 'MNT-02',
        shortcut: 'F2',
        description: 'Reprocessa as fórmulas matemáticas de pedidos para as filiais',
        icon: FileSpreadsheet,
        actionType: 'tab',
        targetTab: 'sheet'
      },
      {
        id: 'mnt-reset-fabrica',
        name: 'Restaurar Matriz Oficial v10.1 (Padrão de Fábrica)',
        division: 'Banco de Dados',
        code: 'MNT-03',
        shortcut: 'F5',
        badge: 'Restauração',
        description: 'Recarrega a planilha e parâmetros originais da Direção',
        icon: RotateCcw,
        actionType: 'action',
        actionId: 'reset'
      },
      {
        id: 'mnt-diagnostico',
        name: 'Diagnóstico de Integridade da Base de Dados',
        division: 'Suporte & TI',
        code: 'MNT-04',
        description: 'Verificação de sincronização, integridade de cálculos e cache',
        icon: ShieldCheck,
        actionType: 'modal',
        actionId: 'diagnostics'
      },
      {
        id: 'mnt-portal-horarios',
        name: 'Horários & Bloqueio do Portal Mobile (Controle Gestor)',
        division: 'Gestão de Acessos & Lojas',
        code: 'MNT-05',
        badge: 'Controle',
        description: 'Bloqueio do portal e configuração de janelas de horários permitidos para lançamento de estoque',
        icon: Clock,
        actionType: 'action',
        actionId: 'portalControl'
      },
      {
        id: 'mnt-portal-mobile',
        name: 'Abrir Portal Mobile de Lançamento por Filial',
        division: 'Operação de Lojas',
        code: 'MNT-06',
        badge: 'Touch',
        description: 'Interface touch mobile para os encarregados registrarem a contagem semanal de câmara e balcão',
        icon: Smartphone,
        actionType: 'action',
        actionId: 'mobilePortal'
      }
    ]
  },
  {
    id: 'nfe',
    label: 'NFe',
    accessKey: 'F',
    divisionArea: 'Fiscal & Recepção de Mercadorias',
    items: [
      {
        id: 'nfe-conferencia-nf',
        name: 'Conferência de Notas Fiscais de Entrada (Frigorífico)',
        division: 'Fiscal & Recepção',
        code: 'NFE-01',
        badge: 'Fiscal',
        description: 'Espelho de NF de fornecedores com pesagem e valores por @',
        icon: ShoppingCart,
        actionType: 'tab',
        targetTab: 'purchases'
      },
      {
        id: 'nfe-conferencia-balanca',
        name: 'Espelho de Pesagem: Balança vs Nota Fiscal',
        division: 'Recebimento & Pesagem',
        code: 'NFE-02',
        description: 'Auditoria de divergência entre peso faturado e peso na descarga',
        icon: Scale,
        actionType: 'tab',
        targetTab: 'yield'
      },
      {
        id: 'nfe-tributos-custo',
        name: 'Demonstrativo de Tributos, Encargos & Custo Efetivo',
        division: 'Fiscal & Controladoria',
        code: 'NFE-03',
        description: 'Cálculo de Funrural, fretes e impostos sobre a arroba',
        icon: TrendingUp,
        actionType: 'tab',
        targetTab: 'results'
      }
    ]
  },
  {
    id: 'janelas',
    label: 'Janelas',
    accessKey: 'J',
    divisionArea: 'Interface & Gerenciamento MDI',
    items: [
      {
        id: 'win-wallpaper',
        name: 'Alternar Janela / Área de Trabalho Metálica 3D',
        division: 'Interface Solidcon',
        code: 'WIN-01',
        badge: 'Logo 3D',
        description: 'Minimiza todas as janelas e exibe o papel de parede metálico',
        icon: Layers,
        actionType: 'action',
        actionId: 'toggleDesktop'
      },
      {
        id: 'win-sheet',
        name: 'Janela: Planilha Matriz da Direção v10.1',
        division: 'Módulo MDI',
        code: 'WIN-02',
        shortcut: 'F2',
        description: 'Traz a janela da planilha oficial para o primeiro plano',
        icon: FileSpreadsheet,
        actionType: 'tab',
        targetTab: 'sheet'
      },
      {
        id: 'win-dashboard',
        name: 'Janela: Painel Executivo / Dashboard',
        division: 'Módulo MDI',
        code: 'WIN-03',
        shortcut: 'F3',
        description: 'Traz o painel com gráficos e indicadores executivos',
        icon: LayoutDashboard,
        actionType: 'tab',
        targetTab: 'dashboard'
      },
      {
        id: 'win-yield',
        name: 'Janela: Rendimento & Desossa',
        division: 'Módulo MDI',
        code: 'WIN-04',
        description: 'Traz a janela de análise zootécnica e formação de custo limpo',
        icon: Scissors,
        actionType: 'tab',
        targetTab: 'yield'
      },
      {
        id: 'win-results',
        name: 'Janela: DRE & Apuração de Margens',
        division: 'Módulo MDI',
        code: 'WIN-05',
        description: 'Traz o demonstrativo de resultados e margem bruta',
        icon: DollarSign,
        actionType: 'tab',
        targetTab: 'results'
      },
      {
        id: 'win-inventory',
        name: 'Janela: Estoque em Câmaras Frias',
        division: 'Módulo MDI',
        code: 'WIN-06',
        description: 'Traz a janela de acompanhamento de estoque das filiais',
        icon: Warehouse,
        actionType: 'tab',
        targetTab: 'inventory'
      },
      {
        id: 'win-purchases',
        name: 'Janela: Compras & Lotes de Gado',
        division: 'Módulo MDI',
        code: 'WIN-07',
        shortcut: 'Ctrl+N',
        description: 'Traz a janela de registro de lotes de frigoríficos',
        icon: ShoppingCart,
        actionType: 'tab',
        targetTab: 'purchases'
      },
      {
        id: 'win-waste',
        name: 'Janela: Descarte (Sebo e Osso / Graxaria)',
        division: 'Módulo MDI',
        code: 'WIN-08',
        description: 'Traz a janela de pesagem e venda de subprodutos',
        icon: Bone,
        actionType: 'tab',
        targetTab: 'waste'
      },
      {
        id: 'win-params',
        name: 'Janela: Módulo 1 - Cadastro e Parâmetros',
        division: 'Módulo MDI',
        code: 'WIN-09',
        description: 'Traz a janela com o assistente dos 7 passos',
        icon: SlidersHorizontal,
        actionType: 'tab',
        targetTab: 'parameters'
      },
      {
        id: 'win-backup',
        name: 'Janela: Central de Backup Online',
        division: 'Módulo MDI',
        code: 'WIN-10',
        shortcut: 'Alt+9',
        description: 'Traz a janela de monitoramento e agendamento de backups na nuvem',
        icon: Cloud,
        actionType: 'tab',
        targetTab: 'backup'
      }
    ]
  },
  {
    id: 'ajuda',
    label: 'Ajuda',
    accessKey: 'U',
    divisionArea: 'Documentação & Suporte Técnico',
    items: [
      {
        id: 'hlp-sobre',
        name: 'Sobre o Grupo GAPP Sistemas v10.1',
        division: 'Institucional',
        code: 'HLP-01',
        badge: 'v10.1',
        description: 'Informações do ERP, autoria Patrick Pessoa e versão da matriz',
        icon: Info,
        actionType: 'modal',
        actionId: 'about'
      },
      {
        id: 'hlp-atalhos',
        name: 'Tabela de Atalhos de Teclado',
        division: 'Operação Rápida',
        code: 'HLP-02',
        shortcut: 'F1',
        description: 'Guia de teclas de atalho: F2, F3, F4, F5, Ctrl+N, Ctrl+P, etc.',
        icon: Keyboard,
        actionType: 'modal',
        actionId: 'shortcuts'
      },
      {
        id: 'hlp-metodologia',
        name: 'Metodologia de Apuração do Boi por Patrick Pessoa',
        division: 'Engenharia Zootécnica',
        code: 'HLP-03',
        description: 'Explicação detalhada dos cálculos de rendimento e custo limpo',
        icon: HelpCircle,
        actionType: 'tab',
        targetTab: 'yield'
      }
    ]
  }
];
