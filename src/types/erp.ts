export type MeatCategory = 
  | 'quarto_osso'       // Dianteiro c/ osso, Traseiro c/ osso, Ponta de Agulha
  | 'corte_traseiro'    // Alcatra, Contra Filé, Picanha, Mignon, Chã, Patinho, Lagarto
  | 'corte_dianteiro'   // Paleta, Acém, Peito, Músculo
  | 'suino'             // Costela Suína, Pernil
  | 'subproduto';       // Osso, Sebo, Graxa

export interface Product {
  id: string;
  code: string;
  name: string;
  category: MeatCategory;
  defaultPriceKg: number;      // Preço de referência da planilha / custo base
  sellingPriceKg: number;      // Preço praticado no balcão
  averageWeightPieceKg: number;// Peso médio por peça (ex: Banda 120kg, Quarto 60kg, Picanha 1.6kg)
  targetMarginPercent: number; // Margem alvo sobre venda (%)
  unit: 'KG' | 'PECA';
  isBoneOrFatWaste?: boolean;  // Sebo ou Osso
  yieldPercentStandard?: number; // % padrão esperado na desossa
}

export interface Store {
  id: string;
  code: string;
  name: string;
  city: string;
  manager: string;
  chamberCapacityPieces: number; // Capacidade da câmara fria (peças)
  active: boolean;
}

export interface Supplier {
  id: string;
  code: string;                 // Código interno (ex: FORN-01)
  name: string;                 // Razão Social / Nome Frigorífico
  tradeName?: string;           // Nome Fantasia / Marca
  cnpj: string;                 // CNPJ
  stateRegistration?: string;   // Inscrição Estadual (IE)
  sifNumber?: string;           // Selo SIF (ex: SIF 42)
  city: string;                 // Cidade da planta
  state: string;                // UF da planta
  contactName: string;          // Contato / Representante
  phone: string;                // Telefone / WhatsApp
  email: string;                // E-mail comercial
  paymentTerms?: string;        // Condições de pagamento (ex: 7 / 14 / 21 dias)
  standardCarcassWeightKg?: number; // Peso médio carcaça (ex: 260kg)
  active: boolean;              // Ativo / Inativo
  notes?: string;               // Observações
}

export interface SheetRowData {
  storeId: string;
  storeName: string;
  // DADOS PARA A GERAÇÃO DE PEDIDO
  pedidoDianteiro: number;
  pedidoTraseiro: number;
  pedidoCoxao: number;
  pedidoAlcatrao: number;
  pedidoCostelaGaucha: number;
  venda?: number;              // Venda projetada / giro da filial (alias de boiAVenda)
  boiAVenda: number;           // Mantido para compatibilidade total
  boi?: number;                // Somatório: (dianteiro + traseiro + coxão + alcatrão) / 2
  sugestaoPedido: number;      // Fórmula: venda - boi
  pedidoFinal?: number;        // Coluna "Pedido" adicionada para quantidade pedida pelo usuário
  pTransito: number;           // Peça Trânsito
  recebeuBoiHoje?: boolean;    // Confirmação se a filial recebeu boi hoje (SIM / NÃO)
  
  // PEÇA INTEIRA CÂMARA
  camaraDianteiro: number;
  camaraTraseiro: number;
  camaraCoxao: number;
  camaraAlcatrao: number;
  somaDoTraseiro: number;
  camaraCostelaGaucha: number;

  // BALCÃO / CÂMARA / DESOSSA (NOBRES)
  alcatra: number;
  alcatraPecas?: number;
  alcatraKg?: number;
  contraFile: number;
  contraFilePecas?: number;
  contraFileKg?: number;
  costelaCong: number;
  totalAlcatrao: number;
  picanha: number;
  picanhaPecas?: number;
  picanhaKg?: number;
  fileMignon: number;
  fileMignonPecas?: number;
  fileMignonKg?: number;

  // BALCÃO E DESOSSA - DIANTEIRO
  totalDianteiro: number;
  paletaKg: number;
  paletaPecas: number;
  acemKg: number;
  acemPecas: number;
  peitoKg: number;
  peitoPecas: number;
  musculoKg: number;
  musculoPecas: number;

  // BALCÃO E DESOSSA - COXÃO
  totalCoxao: number;
  chaKg: number;
  chaPecas: number;
  patinhoKg: number;
  patinhoPecas: number;
  lagartoRedondoKg: number;
  lagartoRedondoPecas: number;
  lagartoPlanoKg: number;
  lagartoPlanoPecas: number;

  // CÂMARA / BALCÃO E DESOSSA
  bandaKg: number;
  bandaPecas: number;
  bandaVenda?: number;
  vendaSuino?: number;
  bandaSugestao?: number;
  bandaPedido?: number;
  pedidoSuino?: number;
  costelaSuinaPecas: number;
  pernilPecas: number;
}

export interface PurchaseBatchItem {
  storeId: string;
  storeName: string;
  dianteiro: number;
  traseiro: number;
  coxao: number;
  alcatrao: number;
  costela: number;
  boi: number;
  venda: number;
  sugestao: number;
  pedido: number;
  estimatedWeightKg: number;
  estimatedTotalR$: number;
  bandaKg?: number;
  bandaPecas?: number;
  bandaVenda?: number;
  bandaSugestao?: number;
  bandaPedido?: number;
  costelaSuina?: number;
  pernil?: number;
}

export interface PurchaseBatch {
  id: string;
  date: string;
  supplier: string;          // Frigorífico
  invoiceNumber: string;     // NF ou Número do Pedido
  headsCount: number;        // Qtd de bois / cabeças
  totalGrossWeightKg: number;// Peso total bruto
  arrobaPrice: number;       // Preço da arroba (@) em R$
  totalCostR$: number;       // Custo total da compra
  costPerKg: number;         // Custo por kg de carcaça
  targetStoreId?: string;    // 'TODAS' ou ID da loja
  status: 'PENDENTE' | 'RECEBIDO' | 'DESOSSADO';
  notes?: string;
  deliveryDate?: string;     // Previsão de entrega
  items?: PurchaseBatchItem[]; // Detalhamento por loja das 16 filiais
}

export interface YieldAnalysisCuts {
  name: string;
  category: 'NOBRE' | 'SEGUNDA' | 'COXAO' | 'COSTELA' | 'DESCARTE';
  weightKg: number;
  yieldPercent: number;     // % do corte em relação à carcaça
  costPriceKg: number;      // Custo atribuído
  sellingPriceKg: number;   // Preço de venda praticado
  revenueR$: number;        // Faturamento gerado
  marginOnSalePercent: number; // Margem s/ venda %
  marginOnCostPercent: number; // Margem s/ compra (markup) %
  isWaste?: boolean;
}

export interface WasteRecord {
  id: string;
  date: string;
  storeId: string;
  batchId?: string;
  fatWeightKg: number;       // Peso do sebo
  boneWeightKg: number;      // Peso do osso
  carcassOriginWeightKg: number; // Peso da carcaça de origem
  fatSalePriceKg: number;    // Preço recebido pelo sebo (R$/kg)
  boneSalePriceKg: number;   // Preço recebido pelo osso (R$/kg)
  fatRevenueR$: number;      // Receita com sebo
  boneRevenueR$: number;     // Receita com osso
  wastePercent: number;      // % total de quebra e descarte
  renderingPlant: string;    // Graxaria / Coletor
}

export interface StoreInventory {
  storeId: string;
  chamberPieces: number;     // Peças na câmara
  chamberWeightKg: number;   // Kg na câmara
  counterPieces: number;     // Peças desossadas / balcão
  counterWeightKg: number;   // Kg no balcão
  inTransitPieces: number;   // Peças em trânsito
  inTransitWeightKg: number; // Kg em trânsito
}

export interface StandardPurchaseOrderItem {
  storeId: string;
  storeName: string;
  dianteiro: number;
  traseiro: number;
  coxao: number;
  alcatrao: number;
  costelaGaucha: number;
  boi: number;               // (D + T + C + A) / 2
  venda: number;
  sugestao: number;          // Venda - Boi
  pedido: number;            // Quantidade de bois/peças pedidas
  estimatedWeightKg: number;
  estimatedTotalR$: number;
}

export interface StandardPurchaseOrder {
  id: string;
  orderNumber: string;
  date: string;
  deliveryDate: string;
  supplier: string;          // Frigorífico
  buyer: string;             // Comprador (Patrick Pessoa - GRUPO GAPP)
  arrobaPrice: number;       // Preço @ (ex: R$ 390,00)
  pricePerKg: number;        // Preço R$/kg (ex: R$ 26,00)
  totalBois: number;
  totalPieces: number;
  totalWeightKg: number;
  totalCostR$: number;
  items: StandardPurchaseOrderItem[];
  status: 'RASCUNHO' | 'ENVIADO' | 'CONFIRMADO';
  notes?: string;
}

export interface StockLaunchRecord {
  id: string;
  date: string;                 // Data formatada (ex: 03/10/2026 14:30)
  timestamp: number;            // Timestamp numérico
  storeId: string;              // ID da loja
  storeName: string;            // Nome da loja
  operatorName: string;         // Nome do usuário/encarregado que lançou
  totalPieces: number;          // Total de peças contadas
  totalKg: number;              // Total de kg calculados
  boisEquivalente: number;      // Bois calculados
  sugestaoPedido: number;       // Sugestão resultante
  rowData: SheetRowData;        // Snapshot dos cortes e dados salvos na planilha
  recebeuBoiHoje?: boolean;     // Se a loja informou que recebeu boi hoje
  notes?: string;
}

export interface SheetSnapshotRecord {
  id: string;
  name: string;                 // Título / Identificador da gravação
  date: string;                 // Data e hora legível (ex: "03/10/2026 13:45:10")
  timestamp: number;            // Timestamp numérico para ordenação e filtro
  author: string;               // Autor / Operador (ex: "Patrick Pessoa (Direção)", "Carlos Silva (Loja 01)")
  source: 'MANUAL_SHEET' | 'PORTAL_MOBILE' | 'INVENTORY_TAB' | 'AUTO_BACKUP' | 'PURCHASE_ORDER';
  notes?: string;               // Observações / Motivo da gravação
  totalStores: number;          // Quantidade de lojas salvas (16 lojas)
  totalPieces: number;          // Total de peças (pedidos + estoque)
  totalKg: number;              // Peso total estimado em Kg
  totalBois: number;            // Total de bois equivalentes calculados
  totalPurchaseR$: number;      // Custo financeiro estimado da compra
  rows: SheetRowData[];         // Snapshot completo das 16 linhas com todos os cortes e câmaras
}

export interface PortalLockConfig {
  mode: 'LIBERADO' | 'HORARIO_PROGRAMADO' | 'BLOQUEADO';
  startTime: string;            // Ex: "07:00"
  endTime: string;              // Ex: "12:00"
  customMessage?: string;       // Mensagem personalizada exibida aos encarregados
  updatedBy?: string;           // Quem configurou (ex: "Patrick Pessoa - Gestor")
  updatedAt?: number;           // Timestamp da última alteração
}

// ==========================================
// USUÁRIOS E PERMISSÕES DO MÓDULO DE GESTÃO
// ==========================================
export type UserRole = 
  | 'DESENVOLVEDOR' 
  | 'DIRETOR' 
  | 'COMPRADOR' 
  | 'OPERACIONAL' 
  | 'VISUALIZADOR';

export interface SystemUser {
  id: string;
  name: string;             // Nome completo (ex: "Patrick Pessoa")
  username: string;         // Login de acesso (ex: "desenvolvedor")
  password: string;         // Senha de acesso (ex: "190996")
  role: UserRole;           // Cargo/Perfil no sistema
  roleTitle?: string;       // Título exibido (ex: "Desenvolvedor do Software")
  email?: string;
  avatar?: string;
  active: boolean;          // Ativo / Inativo
  allowedModules: string[]; // IDs dos módulos permitidos: 'dashboard', 'sheet', 'yield', 'results', 'inventory', 'purchases', 'waste', 'parameters', 'users'
  createdAt: number;
  lastLoginAt?: number;
}

// ==========================================
// MÓDULO DE BACKUP ONLINE & AGENDAMENTOS
// ==========================================
export type BackupTriggerType = 'MANUAL' | 'AUTOMATICO_AGENDADO';
export type BackupStatus = 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
export type BackupPeriodicity = 'DIARIO' | 'INTERVALO_HORAS' | 'SEMANAL';

export interface BackupDataPayload {
  sheetRows: SheetRowData[];
  sheetSnapshots: SheetSnapshotRecord[];
  stockLaunches: StockLaunchRecord[];
  stores: Store[];
  suppliers: Supplier[];
  products: Product[];
  yieldParams: any;
  users?: SystemUser[];
  batches?: PurchaseBatch[];
  wasteRecords?: WasteRecord[];
}

export interface CloudBackupItem {
  id: string;                    // e.g. "BKP-20261004-201833"
  title: string;
  timestamp: number;
  dateFormatted: string;
  triggerType: BackupTriggerType;
  status: BackupStatus;
  author: string;
  recordsCount: number;
  sizeBytes: number;
  checksum: string;
  storageTarget: 'FIRESTORE_NUVEM' | 'LOCAL_CACHE';
  payload?: BackupDataPayload;
  notes?: string;
}

export interface BackupScheduleConfig {
  enabled: boolean;              // Ativo / Inativo
  periodicity: BackupPeriodicity;// 'DIARIO' | 'INTERVALO_HORAS' | 'SEMANAL'
  scheduledTime: string;         // 'HH:mm' (ex: "23:00")
  intervalHours: number;         // 1, 2, 4, 6, 12, 24 horas
  selectedDaysOfWeek: number[];  // 0 = Domingo, 1 = Segunda, etc.
  retentionDays: number;         // 7, 15, 30, 90, 0 = ilimitado
  autoNotify: boolean;           // Exibir notificação / toast na tela
  lastBackupTimestamp?: number;
  lastBackupStatus?: BackupStatus;
  nextScheduledTimestamp?: number;
}

