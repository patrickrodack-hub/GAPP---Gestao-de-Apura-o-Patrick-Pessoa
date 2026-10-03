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
import { SheetRowData, SheetSnapshotRecord, StockLaunchRecord, Store, Supplier, Product } from '../types/erp';

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
      await setDoc(doc(db, 'sheet_rows', safeStoreId), {
        ...row,
        storeId: safeStoreId,
        updatedAt: Date.now()
      }, { merge: true });
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
        batch.set(docRef, {
          ...row,
          storeId: safeStoreId,
          updatedAt: Date.now()
        }, { merge: true });
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
      await setDoc(doc(db, 'sheet_snapshots', safeId), {
        ...snapshot,
        id: safeId
      });
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
      await setDoc(doc(db, 'stock_launches', safeId), {
        ...record,
        id: safeId
      });
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
        batch.set(doc(db, 'stores', safeId), { ...s, id: safeId });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Erro ao salvar stores no Firestore:', e);
    }
  },

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

  async saveSuppliers(suppliers: Supplier[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const s of suppliers) {
        const safeId = String(s.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
        batch.set(doc(db, 'suppliers', safeId), { ...s, id: safeId });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Erro ao salvar suppliers no Firestore:', e);
    }
  }
};
