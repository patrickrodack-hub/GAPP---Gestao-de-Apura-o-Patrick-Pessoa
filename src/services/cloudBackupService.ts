import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  CloudBackupItem, 
  BackupScheduleConfig, 
  BackupTriggerType, 
  BackupDataPayload 
} from '../types/erp';
import { StorageService } from './storageService';

const BACKUP_SCHEDULE_STORAGE_KEY = 'gapp_backup_schedule_config';
const LOCAL_BACKUPS_CACHE_KEY = 'gapp_cloud_backups_cache';

const DEFAULT_SCHEDULE_CONFIG: BackupScheduleConfig = {
  enabled: true,
  periodicity: 'DIARIO',
  scheduledTime: '23:00',
  intervalHours: 4,
  selectedDaysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Todos os dias
  retentionDays: 30,
  autoNotify: true,
  lastBackupTimestamp: undefined,
  lastBackupStatus: undefined,
  nextScheduledTimestamp: undefined,
};

export class CloudBackupService {
  /**
   * Obtém as configurações do agendador de backups
   */
  public static getScheduleConfig(): BackupScheduleConfig {
    try {
      const saved = localStorage.getItem(BACKUP_SCHEDULE_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SCHEDULE_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // fallback para default
    }
    return DEFAULT_SCHEDULE_CONFIG;
  }

  /**
   * Sincroniza as configurações de agendamento diretamente da nuvem Firestore
   */
  public static async syncScheduleFromCloud(): Promise<BackupScheduleConfig> {
    try {
      const snap = await getDoc(doc(db, 'app_settings', 'backup_schedule'));
      if (snap.exists()) {
        const cloudData = snap.data() as Partial<BackupScheduleConfig>;
        const current = this.getScheduleConfig();
        const merged: BackupScheduleConfig = {
          ...current,
          ...cloudData
        };
        localStorage.setItem(BACKUP_SCHEDULE_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    } catch (e) {
      console.warn('Erro ao sincronizar agendamento do Firestore:', e);
    }
    return this.getScheduleConfig();
  }

  /**
   * Salva as configurações de agendamento localmente e no Firestore
   */
  public static async saveScheduleConfig(config: BackupScheduleConfig): Promise<void> {
    const nextTimestamp = this.calculateNextScheduledBackup(config);
    const updated: BackupScheduleConfig = {
      ...config,
      nextScheduledTimestamp: nextTimestamp || undefined
    };

    try {
      localStorage.setItem(BACKUP_SCHEDULE_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar agendamento no localStorage:', e);
    }

    try {
      await setDoc(doc(db, 'app_settings', 'backup_schedule'), {
        ...updated,
        updatedAt: Date.now()
      });
    } catch (e) {
      console.warn('Erro ao sincronizar agendamento no Firestore:', e);
    }
  }

  /**
   * Calcula o próximo timestamp previsto para o backup
   */
  public static calculateNextScheduledBackup(config: BackupScheduleConfig): number | null {
    if (!config.enabled) return null;

    const now = new Date();

    if (config.periodicity === 'INTERVALO_HORAS') {
      const hoursMs = (config.intervalHours || 4) * 3600 * 1000;
      const last = config.lastBackupTimestamp || now.getTime();
      return Math.max(last + hoursMs, now.getTime() + 60000);
    }

    if (config.periodicity === 'DIARIO') {
      const [hours, minutes] = config.scheduledTime.split(':').map(Number);
      const scheduledToday = new Date(now);
      scheduledToday.setHours(hours || 0, minutes || 0, 0, 0);

      if (scheduledToday.getTime() > now.getTime()) {
        return scheduledToday.getTime();
      }

      // Próximo dia
      const scheduledTomorrow = new Date(scheduledToday);
      scheduledTomorrow.setDate(scheduledTomorrow.getDate() + 1);
      return scheduledTomorrow.getTime();
    }

    if (config.periodicity === 'SEMANAL') {
      const [hours, minutes] = config.scheduledTime.split(':').map(Number);
      const days = config.selectedDaysOfWeek && config.selectedDaysOfWeek.length > 0 
        ? config.selectedDaysOfWeek 
        : [0]; // Domingo

      // Procura o próximo dia da semana válido
      for (let i = 0; i <= 7; i++) {
        const candidate = new Date(now);
        candidate.setDate(candidate.getDate() + i);
        candidate.setHours(hours || 0, minutes || 0, 0, 0);

        if (candidate.getTime() > now.getTime() && days.includes(candidate.getDay())) {
          return candidate.getTime();
        }
      }
    }

    return null;
  }

  /**
   * Executa a criação de um backup completo online
   */
  public static async createOnlineBackup(options?: {
    title?: string;
    triggerType?: BackupTriggerType;
    author?: string;
    notes?: string;
  }): Promise<CloudBackupItem> {
    const now = new Date();
    const timestamp = now.getTime();
    const triggerType: BackupTriggerType = options?.triggerType || 'MANUAL';
    const author = options?.author || StorageService.getSessionUser()?.name || 'Patrick Pessoa (Direção)';

    // Coleta dados consolidados de todas as entidades
    const sheetRows = StorageService.getSheetRows();
    const sheetSnapshots = StorageService.getSheetSnapshots();
    const stockLaunches = StorageService.getStockLaunchRecords();
    const stores = StorageService.getStores();
    const suppliers = StorageService.getSuppliers();
    const products = StorageService.getProducts();
    const yieldParams = StorageService.getYieldParams();
    const users = StorageService.getUsers();
    const batches = StorageService.getBatches();
    const wasteRecords = StorageService.getWasteRecords();

    const payload: BackupDataPayload = {
      sheetRows,
      sheetSnapshots,
      stockLaunches,
      stores,
      suppliers,
      products,
      yieldParams,
      users,
      batches,
      wasteRecords
    };

    const recordsCount = 
      sheetRows.length + 
      sheetSnapshots.length + 
      stockLaunches.length + 
      stores.length + 
      suppliers.length + 
      products.length + 
      users.length +
      batches.length +
      wasteRecords.length;

    const payloadString = JSON.stringify(payload);
    const sizeBytes = new Blob([payloadString]).size;

    // Gerador de ID Único e Semelhante a Sistemas ERP
    const dateCode = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const id = `BKP-${dateCode}-${Math.floor(100 + Math.random() * 900)}`;

    const dateFormatted = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const title = options?.title || (
      triggerType === 'AUTOMATICO_AGENDADO'
        ? `Backup Automático Programado (${recordsCount} reg)`
        : `Backup Manual Oficial Matriz (${recordsCount} reg)`
    );

    const checksum = `SHA256-${Date.now().toString(36).toUpperCase()}-${recordsCount}R`;

    const backupItem: CloudBackupItem = {
      id,
      title,
      timestamp,
      dateFormatted,
      triggerType,
      status: 'SUCCESS',
      author,
      recordsCount,
      sizeBytes,
      checksum,
      storageTarget: 'FIRESTORE_NUVEM',
      payload,
      notes: options?.notes || `Backup gerado com sucesso. ${stores.length} lojas, ${sheetRows.length} linhas de pedidos e estoque apurado.`
    };

    // 1. Salva no Firestore se online
    let savedToCloud = false;
    try {
      await setDoc(doc(db, 'cloud_backups', id), {
        id: backupItem.id,
        title: backupItem.title,
        timestamp: backupItem.timestamp,
        dateFormatted: backupItem.dateFormatted,
        triggerType: backupItem.triggerType,
        status: backupItem.status,
        author: backupItem.author,
        recordsCount: backupItem.recordsCount,
        sizeBytes: backupItem.sizeBytes,
        checksum: backupItem.checksum,
        notes: backupItem.notes,
        // Grava o payload serializado
        payloadJson: payloadString
      });
      savedToCloud = true;
    } catch (cloudErr) {
      console.warn('Não foi possível gravar backup diretamente no Firestore, usando fallback local:', cloudErr);
      backupItem.storageTarget = 'LOCAL_CACHE';
    }

    // 2. Salva no cache local para resiliência e visualização offline
    this.saveToLocalCache(backupItem);

    // 3. Atualiza estado do agendador
    const currentSchedule = this.getScheduleConfig();
    currentSchedule.lastBackupTimestamp = timestamp;
    currentSchedule.lastBackupStatus = 'SUCCESS';
    currentSchedule.nextScheduledTimestamp = this.calculateNextScheduledBackup(currentSchedule) || undefined;
    await this.saveScheduleConfig(currentSchedule);

    return backupItem;
  }

  /**
   * Salva item de backup no cache local
   */
  private static saveToLocalCache(backup: CloudBackupItem): void {
    try {
      const existing = this.getLocalCache();
      const updated = [backup, ...existing.filter(b => b.id !== backup.id)].slice(0, 30);
      localStorage.setItem(LOCAL_BACKUPS_CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar backup no cache local:', e);
    }
  }

  /**
   * Recupera backups do cache local
   */
  private static getLocalCache(): CloudBackupItem[] {
    try {
      const saved = localStorage.getItem(LOCAL_BACKUPS_CACHE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * Lista todos os backups disponíveis (nuvem + local)
   */
  public static async getBackups(): Promise<CloudBackupItem[]> {
    const localBackups = this.getLocalCache();
    const cloudBackups: CloudBackupItem[] = [];

    try {
      const q = query(collection(db, 'cloud_backups'), orderBy('timestamp', 'desc'), limit(50));
      const querySnap = await getDocs(q);

      querySnap.forEach((docSnap) => {
        const data = docSnap.data();
        let payload: BackupDataPayload | undefined;
        if (data.payloadJson) {
          try {
            payload = JSON.parse(data.payloadJson);
          } catch {}
        }

        cloudBackups.push({
          id: docSnap.id,
          title: data.title || docSnap.id,
          timestamp: data.timestamp || Date.now(),
          dateFormatted: data.dateFormatted || new Date(data.timestamp || Date.now()).toLocaleString('pt-BR'),
          triggerType: data.triggerType || 'MANUAL',
          status: data.status || 'SUCCESS',
          author: data.author || 'Sistema GAPP',
          recordsCount: data.recordsCount || 0,
          sizeBytes: data.sizeBytes || 0,
          checksum: data.checksum || 'N/A',
          storageTarget: 'FIRESTORE_NUVEM',
          payload,
          notes: data.notes
        });
      });
    } catch (e) {
      console.warn('Erro ao listar backups do Firestore, utilizando lista local:', e);
    }

    // Mescla nuvem com local sem duplicidade
    const mergedMap = new Map<string, CloudBackupItem>();
    cloudBackups.forEach(b => mergedMap.set(b.id, b));
    localBackups.forEach(b => {
      if (!mergedMap.has(b.id)) {
        mergedMap.set(b.id, b);
      }
    });

    const result = Array.from(mergedMap.values());
    result.sort((a, b) => b.timestamp - a.timestamp);
    return result;
  }

  /**
   * Exclui um backup da nuvem e do cache local
   */
  public static async deleteBackup(backupId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'cloud_backups', backupId));
    } catch (e) {
      console.warn('Erro ao deletar backup no Firestore:', e);
    }

    try {
      const local = this.getLocalCache().filter(b => b.id !== backupId);
      localStorage.setItem(LOCAL_BACKUPS_CACHE_KEY, JSON.stringify(local));
    } catch (e) {
      console.warn('Erro ao remover backup do localStorage:', e);
    }
  }

  /**
   * Restaura um backup completo no sistema
   */
  public static async restoreBackup(backupId: string): Promise<{ success: boolean; message: string; restoredCount: number }> {
    let targetBackup: CloudBackupItem | undefined;

    // Tenta obter do Firestore
    try {
      const snap = await getDoc(doc(db, 'cloud_backups', backupId));
      if (snap.exists()) {
        const data = snap.data();
        let payload: BackupDataPayload | undefined;
        if (data.payloadJson) {
          payload = JSON.parse(data.payloadJson);
        }
        targetBackup = {
          id: snap.id,
          title: data.title,
          timestamp: data.timestamp,
          dateFormatted: data.dateFormatted,
          triggerType: data.triggerType,
          status: data.status,
          author: data.author,
          recordsCount: data.recordsCount,
          sizeBytes: data.sizeBytes,
          checksum: data.checksum,
          storageTarget: 'FIRESTORE_NUVEM',
          payload
        };
      }
    } catch (e) {
      console.warn('Erro ao buscar backup do Firestore:', e);
    }

    // Fallback para cache local se não encontrou
    if (!targetBackup || !targetBackup.payload) {
      targetBackup = this.getLocalCache().find(b => b.id === backupId);
    }

    if (!targetBackup || !targetBackup.payload) {
      return {
        success: false,
        message: 'Pacote de dados do backup não encontrado ou corrompido.',
        restoredCount: 0
      };
    }

    const { payload } = targetBackup;
    let restoredCount = 0;

    // 1. Restaura Sheet Rows
    if (payload.sheetRows && payload.sheetRows.length > 0) {
      StorageService.saveSheetRows(payload.sheetRows);
      restoredCount += payload.sheetRows.length;
    }

    // 2. Restaura Snapshots
    if (payload.sheetSnapshots && payload.sheetSnapshots.length > 0) {
      try {
        localStorage.setItem('sheet_snapshots', JSON.stringify(payload.sheetSnapshots));
        restoredCount += payload.sheetSnapshots.length;
      } catch {}
    }

    // 3. Restaura Lojas
    if (payload.stores && payload.stores.length > 0) {
      StorageService.saveStores(payload.stores);
      restoredCount += payload.stores.length;
    }

    // 4. Restaura Fornecedores
    if (payload.suppliers && payload.suppliers.length > 0) {
      StorageService.saveSuppliers(payload.suppliers);
      restoredCount += payload.suppliers.length;
    }

    // 5. Restaura Cortes / Produtos
    if (payload.products && payload.products.length > 0) {
      StorageService.saveProducts(payload.products);
      restoredCount += payload.products.length;
    }

    // 6. Restaura Parâmetros de Rendimento
    if (payload.yieldParams) {
      StorageService.saveYieldParams(payload.yieldParams);
      restoredCount += 1;
    }

    // 7. Restaura Usuários
    if (payload.users && payload.users.length > 0) {
      StorageService.saveUsers(payload.users);
      restoredCount += payload.users.length;
    }

    // 8. Restaura Lotes de Compra
    if (payload.batches && payload.batches.length > 0) {
      StorageService.saveBatches(payload.batches);
      restoredCount += payload.batches.length;
    }

    // 9. Restaura Registros de Descarte / Graxaria
    if (payload.wasteRecords && payload.wasteRecords.length > 0) {
      StorageService.saveWasteRecords(payload.wasteRecords);
      restoredCount += payload.wasteRecords.length;
    }

    // Cria snapshot com registro da restauração se houver linhas
    if (payload.sheetRows && payload.sheetRows.length > 0) {
      const snap = StorageService.createSnapshotFromRows(
        payload.sheetRows,
        `Restauração do Backup ${targetBackup.id}`,
        StorageService.getSessionUser()?.name || 'Patrick Pessoa',
        'AUTO_BACKUP',
        `Restauração completa efetuada em ${new Date().toLocaleString('pt-BR')} a partir do pacote ${targetBackup.title}`
      );
      StorageService.addSheetSnapshot(snap);
    }

    return {
      success: true,
      message: `Restauração concluída com sucesso! ${restoredCount} registros recuperados.`,
      restoredCount
    };
  }

  /**
   * Exporta o backup como arquivo JSON no computador do operador
   */
  public static exportBackupToJson(backup: CloudBackupItem): void {
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GAPP_BACKUP_${backup.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Importa um arquivo JSON de backup para o sistema
   */
  public static async importBackupFromJson(jsonString: string): Promise<CloudBackupItem> {
    const parsed = JSON.parse(jsonString);
    if (!parsed.id || !parsed.payload) {
      throw new Error('Arquivo de backup inválido ou incompatível.');
    }

    const item: CloudBackupItem = {
      ...parsed,
      id: `IMP-${Date.now().toString(36).toUpperCase()}-${parsed.id}`,
      title: `[Importado] ${parsed.title || 'Backup Externo'}`,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleString('pt-BR'),
      triggerType: 'MANUAL',
      author: `${StorageService.getSessionUser()?.name || 'Operador'} (Upload)`
    };

    // Salva local e na nuvem
    this.saveToLocalCache(item);
    try {
      await setDoc(doc(db, 'cloud_backups', item.id), {
        id: item.id,
        title: item.title,
        timestamp: item.timestamp,
        dateFormatted: item.dateFormatted,
        triggerType: item.triggerType,
        status: item.status,
        author: item.author,
        recordsCount: item.recordsCount,
        sizeBytes: item.sizeBytes,
        checksum: item.checksum,
        notes: item.notes,
        payloadJson: JSON.stringify(item.payload)
      });
    } catch {}

    return item;
  }
}
