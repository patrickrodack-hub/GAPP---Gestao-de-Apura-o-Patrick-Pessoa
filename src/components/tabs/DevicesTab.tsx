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
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Trash2, 
  Eye, 
  Plus, 
  Wifi, 
  Server, 
  Globe, 
  Building2, 
  User, 
  Calendar, 
  Hash, 
  X, 
  Sparkles, 
  Radio, 
  Monitor,
  LayoutGrid,
  List
} from 'lucide-react';
import { ConnectedDevice, DeviceAccessStatus, Store, SystemUser } from '../../types/erp';
import { StorageService } from '../../services/storageService';
import { FirebaseService } from '../../services/firebase';

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

  // Modais de Ação
  const [deviceToBlock, setDeviceToBlock] = useState<ConnectedDevice | null>(null);
  const [blockReason, setBlockReason] = useState('Uso fora do horário comercial');
  const [selectedDeviceDetails, setSelectedDeviceDetails] = useState<ConnectedDevice | null>(null);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [isConfirmBlockAllModalOpen, setIsConfirmBlockAllModalOpen] = useState(false);
  const [isConfirmUnlockAllModalOpen, setIsConfirmUnlockAllModalOpen] = useState(false);

  // Form Simulação de Aparelho
  const [simStoreId, setSimStoreId] = useState(stores[0]?.id || 'str_1');
  const [simOperatorName, setSimOperatorName] = useState('João Pedro (Açougueiro)');
  const [simDeviceModel, setSimDeviceModel] = useState('Xiaomi Poco X5 Pro 5G');
  const [simOs, setSimOs] = useState('Android 14 (HyperOS)');
  const [simBrowser, setSimBrowser] = useState('Chrome Mobile 128.0');

  // Sincronização em tempo real do Firestore
  useEffect(() => {
    const unsubscribe = FirebaseService.subscribeToConnectedDevices((cloudDevices) => {
      if (cloudDevices && cloudDevices.length > 0) {
        setDevices(cloudDevices);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Timer para atualização periódica de "tempo online" e status dinâmico
  useEffect(() => {
    const timer = setInterval(() => {
      setDevices(prev => {
        const now = Date.now();
        return prev.map(d => {
          // Considera online se visto nos últimos 3 minutos
          const isReallyOnline = (now - d.lastSeenAt) < 180000;
          if (d.isOnline !== isReallyOnline) {
            return { ...d, isOnline: isReallyOnline };
          }
          return d;
        });
      });
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  // Recarrega do storage local e nuvem
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const synced = await StorageService.syncConnectedDevices();
      setDevices(synced);
      if (showToast) showToast('Status de rede e aparelhos atualizados com sucesso!');
    } catch {
      setDevices(StorageService.getConnectedDevices());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
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
    const adminName = currentUser?.name || 'Patrick Pessoa (Direção)';
    const updated = StorageService.setDeviceStatus(
      deviceToBlock.id, 
      'BLOQUEADO', 
      blockReason, 
      adminName
    );
    setDevices(updated);
    if (showToast) showToast(`Dispositivo de ${deviceToBlock.operatorName || 'Operador'} foi BLOQUEADO.`);
    setDeviceToBlock(null);
  };

  const handleUnlockDevice = (device: ConnectedDevice) => {
    const updated = StorageService.setDeviceStatus(device.id, 'LIBERADO');
    setDevices(updated);
    if (showToast) showToast(`Acesso LIBERADO para ${device.operatorName || 'Operador'}.`);
  };

  const handleDeleteDevice = (deviceId: string) => {
    if (confirm('Tem certeza que deseja remover este aparelho do histórico de acessos?')) {
      const updated = StorageService.deleteConnectedDevice(deviceId);
      setDevices(updated);
      if (showToast) showToast('Aparelho removido do histórico.');
    }
  };

  // Bloquear todos os celulares móveis (exceto matriz desktop)
  const handleConfirmBlockAll = () => {
    const current = StorageService.getConnectedDevices();
    const adminName = currentUser?.name || 'Patrick Pessoa (Direção)';
    const updated = current.map(d => {
      if (d.connectionType !== 'DESKTOP_ERP') {
        return {
          ...d,
          status: 'BLOQUEADO' as DeviceAccessStatus,
          blockedReason: 'Bloqueio geral preventivo acionado pela Direção',
          blockedAt: Date.now(),
          blockedBy: adminName
        };
      }
      return d;
    });
    StorageService.saveConnectedDevices(updated);
    setDevices(updated);
    setIsConfirmBlockAllModalOpen(false);
    if (showToast) showToast('Todos os aparelhos móveis das filiais foram BLOQUEADOS.');
  };

  // Liberar todos os aparelhos
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

  // Simular conexão de um novo dispositivo
  const handleSimulateConnection = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedStore = stores.find(s => s.id === simStoreId);
    const simulatedDeviceId = 'sim-dev-' + Math.random().toString(36).substring(2, 9);
    
    // Gera MAC e IP realistas
    const hex = '0123456789ABCDEF';
    const randomMac = Array.from({ length: 6 }, () => 
      hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)]
    ).join(':');
    const randomIp = `187.58.${Math.floor(10 + Math.random() * 80)}.${Math.floor(5 + Math.random() * 240)}`;

    const newDev = StorageService.registerDeviceConnection({
      deviceId: simulatedDeviceId,
      storeId: simStoreId,
      storeName: selectedStore?.name || 'FILIAL REDE',
      operatorName: simOperatorName.trim(),
      deviceModel: simDeviceModel.trim(),
      os: simOs.trim(),
      browser: simBrowser.trim(),
      connectionType: 'MOBILE_PORTAL',
      ip: randomIp,
      macAddress: randomMac,
      locationHint: `${selectedStore?.city || 'Rio de Janeiro'}, RJ`
    });

    setDevices(StorageService.getConnectedDevices());
    setIsSimulationModalOpen(false);
    if (showToast) showToast(`Aparelho simulado com sucesso para ${newDev.storeName}!`);
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
      `"${d.isOnline ? 'SIM (Online)' : 'NÃO (Offline)'}"`,
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
    link.download = `Relatorio_Aparelhos_Conectados_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    if (showToast) showToast('Relatório de aparelhos baixado em formato CSV/Excel!');
  };

  // Métricas Consolidadas
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.isOnline).length;
  const authorizedDevices = devices.filter(d => d.status === 'LIBERADO').length;
  const blockedDevices = devices.filter(d => d.status === 'BLOQUEADO').length;
  const totalAccessEvents = devices.reduce((sum, d) => sum + (d.accessCount || 1), 0);
  const totalDurationSeconds = devices.reduce((sum, d) => sum + (d.sessionDurationSeconds || 0), 0);

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
      if (filterStatus === 'ONLINE' && !d.isOnline) return false;
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
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-8 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  MÓDULO DE SEGURANÇA & AUDITORIA
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {onlineDevices} Dispositivos Online
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                Aparelhos Conectados ao Sistema & Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-0.5">
                Controle em tempo real de smartphones, coletores e computadores das 16 filiais. Visualize endereço IP, MAC de rede, histórico de acessos, tempo de permanência e bloqueie ou libere o acesso com 1 clique.
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
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Status'}</span>
            </button>

            <button
              onClick={() => setIsSimulationModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition active:scale-95 shadow-sm"
              title="Simular conexão de um novo smartphone de loja"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simular Conexão</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 shadow-sm"
              title="Exportar planilha de auditoria completa em CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Relatório</span>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Aparelhos</span>
            <Smartphone className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalDevices}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Cadastrados na rede
          </div>
        </div>

        <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span>Online Agora</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
            {onlineDevices}
          </div>
          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80 mt-0.5">
            Atividade nos últ. 3 min
          </div>
        </div>

        <div className="bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/30 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-xs font-semibold">
            <span>Acessos Liberados</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">
            {authorizedDevices}
          </div>
          <div className="text-[10px] text-blue-600/80 dark:text-blue-500/80 mt-0.5">
            Autorizados a lançar
          </div>
        </div>

        <div className="bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/30 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-semibold">
            <span>Bloqueados</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1">
            {blockedDevices}
          </div>
          <div className="text-[10px] text-rose-600/80 dark:text-rose-500/80 mt-0.5">
            Acesso suspenso
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Tempo Médio</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalDevices > 0 ? formatDuration(Math.round(totalDurationSeconds / totalDevices)) : '0m'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Por sessão ativa
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Conexões</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalAccessEvents}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Eventos registrados
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
              placeholder="Buscar por Operador, Filial, IP (187.58...), Endereço MAC ou Modelo de celular..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition placeholder:text-slate-400"
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
                className="appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
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
                className="appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
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
            Nenhum aparelho encontrado com estes filtros
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Experimente limpar a busca ou selecionar outro status de filtro para visualizar as conexões registradas.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); setFilterStore('ALL'); setFilterType('ALL'); }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
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
                  return (
                    <tr 
                      key={dev.id || dev.deviceId}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isBlocked ? 'bg-rose-50/40 dark:bg-rose-950/15' : dev.isOnline ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
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
                          ) : dev.isOnline ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              ONLINE
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
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {dev.operatorName || 'Operador Conectado'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <Building2 className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {dev.storeName || 'MATRIZ / DIRETORIA'}
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
                          <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400">MAC:</span>
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
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{formatDuration(dev.sessionDurationSeconds || 60)}</span>
                        </div>
                      </td>

                      {/* Última Atividade */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {formatLastSeen(dev.lastSeenAt)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Início: {new Date(dev.firstConnectedAt).toLocaleDateString('pt-BR')}
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isBlocked ? (
                            <button
                              onClick={() => handleUnlockDevice(dev)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 shadow-sm"
                              title="Liberar acesso deste aparelho ao portal"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Liberar</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenBlockModal(dev)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-500/30 hover:border-transparent transition active:scale-95"
                              title="Bloquear imediatamente o acesso deste aparelho"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Bloquear</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedDeviceDetails(dev)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Ver Ficha Técnica & Histórico"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteDevice(dev.id || dev.deviceId)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Remover do histórico"
                          >
                            <Trash2 className="w-4 h-4" />
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
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDevices.map((dev) => {
            const isBlocked = dev.status === 'BLOQUEADO';
            return (
              <div
                key={dev.id || dev.deviceId}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all shadow-sm ${
                  isBlocked
                    ? 'border-rose-400/50 dark:border-rose-900/60 bg-gradient-to-br from-white via-white to-rose-50/30 dark:from-slate-900 dark:to-rose-950/20'
                    : dev.isOnline
                    ? 'border-emerald-500/40 dark:border-emerald-500/30 shadow-md shadow-emerald-500/5'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl shrink-0 ${
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
                      <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                        {dev.operatorName || 'Operador Conectado'}
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
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
                    ) : dev.isOnline ? (
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
                      <span className="text-sm font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 shadow-sm"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Liberar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenBlockModal(dev)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition active:scale-95 shadow-sm"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Bloquear</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedDeviceDetails(dev)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Ver Ficha Técnica"
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
      {/* MODAL 1: CONFIRMAÇÃO DE BLOQUEIO COM MOTIVO */}
      {/* ======================================================== */}
      {deviceToBlock && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-rose-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500 text-white shadow-md">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                    SEGURANÇA & RESTRIÇÃO
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Bloquear Acesso do Aparelho
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setDeviceToBlock(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {deviceToBlock.operatorName || 'Operador'}
                </div>
                <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>{deviceToBlock.storeName}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <span>IP: {deviceToBlock.ip}</span>
                  <span>MAC: {deviceToBlock.macAddress}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Selecione ou digite o motivo do bloqueio:
                </label>
                <div className="grid grid-cols-1 gap-1.5 mb-2">
                  {[
                    'Uso fora do horário comercial',
                    'Dispositivo pessoal não autorizado pela gerência',
                    'Troca de encarregado / funcionário desligado',
                    'Suspeita de lançamento divergente ou fraudulento',
                    'Solicitação direta da Diretoria Executiva'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBlockReason(preset)}
                      className={`text-left px-3 py-1.5 rounded-xl border text-[11px] font-medium transition ${
                        blockReason === preset
                          ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ou digite um motivo personalizado..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500/40 focus:outline-none"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>
                  Assim que bloqueado, caso este usuário tente acessar o portal no celular, ele receberá uma tela vermelha informando que o aparelho está suspenso e não conseguirá enviar dados.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeviceToBlock(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition active:scale-95 shadow-md shadow-rose-600/20"
              >
                Confirmar Bloqueio Imediato
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: FICHA TÉCNICA E DETALHES COMPLETOS DO APARELHO */}
      {/* ======================================================== */}
      {selectedDeviceDetails && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-slate-50 to-transparent dark:from-amber-500/10 dark:via-slate-900 dark:to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                    AUDITORIA FORENSE DE CONEXÃO
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Ficha Técnica do Dispositivo
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeviceDetails(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Usuário e Loja */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Identificação do Usuário:</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedDeviceDetails.operatorName || 'Operador Conectado'}
                </div>
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{selectedDeviceDetails.storeName || 'MATRIZ / DIRETORIA'}</span>
                </div>
                {selectedDeviceDetails.locationHint && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span>Localização: {selectedDeviceDetails.locationHint}</span>
                  </div>
                )}
              </div>

              {/* Informações de Hardware & Rede */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                  Especificações do Aparelho & Conexão
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Endereço IP</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                      {selectedDeviceDetails.ip}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Endereço MAC (Placa)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                      {selectedDeviceDetails.macAddress}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Modelo do Celular</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-xs">
                      {selectedDeviceDetails.deviceModel}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Sistema Operacional</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-xs">
                      {selectedDeviceDetails.os}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Navegador Web</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-xs">
                      {selectedDeviceDetails.browser}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Tipo de Plataforma</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-xs">
                      {selectedDeviceDetails.connectionType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Estatísticas de Acesso */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                  Métricas de Sessão & Tempo
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Acessos</span>
                    <span className="font-black text-slate-900 dark:text-white text-base">
                      {selectedDeviceDetails.accessCount || 1}x
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Permanência</span>
                    <span className="font-black text-amber-600 dark:text-amber-400 text-base">
                      {formatDuration(selectedDeviceDetails.sessionDurationSeconds || 60)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Status Atual</span>
                    <span className={`font-black text-xs block mt-1 ${
                      selectedDeviceDetails.status === 'BLOQUEADO' ? 'text-rose-500' : 'text-emerald-500'
                    }`}>
                      {selectedDeviceDetails.status}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Primeiro Acesso Registrado:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(selectedDeviceDetails.firstConnectedAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Última Atividade (Heartbeat):</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(selectedDeviceDetails.lastSeenAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detalhes de Bloqueio se aplicável */}
              {selectedDeviceDetails.status === 'BLOQUEADO' && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 space-y-1 text-rose-800 dark:text-rose-300">
                  <div className="font-bold uppercase text-[10px] tracking-wider">Histórico de Bloqueio:</div>
                  <div>Motivo: {selectedDeviceDetails.blockedReason || 'Suspenso pela administração'}</div>
                  {selectedDeviceDetails.blockedAt && (
                    <div className="text-[11px] text-rose-600 dark:text-rose-400">
                      Bloqueado em: {new Date(selectedDeviceDetails.blockedAt).toLocaleString('pt-BR')}
                    </div>
                  )}
                  {selectedDeviceDetails.blockedBy && (
                    <div className="text-[11px] text-rose-600 dark:text-rose-400">
                      Responsável: {selectedDeviceDetails.blockedBy}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <button
                onClick={() => {
                  if (selectedDeviceDetails.status === 'BLOQUEADO') {
                    handleUnlockDevice(selectedDeviceDetails);
                  } else {
                    handleOpenBlockModal(selectedDeviceDetails);
                  }
                  setSelectedDeviceDetails(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm ${
                  selectedDeviceDetails.status === 'BLOQUEADO' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {selectedDeviceDetails.status === 'BLOQUEADO' ? 'Liberar Acesso Agora' : 'Bloquear Este Aparelho'}
              </button>

              <button
                onClick={() => setSelectedDeviceDetails(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: SIMULAR CONEXÃO DE DISPOSITIVO DE LOJA */}
      {/* ======================================================== */}
      {isSimulationModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-md">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                    AMBIENTE DE TESTE & AUDITORIA
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Simular Nova Conexão de Aparelho
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsSimulationModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateConnection} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Filial (Loja Conectada):
                </label>
                <select
                  value={simStoreId}
                  onChange={(e) => setSimStoreId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                >
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Nome do Operador / Encarregado:
                </label>
                <input
                  type="text"
                  required
                  value={simOperatorName}
                  onChange={(e) => setSimOperatorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Modelo do Smartphone:
                </label>
                <input
                  type="text"
                  required
                  value={simDeviceModel}
                  onChange={(e) => setSimDeviceModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Sistema Operacional:
                  </label>
                  <input
                    type="text"
                    required
                    value={simOs}
                    onChange={(e) => setSimOs(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Navegador:
                  </label>
                  <input
                    type="text"
                    required
                    value={simBrowser}
                    onChange={(e) => setSimBrowser(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSimulationModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition active:scale-95 shadow-md shadow-amber-500/20"
                >
                  Registrar Conexão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CONFIRMAÇÃO DE BLOQUEIO EM MASSA */}
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
                Esta ação suspenderá imediatamente o acesso ao Portal Mobile em todos os smartphones e coletores de todas as filiais. Apenas esta estação Desktop permanecerá liberada.
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
      {/* MODAL 5: CONFIRMAÇÃO DE LIBERAÇÃO EM MASSA */}
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
                Esta ação autorizará imediatamente o acesso e os lançamentos para todos os celulares e estações de todas as 16 lojas da rede.
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
    </div>
  );
};
