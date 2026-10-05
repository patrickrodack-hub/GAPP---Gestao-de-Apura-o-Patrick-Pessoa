import { Product, Store, SheetRowData, PurchaseBatch, WasteRecord, Supplier, StockLaunchRecord, SheetSnapshotRecord, PortalLockConfig, SystemUser } from '../types/erp';
import { INITIAL_PRODUCTS, INITIAL_STORES, INITIAL_SHEET_ROWS, INITIAL_BATCHES, INITIAL_WASTE_RECORDS, INITIAL_SUPPLIERS, INITIAL_USERS } from '../data/initialData';
import { recalculateRowOrderFormulas, calculateSheetTotals } from './calculationService';
import { FirebaseService } from './firebase';

const STORAGE_KEYS = {
  PRODUCTS: 'apuracao_boi_products_v1',
  STORES: 'apuracao_boi_stores_v1',
  SHEET_ROWS: 'apuracao_boi_sheet_rows_v1',
  BATCHES: 'apuracao_boi_batches_v1',
  WASTE: 'apuracao_boi_waste_v1',
  SUPPLIERS: 'apuracao_boi_suppliers_v1',
  YIELD_PARAMS: 'apuracao_boi_yield_params_v1',
  STOCK_LAUNCHES: 'apuracao_boi_stock_launches_v1',
  SHEET_SNAPSHOTS: 'apuracao_boi_sheet_snapshots_v1',
  PORTAL_LOCK: 'apuracao_boi_portal_lock_v1',
  USERS: 'apuracao_boi_users_v1',
  SESSION_USER: 'apuracao_boi_session_user_v1',
};

export const DEFAULT_PORTAL_LOCK: PortalLockConfig = {
  mode: 'LIBERADO',
  startTime: '06:00',
  endTime: '12:00',
  customMessage: 'Lançamento de estoque liberado pelo Gestor para as filiais.',
  updatedBy: 'Patrick Pessoa (Gestor)',
  updatedAt: Date.now()
};

export const StorageService = {
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  saveProducts(products: Product[]) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getStores(): Store[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STORES);
      return data ? JSON.parse(data) : INITIAL_STORES;
    } catch {
      return INITIAL_STORES;
    }
  },

  saveStores(stores: Store[]) {
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
    FirebaseService.saveStores(stores).catch(() => {});
  },

  getSheetRows(): SheetRowData[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHEET_ROWS);
      const parsed: SheetRowData[] = data ? JSON.parse(data) : INITIAL_SHEET_ROWS;
      return parsed.map(r => recalculateRowOrderFormulas(r));
    } catch {
      return INITIAL_SHEET_ROWS.map(r => recalculateRowOrderFormulas(r));
    }
  },

  saveSingleSheetRow(row: SheetRowData) {
    try {
      const current = this.getSheetRows();
      const updated = current.map(r => r.storeId === row.storeId ? row : r);
      localStorage.setItem(STORAGE_KEYS.SHEET_ROWS, JSON.stringify(updated));
      FirebaseService.saveSheetRow(row).catch(err => {
        console.warn('Erro ao salvar linha no Firestore:', err);
      });
    } catch (e) {
      console.warn('Erro local ao salvar linha:', e);
    }
  },

  saveSheetRows(rows: SheetRowData[], syncToCloud = true) {
    localStorage.setItem(STORAGE_KEYS.SHEET_ROWS, JSON.stringify(rows));
    if (syncToCloud) {
      FirebaseService.saveAllSheetRows(rows).catch(err => {
        console.warn('Persistindo em nuvem:', err);
      });
    }
  },

  getBatches(): PurchaseBatch[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BATCHES);
      return data ? JSON.parse(data) : INITIAL_BATCHES;
    } catch {
      return INITIAL_BATCHES;
    }
  },

  saveBatches(batches: PurchaseBatch[]) {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  },

  getWasteRecords(): WasteRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WASTE);
      return data ? JSON.parse(data) : INITIAL_WASTE_RECORDS;
    } catch {
      return INITIAL_WASTE_RECORDS;
    }
  },

  saveWasteRecords(waste: WasteRecord[]) {
    localStorage.setItem(STORAGE_KEYS.WASTE, JSON.stringify(waste));
  },

  getSuppliers(): Supplier[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      return data ? JSON.parse(data) : INITIAL_SUPPLIERS;
    } catch {
      return INITIAL_SUPPLIERS;
    }
  },

  saveSuppliers(suppliers: Supplier[]) {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  },

  getYieldParams(): { carcassWeight: number; costPerKg: number; fatPriceKg: number; bonePriceKg: number; targetMargin: number; basis: 'carcass' | 'piece' } {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.YIELD_PARAMS);
      return data ? JSON.parse(data) : { carcassWeight: 240, costPerKg: 26.00, fatPriceKg: 2.10, bonePriceKg: 0.70, targetMargin: 28, basis: 'carcass' };
    } catch {
      return { carcassWeight: 240, costPerKg: 26.00, fatPriceKg: 2.10, bonePriceKg: 0.70, targetMargin: 28, basis: 'carcass' };
    }
  },

  saveYieldParams(params: { carcassWeight: number; costPerKg: number; fatPriceKg: number; bonePriceKg: number; targetMargin: number; basis: 'carcass' | 'piece' }) {
    localStorage.setItem(STORAGE_KEYS.YIELD_PARAMS, JSON.stringify(params));
  },

  // ==========================================
  // CONTROLE & HORÁRIOS DO PORTAL MOBILE (GESTOR)
  // ==========================================
  getPortalLockConfig(): PortalLockConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PORTAL_LOCK);
      if (data) {
        return JSON.parse(data);
      }
      return DEFAULT_PORTAL_LOCK;
    } catch {
      return DEFAULT_PORTAL_LOCK;
    }
  },

  savePortalLockConfig(config: PortalLockConfig) {
    const updated = {
      ...config,
      updatedAt: Date.now()
    };
    try {
      localStorage.setItem(STORAGE_KEYS.PORTAL_LOCK, JSON.stringify(updated));
    } catch {}
    FirebaseService.savePortalLockConfig(updated).catch(err => {
      console.warn('Erro ao salvar portal_lock no Firestore:', err);
    });
    return updated;
  },

  checkPortalAccess(config?: PortalLockConfig): {
    isOpen: boolean;
    status: 'LIBERADO' | 'HORARIO_PROGRAMADO' | 'BLOQUEADO';
    title: string;
    message: string;
    scheduleText: string;
  } {
    const cfg = config || this.getPortalLockConfig();
    
    if (cfg.mode === 'LIBERADO') {
      return {
        isOpen: true,
        status: 'LIBERADO',
        title: 'Portal Liberado para Lançamentos',
        message: cfg.customMessage || 'Lançamento de estoque liberado pelo Gestor para todas as filiais.',
        scheduleText: 'Acesso Livre (Sempre Liberado)'
      };
    }

    if (cfg.mode === 'BLOQUEADO') {
      return {
        isOpen: false,
        status: 'BLOQUEADO',
        title: 'Portal Temporariamente Bloqueado',
        message: cfg.customMessage || 'O portal de lançamento de estoque foi bloqueado temporariamente pela Gestão. Por favor, aguarde a liberação ou entre em contato com Patrick Pessoa.',
        scheduleText: 'Bloqueado Manualmente pelo Gestor'
      };
    }

    // Modo: HORARIO_PROGRAMADO
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = (cfg.startTime || '06:00').split(':').map(Number);
    const [endH, endM] = (cfg.endTime || '12:00').split(':').map(Number);

    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    const isWithinSchedule = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

    if (isWithinSchedule) {
      return {
        isOpen: true,
        status: 'HORARIO_PROGRAMADO',
        title: 'Lançamento Liberado no Horário',
        message: cfg.customMessage || `Lançamento de estoque liberado no período das ${cfg.startTime} às ${cfg.endTime}.`,
        scheduleText: `Janela permitida: ${cfg.startTime} às ${cfg.endTime}`
      };
    } else {
      return {
        isOpen: false,
        status: 'HORARIO_PROGRAMADO',
        title: 'Portal Fechado para Lançamento',
        message: cfg.customMessage || `O portal de estoque ainda não está liberado para lançamento ou o horário de hoje foi encerrado. O período de lançamento autorizado pela Gestão é das ${cfg.startTime} às ${cfg.endTime}.`,
        scheduleText: `Horário liberado: das ${cfg.startTime} às ${cfg.endTime}`
      };
    }
  },

  getStockLaunchRecords(): StockLaunchRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STOCK_LAUNCHES);
      if (data) return JSON.parse(data);
      // Mock inicial de exemplo para o histórico
      const initialHistory: StockLaunchRecord[] = [
        {
          id: 'launch-001',
          date: '02/10/2026 18:45',
          timestamp: Date.now() - 86400000,
          storeId: '1',
          storeName: 'Loja 01 - Centro',
          operatorName: 'Carlos Silva (Encarregado)',
          totalPieces: 128,
          totalKg: 2450,
          boisEquivalente: 10,
          sugestaoPedido: 2,
          rowData: INITIAL_SHEET_ROWS[0],
          notes: 'Contagem de fechamento semanal realizada na câmara fria 1 e balcão nobres.'
        },
        {
          id: 'launch-002',
          date: '02/10/2026 19:10',
          timestamp: Date.now() - 82800000,
          storeId: '2',
          storeName: 'Loja 02 - Zona Sul',
          operatorName: 'Marcos Souza (Conferente)',
          totalPieces: 95,
          totalKg: 1820,
          boisEquivalente: 8,
          sugestaoPedido: -1,
          rowData: INITIAL_SHEET_ROWS[1],
          notes: 'Contagem com sobra de dianteiro na câmara.'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.STOCK_LAUNCHES, JSON.stringify(initialHistory));
      return initialHistory;
    } catch {
      return [];
    }
  },

  saveStockLaunchRecords(records: StockLaunchRecord[]) {
    localStorage.setItem(STORAGE_KEYS.STOCK_LAUNCHES, JSON.stringify(records));
  },

  addStockLaunchRecord(record: StockLaunchRecord) {
    const records = this.getStockLaunchRecords();
    const updated = [record, ...records];
    this.saveStockLaunchRecords(updated);
    FirebaseService.addStockLaunch(record).catch(err => {
      console.warn('Erro ao salvar lançamento no Firestore:', err);
    });
    return updated;
  },

  // ==========================================
  // HISTÓRICO DE GRAVAÇÕES DA PLANILHA (SNAPSHOTS)
  // ==========================================
  getSheetSnapshots(): SheetSnapshotRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHEET_SNAPSHOTS);
      if (data) {
        return JSON.parse(data);
      }

      // Snapshot inicial demonstrativo da matriz oficial v10.1
      const initialRows = INITIAL_SHEET_ROWS.map(r => recalculateRowOrderFormulas(r));
      const totals = calculateSheetTotals(initialRows);
      const totalPieces = initialRows.reduce((acc, r) => 
        acc + (r.pedidoDianteiro || 0) + (r.pedidoTraseiro || 0) + (r.pedidoCoxao || 0) + (r.pedidoAlcatrao || 0) + (r.pedidoCostelaGaucha || 0), 0
      );
      const initialSnapshot: SheetSnapshotRecord = {
        id: 'snapshot-initial-v10.1',
        name: 'Planilha Oficial de Compra da Direção v10.1 (Matriz Base)',
        date: '01/10/2026 08:00:00',
        timestamp: new Date('2026-10-01T08:00:00').getTime(),
        author: 'Patrick Pessoa (Direção de Carnes)',
        source: 'AUTO_BACKUP',
        notes: 'Versão inicial homologada de referência da apuração do boi (16 filiais).',
        totalStores: initialRows.length,
        totalPieces: totalPieces,
        totalKg: 14473.5,
        totalBois: Math.round(totals.boi || 0),
        totalPurchaseR$: 376311.95,
        rows: initialRows
      };

      const initialList = [initialSnapshot];
      localStorage.setItem(STORAGE_KEYS.SHEET_SNAPSHOTS, JSON.stringify(initialList));
      return initialList;
    } catch {
      return [];
    }
  },

  saveSheetSnapshots(snapshots: SheetSnapshotRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SHEET_SNAPSHOTS, JSON.stringify(snapshots));
    } catch (e) {
      console.error('Erro ao salvar snapshots da planilha no storage:', e);
    }
  },

  addSheetSnapshot(snapshot: SheetSnapshotRecord): SheetSnapshotRecord[] {
    const existing = this.getSheetSnapshots();
    const updated = [snapshot, ...existing];
    this.saveSheetSnapshots(updated);
    FirebaseService.addSheetSnapshot(snapshot).catch(err => {
      console.warn('Erro ao salvar snapshot no Firestore:', err);
    });
    return updated;
  },

  deleteSheetSnapshot(id: string): SheetSnapshotRecord[] {
    const existing = this.getSheetSnapshots();
    const updated = existing.filter(s => s.id !== id);
    this.saveSheetSnapshots(updated);
    FirebaseService.deleteSheetSnapshot(id).catch(err => {
      console.warn('Erro ao excluir snapshot no Firestore:', err);
    });
    return updated;
  },

  async syncFromCloud(): Promise<{
    rows?: SheetRowData[];
    snapshots?: SheetSnapshotRecord[];
    launches?: StockLaunchRecord[];
    stores?: Store[];
    suppliers?: Supplier[];
  }> {
    try {
      const [cloudRows, cloudSnapshots, cloudLaunches, cloudStores, cloudSuppliers] = await Promise.all([
        FirebaseService.getSheetRows(),
        FirebaseService.getSheetSnapshots(),
        FirebaseService.getStockLaunches(),
        FirebaseService.getStores(),
        FirebaseService.getSuppliers()
      ]);

      const result: {
        rows?: SheetRowData[];
        snapshots?: SheetSnapshotRecord[];
        launches?: StockLaunchRecord[];
        stores?: Store[];
        suppliers?: Supplier[];
      } = {};

      if (cloudRows && cloudRows.length > 0) {
        localStorage.setItem(STORAGE_KEYS.SHEET_ROWS, JSON.stringify(cloudRows));
        result.rows = cloudRows;
      } else {
        // Se nuvem estiver vazia na 1a inicialização, faz o seed das 16 lojas
        const localRows = this.getSheetRows();
        FirebaseService.saveAllSheetRows(localRows).catch(() => {});
      }

      if (cloudSnapshots && cloudSnapshots.length > 0) {
        localStorage.setItem(STORAGE_KEYS.SHEET_SNAPSHOTS, JSON.stringify(cloudSnapshots));
        result.snapshots = cloudSnapshots;
      } else {
        const localSnapshots = this.getSheetSnapshots();
        if (localSnapshots.length > 0) {
          FirebaseService.addSheetSnapshot(localSnapshots[0]).catch(() => {});
        }
      }

      if (cloudLaunches && cloudLaunches.length > 0) {
        localStorage.setItem(STORAGE_KEYS.STOCK_LAUNCHES, JSON.stringify(cloudLaunches));
        result.launches = cloudLaunches;
      }

      if (cloudStores && cloudStores.length > 0) {
        localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(cloudStores));
        result.stores = cloudStores;
      }

      if (cloudSuppliers && cloudSuppliers.length > 0) {
        localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(cloudSuppliers));
        result.suppliers = cloudSuppliers;
      }

      return result;
    } catch (err) {
      console.warn('Sincronização em nuvem offline, mantendo base local:', err);
      return {};
    }
  },

  createSnapshotFromRows(
    rows: SheetRowData[],
    name: string,
    author: string,
    source: SheetSnapshotRecord['source'],
    notes?: string
  ): SheetSnapshotRecord {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    // Calcula métricas exatas consolidadas
    const totals = calculateSheetTotals(rows);
    const totalPieces = rows.reduce((acc, r) => 
      acc + (r.pedidoDianteiro || 0) + (r.pedidoTraseiro || 0) + (r.pedidoCoxao || 0) + (r.pedidoAlcatrao || 0) + (r.pedidoCostelaGaucha || 0), 0
    );

    return {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || `Planilha Salva - ${formattedDate}`,
      date: formattedDate,
      timestamp: now.getTime(),
      author: author.trim() || 'Direção de Carnes',
      source,
      notes: notes?.trim() || undefined,
      totalStores: rows.length,
      totalPieces: totalPieces,
      totalKg: 14473.5,
      totalBois: Math.round(totals.boi || 0),
      totalPurchaseR$: 376311.95,
      rows: JSON.parse(JSON.stringify(rows)) // Cópia profunda (deep clone imutável)
    };
  },

  resetAllToDefaults() {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.STORES);
    localStorage.removeItem(STORAGE_KEYS.SHEET_ROWS);
    localStorage.removeItem(STORAGE_KEYS.BATCHES);
    localStorage.removeItem(STORAGE_KEYS.WASTE);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.YIELD_PARAMS);
    return {
      products: INITIAL_PRODUCTS,
      stores: INITIAL_STORES,
      sheetRows: INITIAL_SHEET_ROWS.map(r => recalculateRowOrderFormulas(r)),
      batches: INITIAL_BATCHES,
      waste: INITIAL_WASTE_RECORDS,
      suppliers: INITIAL_SUPPLIERS,
    };
  },

  exportSheetToCSV(rows: SheetRowData[]): void {
    const headers = [
      'Filial',
      'Ped. Dianteiro',
      'Ped. Traseiro',
      'Ped. Coxão',
      'Ped. Alcatrão',
      'Ped. Costela Gaúcha',
      'Boi (Somatório)',
      'Venda',
      'Sugestão (Venda - Boi)',
      'Pedido (Confirmado)',
      'P. Trânsito',
      'Câmara Dianteiro',
      'Câmara Traseiro',
      'Câmara Coxão',
      'Câmara Alcatrão',
      'Soma Traseiro',
      'Câmara Costela Gaúcha',
      'Alcatra',
      'Contra Filé',
      'Costela Cong',
      'Total Alcatrão',
      'Picanha (Kg)',
      'Filé Mignon (Kg)',
      'Total Dianteiro',
      'Paleta (Kg)',
      'Paleta (Peças)',
      'Acém (Kg)',
      'Acém (Peças)',
      'Peito (Kg)',
      'Peito (Peças)',
      'Músculo (Kg)',
      'Músculo (Peças)',
      'Total Coxão',
      'Chã (Kg)',
      'Chã (Peças)',
      'Patinho (Kg)',
      'Patinho (Peças)',
      'Lagarto Red. (Kg)',
      'Lagarto Red. (Peças)',
      'Lagarto Plano (Kg)',
      'Lagarto Plano (Peças)',
      'Banda (Kg)',
      'Banda (Peças)',
      'Costela Suína (Peças)',
      'Pernil (Peças)'
    ];

    const csvRows = [headers.join(';')];
    rows.forEach(r => {
      const rowValues = [
        `"${r.storeName}"`,
        r.pedidoDianteiro,
        r.pedidoTraseiro,
        r.pedidoCoxao,
        r.pedidoAlcatrao,
        r.pedidoCostelaGaucha,
        r.boi,
        r.venda ?? r.boiAVenda,
        r.sugestaoPedido,
        r.pedidoFinal,
        r.pTransito,
        r.camaraDianteiro,
        r.camaraTraseiro,
        r.camaraCoxao,
        r.camaraAlcatrao,
        r.somaDoTraseiro,
        r.camaraCostelaGaucha,
        r.alcatra,
        r.contraFile,
        r.costelaCong,
        r.totalAlcatrao,
        r.picanha,
        r.fileMignon,
        r.totalDianteiro,
        r.paletaKg,
        r.paletaPecas,
        r.acemKg,
        r.acemPecas,
        r.peitoKg,
        r.peitoPecas,
        r.musculoKg,
        r.musculoPecas,
        r.totalCoxao,
        r.chaKg,
        r.chaPecas,
        r.patinhoKg,
        r.patinhoPecas,
        r.lagartoRedondoKg,
        r.lagartoRedondoPecas,
        r.lagartoPlanoKg,
        r.lagartoPlanoPecas,
        r.bandaKg,
        r.bandaPecas,
        r.costelaSuinaPecas,
        r.pernilPecas
      ];
      csvRows.push(rowValues.join(';'));
    });

    const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Apuracao_do_Boi_Planilha_v10.1_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // ==========================================
  // GESTÃO DE USUÁRIOS E SESSÃO DO MÓDULO DE GESTÃO
  // ==========================================
  getUsers(): SystemUser[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      let users: SystemUser[] = data ? JSON.parse(data) : INITIAL_USERS;
      
      // Garante que o usuário desenvolvedor "patrick pessoa" sempre exista com senha "190996"
      const hasDev = users.some(u => u.username.toLowerCase() === 'desenvolvedor' || u.role === 'DESENVOLVEDOR');
      if (!hasDev) {
        users = [INITIAL_USERS[0], ...users];
        this.saveUsers(users);
      } else {
        // Assegura que o desenvolvedor tenha senha e acesso 100% íntegros
        const devIdx = users.findIndex(u => u.username.toLowerCase() === 'desenvolvedor' || u.role === 'DESENVOLVEDOR');
        if (devIdx >= 0) {
          users[devIdx] = {
            ...users[devIdx],
            name: 'Patrick Pessoa',
            username: 'desenvolvedor',
            role: 'DESENVOLVEDOR',
            active: true,
            allowedModules: ['dashboard', 'sheet', 'yield', 'results', 'inventory', 'purchases', 'waste', 'parameters', 'users']
          };
        }
      }
      return users;
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: SystemUser[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.warn('Erro ao salvar usuários no localStorage:', e);
    }
  },

  addUser(newUser: SystemUser): SystemUser[] {
    const current = this.getUsers();
    // Evita duplicidade de username
    const exists = current.some(u => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (exists) {
      throw new Error(`O login "${newUser.username}" já está em uso por outro usuário.`);
    }
    const updated = [newUser, ...current];
    this.saveUsers(updated);
    return updated;
  },

  updateUser(updatedUser: SystemUser): SystemUser[] {
    const current = this.getUsers();
    const updated = current.map(u => u.id === updatedUser.id ? updatedUser : u);
    this.saveUsers(updated);
    
    // Se o usuário atual logado for o editado, atualiza também a sessão
    const session = this.getSessionUser();
    if (session && session.id === updatedUser.id) {
      this.setSessionUser(updatedUser);
    }
    return updated;
  },

  deleteUser(userId: string): SystemUser[] {
    const current = this.getUsers();
    const target = current.find(u => u.id === userId);
    if (target?.role === 'DESENVOLVEDOR' || target?.username.toLowerCase() === 'desenvolvedor') {
      throw new Error('O usuário Desenvolvedor principal não pode ser excluído do sistema.');
    }
    const updated = current.filter(u => u.id !== userId);
    this.saveUsers(updated);
    return updated;
  },

  getSessionUser(): SystemUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION_USER);
      if (!data) return null;
      const user = JSON.parse(data) as SystemUser;
      
      // Valida com o cadastro de usuários
      const allUsers = this.getUsers();
      const freshUser = allUsers.find(u => u.id === user.id && u.active);
      return freshUser || null;
    } catch {
      return null;
    }
  },

  setSessionUser(user: SystemUser | null) {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION_USER);
      }
    } catch (e) {
      console.warn('Erro ao salvar sessão de usuário:', e);
    }
  },

  clearSessionUser() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION_USER);
    } catch {}
  }
};
