import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { FirebaseService } from './services/firebase';
import { Product, Store, SheetRowData, PurchaseBatch, WasteRecord, Supplier, SheetSnapshotRecord, PortalLockConfig, SystemUser } from './types/erp';
import { Header } from './components/Header';
import { Navigation, NavigationTab } from './components/Navigation';
import { DashboardTab } from './components/tabs/DashboardTab';
import { SheetTab } from './components/tabs/SheetTab';
import { YieldTab } from './components/tabs/YieldTab';
import { ResultsTab } from './components/tabs/ResultsTab';
import { InventoryTab } from './components/tabs/InventoryTab';
import { PurchasesTab } from './components/tabs/PurchasesTab';
import { WasteTab } from './components/tabs/WasteTab';
import { ParametersTab } from './components/tabs/ParametersTab';
import { QuickCalculatorModal } from './components/modals/QuickCalculatorModal';
import { PrintReportModal } from './components/modals/PrintReportModal';
import { PurchaseOrderModal } from './components/modals/PurchaseOrderModal';
import { SupplierManagementModal } from './components/modals/SupplierManagementModal';
import { PortalControlModal } from './components/modals/PortalControlModal';
import { UserManagementModal } from './components/modals/UserManagementModal';
import { ExitSystemModal } from './components/modals/ExitSystemModal';
import { ManagementLogin } from './components/auth/ManagementLogin';
import { SystemClosedScreen } from './components/auth/SystemClosedScreen';
import { SolidconHeader } from './components/desktop/SolidconHeader';
import { SolidconStatusBar } from './components/desktop/SolidconStatusBar';
import { SolidconDesktopWallpaper } from './components/desktop/SolidconDesktopWallpaper';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { MobileStockPortal } from './components/portal/MobileStockPortal';
import { BackupManagerView } from './components/backup/BackupManagerView';
import { useBackupScheduler } from './hooks/useBackupScheduler';
import { useTheme } from './context/ThemeContext';
import { ExcelExportService } from './services/excelExportService';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { requestPortalFullscreen } from './utils/fullscreen';
import { Minus, Square, X, Beef, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function App() {
  const { theme, isSolidcon, toggleTheme } = useTheme();

  // Service Worker Update Detection & Instant Reload logic
  const [isUpdatingSW, setIsUpdatingSW] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (r) {
        // Checa por novas versões a cada 30 minutos ou quando a aba volta a ter foco
        const intervalId = setInterval(() => {
          r.update().catch(() => {});
        }, 30 * 60 * 1000);

        const handleTabFocus = () => {
          r.update().catch(() => {});
        };

        window.addEventListener('focus', handleTabFocus);
        return () => {
          clearInterval(intervalId);
          window.removeEventListener('focus', handleTabFocus);
        };
      }
    },
    onRegisterError(error) {
      console.warn('Erro ao verificar Service Worker:', error);
    },
  });

  const handleApplySWUpdate = async () => {
    setIsUpdatingSW(true);
    try {
      await updateServiceWorker(true);
    } catch {
      window.location.reload();
    }
  };

  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [stores, setStores] = useState<Store[]>(() => StorageService.getStores());
  const [sheetRows, setSheetRows] = useState<SheetRowData[]>(() => StorageService.getSheetRows());
  const [batches, setBatches] = useState<PurchaseBatch[]>(() => StorageService.getBatches());
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>(() => StorageService.getWasteRecords());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());
  const [sheetSnapshots, setSheetSnapshots] = useState<SheetSnapshotRecord[]>(() => StorageService.getSheetSnapshots());

  // Iniciar sempre no "Painel Geral" (dashboard) conforme solicitado pelo usuário
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isDesktopView, setIsDesktopView] = useState(false);
  const [isQuickCalcOpen, setIsQuickCalcOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isPurchaseOrderOpen, setIsPurchaseOrderOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPortalControlOpen, setIsPortalControlOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [portalLockConfig, setPortalLockConfig] = useState<PortalLockConfig>(() => StorageService.getPortalLockConfig());
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Agendador automático de backups em segundo plano com notificações na tela
  useBackupScheduler({
    showToast: (msg: string) => setFeedbackToast(msg),
    onBackupCompleted: () => {
      setSheetSnapshots(StorageService.getSheetSnapshots());
    }
  });

  // User Authentication & Management State (Módulo de Gestão)
  // Inicializado estritamente como null para exigir autenticação sempre que o sistema for aberto ou recarregado (sem auto-login)
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isSystemClosed, setIsSystemClosed] = useState(false);

  // Limpeza de qualquer credencial residual para impedir login automático no recarregamento da janela
  useEffect(() => {
    StorageService.clearSessionUser();
    try {
      sessionStorage.removeItem('apuracao_boi_temp_user');
    } catch {}
  }, []);

  const handleOpenUserManagement = () => {
    if (currentUser?.role !== 'DESENVOLVEDOR' && currentUser?.role !== 'DIRETOR') {
      showToast('Acesso restrito: Somente Desenvolvedor e Diretor podem gerenciar usuários.');
      return;
    }
    setIsUserManagementOpen(true);
  };

  const handleLoginSuccess = (user: SystemUser) => {
    setCurrentUser(user);
    showToast(`Bem-vindo(a), ${user.name}!`);
    // Se o usuário não tem permissão para a aba atual, redireciona para a primeira permitida
    if (user.role !== 'DESENVOLVEDOR' && !user.allowedModules?.includes(activeTab)) {
      const firstAllowed = (user.allowedModules?.[0] as NavigationTab) || 'dashboard';
      setActiveTab(firstAllowed);
    }
  };

  const handleLogout = () => {
    StorageService.clearSessionUser();
    try {
      sessionStorage.removeItem('apuracao_boi_temp_user');
    } catch {}
    setCurrentUser(null);
    showToast('Sessão encerrada com sucesso.');
  };

  const handleLogoutOnly = () => {
    setIsExitModalOpen(false);
    handleLogout();
  };

  const handleExitAndCloseBrowser = () => {
    // 1. Limpa credenciais persistentes e de sessão
    StorageService.clearSessionUser();
    try {
      sessionStorage.clear();
    } catch {}
    setCurrentUser(null);
    setIsExitModalOpen(false);

    // 2. Dispara tentativa de fechamento do navegador
    try {
      window.close();
    } catch {}

    try {
      window.open('', '_self', '');
      window.close();
    } catch {}

    try {
      if (window.opener) {
        window.opener = null;
        window.close();
      }
    } catch {}

    // 3. Caso o navegador bloqueie o fechamento direto por diretriz de segurança de abas,
    // exibe a tela de encerramento seguro com atalho e botão de fechamento
    setIsSystemClosed(true);
  };

  // Auto detect mobile device or portal mode from URL
  const [isPortalMode, setIsPortalMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('portal') === 'true' || params.get('mode') === 'portal') return true;
      if (params.get('admin') === 'true') return false;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return isMobile || window.innerWidth < 768;
    }
    return false;
  });

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  // Cloud sync & Realtime listener via Firebase Firestore
  useEffect(() => {
    let isMounted = true;
    let unsubscribeRows: (() => void) | undefined;

    // 1. Sincroniza dados persistentes do banco de dados na nuvem (Firestore)
    StorageService.syncFromCloud().then((cloudData) => {
      if (!isMounted) return;
      if (cloudData.rows && cloudData.rows.length > 0) {
        setSheetRows(prev => JSON.stringify(prev) === JSON.stringify(cloudData.rows) ? prev : cloudData.rows!);
      }
      if (cloudData.snapshots && cloudData.snapshots.length > 0) {
        setSheetSnapshots(prev => JSON.stringify(prev) === JSON.stringify(cloudData.snapshots) ? prev : cloudData.snapshots!);
      }
      if (cloudData.stores && cloudData.stores.length > 0) {
        setStores(prev => JSON.stringify(prev) === JSON.stringify(cloudData.stores) ? prev : cloudData.stores!);
      }
      if (cloudData.suppliers && cloudData.suppliers.length > 0) {
        setSuppliers(prev => JSON.stringify(prev) === JSON.stringify(cloudData.suppliers) ? prev : cloudData.suppliers!);
      }
      setIsCloudConnected(true);
    }).catch((e) => {
      console.warn('Banco Firestore inicializado em modo offline/local:', e);
    });

    // 2. Ouvinte em tempo real: qualquer lançamento ou edição na planilha reflete instantaneamente
    try {
      unsubscribeRows = FirebaseService.subscribeToSheetRows((remoteRows) => {
        if (!isMounted) return;
        if (remoteRows && remoteRows.length > 0) {
          setSheetRows(prev => {
            if (JSON.stringify(prev) === JSON.stringify(remoteRows)) {
              return prev; // Mesma referência, sem re-render em cascata
            }
            localStorage.setItem('apuracao_boi_sheet_rows_v1', JSON.stringify(remoteRows));
            return remoteRows;
          });
          setIsCloudConnected(true);
        }
      });
    } catch (e) {
      console.warn('Ouvinte de Firestore não iniciado:', e);
    }

    // 3. Ouvinte das regras e horários do portal configurados pelo Gestor
    let unsubscribeLock: (() => void) | undefined;
    try {
      unsubscribeLock = FirebaseService.subscribeToPortalLockConfig((cfg) => {
        if (!isMounted) return;
        if (cfg) {
          setPortalLockConfig(cfg);
          localStorage.setItem('apuracao_boi_portal_lock_v1', JSON.stringify(cfg));
        }
      });
    } catch (e) {
      console.warn('Ouvinte de portal_lock não iniciado:', e);
    }

    // 4. Ouvinte em tempo real da lista de usuários para sincronização entre dispositivos
    let unsubscribeUsers: (() => void) | undefined;
    try {
      unsubscribeUsers = FirebaseService.subscribeToUsers((cloudUsers) => {
        if (!isMounted) return;
        if (cloudUsers && cloudUsers.length > 0) {
          const localUsers = StorageService.getUsers();
          const map = new Map<string, SystemUser>();
          cloudUsers.forEach(u => map.set(u.id, u));
          localUsers.forEach(u => {
            if (!map.has(u.id)) map.set(u.id, u);
          });
          const merged = Array.from(map.values());
          localStorage.setItem('apuracao_boi_users_v1', JSON.stringify(merged));
        }
      });
    } catch (e) {
      console.warn('Ouvinte de usuários não iniciado:', e);
    }

    return () => {
      isMounted = false;
      if (unsubscribeRows) unsubscribeRows();
      if (unsubscribeLock) unsubscribeLock();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);

  const handleSavePortalLockConfig = (config: PortalLockConfig) => {
    StorageService.savePortalLockConfig(config);
    setPortalLockConfig(config);
    showToast('Regras de acesso e horários do Portal salvas com sucesso!');
  };

  // Sync to local storage
  useEffect(() => {
    StorageService.saveProducts(products);
  }, [products]);

  useEffect(() => {
    StorageService.saveStores(stores);
  }, [stores]);

  useEffect(() => {
    StorageService.saveBatches(batches);
  }, [batches]);

  useEffect(() => {
    StorageService.saveWasteRecords(wasteRecords);
  }, [wasteRecords]);

  useEffect(() => {
    StorageService.saveSuppliers(suppliers);
  }, [suppliers]);

  const showToast = (message: string) => {
    setFeedbackToast(message);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Supplier CRUD handlers
  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers(prev => [newSupplier, ...prev]);
    showToast(`Fornecedor ${newSupplier.name} cadastrado com sucesso!`);
  };

  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    showToast(`Fornecedor ${updatedSupplier.name} atualizado com sucesso!`);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const target = suppliers.find(s => s.id === supplierId);
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    showToast(`Fornecedor ${target ? target.name : ''} excluído com sucesso!`);
  };

  // Row update handlers - gravação garantida e síncrona no banco de dados local
  const handleUpdateRow = (updatedRow: SheetRowData) => {
    setSheetRows(prev => {
      const updated = prev.map((r) => (r.storeId === updatedRow.storeId ? updatedRow : r));
      StorageService.saveSingleSheetRow(updatedRow);
      return updated;
    });
  };

  const handleUpdateMultipleRows = (rows: SheetRowData[]) => {
    setSheetRows(rows);
    StorageService.saveSheetRows(rows);
    showToast('Planilha de compras sincronizada e gravada com sucesso!');
  };

  // Sheet Snapshots / Version History handlers
  const handleSaveSheetSnapshot = (name?: string, author?: string, notes?: string) => {
    const snapshot = StorageService.createSnapshotFromRows(
      sheetRows,
      name || '',
      author || 'Patrick Pessoa (Direção)',
      'MANUAL_SHEET',
      notes
    );
    const updated = StorageService.addSheetSnapshot(snapshot);
    setSheetSnapshots(updated);
    showToast(`Versão "${snapshot.name}" gravada com sucesso no histórico com data e hora!`);
  };

  const handleRestoreSheetSnapshot = (snapshot: SheetSnapshotRecord) => {
    setSheetRows(snapshot.rows);
    StorageService.saveSheetRows(snapshot.rows);
    showToast(`Planilha restaurada com sucesso para a versão de ${snapshot.date}!`);
  };

  const handleDeleteSheetSnapshot = (id: string) => {
    const updated = StorageService.deleteSheetSnapshot(id);
    setSheetSnapshots(updated);
    showToast('Versão removida do histórico.');
  };

  // Batch handler
  const handleAddBatch = (batch: PurchaseBatch) => {
    setBatches([batch, ...batches]);
    showToast(`Lote / Pedido ${batch.invoiceNumber} registrado com sucesso!`);
  };

  const handleUpdateBatch = (updatedBatch: PurchaseBatch) => {
    setBatches(prev => prev.map(b => b.id === updatedBatch.id ? updatedBatch : b));
    showToast(`Pedido / Lote ${updatedBatch.invoiceNumber} atualizado com sucesso!`);
  };

  const handleDeleteBatch = (batchId: string) => {
    const target = batches.find(b => b.id === batchId);
    setBatches(prev => prev.filter(b => b.id !== batchId));
    showToast(`Pedido / Lote ${target ? target.invoiceNumber : ''} excluído com sucesso!`);
  };

  // Waste handler
  const handleAddWasteRecord = (record: WasteRecord) => {
    setWasteRecords([record, ...wasteRecords]);
    showToast('Pesagem de descarte (sebo e osso) registrada com sucesso!');
  };

  // Reset to original data
  const handleReset = () => {
    if (window.confirm('Deseja restaurar todos os dados originais da Planilha de Compra da Direção v10.3? Quaisquer edições manuais serão redefinidas.')) {
      const defaults = StorageService.resetAllToDefaults();
      setProducts(defaults.products);
      setStores(defaults.stores);
      setSheetRows(defaults.sheetRows);
      setBatches(defaults.batches);
      setWasteRecords(defaults.waste);
      setSuppliers(defaults.suppliers);
      showToast('Dados oficiais da Planilha v10.3 restaurados!');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    StorageService.exportSheetToCSV(sheetRows);
    showToast('Download do arquivo CSV iniciado!');
  };

  // Export XLSX formatted
  const handleExportXLSX = async () => {
    try {
      showToast('Gerando pasta de trabalho Excel (.xlsx) estruturada com fórmulas...');
      await ExcelExportService.exportFullReportToXLSX({
        sheetRows,
        stores,
        batches,
        wasteRecords
      });
      showToast('Planilha Excel (.xlsx) baixada com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar XLSX:', err);
      showToast('Erro ao exportar para Excel.');
    }
  };

  const handleTabSelect = (tab: NavigationTab) => {
    if (currentUser && currentUser.role !== 'DESENVOLVEDOR' && !currentUser.allowedModules?.includes(tab)) {
      showToast('Acesso negado: seu perfil não tem permissão para este módulo.');
      return;
    }
    setActiveTab(tab);
    setIsDesktopView(false);
  };

  const handleOpenMobilePortal = () => {
    setIsPortalMode(true);
    requestPortalFullscreen();
  };

  // Global Keyboard Shortcuts hook listener (Alt+1 to Alt+8, Alt+X, Alt+C, Alt+P, etc.)
  useGlobalShortcuts({
    enabled: !isPortalMode,
    onNavigateTab: (tab) => {
      handleTabSelect(tab);
      const tabNames: Record<NavigationTab, string> = {
        dashboard: 'Painel Geral (Alt+1)',
        sheet: 'Planilha Direção v10.3 (Alt+2)',
        yield: 'Desossa & Rendimento (Alt+3)',
        results: 'DRE & Margens (Alt+4)',
        inventory: 'Estoque & Câmaras (Alt+5)',
        purchases: 'Compras & Lotes (Alt+6)',
        waste: 'Descarte Sebo/Osso (Alt+7)',
        parameters: 'Módulo 1: Parâmetros (Alt+8)',
        backup: 'Central de Backup Online (Alt+9)',
      };
      showToast(`Módulo: ${tabNames[tab] || tab}`);
    },
    onExportXLSX: handleExportXLSX,
    onOpenQuickCalc: () => setIsQuickCalcOpen(true),
    onPrint: () => setIsPrintModalOpen(true),
    onToggleTheme: toggleTheme,
    onToggleDesktop: isSolidcon ? () => setIsDesktopView(prev => !prev) : undefined,
    onOpenShortcutsHelp: () => setIsShortcutsOpen(true),
    onOpenPurchaseOrder: () => setIsPurchaseOrderOpen(true),
    onOpenSupplierManager: () => setIsSupplierModalOpen(true),
    onCloseModals: () => {
      setIsQuickCalcOpen(false);
      setIsPrintModalOpen(false);
      setIsShortcutsOpen(false);
      setIsPurchaseOrderOpen(false);
      setIsSupplierModalOpen(false);
      setIsExitModalOpen(false);
      setIsBackupModalOpen(false);
    },
    onExitSystem: () => setIsExitModalOpen(true),
  });

  // Global counts for header
  const totalPieces = sheetRows.reduce((acc, r) => 
    acc + r.pedidoDianteiro + r.pedidoTraseiro + r.pedidoCoxao + r.pedidoAlcatrao + r.pedidoCostelaGaucha, 0
  );
  const totalKg = 14473.5;
  const totalPurchaseR$ = 376311.95;

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'sheet': return 'Planilha de Compra da Direção v10.3 (Matriz 16 Filiais)';
      case 'dashboard': return 'Painel Executivo Geral';
      case 'yield': return 'Rendimento e Desossa do Boi';
      case 'results': return 'Apuração de Resultados DRE e Margens';
      case 'inventory': return 'Controle de Estoque e Câmaras Frias';
      case 'purchases': return 'Gestão de Compras e Lotes de Gado';
      case 'waste': return 'Controle de Descarte (Sebo e Osso)';
      case 'parameters': return 'Módulo 1: Cadastro e Parâmetros';
      case 'backup': return 'Central de Backup Online & Agendamento Automático (Nuvem Firestore)';
      default: return 'Apuração do Boi';
    }
  };

  // ==========================================
  // SERVICE WORKER UPDATE BANNER
  // ==========================================
  const renderSWUpdateBanner = () => {
    if (!needRefresh) return null;
    return (
      <aside
        aria-label="Atualização do sistema disponível"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[94%] max-w-lg shadow-2xl animate-bounce-short"
      >
        <div className="bg-slate-900/98 text-white border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl shadow-emerald-950/60 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
              <RefreshCw className={`w-5 h-5 ${isUpdatingSW ? 'animate-spin' : ''}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                  Nova Versão Disponível
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">v10.3</span>
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                Atualização do Sistema Pronta
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Uma nova versão do ERP Apuração do Boi foi carregada em segundo plano. Recarregue a página para aplicar todas as melhorias e correções imediatamente.
              </p>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleApplySWUpdate}
                  disabled={isUpdatingSW}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer disabled:opacity-75"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingSW ? 'animate-spin' : ''}`} />
                  <span>{isUpdatingSW ? 'Recarregando...' : 'Recarregar e Atualizar Agora'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNeedRefresh(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Lembrar mais tarde
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="Fechar aviso de atualização"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    );
  };

  // ==========================================
  // RENDER MOBILE STOCK PORTAL (MOBILE VIEW)
  // ==========================================
  if (isPortalMode) {
    return (
      <>
        {renderSWUpdateBanner()}
        <MobileStockPortal
          stores={stores}
          rows={sheetRows}
          onUpdateRow={handleUpdateRow}
          onSwitchToAdmin={() => setIsPortalMode(false)}
        />
      </>
    );
  }

  // ==========================================
  // ESTADO DE SISTEMA ENCERRADO (SAÍDA CONCLUÍDA)
  // ==========================================
  if (isSystemClosed) {
    return (
      <>
        {renderSWUpdateBanner()}
        <SystemClosedScreen onReopenLogin={() => setIsSystemClosed(false)} />
      </>
    );
  }

  // ==========================================
  // AUTENTICAÇÃO DO MÓDULO DE GESTÃO (LOGIN)
  // ==========================================
  if (!currentUser) {
    return (
      <>
        {renderSWUpdateBanner()}
        <ManagementLogin 
          onLoginSuccess={handleLoginSuccess}
          onExitSystem={handleExitAndCloseBrowser}
        />
      </>
    );
  }

  // ==========================================
  // RENDER SOLIDCON THEME (DESKTOP ERP LAYOUT)
  // ==========================================
  if (isSolidcon) {
    return (
      <div className="h-screen h-[100dvh] w-full overflow-hidden bg-[#3a4149] text-slate-900 flex flex-col font-sans select-none antialiased">
        {renderSWUpdateBanner()}
        {/* Toast Notification */}
        {feedbackToast && (
          <div className="fixed bottom-10 right-5 z-[12000] bg-[#0078d7] text-white px-4 py-2 rounded shadow-2xl font-bold text-xs flex items-center gap-2 border border-blue-300 animate-bounce">
            <span>✓ {feedbackToast}</span>
          </div>
        )}

        {/* 1. Desktop Blue Header + Menu Bar + Shortcut Toolbar (FIXED AT TOP WITH HIGHEST Z-INDEX) */}
        <div className="shrink-0 relative z-[100] w-full">
          <SolidconHeader
            activeTab={activeTab}
            onTabChange={handleTabSelect}
            onReset={handleReset}
            onExportCSV={handleExportCSV}
            onExportXLSX={handleExportXLSX}
            onOpenQuickCalc={() => setIsQuickCalcOpen(true)}
            onPrint={() => setIsPrintModalOpen(true)}
            isDesktopView={isDesktopView}
            onToggleDesktop={() => setIsDesktopView(!isDesktopView)}
            storeCount={stores.length}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            onOpenPurchaseOrder={() => setIsPurchaseOrderOpen(true)}
            onOpenSupplierManager={() => setIsSupplierModalOpen(true)}
            onOpenMobilePortal={handleOpenMobilePortal}
            onOpenPortalControl={() => setIsPortalControlOpen(true)}
            onOpenBackup={() => setIsBackupModalOpen(true)}
            onSaveSheet={() => handleSaveSheetSnapshot()}
            currentUser={currentUser}
            onOpenUserManagement={handleOpenUserManagement}
            onLogout={handleLogout}
            onExitSystem={() => setIsExitModalOpen(true)}
          />
        </div>

        {/* 2. Main Desktop Area (FIXED CONTAINER, FITS EXACTLY IN AVAILABLE SPACE) */}
        <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden bg-[#e0e4e8]">
          {isDesktopView ? (
            /* Wallpaper view */
            <div className="flex-1 min-h-0 overflow-y-auto w-full h-full">
              <SolidconDesktopWallpaper
                onOpenTab={handleTabSelect}
                onOpenQuickCalc={() => setIsQuickCalcOpen(true)}
              />
            </div>
          ) : (
            /* MDI Active Window Container */
            <div className="flex-1 min-h-0 flex flex-col p-1 sm:p-2.5 bg-slate-200/90 overflow-hidden">
              <div className="flex-1 min-h-0 flex flex-col bg-white border border-[#9ca3af] shadow-lg rounded-sm overflow-hidden">
                
                {/* Window Internal Title Bar (FIXED) */}
                <div 
                  className="shrink-0 h-7 px-3 flex items-center justify-between text-white text-xs font-semibold select-none"
                  style={{
                    background: 'linear-gradient(90deg, #004b87 0%, #0078d7 100%)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
                    <span className="font-bold tracking-tight text-[11px] sm:text-xs">
                      {getActiveTabTitle()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setIsDesktopView(true)}
                      className="w-5 h-5 flex items-center justify-center hover:bg-white/20 text-white rounded text-[10px]"
                      title="Minimizar Janela para o Fundo"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setIsDesktopView(true)}
                      className="w-5 h-5 flex items-center justify-center hover:bg-white/20 text-white rounded text-[10px]"
                      title="Fechar Janela"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Window Sub-navigation bar inside ERP (FIXED) */}
                <div className="shrink-0 bg-[#f1f5f9] border-b border-slate-300 px-3 py-1 flex items-center justify-between text-xs select-none">
                  <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: 'sheet', label: 'Planilha v10.3' },
                      { id: 'dashboard', label: 'Dashboard' },
                      { id: 'yield', label: 'Rendimento & Desossa' },
                      { id: 'results', label: 'DRE & Margens' },
                      { id: 'inventory', label: 'Estoque Câmaras' },
                      { id: 'purchases', label: 'Compras & Lotes' },
                      { id: 'waste', label: 'Descarte (Sebo/Osso)' },
                      { id: 'parameters', label: 'Módulo 1: Parâmetros' },
                      { id: 'backup', label: 'Backup Online' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabSelect(tab.id as NavigationTab)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                          activeTab === tab.id
                            ? 'bg-[#0078d7] text-white shadow-xs'
                            : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <span>16 Filiais</span>
                    <span>•</span>
                    <span>Compra: R$ 376.311,95</span>
                  </div>
                </div>

                {/* Window Body (Scrollable Tab Content strictly inside the window) */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-slate-50">
                  {activeTab === 'dashboard' && (
                    <DashboardTab
                      rows={sheetRows}
                      stores={stores}
                      batches={batches}
                      onNavigate={handleTabSelect}
                      onOpenQuickCalc={() => setIsQuickCalcOpen(true)}
                    />
                  )}

                  {activeTab === 'sheet' && (
                    <SheetTab
                      rows={sheetRows}
                      onUpdateRow={handleUpdateRow}
                      onUpdateMultiple={handleUpdateMultipleRows}
                      onExportXLSX={handleExportXLSX}
                      onOpenPurchaseOrder={() => setIsPurchaseOrderOpen(true)}
                      sheetSnapshots={sheetSnapshots}
                      onSaveSheetSnapshot={handleSaveSheetSnapshot}
                      onRestoreSheetSnapshot={handleRestoreSheetSnapshot}
                      onDeleteSheetSnapshot={handleDeleteSheetSnapshot}
                    />
                  )}

                  {activeTab === 'yield' && <YieldTab />}

                  {activeTab === 'results' && (
                    <ResultsTab 
                      rows={sheetRows} 
                      stores={stores} 
                      batches={batches}
                      wasteRecords={wasteRecords}
                    />
                  )}

                  {activeTab === 'inventory' && (
                    <InventoryTab
                      rows={sheetRows}
                      stores={stores}
                      onUpdateRow={handleUpdateRow}
                      onUpdateMultiple={handleUpdateMultipleRows}
                      onNavigateToSheet={() => handleTabSelect('sheet')}
                    />
                  )}

                  {activeTab === 'purchases' && (
                    <PurchasesTab
                      batches={batches}
                      suppliers={suppliers}
                      stores={stores}
                      sheetRows={sheetRows}
                      onAddBatch={handleAddBatch}
                      onUpdateBatch={handleUpdateBatch}
                      onDeleteBatch={handleDeleteBatch}
                      onOpenSupplierManager={() => setIsSupplierModalOpen(true)}
                    />
                  )}

                  {activeTab === 'waste' && (
                    <WasteTab
                      wasteRecords={wasteRecords}
                      stores={stores}
                      onAddWasteRecord={handleAddWasteRecord}
                    />
                  )}

                  {activeTab === 'parameters' && (
                    <ParametersTab
                      products={products}
                      stores={stores}
                      sheetRows={sheetRows}
                      suppliers={suppliers}
                      onUpdateProducts={setProducts}
                      onUpdateStores={setStores}
                      onOpenSupplierManager={() => setIsSupplierModalOpen(true)}
                      onOpenUserManagement={handleOpenUserManagement}
                      currentUser={currentUser}
                    />
                  )}

                  {activeTab === 'backup' && (
                    <BackupManagerView
                      showToast={showToast}
                      onRestoreCompleted={() => {
                        showToast('Backup restaurado com sucesso! Dados atualizados.');
                        setSheetRows(StorageService.getSheetRows());
                        setStores(StorageService.getStores());
                        setBatches(StorageService.getBatches());
                        setSuppliers(StorageService.getSuppliers());
                        setProducts(StorageService.getProducts());
                        setSheetSnapshots(StorageService.getSheetSnapshots());
                      }}
                    />
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        {/* 3. Bottom Status Bar (FIXED AT BOTTOM) */}
        <div className="shrink-0 z-30 w-full">
          <SolidconStatusBar storeCount={stores.length} isCloudConnected={isCloudConnected} />
        </div>

        {/* Modals */}
        <QuickCalculatorModal
          isOpen={isQuickCalcOpen}
          onClose={() => setIsQuickCalcOpen(false)}
        />

        <PrintReportModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          rows={sheetRows}
          stores={stores}
        />

        <PurchaseOrderModal
          isOpen={isPurchaseOrderOpen}
          onClose={() => setIsPurchaseOrderOpen(false)}
          rows={sheetRows}
          stores={stores}
          suppliers={suppliers}
          onOpenSupplierManager={() => setIsSupplierModalOpen(true)}
          onSaveBatch={handleAddBatch}
          onUpdateRow={handleUpdateRow}
          onUpdateMultiple={handleUpdateMultipleRows}
        />

        <SupplierManagementModal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          suppliers={suppliers}
          onAddSupplier={handleAddSupplier}
          onUpdateSupplier={handleUpdateSupplier}
          onDeleteSupplier={handleDeleteSupplier}
        />

        <KeyboardShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
          onNavigateTab={handleTabSelect}
        />

        <PortalControlModal
          isOpen={isPortalControlOpen}
          onClose={() => setIsPortalControlOpen(false)}
          currentConfig={portalLockConfig}
          onSaveConfig={handleSavePortalLockConfig}
        />

        <UserManagementModal
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          currentUser={currentUser}
          onUsersUpdated={() => {
            if (currentUser) {
              const freshUser = StorageService.getUsers().find(u => u.id === currentUser.id);
              if (freshUser) setCurrentUser(freshUser);
            }
          }}
        />

        <ExitSystemModal
          isOpen={isExitModalOpen}
          onClose={() => setIsExitModalOpen(false)}
          onExitAndCloseBrowser={handleExitAndCloseBrowser}
          onLogoutOnly={handleLogoutOnly}
          userName={currentUser?.name}
        />

        {/* Modal da Central de Backup Online no Tema GAPP Classic */}
        {isBackupModalOpen && (
          <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-6xl my-auto">
              <BackupManagerView
                onClose={() => setIsBackupModalOpen(false)}
                showToast={showToast}
                onRestoreCompleted={() => {
                  showToast('Backup restaurado com sucesso! Dados atualizados.');
                  setIsBackupModalOpen(false);
                  setSheetRows(StorageService.getSheetRows());
                  setStores(StorageService.getStores());
                  setBatches(StorageService.getBatches());
                  setSuppliers(StorageService.getSuppliers());
                  setProducts(StorageService.getProducts());
                  setSheetSnapshots(StorageService.getSheetSnapshots());
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER MODERN THEMES (LIGHT & DARK)
  // ==========================================
  return (
    <div className="h-screen h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 select-none">
      {renderSWUpdateBanner()}
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-14 right-5 z-[12000] bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 border border-amber-400">
          <span>✓ {feedbackToast}</span>
        </div>
      )}

      {/* Main App Header (FIXED AT TOP WITH HIGHEST Z-INDEX SO DROPDOWNS OVERLAY EVERYTHING) */}
      <div className="shrink-0 relative z-[100] w-full shadow-sm">
        <Header
          totalPurchaseR$={totalPurchaseR$}
          totalPieces={totalPieces}
          totalKg={totalKg}
          storeCount={stores.length}
          onReset={handleReset}
          onExportCSV={handleExportCSV}
          onExportXLSX={handleExportXLSX}
          onOpenQuickCalc={() => setIsQuickCalcOpen(true)}
          onPrint={() => setIsPrintModalOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenPurchaseOrder={() => setIsPurchaseOrderOpen(true)}
          onOpenSupplierManager={() => setIsSupplierModalOpen(true)}
          onOpenMobilePortal={handleOpenMobilePortal}
          onOpenPortalControl={() => setIsPortalControlOpen(true)}
          onOpenBackup={() => setIsBackupModalOpen(true)}
          onSaveSheet={() => handleSaveSheetSnapshot()}
          currentUser={currentUser}
          onOpenUserManagement={handleOpenUserManagement}
          onLogout={handleLogout}
          onExitSystem={() => setIsExitModalOpen(true)}
        />
      </div>

      {/* Navigation Tabs (FIXED DIRECTLY BELOW HEADER) */}
      <div className="shrink-0 relative z-[90] w-full shadow-2xs">
        <Navigation 
          activeTab={activeTab} 
          onTabChange={handleTabSelect} 
          currentUser={currentUser}
        />
      </div>

      {/* Content Body (ONLY THIS AREA SCROLLS, AUTO-ADJUSTS TO WINDOW RESIZE) */}
      <main className="flex-1 min-h-0 overflow-y-auto w-full px-3 sm:px-6 py-4">
        <div className="max-w-[1920px] mx-auto pb-4">
          {activeTab === 'dashboard' && (
            <DashboardTab
              rows={sheetRows}
              stores={stores}
              batches={batches}
              onNavigate={handleTabSelect}
              onOpenQuickCalc={() => setIsQuickCalcOpen(true)}
            />
          )}

          {activeTab === 'sheet' && (
            <SheetTab
              rows={sheetRows}
              onUpdateRow={handleUpdateRow}
              onUpdateMultiple={handleUpdateMultipleRows}
              onExportXLSX={handleExportXLSX}
              onOpenPurchaseOrder={() => setIsPurchaseOrderOpen(true)}
              sheetSnapshots={sheetSnapshots}
              onSaveSheetSnapshot={handleSaveSheetSnapshot}
              onRestoreSheetSnapshot={handleRestoreSheetSnapshot}
              onDeleteSheetSnapshot={handleDeleteSheetSnapshot}
            />
          )}

          {activeTab === 'yield' && <YieldTab />}

          {activeTab === 'results' && (
            <ResultsTab 
              rows={sheetRows} 
              stores={stores} 
              batches={batches}
              wasteRecords={wasteRecords}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              rows={sheetRows}
              stores={stores}
              onUpdateRow={handleUpdateRow}
              onUpdateMultiple={handleUpdateMultipleRows}
              onNavigateToSheet={() => handleTabSelect('sheet')}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesTab
              batches={batches}
              suppliers={suppliers}
              stores={stores}
              sheetRows={sheetRows}
              onAddBatch={handleAddBatch}
              onUpdateBatch={handleUpdateBatch}
              onDeleteBatch={handleDeleteBatch}
              onOpenSupplierManager={() => setIsSupplierModalOpen(true)}
            />
          )}

          {activeTab === 'waste' && (
            <WasteTab
              wasteRecords={wasteRecords}
              stores={stores}
              onAddWasteRecord={handleAddWasteRecord}
            />
          )}

          {activeTab === 'parameters' && (
            <ParametersTab
              products={products}
              stores={stores}
              sheetRows={sheetRows}
              suppliers={suppliers}
              onUpdateProducts={setProducts}
              onUpdateStores={setStores}
              onOpenSupplierManager={() => setIsSupplierModalOpen(true)}
              onOpenUserManagement={handleOpenUserManagement}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'backup' && (
            <BackupManagerView
              showToast={showToast}
              onRestoreCompleted={() => {
                showToast('Backup restaurado com sucesso! Dados atualizados.');
                setSheetRows(StorageService.getSheetRows());
                setStores(StorageService.getStores());
                setBatches(StorageService.getBatches());
                setSuppliers(StorageService.getSuppliers());
                setProducts(StorageService.getProducts());
                setSheetSnapshots(StorageService.getSheetSnapshots());
              }}
            />
          )}
        </div>
      </main>

      {/* Footer (FIXED AT BOTTOM) */}
      <footer className="shrink-0 z-30 w-full py-2 sm:py-2.5 border-t border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur transition-colors">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Grupo GAPP Sistemas • Apuração do Boi por Patrick Pessoa
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              GRUPO GAPP
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Planilha Matriz Oficial da Direção v10.3 • 16 Filiais Integradas
          </div>
        </div>
      </footer>

      {/* Modals */}
      <QuickCalculatorModal
        isOpen={isQuickCalcOpen}
        onClose={() => setIsQuickCalcOpen(false)}
      />

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        rows={sheetRows}
        stores={stores}
      />

      <PurchaseOrderModal
        isOpen={isPurchaseOrderOpen}
        onClose={() => setIsPurchaseOrderOpen(false)}
        rows={sheetRows}
        stores={stores}
        suppliers={suppliers}
        onOpenSupplierManager={() => setIsSupplierModalOpen(true)}
        onSaveBatch={handleAddBatch}
        onUpdateRow={handleUpdateRow}
        onUpdateMultiple={handleUpdateMultipleRows}
      />

      <SupplierManagementModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        suppliers={suppliers}
        onAddSupplier={handleAddSupplier}
        onUpdateSupplier={handleUpdateSupplier}
        onDeleteSupplier={handleDeleteSupplier}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        onNavigateTab={handleTabSelect}
      />

      <PortalControlModal
        isOpen={isPortalControlOpen}
        onClose={() => setIsPortalControlOpen(false)}
        currentConfig={portalLockConfig}
        onSaveConfig={handleSavePortalLockConfig}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        currentUser={currentUser}
        onUsersUpdated={() => {
          if (currentUser) {
            const freshUser = StorageService.getUsers().find(u => u.id === currentUser.id);
            if (freshUser) setCurrentUser(freshUser);
          }
        }}
      />

      <ExitSystemModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onExitAndCloseBrowser={handleExitAndCloseBrowser}
        onLogoutOnly={handleLogoutOnly}
        userName={currentUser?.name}
      />

      {/* Modal da Central de Backup Online */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-6xl my-auto">
            <BackupManagerView
              onClose={() => setIsBackupModalOpen(false)}
              showToast={showToast}
              onRestoreCompleted={() => {
                showToast('Backup restaurado com sucesso! Dados atualizados.');
                setIsBackupModalOpen(false);
                setSheetRows(StorageService.getSheetRows());
                setStores(StorageService.getStores());
                setBatches(StorageService.getBatches());
                setSuppliers(StorageService.getSuppliers());
                setProducts(StorageService.getProducts());
                setSheetSnapshots(StorageService.getSheetSnapshots());
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

