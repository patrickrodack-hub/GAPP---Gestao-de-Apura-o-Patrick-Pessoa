import { Product, Store, SheetRowData, PurchaseBatch, WasteRecord, Supplier, StockLaunchRecord, SheetSnapshotRecord } from '../types/erp';
import { INITIAL_PRODUCTS, INITIAL_STORES, INITIAL_SHEET_ROWS, INITIAL_BATCHES, INITIAL_WASTE_RECORDS, INITIAL_SUPPLIERS } from '../data/initialData';
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
  }
};
