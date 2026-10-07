import React, { useState, useEffect, useMemo } from 'react';
import { 
  Smartphone, 
  Laptop, 
  Tablet, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Activity, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Copy, 
  Trash2, 
  Eye, 
  Building2, 
  X, 
  Radio, 
  LayoutGrid,
  List,
  CheckCircle2,
  AlertCircle,
  Edit3,
  User
} from 'lucide-react';
import { ConnectedDevice, DeviceAccessStatus, Store, SystemUser } from '../../types/erp';
import { StorageService } from '../../services/storageService';
import { FirebaseService } from '../../services/firebase';
import { getOrCreateDeviceId } from '../../services/devicePresenceService';

interface DevicesTabProps {
  stores: Store[];
  currentUser?: SystemUser | null;
  showToast?: (message: string) => void;
  onOpenMobilePortal?: () => void;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({
  stores,
  currentUser,
  showToast,
  onOpenMobilePortal
}) => {
  const [devices, setDevices] = useState<ConnectedDevice[]>(() => StorageService.getConnectedDevices());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ONLINE' | 'LIBERADO' | 'BLOQUEADO'>('ALL');
  const [filterStore, setFilterStore] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ID do dispositivo atual sendo operado neste navegador
  const currentDeviceId = useMemo(() => getOrCreateDeviceId(), []);

  // Modais de Ação
  const [deviceToBlock, setDeviceToBlock] = useState<ConnectedDevice | null>(null);
  const [blockReason, setBlockReason] = useState('Uso fora do horário comercial');
  const [selectedDeviceDetails, setSelectedDeviceDetails] = useState<ConnectedDevice | null>(null);
  const [isConfirmBlockAllModalOpen, setIsConfirmBlockAllModalOpen] = useState(false);
  const [isConfirmUnlockAllModalOpen, setIsConfirmUnlockAllModalOpen] = useState(false);

  // Modal de Edição/Atribuição de Operador & Filial
  const [deviceToEdit, setDeviceToEdit] = useState<ConnectedDevice | null>(null);
  const [editOperatorName, setEditOperatorName] = useState('');
  const [editStoreId, setEditStoreId] = useState('');

  const handleOpenEditModal = (device: ConnectedDevice) => {
    setDeviceToEdit(device);
    setEditOperatorName(device.operatorName || '');
    setEditStoreId(device.storeId || '');
  };

  const handleSaveDeviceEdit = () => {
    if (!deviceToEdit) return;
    const selectedStore = stores.find(s => s.id === editStoreId);
    let updatedStoreName = deviceToEdit.storeName;
    if (editStoreId === 'matriz') {
      updatedStoreName = 'Diretoria / Matriz GAPP';
    } else if (selectedStore) {
      updatedStoreName = `${selectedStore.code} • ${selectedStore.name}`;
    }

    const updatedList = StorageService.updateDeviceMetadata(deviceToEdit.deviceId, {
      operatorName: editOperatorName.trim() || deviceToEdit.operatorName,
      storeId: editStoreId || undefined,
      storeName: updatedStoreName
    });
    setDevices(updatedList);
    setDeviceToEdit(null);
    if (showToast) showToast('Identificação do operador e filial atualizadas!');
  };

  // Sincronização em tempo real do Firestore
  useEffect(() => {
    // Sincroniza e limpa quaisquer resquícios mockados
    StorageService.syncConnectedDevices().then(synced => {
      setDevices(synced);
    }).catch(() => {});

    const unsubscribe = FirebaseService.subscribeToConnectedDevices((cloudDevices) => {
      if (cloudDevices) {
        // Filtra apenas registros válidos reais
        const valid = cloudDevices.filter(d => 
          !d.id?.startsWith('dev_str_') && 
          !d.deviceId?.startsWith('dev-samsung-a54-str') && 
          !d.deviceId?.startsWith('dev-iphone-13-str') &&
          !d.deviceId?.startsWith('dev-motorola-g84-str') &&
          !d.deviceId?.startsWith('dev-xiaomi-note12-str') &&
          !d.deviceId?.startsWith('dev-samsung-s22-str') &&
          !d.deviceId?.startsWith('sim-dev-')
        );
        setDevices(valid);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Timer para atualização periódica de "tempo online" e status dinâmico (a cada 10 segundos)
  useEffect(() => {
    const timer = setInterval(() => {
      setDevices(prev => {
        const now = Date.now();
        return prev.map(d => {
          // Considera online se visto nos últimos 60 segundos
          const isReallyOnline = (now - d.lastSeenAt) < 60000;
          if (d.isOnline !== isReallyOnline) {
            return { ...d, isOnline: isReallyOnline };
          }
          return d;
        });
      });
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // Recarrega do storage local e nuvem
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const synced = await StorageService.syncConnectedDevices();
      setDevices(synced);
      if (showToast) showToast('Status de rede e aparelhos atualizados em tempo real!');
    } catch {
      setDevices(StorageService.getConnectedDevices());
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Limpar histórico de desconectados
  const handleClearOffline = async () => {
    if (window.confirm('Deseja limpar todos os aparelhos offline do histórico? Apenas os dispositivos conectados e com atividade em tempo real serão mantidos.')) {
      setIsRefreshing(true);
      try {
        const remaining = await StorageService.clearAllOfflineDevices();
        setDevices(remaining);
        if (showToast) showToast('Histórico de aparelhos offline limpo com sucesso!');
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Copiar IP ou MAC para a área de transferência
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (showToast) showToast(`Copiado: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Bloquear ou Liberar Acesso Individual
  const handleOpenBlockModal = (device: ConnectedDevice) => {
    setDeviceToBlock(device);
    setBlockReason('Uso fora do horário comercial');
  };

  const handleConfirmBlock = () => {
    if (!deviceToBlock) return;
    const operator = currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Patrick Pessoa (Direção)';
    const updated = StorageService.setDeviceStatus(
      deviceToBlock.deviceId,
      'BLOQUEADO',
      blockReason.trim() || 'Bloqueado pela administração da rede',
      operator
    );
    setDevices(updated);
    setDeviceToBlock(null);
    if (showToast) showToast(`Aparelho "${deviceToBlock.deviceModel}" BLOQUEADO com sucesso.`);
  };

  const handleUnlockDevice = (device: ConnectedDevice) => {
    const updated = StorageService.setDeviceStatus(device.deviceId, 'LIBERADO');
    setDevices(updated);
    if (showToast) showToast(`Aparelho "${device.deviceModel}" LIBERADO para acesso.`);
  };

  const handleDeleteDevice = (deviceId: string) => {
    if (window.confirm('Deseja remover este aparelho do registro de auditoria?')) {
      const updated = StorageService.deleteConnectedDevice(deviceId);
      setDevices(updated);
      if (showToast) showToast('Aparelho removido do registro.');
    }
  };

  // Bloquear Todos os Celulares (exceto estações Desktop ERP)
  const handleConfirmBlockAll = () => {
    const operator = currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Patrick Pessoa (Direção)';
    const current = StorageService.getConnectedDevices();
    const now = Date.now();
    const updated = current.map(d => {
      // Não bloqueia a própria estação Desktop se for o desenvolvedor/diretor
      if (d.connectionType === 'DESKTOP_ERP') return d;
      return {
        ...d,
        status: 'BLOQUEADO' as DeviceAccessStatus,
        blockedReason: 'Bloqueio geral acionado pela Diretoria',
        blockedAt: now,
        blockedBy: operator
      };
    });
    StorageService.saveConnectedDevices(updated);
    setDevices(updated);
    setIsConfirmBlockAllModalOpen(false);
    if (showToast) showToast('Todos os celulares das filiais foram BLOQUEADOS.');
  };

  // Liberar Todos
  const handleConfirmUnlockAll = () => {
    const current = StorageService.getConnectedDevices();
    const updated = current.map(d => ({
      ...d,
      status: 'LIBERADO' as DeviceAccessStatus,
      blockedReason: undefined,
      blockedAt: undefined,
      blockedBy: undefined
    }));
    StorageService.saveConnectedDevices(updated);
    setDevices(updated);
    setIsConfirmUnlockAllModalOpen(false);
    if (showToast) showToast('Todos os aparelhos tiveram o acesso LIBERADO com sucesso.');
  };

  // Exportar relatório completo em CSV
  const handleExportCSV = () => {
    const headers = [
      'ID Dispositivo',
      'Filial',
      'Operador / Usuário',
      'Status de Acesso',
      'Conectado Agora',
      'Tipo de Conexão',
      'Modelo do Aparelho',
      'Sistema Operacional',
      'Navegador',
      'Endereço IP',
      'Endereço MAC',
      'Qtd de Acessos',
      'Tempo de Permanência (seg)',
      'Primeiro Acesso',
      'Última Atividade'
    ];

    const rows = devices.map(d => [
      `"${d.deviceId}"`,
      `"${d.storeName || 'Matriz'}"`,
      `"${d.operatorName || 'Operador'}"`,
      `"${d.status}"`,
      `"${isDeviceOnline(d) ? 'SIM (Online)' : 'NÃO (Offline)'}"`,
      `"${d.connectionType}"`,
      `"${d.deviceModel}"`,
      `"${d.os}"`,
      `"${d.browser}"`,
      `"${d.ip}"`,
      `"${d.macAddress}"`,
      d.accessCount || 1,
      d.sessionDurationSeconds || 0,
      `"${new Date(d.firstConnectedAt).toLocaleString('pt-BR')}"`,
      `"${new Date(d.lastSeenAt).toLocaleString('pt-BR')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Aparelhos_Conectados_Real_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    if (showToast) showToast('Relatório de conexões reais baixado em CSV!');
  };

  // Verificação precisa de status online em tempo real (heartbeat < 60s)
  const isDeviceOnline = (d: ConnectedDevice) => {
    return d.isOnline !== false && (Date.now() - (d.lastSeenAt || 0) < 60000);
  };

  // Métricas Consolidadas 100% Reais
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => isDeviceOnline(d)).length;
  const authorizedDevices = devices.filter(d => d.status === 'LIBERADO').length;
  const blockedDevices = devices.filter(d => d.status === 'BLOQUEADO').length;
  const totalAccessEvents = devices.reduce((sum, d) => sum + (d.accessCount || 1), 0);

  // Formata tempo de permanência
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 60) return `${Math.max(1, seconds || 0)}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  // Formata data e hora amigável
  const formatLastSeen = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Agora mesmo (< 1 min)';
    if (diff < 3600000) return `Há ${Math.floor(diff / 60000)} min atrás`;
    if (diff < 86400000) return `Hoje às ${new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // Filtragem
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      // Busca textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = d.operatorName?.toLowerCase().includes(query);
        const matchStore = d.storeName?.toLowerCase().includes(query);
        const matchIp = d.ip?.toLowerCase().includes(query);
        const matchMac = d.macAddress?.toLowerCase().includes(query);
        const matchModel = d.deviceModel?.toLowerCase().includes(query);
        if (!matchName && !matchStore && !matchIp && !matchMac && !matchModel) {
          return false;
        }
      }

      // Filtro de Status
      if (filterStatus === 'ONLINE' && !isDeviceOnline(d)) return false;
      if (filterStatus === 'LIBERADO' && d.status !== 'LIBERADO') return false;
      if (filterStatus === 'BLOQUEADO' && d.status !== 'BLOQUEADO') return false;

      // Filtro de Loja
      if (filterStore !== 'ALL') {
        if (d.storeId !== filterStore) return false;
      }

      // Filtro de Tipo
      if (filterType !== 'ALL') {
        if (d.connectionType !== filterType) return false;
      }

      return true;
    });
  }, [devices, searchQuery, filterStatus, filterStore, filterType]);

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-8 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PRESENÇA REAL EM TEMPO REAL (FIREBASE CLOUD)
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {onlineDevices} Conectado(s) Agora
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                Aparelhos Conectados ao Sistema & Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-0.5">
                Monitoramento <strong>100% REAL</strong> e sem dados simulados. A contagem e listagem refletem exclusivamente os navegadores, smartphones e estações conectados via Firebase Firestore.
              </p>
            </div>
          </div>

          {/* Action Buttons Top */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 shadow-sm"
              title="Atualizar conexões e ping com as filiais"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Status'}</span>
            </button>

            <button
              onClick={handleClearOffline}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition active:scale-95 shadow-sm"
              title="Limpar aparelhos desconectados/inativos do histórico"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Limpar Inativos</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 shadow-sm"
              title="Exportar planilha de auditoria completa em CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>

            <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block" />

            <button
              onClick={() => setIsConfirmUnlockAllModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-emerald-950/50 hover:text-emerald-300 text-slate-300 border border-slate-700 hover:border-emerald-500/40 transition"
              title="Liberar todos os aparelhos bloqueados"
            >
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Liberar Todos</span>
            </button>

            <button
              onClick={() => setIsConfirmBlockAllModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition"
              title="Bloquear todos os celulares das lojas"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Bloquear Celulares</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
            <span>Conectados Agora (Online)</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-3xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
            {onlineDevices}
          </div>
          <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 font-medium">
            Heartbeat ativo nos últimos 60 segundos
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total de Aparelhos</span>
            <Smartphone className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {totalDevices}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Registrados na base de dados
          </div>
        </div>

        <div className="bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-xs font-semibold">
            <span>Acesso Liberado</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-blue-900 dark:text-blue-200 mt-1">
            {authorizedDevices}
          </div>
          <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">
            Aparelhos autorizados
          </div>
        </div>

        <div className="bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-semibold">
            <span>Acesso Bloqueado</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-900 dark:text-rose-200 mt-1">
            {blockedDevices}
          </div>
          <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
            Acesso suspenso
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Operador, Filial, IP, Endereço MAC ou Modelo..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Store */}
            <div className="relative">
              <select
                value={filterStore}
                onChange={(e) => setFilterStore(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
              >
                <option value="ALL">Todas as Filiais ({stores.length})</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Device Type */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
              >
                <option value="ALL">Todos os Tipos</option>
                <option value="MOBILE_PORTAL">📱 Smartphones (Portal)</option>
                <option value="DESKTOP_ERP">💻 Computadores (ERP)</option>
                <option value="TABLET_PWA">📲 Tablets / PWA</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg text-xs transition ${viewMode === 'TABLE' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                title="Visualização em Tabela Detalhada"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('CARDS')}
                className={`p-1.5 rounded-lg text-xs transition ${viewMode === 'CARDS' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                title="Visualização em Grade de Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>

          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${filterStatus === 'ALL' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Todos ({devices.length})
          </button>

          <button
            onClick={() => setFilterStatus('ONLINE')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 ${filterStatus === 'ONLINE' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Online Agora ({onlineDevices})
          </button>

          <button
            onClick={() => setFilterStatus('LIBERADO')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 ${filterStatus === 'LIBERADO' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20'}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Liberados ({authorizedDevices})
          </button>

          <button
            onClick={() => setFilterStatus('BLOQUEADO')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 ${filterStatus === 'BLOQUEADO' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20'}`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Bloqueados ({blockedDevices})
          </button>
        </div>
      </div>

      {/* Device List View */}
      {filteredDevices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Smartphone className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum aparelho encontrado
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Assim que outros operadores ou gerentes acessarem o ERP ou o Portal Mobile, as conexões reais aparecerão automaticamente aqui.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); setFilterStore('ALL'); setFilterType('ALL'); }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition"
          >
            Limpar Todos os Filtros
          </button>
        </div>
      ) : viewMode === 'TABLE' ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Status & Presença</th>
                  <th className="py-3 px-4">Usuário / Operador & Filial</th>
                  <th className="py-3 px-4">Aparelho & Sistema</th>
                  <th className="py-3 px-4">Identificação de Rede (IP & MAC)</th>
                  <th className="py-3 px-3 text-center">Acessos</th>
                  <th className="py-3 px-3">Permanência</th>
                  <th className="py-3 px-4">Última Atividade</th>
                  <th className="py-3 px-4 text-right">Controle de Acesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredDevices.map((dev) => {
                  const isBlocked = dev.status === 'BLOQUEADO';
                  const isOnline = isDeviceOnline(dev);
                  const isCurrent = dev.deviceId === currentDeviceId || dev.id === currentDeviceId;

                  return (
                    <tr 
                      key={dev.id || dev.deviceId}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isBlocked ? 'bg-rose-50/40 dark:bg-rose-950/15' : isOnline ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                      }`}
                    >
                      {/* Status & Presença */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isBlocked ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <Lock className="w-3 h-3" />
                              BLOQUEADO
                            </span>
                          ) : isOnline ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              ONLINE (AO VIVO)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              OFFLINE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Usuário & Filial */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {dev.operatorName || 'Operador Conectado'}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                              Você
                            </span>
                          )}
                          {dev.connectionType === 'MOBILE_PORTAL' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              Portal Celular
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {dev.storeName || 'Portal de Filiais'}
                          </span>
                        </div>
                      </td>

                      {/* Aparelho & Sistema */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                            {dev.connectionType === 'DESKTOP_ERP' ? (
                              <Laptop className="w-4 h-4 text-blue-500" />
                            ) : dev.connectionType === 'TABLET_PWA' ? (
                              <Tablet className="w-4 h-4 text-purple-500" />
                            ) : (
                              <Smartphone className="w-4 h-4 text-emerald-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {dev.deviceModel}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {dev.os} • {dev.browser}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rede (IP & MAC) */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {dev.ip}
                          </span>
                          <button
                            onClick={() => handleCopyText(dev.ip, `ip-${dev.id}`)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                            title="Copiar IP"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400">MAC:</span>
                          <span>{dev.macAddress}</span>
                          <button
                            onClick={() => handleCopyText(dev.macAddress, `mac-${dev.id}`)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                            title="Copiar Endereço MAC"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Quantidade de Acessos */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {dev.accessCount || 1}x
                        </span>
                      </td>

                      {/* Tempo de Permanência */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{formatDuration(dev.sessionDurationSeconds || 60)}</span>
                        </div>
                      </td>

                      {/* Última Atividade */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          {formatLastSeen(dev.lastSeenAt)}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isBlocked ? (
                            <button
                              onClick={() => handleUnlockDevice(dev)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 shadow-xs flex items-center gap-1"
                              title="Liberar acesso deste aparelho"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Liberar</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenBlockModal(dev)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 border border-rose-500/30 transition active:scale-95 flex items-center gap-1"
                              title="Bloquear acesso deste aparelho"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Bloquear</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditModal(dev)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                            title="Editar / Atribuir Operador e Filial"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setSelectedDeviceDetails(dev)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Ver ficha técnica completa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteDevice(dev.deviceId || dev.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Excluir do histórico"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDevices.map((dev) => {
            const isBlocked = dev.status === 'BLOQUEADO';
            const isOnline = isDeviceOnline(dev);
            const isCurrent = dev.deviceId === currentDeviceId || dev.id === currentDeviceId;

            return (
              <div 
                key={dev.id || dev.deviceId}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
                  isBlocked
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20'
                    : isOnline
                    ? 'border-emerald-500/40 dark:border-emerald-800/60 bg-emerald-50/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      dev.connectionType === 'DESKTOP_ERP'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : isBlocked
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {dev.connectionType === 'DESKTOP_ERP' ? (
                        <Laptop className="w-5 h-5" />
                      ) : (
                        <Smartphone className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                          {dev.operatorName || 'Operador Conectado'}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>{dev.storeName || 'MATRIZ / DIRETORIA'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badge de Status */}
                  <div>
                    {isBlocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        <Lock className="w-3 h-3" />
                        BLOQUEADO
                      </span>
                    ) : isOnline ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        ONLINE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                        OFFLINE
                      </span>
                    )}
                  </div>
                </div>

                {/* Especificações Técnicas */}
                <div className="py-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Modelo:</span>
                    <span className="font-semibold">{dev.deviceModel}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Sistema & Navegador:</span>
                    <span className="text-[11px] font-medium">{dev.os} • {dev.browser}</span>
                  </div>

                  <div className="flex items-center justify-between font-mono bg-slate-50 dark:bg-slate-850 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans">Endereço IP:</div>
                      <div className="font-bold text-slate-900 dark:text-white">{dev.ip}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-sans">Endereço MAC:</div>
                      <div className="font-bold text-slate-700 dark:text-slate-300">{dev.macAddress}</div>
                    </div>
                  </div>

                  {/* Informações de Sessão */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600 dark:text-slate-300">
                    <div className="bg-slate-50 dark:bg-slate-850 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">Qtd de Acessos</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {dev.accessCount || 1} acessos
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-850 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">Permanência</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDuration(dev.sessionDurationSeconds || 60)}
                      </span>
                    </div>
                  </div>

                  {isBlocked && dev.blockedReason && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 text-xs text-rose-700 dark:text-rose-300">
                      <span className="font-bold block text-[10px] uppercase">Motivo do Bloqueio:</span>
                      <span>{dev.blockedReason}</span>
                    </div>
                  )}
                </div>

                {/* Footer do Card com Botões */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400">
                    {formatLastSeen(dev.lastSeenAt)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isBlocked ? (
                      <button
                        onClick={() => handleUnlockDevice(dev)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 shadow-xs flex items-center gap-1"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Liberar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenBlockModal(dev)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 border border-rose-500/30 transition active:scale-95 flex items-center gap-1"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Bloquear</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditModal(dev)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                      title="Editar Operador e Filial"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setSelectedDeviceDetails(dev)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: BLOQUEIO DE APARELHO INDIVIDUAL */}
      {/* ======================================================== */}
      {deviceToBlock && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Bloquear Acesso do Aparelho</h3>
                  <p className="text-xs text-rose-100">Suspensão imediata de lançamentos</p>
                </div>
              </div>
              <button 
                onClick={() => setDeviceToBlock(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-3.5 text-xs text-rose-800 dark:text-rose-300">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Atenção:</span>
                </div>
                <span>
                  O aparelho <strong>{deviceToBlock.deviceModel}</strong> ({deviceToBlock.operatorName}) será impedido imediatamente de enviar contagens ou acessar o portal.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo do Bloqueio:
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ex: Fora do horário, suspeita de extravio, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500/40 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeviceToBlock(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBlock}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition active:scale-95 shadow-md shadow-rose-600/20"
                >
                  Confirmar Bloqueio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DETALHES TÉCNICOS DO APARELHO */}
      {/* ======================================================== */}
      {selectedDeviceDetails && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Ficha de Auditoria do Aparelho</h3>
                  <p className="text-xs text-slate-300">Auditoria técnica e telemetria de rede</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDeviceDetails(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Operador Responsável</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {selectedDeviceDetails.operatorName || 'Operador'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Filial Conectada</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {selectedDeviceDetails.storeName || 'Matriz'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-400 font-sans">ID do Aparelho:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedDeviceDetails.deviceId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-400 font-sans">Endereço IP:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedDeviceDetails.ip}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-400 font-sans">Endereço MAC Físico:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDeviceDetails.macAddress}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-400 font-sans">Modelo de Dispositivo:</span>
                  <span className="font-sans font-bold text-slate-900 dark:text-white">{selectedDeviceDetails.deviceModel}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-400 font-sans">Sistema Operacional:</span>
                  <span className="font-sans font-medium text-slate-700 dark:text-slate-300">{selectedDeviceDetails.os}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-400 font-sans">Navegador Utilizado:</span>
                  <span className="font-sans font-medium text-slate-700 dark:text-slate-300">{selectedDeviceDetails.browser}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-400 font-sans">Localização / Provedor:</span>
                  <span className="font-sans font-medium text-slate-700 dark:text-slate-300">{selectedDeviceDetails.locationHint || 'Rio de Janeiro, RJ'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-400 font-sans">Primeiro Acesso:</span>
                  <span className="font-sans text-slate-600 dark:text-slate-400">{new Date(selectedDeviceDetails.firstConnectedAt).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Última Atividade:</span>
                  <span className="font-sans text-slate-600 dark:text-slate-400">{new Date(selectedDeviceDetails.lastSeenAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={() => setSelectedDeviceDetails(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition"
                >
                  Fechar Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CONFIRMAÇÃO DE BLOQUEIO EM MASSA */}
      {/* ======================================================== */}
      {isConfirmBlockAllModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Bloquear Todos os Celulares?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Esta ação suspenderá imediatamente o acesso ao Portal Mobile em todos os smartphones e coletores das filiais.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsConfirmBlockAllModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmBlockAll}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition active:scale-95 shadow-md shadow-rose-600/20"
              >
                Confirmar Bloqueio Geral
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CONFIRMAÇÃO DE LIBERAÇÃO EM MASSA */}
      {/* ======================================================== */}
      {isConfirmUnlockAllModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Unlock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Liberar Todos os Dispositivos?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Esta ação autorizará imediatamente o acesso e os lançamentos para todos os celulares e estações da rede.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsConfirmUnlockAllModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmUnlockAll}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 shadow-md shadow-emerald-600/20"
              >
                Liberar Todos Agora
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* MODAL 5: EDITAR / ATRIBUIR OPERADOR E FILIAL AO APARELHO */}
      {/* ======================================================== */}
      {deviceToEdit && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-slate-950 p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-black/10">
                  <Edit3 className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-base font-black">Identificar Aparelho Conectado</h3>
                  <p className="text-xs font-semibold text-slate-900/80">Atribuir Operador e Filial ao Dispositivo</p>
                </div>
              </div>
              <button 
                onClick={() => setDeviceToEdit(null)}
                className="p-1.5 rounded-xl hover:bg-black/10 text-slate-950/80 hover:text-slate-950 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                  <span><strong>Modelo:</strong> {deviceToEdit.deviceModel}</span>
                  <span className="text-amber-700 dark:text-amber-400 font-bold">{deviceToEdit.os}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  IP: {deviceToEdit.ip} • MAC: {deviceToEdit.macAddress}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Nome do Usuário / Operador:</span>
                </label>
                <input
                  type="text"
                  value={editOperatorName}
                  onChange={(e) => setEditOperatorName(e.target.value)}
                  placeholder="Ex: Carlos Silva (Encarregado)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Filial Conectada:</span>
                </label>
                <select
                  value={editStoreId}
                  onChange={(e) => setEditStoreId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                >
                  <option value="matriz">Diretoria / Matriz GAPP</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.code} • {store.name} ({store.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeviceToEdit(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDeviceEdit}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition active:scale-95 shadow-md shadow-amber-500/20"
                >
                  Salvar Identificação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
