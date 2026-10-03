import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { FirebaseService } from './services/firebase';
import { Product, Store, SheetRowData, PurchaseBatch, WasteRecord, Supplier, SheetSnapshotRecord, PortalLockConfig } from './types/erp';
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
import { SolidconHeader } from './components/desktop/SolidconHeader';
import { SolidconStatusBar } from './components/desktop/SolidconStatusBar';
import { SolidconDesktopWallpaper } from './components/desktop/SolidconDesktopWallpaper';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { MobileStockPortal } from './components/portal/MobileStockPortal';
import { useTheme } from './context/ThemeContext';
import { ExcelExportService } from './services/excelExportService';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { Minus, Square, X, Beef, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const { theme, isSolidcon, toggleTheme } = useTheme();

  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [stores, setStores] = useState<Store[]>(() => StorageService.getStores());
  const [sheetRows, setSheetRows] = useState<SheetRowData[]>(() => StorageService.getSheetRows());
  const [batches, setBatches] = useState<PurchaseBatch[]>(() => StorageService.getBatches());
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>(() => StorageService.getWasteRecords());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());
  const [sheetSnapshots, setSheetSnapshots] = useState<SheetSnapshotRecord[]>(() => StorageService.getSheetSnapshots());

  const [activeTab, setActiveTab] = useState<NavigationTab>('sheet');
  const [isDesktopView, setIsDesktopView] = useState(false);
  const [isQuickCalcOpen, setIsQuickCalcOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isPurchaseOrderOpen, setIsPurchaseOrderOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPortalControlOpen, setIsPortalControlOpen] = useState(false);
  const [portalLockConfig, setPortalLockConfig] = useState<PortalLockConfig>(() => StorageService.getPortalLockConfig());
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

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

    return () => {
      isMounted = false;
      if (unsubscribeRows) unsubscribeRows();
      if (unsubscribeLock) unsubscribeLock();
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
    if (window.confirm('Deseja restaurar todos os dados originais da Planilha de Compra da Direção v10.1? Quaisquer edições manuais serão redefinidas.')) {
      const defaults = StorageService.resetAllToDefaults();
      setProducts(defaults.products);
      setStores(defaults.stores);
      setSheetRows(defaults.sheetRows);
      setBatches(defaults.batches);
      setWasteRecords(defaults.waste);
      setSuppliers(defaults.suppliers);
      showToast('Dados oficiais da Planilha v10.1 restaurados!');
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
    setActiveTab(tab);
    setIsDesktopView(false);
  };

  // Global Keyboard Shortcuts hook listener (Alt+1 to Alt+8, Alt+X, Alt+C, Alt+P, etc.)
  useGlobalShortcuts({
    onNavigateTab: (tab) => {
      handleTabSelect(tab);
      const tabNames: Record<NavigationTab, string> = {
        dashboard: 'Painel Geral (Alt+1)',
        sheet: 'Planilha Direção v10.1 (Alt+2)',
        yield: 'Desossa & Rendimento (Alt+3)',
        results: 'DRE & Margens (Alt+4)',
        inventory: 'Estoque & Câmaras (Alt+5)',
        purchases: 'Compras & Lotes (Alt+6)',
        waste: 'Descarte Sebo/Osso (Alt+7)',
        parameters: 'Módulo 1: Parâmetros (Alt+8)',
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
    }
  });

  // Global counts for header
  const totalPieces = sheetRows.reduce((acc, r) => 
    acc + r.pedidoDianteiro + r.pedidoTraseiro + r.pedidoCoxao + r.pedidoAlcatrao + r.pedidoCostelaGaucha, 0
  );
  const totalKg = 14473.5;
  const totalPurchaseR$ = 376311.95;

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'sheet': return 'Planilha de Compra da Direção v10.1 (Matriz 16 Filiais)';
      case 'dashboard': return 'Painel Executivo Geral';
      case 'yield': return 'Rendimento e Desossa do Boi';
      case 'results': return 'Apuração de Resultados DRE e Margens';
      case 'inventory': return 'Controle de Estoque e Câmaras Frias';
      case 'purchases': return 'Gestão de Compras e Lotes de Gado';
      case 'waste': return 'Controle de Descarte (Sebo e Osso)';
      case 'parameters': return 'Módulo 1: Cadastro e Parâmetros';
      default: return 'Apuração do Boi';
    }
  };

  // ==========================================
  // RENDER MOBILE STOCK PORTAL (MOBILE VIEW)
  // ==========================================
  if (isPortalMode) {
    return (
      <MobileStockPortal
        stores={stores}
        rows={sheetRows}
        onUpdateRow={handleUpdateRow}
        onSwitchToAdmin={() => setIsPortalMode(false)}
      />
    );
  }

  // ==========================================
  // RENDER SOLIDCON THEME (DESKTOP ERP LAYOUT)
  // ==========================================
  if (isSolidcon) {
    return (
      <div className="min-h-screen bg-[#3a4149] text-slate-900 flex flex-col font-sans select-none antialiased">
        {/* Toast Notification */}
        {feedbackToast && (
          <div className="fixed bottom-10 right-5 z-50 bg-[#0078d7] text-white px-4 py-2 rounded shadow-2xl font-bold text-xs flex items-center gap-2 border border-blue-300 animate-bounce">
            <span>✓ {feedbackToast}</span>
          </div>
        )}

        {/* 1. Desktop Blue Header + Menu Bar + Shortcut Toolbar */}
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
          onOpenMobilePortal={() => setIsPortalMode(true)}
          onOpenPortalControl={() => setIsPortalControlOpen(true)}
          onSaveSheet={() => handleSaveSheetSnapshot()}
        />

        {/* 2. Main Desktop Area */}
        <div className="flex-1 relative flex flex-col overflow-x-hidden bg-[#e0e4e8]">
          {isDesktopView ? (
            /* Wallpaper view */
            <SolidconDesktopWallpaper
              onOpenTab={handleTabSelect}
              onOpenQuickCalc={() => setIsQuickCalcOpen(true)}
            />
          ) : (
            /* MDI Active Window Container */
            <div className="flex-1 flex flex-col p-2 sm:p-3 bg-slate-200/90 min-h-0">
              <div className="flex-1 flex flex-col bg-white border border-[#9ca3af] shadow-lg rounded-sm overflow-hidden">
                
                {/* Window Internal Title Bar */}
                <div 
                  className="h-7 px-3 flex items-center justify-between text-white text-xs font-semibold"
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

                {/* Window Sub-navigation bar inside ERP */}
                <div className="bg-[#f1f5f9] border-b border-slate-300 px-3 py-1 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: 'sheet', label: 'Planilha v10.1' },
                      { id: 'dashboard', label: 'Dashboard' },
                      { id: 'yield', label: 'Rendimento & Desossa' },
                      { id: 'results', label: 'DRE & Margens' },
                      { id: 'inventory', label: 'Estoque Câmaras' },
                      { id: 'purchases', label: 'Compras & Lotes' },
                      { id: 'waste', label: 'Descarte (Sebo/Osso)' },
                      { id: 'parameters', label: 'Módulo 1: Parâmetros' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabSelect(tab.id as NavigationTab)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
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

                {/* Window Body (Scrollable Tab Content) */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
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
                      onAddBatch={handleAddBatch}
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
                    />
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        {/* 3. Bottom Status Bar (Solidcon style: 01/10/2026 | Patrick Pessoa | 1.1.8719) */}
        <SolidconStatusBar storeCount={stores.length} isCloudConnected={isCloudConnected} />

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
      </div>
    );
  }

  // ==========================================
  // RENDER MODERN THEMES (LIGHT & DARK)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 border border-amber-400">
          <span>✓ {feedbackToast}</span>
        </div>
      )}

      {/* Main App Header */}
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
        onOpenMobilePortal={() => setIsPortalMode(true)}
        onOpenPortalControl={() => setIsPortalControlOpen(true)}
        onSaveSheet={() => handleSaveSheetSnapshot()}
      />

      {/* Navigation Tabs */}
      <Navigation 
        activeTab={activeTab} 
        onTabChange={handleTabSelect} 
        onOpenShortcuts={() => setIsShortcutsOpen(true)} 
      />

      {/* Content Body */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-6 py-6">
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
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur transition-colors">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Grupo GAPP Sistemas • Apuração do Boi por Patrick Pessoa
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              GRUPO GAPP
            </span>
          </div>
          <div>
            Planilha Matriz Oficial da Direção v10.1 • 16 Filiais Integradas
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
    </div>
  );
}

