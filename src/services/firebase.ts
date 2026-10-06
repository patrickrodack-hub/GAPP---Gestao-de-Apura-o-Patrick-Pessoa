import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  getDoc,
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  onSnapshot,
  writeBatch,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SheetRowData, SheetSnapshotRecord, StockLaunchRecord, Store, Supplier, Product, PortalLockConfig, SystemUser, PurchaseBatch, WasteRecord, StandardPurchaseOrder } from '../types/erp';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore está offline no momento ou sem conexão com internet.");
      return false;
    }
    // Any other response means we connected to the server
    return true;
  }
}

// Helper to sanitize payload and remove undefined fields before sending to Firestore
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data, (_, value) => (value === undefined ? null : value)));
}

// Automatically test connection on boot
testConnection().catch(() => {});

// ========================================================
// FIRESTORE SERVICES FOR APURAÇÃO DO BOI (CLOUD DATABASE)
// ========================================================

export const FirebaseService = {
  // 1. SHEET ROWS (Planilha de Compra Oficial)
  async getSheetRows(): Promise<SheetRowData[] | null> {
    const path = 'sheet_rows';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) return null;
      const rows: SheetRowData[] = [];
      snap.forEach(docSnap => {
        rows.push(docSnap.data() as SheetRowData);
      });
      // Ordena por número da filial se possível
      return rows.sort((a, b) => {
        const numA = parseInt(a.storeId.replace(/\D/g, '') || '0', 10);
        const numB = parseInt(b.storeId.replace(/\D/g, '') || '0', 10);
        return numA - numB;
      });
    } catch (error) {
      console.warn('Erro ao carregar sheet_rows do Firestore, usando fallback local:', error);
      return null;
    }
  },

  async saveSheetRow(row: SheetRowData): Promise<void> {
    const safeStoreId = String(row.storeId || '1').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `sheet_rows/${safeStoreId}`;
    try {
      const cleanData = sanitizeForFirestore({
        ...row,
        storeId: safeStoreId,
        updatedAt: Date.now()
      });
      await setDoc(doc(db, 'sheet_rows', safeStoreId), cleanData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveAllSheetRows(rows: SheetRowData[]): Promise<void> {
    const path = 'sheet_rows';
    try {
      const batch = writeBatch(db);
      for (const row of rows) {
        const safeStoreId = String(row.storeId || '1').replace(/[^a-zA-Z0-9_\-]/g, '_');
        const docRef = doc(db, 'sheet_rows', safeStoreId);
        const cleanData = sanitizeForFirestore({
          ...row,
          storeId: safeStoreId,
          updatedAt: Date.now()
        });
        batch.set(docRef, cleanData, { merge: true });
      }
      await batch.commit();
    } catch (error) {
      console.warn('Falha no batch do Firestore, salvando individualmente:', error);
      for (const r of rows) {
        await this.saveSheetRow(r).catch(() => {});
      }
    }
  },

  subscribeToSheetRows(callback: (rows: SheetRowData[]) => void): () => void {
    const path = 'sheet_rows';
    try {
      return onSnapshot(collection(db, path), (snapshot) => {
        if (!snapshot.empty) {
          const rows: SheetRowData[] = [];
          snapshot.forEach(docSnap => rows.push(docSnap.data() as SheetRowData));
          rows.sort((a, b) => {
            const numA = parseInt(a.storeId.replace(/\D/g, '') || '0', 10);
            const numB = parseInt(b.storeId.replace(/\D/g, '') || '0', 10);
            return numA - numB;
          });
          callback(rows);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });
    } catch {
      return () => {};
    }
  },

  // 2. SHEET SNAPSHOTS (Histórico de Versões Gravadas com Data e Hora)
  async getSheetSnapshots(): Promise<SheetSnapshotRecord[] | null> {
    const path = 'sheet_snapshots';
    try {
      const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(100));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const list: SheetSnapshotRecord[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as SheetSnapshotRecord);
      });
      return list;
    } catch (error) {
      console.warn('Erro ao carregar sheet_snapshots do Firestore:', error);
      return null;
    }
  },

  async addSheetSnapshot(snapshot: SheetSnapshotRecord): Promise<void> {
    const safeId = String(snapshot.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `sheet_snapshots/${safeId}`;
    try {
      const cleanData = sanitizeForFirestore({
        ...snapshot,
        id: safeId,
        notes: snapshot.notes?.trim() || ''
      });
      await setDoc(doc(db, 'sheet_snapshots', safeId), cleanData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteSheetSnapshot(snapshotId: string): Promise<void> {
    const safeId = String(snapshotId).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `sheet_snapshots/${safeId}`;
    try {
      await deleteDoc(doc(db, 'sheet_snapshots', safeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // 3. STOCK LAUNCHES (Lançamentos de Estoque & Contagem)
  async getStockLaunches(): Promise<StockLaunchRecord[] | null> {
    const path = 'stock_launches';
    try {
      const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(150));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const launches: StockLaunchRecord[] = [];
      snap.forEach(docSnap => launches.push(docSnap.data() as StockLaunchRecord));
      return launches;
    } catch (error) {
      console.warn('Erro ao carregar stock_launches do Firestore:', error);
      return null;
    }
  },

  async addStockLaunch(record: StockLaunchRecord): Promise<void> {
    const safeId = String(record.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `stock_launches/${safeId}`;
    try {
      const cleanData = sanitizeForFirestore({
        ...record,
        id: safeId,
        notes: record.notes?.trim() || ''
      });
      await setDoc(doc(db, 'stock_launches', safeId), cleanData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // 4. STORES, SUPPLIERS, PRODUCTS
  async getStores(): Promise<Store[] | null> {
    const path = 'stores';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) return null;
      const stores: Store[] = [];
      snap.forEach(d => stores.push(d.data() as Store));
      return stores;
    } catch {
      return null;
    }
  },

  async saveStores(stores: Store[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const s of stores) {
        const safeId = String(s.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
        const cleanStore = sanitizeForFirestore({ ...s, id: safeId });
        batch.set(doc(db, 'stores', safeId), cleanStore);
      }
      await batch.commit();
    } catch (e) {
      console.warn('Erro ao salvar stores no Firestore:', e);
    }
  },

  async saveStore(store: Store): Promise<void> {
    const safeId = String(store.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `stores/${safeId}`;
    try {
      const cleanData = sanitizeForFirestore({ ...store, id: safeId });
      await setDoc(doc(db, 'stores', safeId), cleanData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteStore(storeId: string): Promise<void> {
    const safeId = String(storeId).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `stores/${safeId}`;
    try {
      await deleteDoc(doc(db, 'stores', safeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // 5. SUPPLIERS (Cadastro de Frigoríficos e Fornecedores)
  async getSuppliers(): Promise<Supplier[] | null> {
    const path = 'suppliers';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) return null;
      const suppliers: Supplier[] = [];
      snap.forEach(d => suppliers.push(d.data() as Supplier));
      return suppliers;
    } catch {
      return null;
    }
  },

  async saveSupplier(supplier: Supplier): Promise<void> {
    const safeId = String(supplier.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `suppliers/${safeId}`;
    try {
      const cleanData = sanitizeForFirestore({ ...supplier, id: safeId });
      await setDoc(doc(db, 'suppliers', safeId), cleanData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveSuppliers(suppliers: Supplier[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const s of suppliers) {
        const safeId = String(s.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
        const cleanSupplier = sanitizeForFirestore({ ...s, id: safeId });
        batch.set(doc(db, 'suppliers', safeId), cleanSupplier);
      }
      await batch.commit();
    } catch (e) {
      console.warn('Erro ao salvar suppliers no Firestore:', e);
    }
  },

  async saveAllSuppliers(suppliers: Supplier[]): Promise<void> {
    return this.saveSuppliers(suppliers);
  },

  async deleteSupplier(supplierId: string): Promise<void> {
    const safeId = String(supplierId).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `suppliers/${safeId}`;
    try {
      await deleteDoc(doc(db, 'suppliers', safeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribeToSuppliers(callback: (suppliers: Supplier[]) => void): () => void {
    const path = 'suppliers';
    try {
      return onSnapshot(collection(db, path), (snap) => {
        if (!snap.empty) {
          const list: Supplier[] = [];
          snap.forEach(d => list.push(d.data() as Supplier));
          callback(list);
        }
      }, (error) => {
        console.warn('Erro ao escutar suppliers do Firestore:', error);
      });
    } catch {
      return () => {};
    }
  },

  // 6. PRODUCTS (Cortes e Cadastro de Produtos)
  async getProducts(): Promise<Product[] | null> {
    const path = 'products';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) return null;
      const products: Product[] = [];
      snap.forEach(d => products.push(d.data() as Product));
      return products;
    } catch {
      return null;
    }
  },

  async saveProduct(product: Product): Promise<void> {
    const safeId = String(product.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `products/${safeId}`;
    try {
      const cleanData = sanitizeForFirestore({ ...product, id: safeId });
      await setDoc(doc(db, 'products', safeId), cleanData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveAllProducts(products: Product[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const p of products) {
        const safeId = String(p.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
        const cleanProduct = sanitizeForFirestore({ ...p, id: safeId });
        batch.set(doc(db, 'products', safeId), cleanProduct);
      }
      await batch.commit();
    } catch (e) {
      console.warn('Erro ao salvar produtos no Firestore:', e);
    }
  },

  async deleteProduct(productId: string): Promise<void> {
    const safeId = String(productId).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `products/${safeId}`;
    try {
      await deleteDoc(doc(db, 'products', safeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // 7. PURCHASE BATCHES (Histórico de Entradas de Frigoríficos & Lotes de Compras)
  async getBatches(): Promise<PurchaseBatch[] | null> {
    const path = 'purchase_batches';
    try {
      const q = query(collection(db, path), orderBy('date', 'desc'), limit(200));
      const snap = await getDocs(q);
      if (snap.empty) {
        // Tenta sem orderBy caso haja documentos com data variada
        const rawSnap = await getDocs(collection(db, path));
        if (rawSnap.empty) return null;
        const list: PurchaseBatch[] = [];
        rawSnap.forEach(d => list.push(d.data() as PurchaseBatch));
        return list;
      }
      const batches: PurchaseBatch[] = [];
      snap.forEach(d => batches.push(d.data() as PurchaseBatch));
      return batches;
    } catch (e) {
      console.warn('Erro ao carregar purchase_batches do Firestore:', e);
      return null;
    }
  },

  async saveBatch(batch: PurchaseBatch): Promise<void> {
    const safeId = String(batch.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `purchase_batches/${safeId}`;
    try {
      const cleanData = sanitizeForFirestore({
        ...batch,
        id: safeId,
        notes: batch.notes?.trim() || '',
        deliveryDate: batch.deliveryDate || '',
        targetStoreId: batch.targetStoreId || 'TODAS',
        items: batch.items || []
      });
      await setDoc(doc(db, 'purchase_batches', safeId), cleanData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveAllBatches(batches: PurchaseBatch[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const b of batches) {
        const safeId = String(b.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
        const cleanData = sanitizeForFirestore({
          ...b,
          id: safeId,
          notes: b.notes?.trim() || '',
          deliveryDate: b.deliveryDate || '',
          targetStoreId: b.targetStoreId || 'TODAS',
          items: b.items || []
        });
        batch.set(doc(db, 'purchase_batches', safeId), cleanData, { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Falha no batch de purchase_batches, salvando individualmente:', e);
      for (const b of batches) {
        await this.saveBatch(b).catch(() => {});
      }
    }
  },

  async deleteBatch(batchId: string): Promise<void> {
    const safeId = String(batchId).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `purchase_batches/${safeId}`;
    try {
      await deleteDoc(doc(db, 'purchase_batches', safeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribeToBatches(callback: (batches: PurchaseBatch[]) => void): () => void {
    const path = 'purchase_batches';
    try {
      return onSnapshot(collection(db, path), (snap) => {
        if (!snap.empty) {
          const list: PurchaseBatch[] = [];
          snap.forEach(d => list.push(d.data() as PurchaseBatch));
          list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          callback(list);
        }
      }, (error) => {
        console.warn('Erro ao escutar purchase_batches do Firestore:', error);
      });
    } catch {
      return () => {};
    }
  },

  // 8. WASTE RECORDS (Controle de Descarte & Subprodutos - Sebo e Osso)
  async getWasteRecords(): Promise<WasteRecord[] | null> {
    const path = 'waste_records';
    try {
      const q = query(collection(db, path), orderBy('date', 'desc'), limit(200));
      const snap = await getDocs(q);
      if (snap.empty) {
        const rawSnap = await getDocs(collection(db, path));
        if (rawSnap.empty) return null;
        const list: WasteRecord[] = [];
        rawSnap.forEach(d => list.push(d.data() as WasteRecord));
        return list;
      }
      const list: WasteRecord[] = [];
      snap.forEach(d => list.push(d.data() as WasteRecord));
      return list;
    } catch (e) {
      console.warn('Erro ao carregar waste_records do Firestore:', e);
      return null;
    }
  },

  async saveWasteRecord(record: WasteRecord): Promise<void> {
    const safeId = String(record.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `waste_records/${safeId}`;
    try {
      const cleanData = sanitizeForFirestore({
        ...record,
        id: safeId,
        batchId: record.batchId || '',
        renderingPlant: record.renderingPlant || 'Graxaria Regional'
      });
      await setDoc(doc(db, 'waste_records', safeId), cleanData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveAllWasteRecords(records: WasteRecord[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const r of records) {
        const safeId = String(r.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
        const cleanData = sanitizeForFirestore({
          ...r,
          id: safeId,
          batchId: r.batchId || '',
          renderingPlant: r.renderingPlant || 'Graxaria Regional'
        });
        batch.set(doc(db, 'waste_records', safeId), cleanData, { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Falha no batch de waste_records, salvando individualmente:', e);
      for (const r of records) {
        await this.saveWasteRecord(r).catch(() => {});
      }
    }
  },

  async deleteWasteRecord(recordId: string): Promise<void> {
    const safeId = String(recordId).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `waste_records/${safeId}`;
    try {
      await deleteDoc(doc(db, 'waste_records', safeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribeToWasteRecords(callback: (records: WasteRecord[]) => void): () => void {
    const path = 'waste_records';
    try {
      return onSnapshot(collection(db, path), (snap) => {
        if (!snap.empty) {
          const list: WasteRecord[] = [];
          snap.forEach(d => list.push(d.data() as WasteRecord));
          list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          callback(list);
        }
      }, (error) => {
        console.warn('Erro ao escutar waste_records do Firestore:', error);
      });
    } catch {
      return () => {};
    }
  },

  // 9. PURCHASE ORDERS (Pedidos Oficiais de Compras Emitidos)
  async getPurchaseOrders(): Promise<StandardPurchaseOrder[] | null> {
    const path = 'purchase_orders';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) return null;
      const list: StandardPurchaseOrder[] = [];
      snap.forEach(d => list.push(d.data() as StandardPurchaseOrder));
      return list;
    } catch {
      return null;
    }
  },

  async savePurchaseOrder(order: StandardPurchaseOrder | any): Promise<void> {
    const safeId = String(order.id || `order_${order.orderNumber || Date.now()}`).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `purchase_orders/${safeId}`;
    try {
      const cleanData = sanitizeForFirestore({
        ...order,
        id: safeId,
        orderNumber: String(order.orderNumber || safeId),
        date: order.date || new Date().toISOString().slice(0, 10),
        supplier: order.supplier || order.supplierName || 'Frigorífico',
        status: order.status || 'CONFIRMADO',
        notes: order.notes || '',
        updatedAt: Date.now()
      });
      await setDoc(doc(db, 'purchase_orders', safeId), cleanData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deletePurchaseOrder(orderId: string): Promise<void> {
    const safeId = String(orderId).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `purchase_orders/${safeId}`;
    try {
      await deleteDoc(doc(db, 'purchase_orders', safeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // 5. PORTAL LOCK CONFIG (Controle de Horários & Bloqueio do Portal Mobile)
  async getPortalLockConfig(): Promise<PortalLockConfig | null> {
    const path = 'app_settings/portal_lock';
    try {
      const snap = await getDoc(doc(db, 'app_settings', 'portal_lock'));
      if (snap.exists()) {
        return snap.data() as PortalLockConfig;
      }
      return null;
    } catch (e) {
      console.warn('Erro ao carregar portal_lock do Firestore:', e);
      return null;
    }
  },

  async savePortalLockConfig(config: PortalLockConfig): Promise<void> {
    const path = 'app_settings/portal_lock';
    try {
      const cleanData = sanitizeForFirestore({
        ...config,
        customMessage: config.customMessage || '',
        updatedBy: config.updatedBy || '',
        updatedAt: Date.now()
      });
      await setDoc(doc(db, 'app_settings', 'portal_lock'), cleanData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  subscribeToPortalLockConfig(callback: (config: PortalLockConfig) => void): () => void {
    const path = 'app_settings/portal_lock';
    try {
      return onSnapshot(doc(db, 'app_settings', 'portal_lock'), (snap) => {
        if (snap.exists()) {
          callback(snap.data() as PortalLockConfig);
        }
      }, (error) => {
        console.warn('Erro ao escutar portal_lock do Firestore:', error);
      });
    } catch {
      return () => {};
    }
  },

  // 6. GESTÃO PERMANENTE DE USUÁRIOS (FIRESTORE CLOUD)
  async getUsers(): Promise<SystemUser[] | null> {
    const path = 'users';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) return null;
      const users: SystemUser[] = [];
      snap.forEach(d => {
        users.push(d.data() as SystemUser);
      });
      return users;
    } catch (e) {
      console.warn('Erro ao carregar usuários do Firestore:', e);
      return null;
    }
  },

  async saveUser(user: SystemUser): Promise<void> {
    const safeUserId = String(user.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `users/${safeUserId}`;
    try {
      const cleanData = sanitizeForFirestore({
        ...user,
        id: safeUserId,
        roleTitle: user.roleTitle || '',
        email: user.email || '',
        allowedModules: user.allowedModules || []
      });
      await setDoc(doc(db, 'users', safeUserId), cleanData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveAllUsers(users: SystemUser[]): Promise<void> {
    const path = 'users';
    try {
      const batch = writeBatch(db);
      for (const u of users) {
        const safeUserId = String(u.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
        const cleanData = sanitizeForFirestore({
          ...u,
          id: safeUserId,
          roleTitle: u.roleTitle || '',
          email: u.email || '',
          allowedModules: u.allowedModules || []
        });
        batch.set(doc(db, 'users', safeUserId), cleanData, { merge: true });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteUser(userId: string): Promise<void> {
    const safeUserId = String(userId).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `users/${safeUserId}`;
    try {
      await deleteDoc(doc(db, 'users', safeUserId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribeToUsers(callback: (users: SystemUser[]) => void): () => void {
    const path = 'users';
    try {
      return onSnapshot(collection(db, path), (snap) => {
        if (!snap.empty) {
          const list: SystemUser[] = [];
          snap.forEach(d => list.push(d.data() as SystemUser));
          callback(list);
        }
      }, (error) => {
        console.warn('Erro ao escutar coleção de usuários no Firestore:', error);
      });
    } catch {
      return () => {};
    }
  },

  // 12. YIELD PARAMS (Parâmetros Técnicos de Rendimento, Preços & Desossa)
  async getYieldParams(): Promise<{ carcassWeight: number; costPerKg: number; fatPriceKg: number; bonePriceKg: number; targetMargin: number; basis: 'carcass' | 'piece' } | null> {
    const path = 'app_settings/yield_params';
    try {
      const snap = await getDoc(doc(db, 'app_settings', 'yield_params'));
      if (!snap.exists()) return null;
      return snap.data() as any;
    } catch (error) {
      console.warn('Erro ao carregar yield_params do Firestore:', error);
      return null;
    }
  },

  async saveYieldParams(params: { carcassWeight: number; costPerKg: number; fatPriceKg: number; bonePriceKg: number; targetMargin: number; basis: 'carcass' | 'piece' }): Promise<void> {
    const path = 'app_settings/yield_params';
    try {
      const cleanData = sanitizeForFirestore({
        ...params,
        updatedAt: Date.now()
      });
      await setDoc(doc(db, 'app_settings', 'yield_params'), cleanData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
