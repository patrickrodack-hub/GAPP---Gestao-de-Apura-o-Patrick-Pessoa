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
  Moon
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
  onSwitchToAdmin: () => void;
  theme: PortalTheme;
  onToggleTheme: () => void;
}

export const PortalForm: React.FC<PortalFormProps> = ({
  store,
  operatorName,
  stores,
  initialRow,
  onSave,
  onLogout,
  onSwitchToAdmin,
  theme,
  onToggleTheme
}) => {
  const [activeSection, setActiveSection] = useState<'bovina_camara' | 'bovina_desossa' | 'suina_desossa'>('bovina_camara');
  const [subSection, setSubSection] = useState<'nobres' | 'dianteiro' | 'traseiro'>('nobres');
  const [launchNotes, setLaunchNotes] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<StockLaunchRecord[]>(() => StorageService.getStockLaunchRecords());

  const yieldParams = StorageService.getYieldParams();
  const currentWeights: CutYieldWeights = yieldParams.basis === 'piece' 
    ? HALF_CARCASS_CUT_YIELD_WEIGHTS 
    : DEFAULT_CUT_YIELD_WEIGHTS;

  const [draft, setDraft] = useState<SheetRowData>(() => {
    return recalculateRowOrderFormulas({ ...initialRow }, currentWeights);
  });
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [savedSummaryMsg, setSavedSummaryMsg] = useState<string>('');

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

  const handleSaveData = () => {
    const finalRow = recalculateRowOrderFormulas(draft, currentWeights);
    
    // 1. Alimenta e atualiza a linha na Planilha de Compras Oficial
    onSave(finalRow);

    // Salva imediatamente no banco de dados local para garantir persistência garantida da Planilha
    const currentSheetRows = StorageService.getSheetRows();
    const updatedSheetRows = currentSheetRows.map(r => r.storeId === finalRow.storeId ? finalRow : r);
    StorageService.saveSheetRows(updatedSheetRows);

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
      notes: launchNotes.trim() || undefined
    };

    const updatedHistory = StorageService.addStockLaunchRecord(launchRecord);
    setHistoryRecords(updatedHistory);

    // 4. Salva também no histórico de versões da Planilha de Compras com data gravada para localização
    const sheetSnapshot = StorageService.createSnapshotFromRows(
      updatedSheetRows,
      `Lançamento Portal - ${store.name}`,
      operatorName,
      'PORTAL_MOBILE',
      `Contagem de estoque enviada via celular pelo operador ${operatorName} para a filial ${store.name}.${launchNotes.trim() ? ` Obs: ${launchNotes.trim()}` : ''}`
    );
    StorageService.addSheetSnapshot(sheetSnapshot);

    setSavedSummaryMsg(`${totalPecas} peças salvas na Planilha (${finalRow.boi} bois). Registro gravado no histórico em ${formattedDate}!`);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 4500);

    // 4. Limpa os campos do formulário para o próximo lançamento conforme solicitado
    const cleanRow = getZeroedRow();
    setDraft(cleanRow);
    setLaunchNotes('');
  };

  const handleRestoreFromHistory = (record: StockLaunchRecord) => {
    if (record.rowData) {
      const restored = recalculateRowOrderFormulas({ ...record.rowData }, currentWeights);
      setDraft(restored);
      if (record.notes) setLaunchNotes(record.notes);
      setSavedSummaryMsg(`Dados do lançamento de ${record.date} carregados no formulário!`);
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 3000);
    }
  };

  // Totais rápidos da contagem atual
  const totalCamaraPecas = draft.camaraDianteiro + draft.somaDoTraseiro + draft.camaraCostelaGaucha;
  const totalCortesDesossa = draft.totalAlcatrao + draft.totalDianteiro + draft.totalCoxao;

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
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-xs transition-colors">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title="Trocar de Loja / Sair"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-xs">
                {store.name}
              </h2>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>Resp: <strong className="text-slate-700 dark:text-slate-200">{operatorName}</strong></span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono">{store.city}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar</span>
          </button>
        </div>
      </header>

      {/* Main Section Navigation Pills */}
      <div className="px-4 pt-3 pb-2 bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/80 sticky top-[57px] z-20 backdrop-blur-md transition-colors">
        <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
          {/* 1. CARNE BOVINA */}
          <button
            type="button"
            onClick={() => setActiveSection('bovina_camara')}
            className={`py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
              activeSection === 'bovina_camara'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold ring-2 ring-amber-400/40'
                : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-transparent shadow-2xs'
            }`}
          >
            <Beef className="w-4 h-4" />
            <span className="leading-tight text-center truncate w-full">1. Bovina Câm.</span>
          </button>

          {/* 2. BOVINA DESOSSA */}
          <button
            type="button"
            onClick={() => setActiveSection('bovina_desossa')}
            className={`py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
              activeSection === 'bovina_desossa'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md font-extrabold ring-2 ring-emerald-400/40'
                : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-transparent shadow-2xs'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span className="leading-tight text-center truncate w-full">2. Desossa Balcão</span>
          </button>

          {/* 3. SUÍNA DESOSSA */}
          <button
            type="button"
            onClick={() => setActiveSection('suina_desossa')}
            className={`py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
              activeSection === 'suina_desossa'
                ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md font-extrabold ring-2 ring-teal-400/40'
                : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-transparent shadow-2xs'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="leading-tight text-center truncate w-full">3. Suína / Banda</span>
          </button>
        </div>

        {/* Sub-nav for Bovina Desossa */}
        {activeSection === 'bovina_desossa' && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSubSection('nobres')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                subSection === 'nobres'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent'
              }`}
            >
              Nobres (Alcatrão)
            </button>
            <button
              type="button"
              onClick={() => setSubSection('dianteiro')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                subSection === 'dianteiro'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent'
              }`}
            >
              Dianteiro
            </button>
            <button
              type="button"
              onClick={() => setSubSection('traseiro')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                subSection === 'traseiro'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent'
              }`}
            >
              Traseiro (Coxão)
            </button>
          </div>
        )}
      </div>

      {/* Body Content */}
      <main className="p-4 space-y-4 max-w-lg mx-auto w-full flex-1">
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
                isSpecial
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEÇÃO 2: CARNE BOVINA DESOSSA BALCÃO */}
        {/* ========================================================================= */}
        {activeSection === 'bovina_desossa' && (
          <div className="space-y-4">
            {/* 2.1 NOBRES */}
            {subSection === 'nobres' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-between shadow-2xs">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-emerald-800 dark:text-emerald-400 tracking-wider">
                      Cortes Nobres & Alcatrão (Balcão)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tot. Alcatrão Calculado = Σ Kg / 22
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    Tot: {draft.totalAlcatrao} pç
                  </span>
                </div>

                <MobileCutCard
                  title="Alcatra"
                  subtitle={`Peso calculado: ${draft.alcatraKg} kg (${currentWeights.alcatra}kg/pç)`}
                  unit="pç"
                  value={draft.alcatra}
                  onChange={(val) => handleFieldChange('alcatra', val)}
                  onAdjust={(delta) => handleAdjustValue('alcatra', delta)}
                />

                <MobileCutCard
                  title="Contra Filé"
                  subtitle={`Peso calculado: ${draft.contraFileKg} kg (${currentWeights.contraFile}kg/pç)`}
                  unit="pç"
                  value={draft.contraFile}
                  onChange={(val) => handleFieldChange('contraFile', val)}
                  onAdjust={(delta) => handleAdjustValue('contraFile', delta)}
                />

                <MobileCutCard
                  title="Picanha"
                  subtitle={`Peso calculado: ${draft.picanhaKg} kg (${currentWeights.picanha}kg/pç)`}
                  unit="pç"
                  value={draft.picanha}
                  onChange={(val) => handleFieldChange('picanha', val)}
                  onAdjust={(delta) => handleAdjustValue('picanha', delta)}
                />

                <MobileCutCard
                  title="Filé Mignon"
                  subtitle={`Peso calculado: ${draft.fileMignonKg} kg (${currentWeights.fileMignon}kg/pç)`}
                  unit="pç"
                  value={draft.fileMignon}
                  onChange={(val) => handleFieldChange('fileMignon', val)}
                  onAdjust={(delta) => handleAdjustValue('fileMignon', delta)}
                />

                <MobileCutCard
                  title="Costela Congelada"
                  subtitle="Estoque em balcão congelado"
                  unit="pç"
                  value={draft.costelaCong}
                  onChange={(val) => handleFieldChange('costelaCong', val)}
                  onAdjust={(delta) => handleAdjustValue('costelaCong', delta)}
                />
              </div>
            )}

            {/* 2.2 DIANTEIRO */}
            {subSection === 'dianteiro' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20 flex items-center justify-between shadow-2xs">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-purple-800 dark:text-purple-400 tracking-wider">
                      Dianteiro Balcão de Desossa
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tot. Dianteiro Calculado = Σ Kg / 35
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-500/30">
                    Tot: {draft.totalDianteiro} pç
                  </span>
                </div>

                <MobileCutCard
                  title="Paleta"
                  subtitle={`Peso calculado: ${draft.paletaKg} kg (${currentWeights.paleta}kg/pç)`}
                  unit="pç"
                  value={draft.paletaPecas}
                  onChange={(val) => handleFieldChange('paletaPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('paletaPecas', delta)}
                />

                <MobileCutCard
                  title="Acém"
                  subtitle={`Peso calculado: ${draft.acemKg} kg (${currentWeights.acem}kg/pç)`}
                  unit="pç"
                  value={draft.acemPecas}
                  onChange={(val) => handleFieldChange('acemPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('acemPecas', delta)}
                />

                <MobileCutCard
                  title="Peito"
                  subtitle={`Peso calculado: ${draft.peitoKg} kg (${currentWeights.peito}kg/pç)`}
                  unit="pç"
                  value={draft.peitoPecas}
                  onChange={(val) => handleFieldChange('peitoPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('peitoPecas', delta)}
                />

                <MobileCutCard
                  title="Músculo"
                  subtitle={`Peso calculado: ${draft.musculoKg} kg (${currentWeights.musculo}kg/pç)`}
                  unit="pç"
                  value={draft.musculoPecas}
                  onChange={(val) => handleFieldChange('musculoPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('musculoPecas', delta)}
                />
              </div>
            )}

            {/* 2.3 TRASEIRO */}
            {subSection === 'traseiro' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 flex items-center justify-between shadow-2xs">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-rose-800 dark:text-rose-400 tracking-wider">
                      Traseiro & Coxão Balcão de Desossa
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tot. Coxão Calculado = Σ Kg / 35
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30">
                    Tot: {draft.totalCoxao} pç
                  </span>
                </div>

                <MobileCutCard
                  title="Chã (Coxão Mole)"
                  subtitle={`Peso calculado: ${draft.chaKg} kg (${currentWeights.cha}kg/pç)`}
                  unit="pç"
                  value={draft.chaPecas}
                  onChange={(val) => handleFieldChange('chaPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('chaPecas', delta)}
                />

                <MobileCutCard
                  title="Patinho"
                  subtitle={`Peso calculado: ${draft.patinhoKg} kg (${currentWeights.patinho}kg/pç)`}
                  unit="pç"
                  value={draft.patinhoPecas}
                  onChange={(val) => handleFieldChange('patinhoPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('patinhoPecas', delta)}
                />

                <MobileCutCard
                  title="Lagarto Redondo (Paulista)"
                  subtitle={`Peso calculado: ${draft.lagartoRedondoKg} kg (${currentWeights.lagartoRedondo}kg/pç)`}
                  unit="pç"
                  value={draft.lagartoRedondoPecas}
                  onChange={(val) => handleFieldChange('lagartoRedondoPecas', val)}
                  onAdjust={(delta) => handleAdjustValue('lagartoRedondoPecas', delta)}
                />

                <MobileCutCard
                  title="Lagarto Plano (Tatu)"
                  subtitle={`Peso calculado: ${draft.lagartoPlanoKg} kg (${currentWeights.lagartoPlano}kg/pç)`}
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
        {/* SEÇÃO 3: CARNE SUÍNA DESOSSA BALCÃO */}
        {/* ========================================================================= */}
        {activeSection === 'suina_desossa' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 flex items-center justify-between shadow-2xs">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-teal-800 dark:text-teal-400 tracking-wider">
                  Carne Suína Desossa Balcão
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

              <MobileCutCard
                title="Venda Estimada (Banda)"
                subtitle="Giro semanal projetado da loja"
                unit="pç"
                value={draft.bandaVenda || 0}
                onChange={(val) => handleFieldChange('bandaVenda', val)}
                onAdjust={(delta) => handleAdjustValue('bandaVenda', delta)}
              />

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

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 p-3 z-40 backdrop-blur-md shadow-lg transition-colors">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-sans">Boi Equivalente</span>
            <strong className="text-amber-600 dark:text-amber-400 text-sm font-bold">{draft.boi} bois</strong>
          </div>

          <button
            type="button"
            onClick={handleSaveData}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-extrabold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Salvar & Limpar para Próximo</span>
          </button>
        </div>
      </div>

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
  isSpecial = false
}) => {
  return (
    <div className={`p-3.5 rounded-2xl border shadow-xs space-y-2.5 transition ${
      isSpecial 
        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40' 
        : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{title}</h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <span className="text-xs font-bold font-mono text-slate-600 dark:text-slate-300">{unit}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Minus 1 */}
        <button
          type="button"
          onClick={() => onAdjust(-1)}
          disabled={value <= 0}
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-800 dark:text-white border border-slate-200/80 dark:border-transparent flex items-center justify-center font-bold active:scale-90 transition shrink-0 cursor-pointer shadow-2xs"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Value Input */}
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={value === 0 ? '' : value}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder="0"
          className="flex-1 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-amber-500 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-center text-base font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
        />

        {/* Plus 1 */}
        <button
          type="button"
          onClick={() => onAdjust(+1)}
          className="w-10 h-10 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-400 border border-amber-200/80 dark:border-transparent flex items-center justify-center font-bold active:scale-90 transition shrink-0 cursor-pointer shadow-2xs"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Quick +5 */}
        <button
          type="button"
          onClick={() => onAdjust(+5)}
          className="h-10 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center active:scale-90 transition shrink-0 cursor-pointer shadow-2xs"
        >
          +5
        </button>
      </div>
    </div>
  );
};
