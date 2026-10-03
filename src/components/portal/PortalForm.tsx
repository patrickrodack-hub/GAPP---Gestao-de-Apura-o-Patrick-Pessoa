import React, { useState } from 'react';
import { SheetRowData, Store, StockLaunchRecord } from '../../types/erp';
import { 
  recalculateRowOrderFormulas, 
  CutYieldWeights, 
  DEFAULT_CUT_YIELD_WEIGHTS,
  HALF_CARCASS_CUT_YIELD_WEIGHTS,
  formatNumberBR
} from '../../services/calculationService';
import { StorageService } from '../../services/storageService';
import { 
  Beef, 
  Scissors, 
  Layers, 
  Save, 
  CheckCircle2, 
  ArrowLeft, 
  Building2, 
  User, 
  Plus, 
  Minus, 
  RotateCcw, 
  Sparkles, 
  ChevronRight, 
  Warehouse, 
  Flame, 
  Check, 
  History, 
  FileText, 
  Sun, 
  Moon,
  LogOut,
  AlertTriangle,
  HelpCircle,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { PortalLaunchHistory } from './PortalLaunchHistory';
import { PortalTheme } from './MobileStockPortal';

interface PortalFormProps {
  store: Store;
  operatorName: string;
  stores: Store[];
  initialRow: SheetRowData;
  onSave: (updatedRow: SheetRowData) => void;
  onLogout: () => void;
  theme: PortalTheme;
  onToggleTheme: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const PortalForm: React.FC<PortalFormProps> = ({
  store,
  operatorName,
  stores,
  initialRow,
  onSave,
  onLogout,
  theme,
  onToggleTheme,
  isFullscreen,
  onToggleFullscreen
}) => {
  const [activeSection, setActiveSection] = useState<'bovina_camara' | 'bovina_desossa' | 'suina_desossa'>('bovina_camara');
  const [subSection, setSubSection] = useState<'nobres' | 'dianteiro' | 'traseiro'>('nobres');
  const [launchNotes, setLaunchNotes] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<StockLaunchRecord[]>(() => StorageService.getStockLaunchRecords());

  // Pergunta obrigatória: Recebeu BOI hoje?
  const [recebeuBoiHoje, setRecebeuBoiHoje] = useState<boolean | null>(initialRow.recebeuBoiHoje ?? null);

  // Rastreamento obrigatório de navegação pelas abas antes de liberar o salvamento
  const [visitedMainSections, setVisitedMainSections] = useState<Set<'bovina_camara' | 'bovina_desossa' | 'suina_desossa'>>(
    new Set(['bovina_camara'])
  );
  const [visitedSubSections, setVisitedSubSections] = useState<Set<'nobres' | 'dianteiro' | 'traseiro'>>(
    new Set([])
  );

  // Modal de aviso quando o usuário tenta salvar sem ter navegado por todas as abas
  const [missingTabsWarning, setMissingTabsWarning] = useState<string[] | null>(null);

  const yieldParams = StorageService.getYieldParams();
  const currentWeights: CutYieldWeights = yieldParams.basis === 'piece' 
    ? HALF_CARCASS_CUT_YIELD_WEIGHTS 
    : DEFAULT_CUT_YIELD_WEIGHTS;

  const [draft, setDraft] = useState<SheetRowData>(() => {
    return recalculateRowOrderFormulas({ ...initialRow }, currentWeights);
  });
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [savedSummaryMsg, setSavedSummaryMsg] = useState<string>('');

  // Funções de navegação com marcação de visita
  const handleSelectMainSection = (section: 'bovina_camara' | 'bovina_desossa' | 'suina_desossa') => {
    setActiveSection(section);
    setVisitedMainSections(prev => new Set(prev).add(section));
    if (section === 'bovina_desossa') {
      setVisitedSubSections(prev => new Set(prev).add(subSection));
    }
  };

  const handleSelectSubSection = (sub: 'nobres' | 'dianteiro' | 'traseiro') => {
    setSubSection(sub);
    setVisitedSubSections(prev => new Set(prev).add(sub));
    setVisitedMainSections(prev => new Set(prev).add('bovina_desossa'));
  };

  const handleFieldChange = (field: keyof SheetRowData, val: number) => {
    const num = Math.max(0, isNaN(val) ? 0 : val);
    const updated = recalculateRowOrderFormulas({
      ...draft,
      [field]: num
    }, currentWeights);
    setDraft(updated);
  };

  const handleAdjustValue = (field: keyof SheetRowData, delta: number) => {
    const currentVal = Number(draft[field]) || 0;
    handleFieldChange(field, currentVal + delta);
  };

  // Cria uma estrutura de linha limpa com 0 em todos os campos de contagem
  const getZeroedRow = (): SheetRowData => {
    return recalculateRowOrderFormulas({
      ...draft,
      camaraDianteiro: 0,
      camaraTraseiro: 0,
      camaraCoxao: 0,
      camaraAlcatrao: 0,
      camaraCostelaGaucha: 0,
      somaDoTraseiro: 0,
      alcatra: 0,
      alcatraPecas: 0,
      alcatraKg: 0,
      contraFile: 0,
      contraFilePecas: 0,
      contraFileKg: 0,
      picanha: 0,
      picanhaPecas: 0,
      picanhaKg: 0,
      fileMignon: 0,
      fileMignonPecas: 0,
      fileMignonKg: 0,
      costelaCong: 0,
      paletaKg: 0,
      paletaPecas: 0,
      acemKg: 0,
      acemPecas: 0,
      peitoKg: 0,
      peitoPecas: 0,
      musculoKg: 0,
      musculoPecas: 0,
      chaKg: 0,
      chaPecas: 0,
      patinhoKg: 0,
      patinhoPecas: 0,
      lagartoRedondoKg: 0,
      lagartoRedondoPecas: 0,
      lagartoPlanoKg: 0,
      lagartoPlanoPecas: 0,
      bandaKg: 0,
      bandaPecas: 0,
      costelaSuinaPecas: 0,
      pernilPecas: 0,
      pTransito: 0
    }, currentWeights);
  };

  // Validação estrita de navegação antes de salvar
  const handleSaveData = () => {
    const missing: string[] = [];

    // 1. Verifica resposta se recebeu BOI hoje
    if (recebeuBoiHoje === null) {
      missing.push('Resposta obrigatória: Você deve responder se "Recebeu BOI hoje" (SIM ou NÃO)');
    }

    // 2. Verifica abas principais
    if (!visitedMainSections.has('bovina_camara')) {
      missing.push('Aba "1. Bovina Câm." (Estoque das câmaras frigoríficas)');
    }
    if (!visitedMainSections.has('bovina_desossa')) {
      missing.push('Aba "2. Desossa Balcão"');
    }
    if (!visitedMainSections.has('suina_desossa')) {
      missing.push('Aba "3. Suína / Banda" (Estoque suíno e balcão)');
    }

    // 3. Verifica sub-abas obrigatórias de Desossa Balcão
    if (!visitedSubSections.has('nobres')) {
      missing.push('Sub-aba "Nobres" (Alcatra, Contra Filé, Picanha, Mignon, Costela Cong.)');
    }
    if (!visitedSubSections.has('dianteiro')) {
      missing.push('Sub-aba "Dianteiro" (Paleta, Acém, Peito, Músculo)');
    }
    if (!visitedSubSections.has('traseiro')) {
      missing.push('Sub-aba "Traseiro" (Chã, Patinho, Lagarto Redondo e Plano)');
    }

    // Se faltar alguma aba obrigatória, bloqueia e avisa o usuário!
    if (missing.length > 0) {
      setMissingTabsWarning(missing);
      return;
    }

    // Todas as abas foram navegadas e conferidas! Prossegue com o salvamento
    const finalRow = recalculateRowOrderFormulas({
      ...draft,
      recebeuBoiHoje: recebeuBoiHoje ?? false
    }, currentWeights);
    
    // 1. Alimenta e atualiza a linha na Planilha de Compras Oficial
    onSave(finalRow);

    // Salva imediatamente no banco de dados local para garantir persistência garantida da Planilha
    StorageService.saveSingleSheetRow(finalRow);

    // 2. Calcula métricas do envio para histórico
    const totalPecas = finalRow.camaraDianteiro + finalRow.somaDoTraseiro + finalRow.camaraCostelaGaucha +
                       finalRow.alcatra + finalRow.contraFile + finalRow.picanha + finalRow.fileMignon + finalRow.costelaCong +
                       finalRow.paletaPecas + finalRow.acemPecas + finalRow.peitoPecas + finalRow.musculoPecas +
                       finalRow.chaPecas + finalRow.patinhoPecas + finalRow.lagartoRedondoPecas + finalRow.lagartoPlanoPecas +
                       finalRow.bandaPecas + finalRow.costelaSuinaPecas + finalRow.pernilPecas;

    const totalKg = (finalRow.alcatraKg || 0) + (finalRow.contraFileKg || 0) + (finalRow.picanhaKg || 0) + (finalRow.fileMignonKg || 0) +
                    (finalRow.paletaKg || 0) + (finalRow.acemKg || 0) + (finalRow.peitoKg || 0) + (finalRow.musculoKg || 0) +
                    (finalRow.chaKg || 0) + (finalRow.patinhoKg || 0) + (finalRow.lagartoRedondoKg || 0) + (finalRow.lagartoPlanoKg || 0) +
                    (finalRow.bandaKg || 0) + (finalRow.camaraDianteiro * 60) + (finalRow.camaraTraseiro * 60);

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // 3. Salva no histórico de lançamentos do portal
    const launchRecord: StockLaunchRecord = {
      id: `launch-${Date.now()}`,
      date: formattedDate,
      timestamp: now.getTime(),
      storeId: store.id,
      storeName: store.name,
      operatorName: operatorName,
      totalPieces: totalPecas,
      totalKg: Math.round(totalKg),
      boisEquivalente: finalRow.boi || 0,
      sugestaoPedido: finalRow.sugestaoPedido || 0,
      rowData: finalRow,
      recebeuBoiHoje: recebeuBoiHoje ?? false,
      notes: `${launchNotes.trim() ? `${launchNotes.trim()} • ` : ''}Recebeu boi hoje: ${recebeuBoiHoje ? 'SIM' : 'NÃO'}`
    };

    const updatedHistory = StorageService.addStockLaunchRecord(launchRecord);
    setHistoryRecords(updatedHistory);

    // 4. Salva também no histórico de versões da Planilha de Compras
    const currentSheetRows = StorageService.getSheetRows();
    const sheetSnapshot = StorageService.createSnapshotFromRows(
      currentSheetRows,
      `Lançamento Portal - ${store.name}`,
      operatorName,
      'PORTAL_MOBILE',
      `Contagem de estoque enviada via celular pelo operador ${operatorName} para a filial ${store.name} (Recebeu Boi: ${recebeuBoiHoje ? 'SIM' : 'NÃO'}).${launchNotes.trim() ? ` Obs: ${launchNotes.trim()}` : ''}`
    );
    StorageService.addSheetSnapshot(sheetSnapshot);

    setSavedSummaryMsg(`${totalPecas} peças salvas na Planilha (${finalRow.boi} bois). Boi hoje: ${recebeuBoiHoje ? 'SIM' : 'NÃO'}. Gravado em ${formattedDate}!`);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 4500);

    // Limpa os campos do formulário para o próximo lançamento
    const cleanRow = getZeroedRow();
    setDraft(cleanRow);
    setLaunchNotes('');
    // Reseta verificação de abas para o próximo ciclo
    setVisitedMainSections(new Set(['bovina_camara']));
    setVisitedSubSections(new Set([]));
    setRecebeuBoiHoje(null);
  };

  const handleNavigateToMissingTab = (tabName: string) => {
    setMissingTabsWarning(null);
    if (tabName.includes('Bovina Câm')) {
      setActiveSection('bovina_camara');
      setVisitedMainSections(prev => new Set(prev).add('bovina_camara'));
    } else if (tabName.includes('Suína')) {
      setActiveSection('suina_desossa');
      setVisitedMainSections(prev => new Set(prev).add('suina_desossa'));
    } else if (tabName.includes('Nobres')) {
      setActiveSection('bovina_desossa');
      setSubSection('nobres');
      setVisitedMainSections(prev => new Set(prev).add('bovina_desossa'));
      setVisitedSubSections(prev => new Set(prev).add('nobres'));
    } else if (tabName.includes('Dianteiro')) {
      setActiveSection('bovina_desossa');
      setSubSection('dianteiro');
      setVisitedMainSections(prev => new Set(prev).add('bovina_desossa'));
      setVisitedSubSections(prev => new Set(prev).add('dianteiro'));
    } else if (tabName.includes('Traseiro')) {
      setActiveSection('bovina_desossa');
      setSubSection('traseiro');
      setVisitedMainSections(prev => new Set(prev).add('bovina_desossa'));
      setVisitedSubSections(prev => new Set(prev).add('traseiro'));
    } else {
      setActiveSection('bovina_camara');
    }
  };

  const handleRestoreFromHistory = (record: StockLaunchRecord) => {
    if (record.rowData) {
      const restored = recalculateRowOrderFormulas({ ...record.rowData }, currentWeights);
      setDraft(restored);
      if (record.recebeuBoiHoje !== undefined) setRecebeuBoiHoje(record.recebeuBoiHoje);
      if (record.notes) setLaunchNotes(record.notes);
      // Marca todas as abas como visitadas ao restaurar
      setVisitedMainSections(new Set(['bovina_camara', 'bovina_desossa', 'suina_desossa']));
      setVisitedSubSections(new Set(['nobres', 'dianteiro', 'traseiro']));
      setSavedSummaryMsg(`Dados do lançamento de ${record.date} carregados no formulário!`);
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 3000);
    }
  };

  // Totais rápidos da contagem atual
  const totalCamaraPecas = draft.camaraDianteiro + draft.somaDoTraseiro + draft.camaraCostelaGaucha;

  // Status de visitas
  const isCamaraVisited = visitedMainSections.has('bovina_camara');
  const isDesossaVisited = visitedMainSections.has('bovina_desossa') && visitedSubSections.size === 3;
  const isSuinaVisited = visitedMainSections.has('suina_desossa');

  return (
    <div className="min-h-screen flex flex-col font-sans pb-28 select-none transition-colors duration-200">
      {/* Toast Notification */}
      {isSavedToast && (
        <div className="fixed top-4 inset-x-4 z-50 max-w-md mx-auto bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-emerald-400 animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <strong className="block text-xs font-bold">Estoque Salvo na Planilha!</strong>
              <span className="text-[11px] opacity-95">{savedSummaryMsg}</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/20 font-mono">OK</span>
        </div>
      )}

      {/* Top Mobile App Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md px-4 py-2.5 flex items-center justify-between shadow-xs transition-colors">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
            title="Sair do Lançamento da Loja"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
          
          <div className="w-8 h-8 rounded-xl bg-[#0c140d] p-0.5 border border-emerald-500/30 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/icon.svg" alt="Patrick Pessoa" className="w-full h-full object-contain" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                {store.name}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>Resp: <strong className="text-slate-700 dark:text-slate-200">{operatorName}</strong></span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono">{store.city}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Botão de Tela Cheia (Fullscreen) */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title={isFullscreen ? 'Sair da Tela Cheia' : 'Abrir em Tela Cheia (Fullscreen)'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-amber-500" />
              ) : (
                <Maximize2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              )}
            </button>
          )}

          {/* Theme Switcher Toggle (Claro / Escuro) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Botão Histórico */}
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Ver Histórico de Lançamentos de Estoque"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Histórico</span>
          </button>

          {/* Botão Salvar */}
          <button
            type="button"
            onClick={handleSaveData}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar</span>
          </button>
        </div>
      </header>

      {/* Main Section Navigation Pills com Indicadores de Visita Obrigatória */}
      <div className="px-4 pt-3 pb-2 bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/80 sticky top-[53px] z-20 backdrop-blur-md transition-colors">
        <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
          {/* 1. CARNE BOVINA CÂMARA */}
          <button
            type="button"
            onClick={() => handleSelectMainSection('bovina_camara')}
            className={`py-2 px-1.5 rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer relative ${
              activeSection === 'bovina_camara'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold ring-2 ring-amber-400/40'
                : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-transparent shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-1">
              <Beef className="w-3.5 h-3.5" />
              {isCamaraVisited ? (
                <span className="text-[10px] font-extrabold px-1 rounded-full bg-emerald-500 text-white leading-none">✓</span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
            <span className="leading-tight text-center truncate w-full text-[10px] sm:text-[11px]">1. Bovina Câm.</span>
          </button>

          {/* 2. BOVINA DESOSSA */}
          <button
            type="button"
            onClick={() => handleSelectMainSection('bovina_desossa')}
            className={`py-2 px-1.5 rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer relative ${
              activeSection === 'bovina_desossa'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md font-extrabold ring-2 ring-emerald-400/40'
                : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-transparent shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5" />
              {isDesossaVisited ? (
                <span className="text-[10px] font-extrabold px-1 rounded-full bg-emerald-400 text-slate-950 leading-none">✓</span>
              ) : (
                <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  {visitedSubSections.size}/3
                </span>
              )}
            </div>
            <span className="leading-tight text-center truncate w-full text-[10px] sm:text-[11px]">2. Desossa Balcão</span>
          </button>

          {/* 3. SUÍNA DESOSSA */}
          <button
            type="button"
            onClick={() => handleSelectMainSection('suina_desossa')}
            className={`py-2 px-1.5 rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer relative ${
              activeSection === 'suina_desossa'
                ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md font-extrabold ring-2 ring-teal-400/40'
                : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-transparent shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              {isSuinaVisited ? (
                <span className="text-[10px] font-extrabold px-1 rounded-full bg-emerald-500 text-white leading-none">✓</span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
            <span className="leading-tight text-center truncate w-full text-[10px] sm:text-[11px]">3. Suína / Banda</span>
          </button>
        </div>

        {/* Sub-nav for Bovina Desossa com Rastreamento Obrigatório de Nobres, Dianteiro e Traseiro */}
        {activeSection === 'bovina_desossa' && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            {/* Nobres */}
            <button
              type="button"
              onClick={() => handleSelectSubSection('nobres')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                subSection === 'nobres'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent'
              }`}
            >
              <span>Nobres (Alcatrão)</span>
              {visitedSubSections.has('nobres') && <span className="text-[9px]">✓</span>}
            </button>

            {/* Dianteiro */}
            <button
              type="button"
              onClick={() => handleSelectSubSection('dianteiro')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                subSection === 'dianteiro'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent'
              }`}
            >
              <span>Dianteiro</span>
              {visitedSubSections.has('dianteiro') && <span className="text-[9px]">✓</span>}
            </button>

            {/* Traseiro */}
            <button
              type="button"
              onClick={() => handleSelectSubSection('traseiro')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                subSection === 'traseiro'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent'
              }`}
            >
              <span>Traseiro (Coxão)</span>
              {visitedSubSections.has('traseiro') && <span className="text-[9px]">✓</span>}
            </button>
          </div>
        )}
      </div>

      {/* Body Content */}
      <main className="p-4 space-y-4 max-w-lg mx-auto w-full flex-1">
        
        {/* ========================================================================= */}
        {/* BARRA DE SELEÇÃO: RECEBEU BOI HOJE (SIM / NÃO) */}
        {/* ========================================================================= */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Beef className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Recebeu BOI hoje na filial?
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Confirmação obrigatória de recebimento no dia
                </p>
              </div>
            </div>

            {recebeuBoiHoje === null ? (
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300 animate-pulse">
                Pendente
              </span>
            ) : (
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                recebeuBoiHoje 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {recebeuBoiHoje ? '✓ Confirmado SIM' : '✓ Confirmado NÃO'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setRecebeuBoiHoje(true);
                handleFieldChange('recebeuBoiHoje' as any, true as any);
              }}
              className={`py-3 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                recebeuBoiHoje === true
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>SIM (Recebeu Boi)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRecebeuBoiHoje(false);
                handleFieldChange('recebeuBoiHoje' as any, false as any);
              }}
              className={`py-3 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                recebeuBoiHoje === false
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
              <span>NÃO (Não Recebeu)</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SEÇÃO 1: CARNE BOVINA (PEÇA INTEIRA CÂMARA) */}
        {/* ========================================================================= */}
        {activeSection === 'bovina_camara' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 flex items-center justify-between shadow-2xs">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-amber-800 dark:text-amber-400 tracking-wider">
                  Carne Bovina — Peça Inteira Câmara
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Lançamento das peças inteiras e quartos pendurados
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                {totalCamaraPecas} pç
              </span>
            </div>

            {/* Cuts Grid */}
            <div className="space-y-3">
              <MobileCutCard
                title="Dianteiro Câmara"
                subtitle="Quartos dianteiros com osso na câmara"
                unit="pç"
                value={draft.camaraDianteiro}
                onChange={(val) => handleFieldChange('camaraDianteiro', val)}
                onAdjust={(delta) => handleAdjustValue('camaraDianteiro', delta)}
              />

              <MobileCutCard
                title="Traseiro Câmara"
                subtitle="Quartos traseiros com osso na câmara"
                unit="pç"
                value={draft.camaraTraseiro}
                onChange={(val) => handleFieldChange('camaraTraseiro', val)}
                onAdjust={(delta) => handleAdjustValue('camaraTraseiro', delta)}
              />

              <MobileCutCard
                title="Coxão Câmara"
                subtitle="Peças de coxão penduradas na câmara"
                unit="pç"
                value={draft.camaraCoxao}
                onChange={(val) => handleFieldChange('camaraCoxao', val)}
                onAdjust={(delta) => handleAdjustValue('camaraCoxao', delta)}
              />

              <MobileCutCard
                title="Alcatrão Câmara"
                subtitle="Peças de alcatrão completas na câmara"
                unit="pç"
                value={draft.camaraAlcatrao}
                onChange={(val) => handleFieldChange('camaraAlcatrao', val)}
                onAdjust={(delta) => handleAdjustValue('camaraAlcatrao', delta)}
              />

              <MobileCutCard
                title="Costela Gaúcha Câmara"
                subtitle="Costela inteira na câmara"
                unit="pç"
                value={draft.camaraCostelaGaucha}
                onChange={(val) => handleFieldChange('camaraCostelaGaucha', val)}
                onAdjust={(delta) => handleAdjustValue('camaraCostelaGaucha', delta)}
              />

              <MobileCutCard
                title="Peça em Trânsito"
                subtitle="Caminhões frigoríficos em rota de entrega"
                unit="pç"
                value={draft.pTransito}
                onChange={(val) => handleFieldChange('pTransito', val)}
                onAdjust={(delta) => handleAdjustValue('pTransito', delta)}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEÇÃO 2: BOVINA DESOSSA / BALCÃO */}
        {/* ========================================================================= */}
        {activeSection === 'bovina_desossa' && (
          <div className="space-y-4">
            {/* SUB-SEÇÃO 2.1: NOBRES (ALCATRÃO) */}
            {subSection === 'nobres' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-emerald-800 dark:text-emerald-300">
                      Cortes Nobres (Alcatrão)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Peças e kg nobres no balcão e câmara
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                    Total: {draft.totalAlcatrao} pç
                  </span>
                </div>

                <MobileCutCard
                  title="Alcatra"
                  subtitle={`Peso calculado: ${draft.alcatraKg} kg (11kg/pç)`}
                  unit="pç"
                  value={draft.alcatra}
                  onChange={(val) => handleFieldChange('alcatra', val)}
                  onAdjust={(delta) => handleAdjustValue('alcatra', delta)}
                />

                <MobileCutCard
                  title="Contra Filé"
                  subtitle={`Peso calculado: ${draft.contraFileKg} kg (16kg/pç)`}
                  unit="pç"
                  value={draft.contraFile}
                  onChange={(val) => handleFieldChange('contraFile', val)}
                  onAdjust={(delta) => handleAdjustValue('contraFile', delta)}
                />

                <MobileCutCard
                  title="Picanha"
                  subtitle={`Peso calculado: ${draft.picanhaKg} kg (1.6kg/pç)`}
                  unit="pç"
                  value={draft.picanha}
                  onChange={(val) => handleFieldChange('picanha', val)}
                  onAdjust={(delta) => handleAdjustValue('picanha', delta)}
                  isSpecial
                />

                <MobileCutCard
                  title="Filé Mignon"
                  subtitle={`Peso calculado: ${draft.fileMignonKg} kg (2.3kg/pç)`}
                  unit="pç"
                  value={draft.fileMignon}
                  onChange={(val) => handleFieldChange('fileMignon', val)}
                  onAdjust={(delta) => handleAdjustValue('fileMignon', delta)}
                  isSpecial
                />

                <MobileCutCard
                  title="Costela Congelada"
                  subtitle="Costela congelada de giro"
                  unit="pç"
                  value={draft.costelaCong}
                  onChange={(val) => handleFieldChange('costelaCong', val)}
                  onAdjust={(delta) => handleAdjustValue('costelaCong', delta)}
                />
              </div>
            )}

            {/* SUB-SEÇÃO 2.2: DIANTEIRO DESOSSA */}
            {subSection === 'dianteiro' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-purple-800 dark:text-purple-300">
                      Cortes de Dianteiro Desossados
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Cortes derivados do quarto dianteiro
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-purple-500/20 text-purple-800 dark:text-purple-300">
                    Total: {draft.totalDianteiro} pç
                  </span>
                </div>

                <MobileCutCard
                  title="Paleta"
                  subtitle={`Peso calculado: ${draft.paletaKg} kg (18.5kg/pç)`}
                  unit="pç"
                  value={draft.paletaPecas}
                  onChange={(val) => handleFieldChange('paletaPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('paletaPecas', delta)}
                />

                <MobileCutCard
                  title="Acém"
                  subtitle={`Peso calculado: ${draft.acemKg} kg (20kg/pç)`}
                  unit="pç"
                  value={draft.acemPecas}
                  onChange={(val) => handleFieldChange('acemPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('acemPecas', delta)}
                />

                <MobileCutCard
                  title="Peito"
                  subtitle={`Peso calculado: ${draft.peitoKg} kg (11kg/pç)`}
                  unit="pç"
                  value={draft.peitoPecas}
                  onChange={(val) => handleFieldChange('peitoPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('peitoPecas', delta)}
                />

                <MobileCutCard
                  title="Músculo"
                  subtitle={`Peso calculado: ${draft.musculoKg} kg (8.5kg/pç)`}
                  unit="pç"
                  value={draft.musculoPecas}
                  onChange={(val) => handleFieldChange('musculoPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('musculoPecas', delta)}
                />
              </div>
            )}

            {/* SUB-SEÇÃO 2.3: TRASEIRO DESOSSA (COXÃO) */}
            {subSection === 'traseiro' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-rose-800 dark:text-rose-300">
                      Cortes de Traseiro (Coxão)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Cortes desossados do coxão
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-rose-500/20 text-rose-800 dark:text-rose-300">
                    Total: {draft.totalCoxao} pç
                  </span>
                </div>

                <MobileCutCard
                  title="Chã (Coxão Mole)"
                  subtitle={`Peso calculado: ${draft.chaKg} kg (19.5kg/pç)`}
                  unit="pç"
                  value={draft.chaPecas}
                  onChange={(val) => handleFieldChange('chaPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('chaPecas', delta)}
                />

                <MobileCutCard
                  title="Patinho"
                  subtitle={`Peso calculado: ${draft.patinhoKg} kg (12kg/pç)`}
                  unit="pç"
                  value={draft.patinhoPecas}
                  onChange={(val) => handleFieldChange('patinhoPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('patinhoPecas', delta)}
                />

                <MobileCutCard
                  title="Lagarto Redondo"
                  subtitle={`Peso calculado: ${draft.lagartoRedondoKg} kg (4.8kg/pç)`}
                  unit="pç"
                  value={draft.lagartoRedondoPecas}
                  onChange={(val) => handleFieldChange('lagartoRedondoPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('lagartoRedondoPecas', delta)}
                />

                <MobileCutCard
                  title="Lagarto Plano (Coxão Duro)"
                  subtitle={`Peso calculado: ${draft.lagartoPlanoKg} kg (14.5kg/pç)`}
                  unit="pç"
                  value={draft.lagartoPlanoPecas}
                  onChange={(val) => handleFieldChange('lagartoPlanoPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('lagartoPlanoPecas', delta)}
                />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEÇÃO 3: SUÍNA / BANDA (SEM O CARD VENDA ESTIMADA, CONFORME IMAGEM) */}
        {/* ========================================================================= */}
        {activeSection === 'suina_desossa' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 flex items-center justify-between shadow-2xs">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-teal-800 dark:text-teal-300 tracking-wider">
                  Carne Suína & Banda
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Câmara / Balcão e Desossa de Suíno
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                Sug: {draft.bandaSugestao} pç
              </span>
            </div>

            <div className="space-y-3">
              <MobileCutCard
                title="Banda Suína"
                subtitle={`Peso calculado: ${draft.bandaKg} kg (36kg/pç)`}
                unit="pç"
                value={draft.bandaPecas}
                onChange={(val) => handleFieldChange('bandaPecas', val)}
                onAdjust={(delta) => handleAdjustValue('bandaPecas', delta)}
              />

              {/* Venda Estimada removida conforme solicitado na imagem */}

              <MobileCutCard
                title="Costela Suína"
                subtitle="Estoque de costela suína no balcão"
                unit="pç"
                value={draft.costelaSuinaPecas}
                onChange={(val) => handleFieldChange('costelaSuinaPecas', val)}
                onAdjust={(delta) => handleAdjustValue('costelaSuinaPecas', delta)}
              />

              <MobileCutCard
                title="Pernil Suíno"
                subtitle="Estoque de pernil suíno no balcão"
                unit="pç"
                value={draft.pernilPecas}
                onChange={(val) => handleFieldChange('pernilPecas', val)}
                onAdjust={(delta) => handleAdjustValue('pernilPecas', delta)}
              />
            </div>
          </div>
        )}

        {/* Campo de Observações do Lançamento */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-1.5 shadow-2xs">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Observações da Contagem (Opcional):</span>
          </label>
          <textarea
            value={launchNotes}
            onChange={(e) => setLaunchNotes(e.target.value)}
            placeholder="Ex: Contagem realizada às 18h com 2 quartos a desossar..."
            rows={2}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900"
          />
        </div>
      </main>

      {/* Bottom Sticky Action Bar com Botão Sair e Salvar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 p-3 z-40 backdrop-blur-md shadow-lg transition-colors">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2.5">
          {/* Botão Sair */}
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="py-3 px-3.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shrink-0"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Sair</span>
          </button>

          <div className="text-xs font-mono text-center">
            <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase font-sans">Boi Eq.</span>
            <strong className="text-amber-600 dark:text-amber-400 text-sm font-bold">{draft.boi} bois</strong>
          </div>

          {/* Botão Salvar com Validação de Abas */}
          <button
            type="button"
            onClick={handleSaveData}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-extrabold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Lançamento</span>
          </button>
        </div>
      </div>

      {/* Modal de Aviso: Abas Obrigatórias Não Navegadas */}
      {missingTabsWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Está Faltando Lançar Valores!
                </h3>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                  Navegação obrigatória por todas as abas antes de salvar
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              O salvamento só é liberado após você ter navegado e conferido todas as áreas de lançamento (<strong>"Nobres"</strong>, <strong>"Dianteiro"</strong>, <strong>"Traseiro"</strong>, <strong>"1. Bovina Câm."</strong>, <strong>"2. Desossa Balcão"</strong> e <strong>"3. Suína / Banda"</strong>). Isso garante que você não esqueça de passar por nenhuma dessas abas.
            </p>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-400 block mb-1">
                Faltam visitar as seguintes áreas:
              </span>
              <ul className="space-y-1 text-xs text-amber-900 dark:text-amber-200 font-semibold">
                {missingTabsWarning.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleNavigateToMissingTab(missingTabsWarning[0] || '')}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
              >
                <span>Ir para a próxima aba pendente</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setMissingTabsWarning(null)}
                className="w-full py-2 rounded-xl text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Entendi, vou conferir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Saída (Botão Sair) */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Deseja sair do lançamento?
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Filial: {store.name}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Você voltará para a tela inicial de seleção de filial. Se houver valores recém-digitados que não foram salvos, eles serão descartados.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Continuar Lançando
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sim, Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico */}
      {showHistoryModal && (
        <PortalLaunchHistory
          history={historyRecords}
          stores={stores}
          onClose={() => setShowHistoryModal(false)}
          onRestoreLaunch={handleRestoreFromHistory}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
      )}
    </div>
  );
};

// Reusable touch-friendly Cut Card
interface MobileCutCardProps {
  title: string;
  subtitle: string;
  unit: string;
  value: number;
  onChange: (val: number) => void;
  onAdjust: (delta: number) => void;
  isSpecial?: boolean;
}

const MobileCutCard: React.FC<MobileCutCardProps> = ({
  title,
  subtitle,
  unit,
  value,
  onChange,
  onAdjust,
  isSpecial
}) => {
  return (
    <div className={`p-3.5 rounded-2xl border transition-all ${
      value > 0
        ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
        : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
    } shadow-2xs space-y-2.5`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSpecial && <Flame className="w-3.5 h-3.5 text-amber-500" />}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              {subtitle}
            </span>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
          {unit}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Botão Menos */}
        <button
          type="button"
          onClick={() => onAdjust(-1)}
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-base transition active:scale-95 cursor-pointer disabled:opacity-40"
          disabled={value <= 0}
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Input Numérico com Digitação Direta */}
        <div className="flex-1 relative">
          <input
            type="number"
            min="0"
            step="1"
            value={value === 0 ? '' : value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            placeholder="0"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-center text-base font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-500/20 transition"
          />
        </div>

        {/* Botão Mais 1 */}
        <button
          type="button"
          onClick={() => onAdjust(1)}
          className="w-10 h-10 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-base transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Botão Rápido +5 */}
        <button
          type="button"
          onClick={() => onAdjust(5)}
          className="px-2.5 h-10 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-extrabold text-xs flex items-center justify-center transition active:scale-95 cursor-pointer"
        >
          +5
        </button>
      </div>
    </div>
  );
};
