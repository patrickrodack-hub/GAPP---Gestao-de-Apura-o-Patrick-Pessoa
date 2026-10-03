import React, { useState, useEffect } from 'react';
import { SheetRowData, Store, PortalLockConfig } from '../../types/erp';
import { StorageService } from '../../services/storageService';
import { FirebaseService } from '../../services/firebase';
import { PortalLogin } from './PortalLogin';
import { PortalForm } from './PortalForm';

export type PortalTheme = 'light' | 'dark';

interface MobileStockPortalProps {
  stores: Store[];
  rows: SheetRowData[];
  onUpdateRow: (row: SheetRowData) => void;
  onSwitchToAdmin: () => void;
}

export const MobileStockPortal: React.FC<MobileStockPortalProps> = ({
  stores,
  rows,
  onUpdateRow,
  onSwitchToAdmin
}) => {
  const [loggedStoreId, setLoggedStoreId] = useState<string | null>(null);
  const [operatorName, setOperatorName] = useState<string>('');
  
  // Controle de Horários & Bloqueio do Portal
  const [portalLockConfig, setPortalLockConfig] = useState<PortalLockConfig>(() => 
    StorageService.getPortalLockConfig()
  );

  useEffect(() => {
    // Sincroniza configuração de bloqueio em tempo real com o Firestore
    const unsubscribe = FirebaseService.subscribeToPortalLockConfig((cfg) => {
      if (cfg) {
        setPortalLockConfig(cfg);
        localStorage.setItem('apuracao_boi_portal_lock_v1', JSON.stringify(cfg));
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Padrão "claro" conforme solicitado pelo usuário
  const [portalTheme, setPortalTheme] = useState<PortalTheme>(() => {
    try {
      const saved = localStorage.getItem('gapp_portal_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light'; // Default to "claro"
  });

  useEffect(() => {
    try {
      localStorage.setItem('gapp_portal_theme', portalTheme);
    } catch {}
  }, [portalTheme]);

  const togglePortalTheme = () => {
    setPortalTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogin = (storeId: string, name: string) => {
    setLoggedStoreId(storeId);
    setOperatorName(name);
  };

  const handleLogout = () => {
    setLoggedStoreId(null);
    setOperatorName('');
  };

  const currentStore = stores.find(s => s.id === loggedStoreId);
  const currentRow = rows.find(r => r.storeId === loggedStoreId);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${portalTheme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-50 text-slate-900'}`}>
      {!loggedStoreId || !currentStore || !currentRow ? (
        <PortalLogin
          stores={stores}
          onLogin={handleLogin}
          onSwitchToAdmin={onSwitchToAdmin}
          theme={portalTheme}
          onToggleTheme={togglePortalTheme}
          portalLockConfig={portalLockConfig}
        />
      ) : (
        <PortalForm
          store={currentStore}
          operatorName={operatorName}
          stores={stores}
          initialRow={currentRow}
          onSave={onUpdateRow}
          onLogout={handleLogout}
          onSwitchToAdmin={onSwitchToAdmin}
          theme={portalTheme}
          onToggleTheme={togglePortalTheme}
        />
      )}
    </div>
  );
};
