import React, { useState, useEffect } from 'react';
import { 
  CloudBackupItem, 
  BackupScheduleConfig, 
  BackupPeriodicity 
} from '../../types/erp';
import { CloudBackupService } from '../../services/cloudBackupService';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  Download, 
  Upload, 
  Database, 
  ShieldCheck, 
  Server, 
  HardDrive, 
  FileText, 
  X,
  Play,
  Settings,
  Sliders,
  History
} from 'lucide-react';

interface BackupManagerViewProps {
  onClose?: () => void;
  onRestoreCompleted?: () => void;
  showToast?: (message: string) => void;
}

export const BackupManagerView: React.FC<BackupManagerViewProps> = ({
  onClose,
  onRestoreCompleted,
  showToast
}) => {
  const [backups, setBackups] = useState<CloudBackupItem[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<BackupScheduleConfig>(() => CloudBackupService.getScheduleConfig());
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<CloudBackupItem | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [inspectBackup, setInspectBackup] = useState<CloudBackupItem | null>(null);
  const [activeTab, setActiveTab] = useState<'backups' | 'schedule'>('backups');
  const [backupTitleInput, setBackupTitleInput] = useState('');
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  // Carrega lista de backups
  const loadBackups = async () => {
    setIsLoading(true);
    try {
      await CloudBackupService.syncScheduleFromCloud();
      const list = await CloudBackupService.getBackups();
      setBackups(list);
      setIsQuotaExceeded(CloudBackupService.isLastQuotaExceeded());
      setScheduleConfig(CloudBackupService.getScheduleConfig());
    } catch (e) {
      console.error('Erro ao carregar backups:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  // Disparo manual de backup online
  const handleCreateManualBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const item = await CloudBackupService.createOnlineBackup({
        title: backupTitleInput.trim() || undefined,
        triggerType: 'MANUAL',
        author: 'Diretoria / Patrick Pessoa'
      });
      setBackupTitleInput('');
      await loadBackups();
      if (showToast) {
        showToast(`Backup Online '${item.id}' gerado e sincronizado no Firestore com sucesso!`);
      }
    } catch (e) {
      console.error('Erro ao gerar backup:', e);
      if (showToast) showToast('Erro ao gerar backup online.');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Salvar configurações do agendamento
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSchedule(true);
    try {
      await CloudBackupService.saveScheduleConfig(scheduleConfig);
      if (showToast) {
        showToast('Programação de backup atualizada com sucesso!');
      }
      setScheduleConfig(CloudBackupService.getScheduleConfig());
    } catch (e) {
      console.error('Erro ao salvar agendamento:', e);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Excluir backup
  const handleDeleteBackup = async (id: string) => {
    if (!window.confirm(`Deseja realmente excluir o backup ${id}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await CloudBackupService.deleteBackup(id);
      setBackups(prev => prev.filter(b => b.id !== id));
      if (showToast) showToast('Backup excluído com sucesso.');
    } catch (e) {
      console.error('Erro ao excluir backup:', e);
    }
  };

  // Confirmar restauração
  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;
    setIsRestoring(true);
    try {
      const result = await CloudBackupService.restoreBackup(selectedBackupForRestore.id);
      if (result.success) {
        if (showToast) showToast(result.message);
        setSelectedBackupForRestore(null);
        if (onRestoreCompleted) {
          onRestoreCompleted();
        } else {
          // Recarrega a página se não houver callback específico
          setTimeout(() => window.location.reload(), 1200);
        }
      } else {
        alert(result.message);
      }
    } catch (e) {
      console.error('Erro na restauração:', e);
      alert('Falha ao restaurar backup.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Exportar backup
  const handleExportJson = (b: CloudBackupItem) => {
    CloudBackupService.exportBackupToJson(b);
  };

  // Importar backup de arquivo
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const imported = await CloudBackupService.importBackupFromJson(text);
        await loadBackups();
        if (showToast) showToast(`Backup '${imported.id}' importado com sucesso!`);
      } catch (err: any) {
        alert(err.message || 'Erro ao importar arquivo de backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const nextBackupTimeFormatted = scheduleConfig.nextScheduledTimestamp
    ? new Date(scheduleConfig.nextScheduledTimestamp).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Não agendado';

  const lastBackupTimeFormatted = scheduleConfig.lastBackupTimestamp
    ? new Date(scheduleConfig.lastBackupTimestamp).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : (backups.length > 0 ? backups[0].dateFormatted : 'Nenhum recente');

  const totalBytesAccumulated = backups.reduce((acc, b) => acc + (b.sizeBytes || 0), 0);
  const totalKbFormatted = (totalBytesAccumulated / 1024).toFixed(1) + ' KB';

  return (
    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-w-6xl mx-auto my-4 w-full">
      
      {/* Header Corporativo do Módulo */}
      <div className="bg-gradient-to-r from-[#004b87] via-[#005a9e] to-[#0078d7] text-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner shrink-0">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-sky-200 bg-white/10 px-2 py-0.5 rounded">
                Módulo Online • Firestore Database
              </span>
              <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Tempo Real
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-0.5">
              Central de Backup & Restauração Online
            </h2>
            <p className="text-xs text-blue-100 font-medium">
              Geração, monitoramento em tempo real e agendamento automático com horários definidos pelo usuário
            </p>
          </div>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <label className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-white/15">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Importar (.JSON)</span>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportFile} 
              className="hidden" 
            />
          </label>

          <button
            onClick={loadBackups}
            disabled={isLoading}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Atualizar lista de backups"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-rose-600 text-white rounded-xl transition cursor-pointer"
              title="Fechar módulo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cards de Status e Monitoramento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
        
        {/* Card 1: Status do Banco */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase text-[10px]">Banco de Dados</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base font-black text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Nuvem Firestore</span>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono block mt-0.5">
            ai-studio-erpapuraodoboi
          </span>
        </div>

        {/* Card 2: Último Backup */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase text-[10px]">Último Backup</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
            {lastBackupTimeFormatted}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
            {backups.length > 0 ? `${backups[0].recordsCount} registros salvos` : 'Nenhum registro'}
          </span>
        </div>

        {/* Card 3: Próximo Agendamento */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase text-[10px]">Próximo Agendado</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
            {scheduleConfig.enabled ? nextBackupTimeFormatted : 'Agendamento Desativado'}
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block mt-0.5">
            {scheduleConfig.enabled ? `Período: ${scheduleConfig.periodicity} (${scheduleConfig.scheduledTime})` : 'Ative nas configurações'}
          </span>
        </div>

        {/* Card 4: Total de Backups Armazenados */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase text-[10px]">Histórico de Backups</span>
            <HardDrive className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-base font-black text-slate-900 dark:text-white mt-1">
            {backups.length} {backups.length === 1 ? 'Arquivo' : 'Arquivos'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
            Volume Total: {totalKbFormatted}
          </span>
        </div>

      </div>

      {/* Navegação entre Abas: Lista de Backups vs Configurações de Agendamento */}
      <div className="flex items-center justify-between px-6 pt-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('backups')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'backups'
                ? 'border-[#0078d7] text-[#0078d7] dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Monitoramento & Lista de Backups ({backups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'schedule'
                ? 'border-[#0078d7] text-[#0078d7] dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Configurar Agendamento Online</span>
            {scheduleConfig.enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Disparo Rápido Integrado */}
        {activeTab === 'backups' && (
          <div className="hidden sm:flex items-center gap-2 pb-2">
            <input
              type="text"
              value={backupTitleInput}
              onChange={(e) => setBackupTitleInput(e.target.value)}
              placeholder="Identificador opcional (ex: Fechamento Semanal)"
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500 w-64"
            />
            <button
              onClick={handleCreateManualBackup}
              disabled={isCreatingBackup}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-70 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Gravando na Nuvem...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Gerar Backup Agora</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
        
        {/* ABA 1: LISTA E MONITORAMENTO DOS BACKUPS */}
        {activeTab === 'backups' && (
          <div className="space-y-4">
            
            {/* Barra mobile para gerar backup */}
            <div className="sm:hidden flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                value={backupTitleInput}
                onChange={(e) => setBackupTitleInput(e.target.value)}
                placeholder="Título do backup manual..."
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <button
                onClick={handleCreateManualBackup}
                disabled={isCreatingBackup}
                className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Gerar Backup Online Agora</span>
              </button>
            </div>

            {/* Aviso de Cota Diária do Firestore */}
            {isQuotaExceeded && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <span>Cota Diária de Leituras do Firestore Atingida (50.000 requisições/dia)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 font-mono">Plano Gratuito</span>
                  </div>
                  <p className="leading-relaxed">
                    O banco de dados na nuvem excedeu o limite gratuito diário de leituras. Por este motivo, backups remotos não puderam ser listados do servidor neste instante.
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    • <strong>Reinício da cota:</strong> A cota é zerada diariamente pelo Google Cloud às 00:00 PST (~04:00 BRT).<br />
                    • <strong>Restauração manual:</strong> Você pode usar a ferramenta <strong>"Importar Backup (.json)"</strong> abaixo para restaurar arquivos salvos previamente no seu computador.
                  </p>
                </div>
              </div>
            )}

            {/* Tabela de Monitoramento */}
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                <span className="text-xs block">Carregando backups da nuvem...</span>
              </div>
            ) : backups.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <HardDrive className="w-10 h-10 mx-auto text-slate-400" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isQuotaExceeded ? 'Backups em nuvem temporariamente indisponíveis (Cota Excedida)' : 'Nenhum backup online registrado ainda'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isQuotaExceeded 
                    ? 'A lista de backups da nuvem reaparecerá automaticamente assim que a cota diária for restabelecida pelo Google Cloud. Caso possua um arquivo .json exportado, clique em "Importar Arquivo" abaixo.' 
                    : 'Clique no botão "Gerar Backup Agora" para criar uma cópia completa de segurança no banco Firestore ou ative o agendamento automático.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleCreateManualBackup}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow inline-flex items-center gap-2"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>Criar Backup Agora</span>
                  </button>
                  <label className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow inline-flex items-center gap-2 cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>Importar Arquivo (.json)</span>
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      onChange={handleImportFile}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Identificador / Título</th>
                      <th className="p-3">Data & Hora</th>
                      <th className="p-3">Tipo de Disparo</th>
                      <th className="p-3 text-center">Registros</th>
                      <th className="p-3 text-center">Armazenamento</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Ações de Gestão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
                    {backups.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        {/* ID e Título */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-blue-700 dark:text-sky-400">
                              {b.id}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 block truncate max-w-xs">
                            {b.title}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block">
                            Autor: {b.author}
                          </span>
                        </td>

                        {/* Data e Hora */}
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {b.dateFormatted}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {(b.sizeBytes / 1024).toFixed(1)} KB
                          </span>
                        </td>

                        {/* Tipo de Disparo */}
                        <td className="p-3 whitespace-nowrap">
                          {b.triggerType === 'AUTOMATICO_AGENDADO' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/50 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Automático
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-sky-300 border border-blue-300/50 inline-flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              Manual
                            </span>
                          )}
                        </td>

                        {/* Contagem de Registros */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                            {b.recordsCount}
                          </span>
                          <span className="text-[9px] text-slate-400 block">itens</span>
                        </td>

                        {/* Destino */}
                        <td className="p-3 text-center whitespace-nowrap">
                          {b.storageTarget === 'FIRESTORE_NUVEM' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/70 inline-flex items-center gap-1">
                              <Cloud className="w-3 h-3 text-emerald-600" />
                              Firestore Nuvem
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 inline-flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              Cache Local
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            OK • Válido
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspecionar */}
                            <button
                              onClick={() => setInspectBackup(b)}
                              className="px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-semibold text-[11px] transition cursor-pointer"
                              title="Inspecionar conteúdo do backup"
                            >
                              Ver
                            </button>

                            {/* Exportar JSON */}
                            <button
                              onClick={() => handleExportJson(b)}
                              className="p-1 text-slate-600 hover:text-blue-600 rounded transition cursor-pointer"
                              title="Baixar arquivo JSON no computador"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Restaurar */}
                            <button
                              onClick={() => setSelectedBackupForRestore(b)}
                              className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-400/40 rounded font-bold text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                              title="Restaurar base de dados a partir deste backup"
                            >
                              <CloudDownload className="w-3.5 h-3.5" />
                              <span>Restaurar</span>
                            </button>

                            {/* Excluir */}
                            <button
                              onClick={() => handleDeleteBackup(b.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Excluir backup"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* ABA 2: CONFIGURAÇÃO DE AGENDAMENTO COM HORÁRIO E PERÍODOS DEFINIDOS PELO USUÁRIO */}
        {activeTab === 'schedule' && (
          <form onSubmit={handleSaveSchedule} className="space-y-6 max-w-3xl mx-auto">
            
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Rotina Automática de Backup Online</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Defina o período, dias e horário para gravação automática e silenciosa no banco Firestore
                  </p>
                </div>

                {/* Switch Ativar / Desativar */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={scheduleConfig.enabled}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, enabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className={`text-xs font-bold ${scheduleConfig.enabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                    {scheduleConfig.enabled ? 'Agendador Ativo' : 'Desativado'}
                  </span>
                </label>
              </div>

              {/* Periodicidade */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Periodicidade do Backup
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setScheduleConfig({ ...scheduleConfig, periodicity: 'DIARIO' })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      scheduleConfig.periodicity === 'DIARIO'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-sky-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Diário</span>
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Todos os dias no horário pré-estabelecido
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleConfig({ ...scheduleConfig, periodicity: 'INTERVALO_HORAS' })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      scheduleConfig.periodicity === 'INTERVALO_HORAS'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-sky-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">A Cada X Horas</span>
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Em intervalos contínuos durante a operação
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleConfig({ ...scheduleConfig, periodicity: 'SEMANAL' })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      scheduleConfig.periodicity === 'SEMANAL'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-sky-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Semanal</span>
                      <History className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Em dias selecionados da semana
                    </span>
                  </button>
                </div>
              </div>

              {/* Horário Definido pelo Usuário */}
              {(scheduleConfig.periodicity === 'DIARIO' || scheduleConfig.periodicity === 'SEMANAL') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Horário Definido para Execução (HH:mm)
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={scheduleConfig.scheduledTime}
                        onChange={(e) => setScheduleConfig({ ...scheduleConfig, scheduledTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Recomendado: após o fechamento das 16 lojas (ex: 22:00 ou 23:00)
                    </span>
                  </div>

                  {scheduleConfig.periodicity === 'SEMANAL' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Dias da Semana Programados
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName, idx) => {
                          const isSelected = scheduleConfig.selectedDaysOfWeek.includes(idx);
                          return (
                            <button
                              key={dayName}
                              type="button"
                              onClick={() => {
                                const exists = scheduleConfig.selectedDaysOfWeek.includes(idx);
                                const next = exists
                                  ? scheduleConfig.selectedDaysOfWeek.filter(d => d !== idx)
                                  : [...scheduleConfig.selectedDaysOfWeek, idx];
                                setScheduleConfig({ ...scheduleConfig, selectedDaysOfWeek: next });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {dayName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Intervalo em Horas */}
              {scheduleConfig.periodicity === 'INTERVALO_HORAS' && (
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Frequência do Intervalo
                  </label>
                  <select
                    value={scheduleConfig.intervalHours}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, intervalHours: Number(e.target.value) })}
                    className="w-full sm:w-72 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                  >
                    <option value={1}>A cada 1 hora</option>
                    <option value={2}>A cada 2 horas</option>
                    <option value={4}>A cada 4 horas (Recomendado)</option>
                    <option value={6}>A cada 6 horas</option>
                    <option value={12}>A cada 12 horas</option>
                    <option value={24}>A cada 24 horas</option>
                  </select>
                </div>
              )}

              {/* Retenção e Notificação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Política de Retenção de Backups
                  </label>
                  <select
                    value={scheduleConfig.retentionDays}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, retentionDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                  >
                    <option value={7}>Manter últimos 7 dias</option>
                    <option value={15}>Manter últimos 15 dias</option>
                    <option value={30}>Manter últimos 30 dias (Padrão)</option>
                    <option value={90}>Manter últimos 90 dias</option>
                    <option value={0}>Manter todos (Sem expiração)</option>
                  </select>
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={scheduleConfig.autoNotify}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, autoNotify: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Notificar na tela ao concluir backup automático
                    </span>
                  </label>
                </div>
              </div>

            </div>

            {/* Botão Salvar Programação */}
            <div className="flex justify-end gap-3">
              <button
                type="submit"
                disabled={isSavingSchedule}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
              >
                {isSavingSchedule ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando Configuração...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar Programação de Backup</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>

      {/* MODAL DE CONFIRMAÇÃO DE RESTAURAÇÃO */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 z-[10100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-500/40 space-y-4 animate-scaleUp">
            
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Confirmar Restauração do Backup?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Você está prestes a restaurar o sistema para o ponto de dados gravado em:
              </p>
              <div className="my-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-200">
                <strong>{selectedBackupForRestore.title}</strong>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  ID: {selectedBackupForRestore.id} • {selectedBackupForRestore.dateFormatted}
                </span>
                <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  {selectedBackupForRestore.recordsCount} registros serão aplicados
                </span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                Atenção: Os dados atuais da planilha e estoques serão substituídos pelos dados contidos neste backup.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedBackupForRestore(null)}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md flex items-center gap-1.5"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Restaurando...</span>
                  </>
                ) : (
                  <>
                    <CloudDownload className="w-4 h-4" />
                    <span>Sim, Restaurar Dados</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE INSPEÇÃO DO BACKUP */}
      {inspectBackup && (
        <div className="fixed inset-0 z-[10100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Detalhamento do Pacote de Backup</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {inspectBackup.id} • {inspectBackup.dateFormatted}
                </span>
              </div>
              <button
                onClick={() => setInspectBackup(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Título</span>
                  <span className="font-bold text-slate-800 dark:text-white">{inspectBackup.title}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Autor</span>
                  <span className="font-bold text-slate-800 dark:text-white">{inspectBackup.author}</span>
                </div>
              </div>

              {inspectBackup.payload && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Entidades Contidas no Pacote</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-sans">Lojas Matriz</span>
                      <strong>{inspectBackup.payload.stores?.length || 0} filiais</strong>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-sans">Linhas Planilha</span>
                      <strong>{inspectBackup.payload.sheetRows?.length || 0} linhas</strong>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-sans">Fornecedores</span>
                      <strong>{inspectBackup.payload.suppliers?.length || 0} itens</strong>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-sans">Cortes e Carnes</span>
                      <strong>{inspectBackup.payload.products?.length || 0} cortes</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-[11px] text-slate-600 dark:text-slate-400">
                <span>Checksum de Integridade: <strong>{inspectBackup.checksum}</strong></span>
                <span className="block mt-0.5">Destino: <strong>{inspectBackup.storageTarget}</strong></span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleExportJson(inspectBackup)}
                className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Arquivo</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectBackup(null)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
