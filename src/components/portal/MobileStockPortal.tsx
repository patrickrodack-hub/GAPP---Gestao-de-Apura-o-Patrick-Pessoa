import React, { useState, useEffect } from 'react';
import { SheetRowData, Store } from '../../types/erp';
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
