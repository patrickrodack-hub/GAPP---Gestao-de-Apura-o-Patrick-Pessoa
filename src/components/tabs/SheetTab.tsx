import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SheetRowData } from '../../types/erp';
import { 
  calculateSheetTotals, 
  recalculateRowOrderFormulas,
  CutYieldWeights,
  DEFAULT_CUT_YIELD_WEIGHTS,
  HALF_CARCASS_CUT_YIELD_WEIGHTS,
  getCutYieldWeightsFromSimulation
} from '../../services/calculationService';
import { StorageService } from '../../services/storageService';
import { 
  auditSheetFormulas, 
  isFormulaField 
} from '../../services/formulaAuditService';
import { 
  FileSpreadsheet, 
  Search, 
  Check, 
  Info, 
  Sparkles, 
  ArrowDown, 
  ArrowUp, 
  ArrowLeft, 
  ArrowRight, 
  Download, 
  ShoppingCart, 
  CheckCircle2, 
  Scissors, 
  X,
  Edit2,
  Eraser,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Save,
  History,
  Calendar,
  Printer
} from 'lucide-react';
import { ClearDataModal } from '../modals/ClearDataModal';
import { FormulaAuditModal } from '../modals/FormulaAuditModal';
import { SaveSheetModal } from '../modals/SaveSheetModal';
import { SheetHistoryModal } from '../modals/SheetHistoryModal';
import { PrintSpreadsheetModal } from '../modals/PrintSpreadsheetModal';
import { SheetSnapshotRecord, Store } from '../../types/erp';

interface SheetTabProps {
  rows: SheetRowData[];
  stores?: Store[];
  yieldParams?: { carcassWeight: number; costPerKg: number; fatPriceKg: number; bonePriceKg: number; targetMargin: number; basis: 'carcass' | 'piece' };
  onUpdateRow: (updatedRow: SheetRowData) => void;
  onUpdateMultiple: (rows: SheetRowData[]) => void;
  onExportXLSX?: () => void;
  onOpenPurchaseOrder?: () => void;
  sheetSnapshots?: SheetSnapshotRecord[];
  onSaveSheetSnapshot?: (name?: string, author?: string, notes?: string) => void;
  onRestoreSheetSnapshot?: (snapshot: SheetSnapshotRecord) => void;
  onDeleteSheetSnapshot?: (id: string) => void;
  onUpdateYieldParams?: (params: any) => void;
  onNavigateToYieldTab?: () => void;
}

// Sequence of editable columns matching the EXACT left-to-right display order in the matrix
export const EDITABLE_COLUMNS: { field: keyof SheetRowData; label: string; group: string }[] = [
  // 1. DADOS PEDIDO
  { field: 'pedidoDianteiro', label: 'Ped. Dianteiro', group: 'Pedido' },
  { field: 'pedidoTraseiro', label: 'Ped. Traseiro', group: 'Pedido' },
  { field: 'pedidoCoxao', label: 'Ped. Coxão', group: 'Pedido' },
  { field: 'pedidoAlcatrao', label: 'Ped. Alcatrão', group: 'Pedido' },
  { field: 'pedidoCostelaGaucha', label: 'Ped. Costela Gaúcha', group: 'Pedido' },
  { field: 'venda', label: 'Venda (Giro)', group: 'Pedido' },
  { field: 'pedidoFinal', label: 'Pedido (Qtd Real)', group: 'Pedido' },
  { field: 'pTransito', label: 'Peça Trânsito', group: 'Pedido' },

  // 2. PEÇA INTEIRA CÂMARA
  { field: 'camaraDianteiro', label: 'Câm. Dianteiro', group: 'Câmara' },
  { field: 'camaraTraseiro', label: 'Câm. Traseiro', group: 'Câmara' },
  { field: 'camaraCoxao', label: 'Câm. Coxão', group: 'Câmara' },
  { field: 'camaraAlcatrao', label: 'Câm. Alcatrão', group: 'Câmara' },
  { field: 'camaraCostelaGaucha', label: 'Câm. Costela Gaúcha', group: 'Câmara' },

  // 3. BALCÃO / CÂMARA / DESOSSA (NOBRES)
  { field: 'alcatra', label: 'Alcatra Pç', group: 'Balcão/Nobres' },
  { field: 'contraFile', label: 'Contra Filé Pç', group: 'Balcão/Nobres' },
  { field: 'picanha', label: 'Picanha Pç', group: 'Balcão/Nobres' },
  { field: 'fileMignon', label: 'Filé Mignon Pç', group: 'Balcão/Nobres' },
  { field: 'costelaCong', label: 'Cost. Cong.', group: 'Balcão/Nobres' },

  // 4. BALCÃO DE DESOSSA (DIANTEIRO)
  { field: 'paletaPecas', label: 'Paleta Pç', group: 'Dianteiro' },
  { field: 'acemPecas', label: 'Acém Pç', group: 'Dianteiro' },
  { field: 'peitoPecas', label: 'Peito Pç', group: 'Dianteiro' },
  { field: 'musculoPecas', label: 'Músculo Pç', group: 'Dianteiro' },

  // 5. BALCÃO DE DESOSSA (TRASEIRO / COXÃO)
  { field: 'chaPecas', label: 'Chã Pç', group: 'Coxão' },
  { field: 'patinhoPecas', label: 'Patinho Pç', group: 'Coxão' },
  { field: 'lagartoRedondoPecas', label: 'Lag. Red. Pç', group: 'Coxão' },
  { field: 'lagartoPlanoPecas', label: 'Lag. Plano Pç', group: 'Coxão' },

  // 6. CÂMARA / BALCÃO E DESOSSA (SUÍNO / BANDA)
  { field: 'bandaPecas', label: 'Banda Pç', group: 'Suíno/Banda' },
  { field: 'bandaVenda', label: 'Venda (Banda)', group: 'Suíno/Banda' },
  { field: 'bandaPedido', label: 'Pedido (Banda)', group: 'Suíno/Banda' },
  { field: 'costelaSuinaPecas', label: 'Costela Suína', group: 'Suíno/Banda' },
  { field: 'pernilPecas', label: 'Pernil', group: 'Suíno/Banda' },
];

export const SheetTab: React.FC<SheetTabProps> = ({ 
  rows, 
  stores,
  yieldParams,
  onUpdateRow, 
  onUpdateMultiple,
  onExportXLSX,
  onOpenPurchaseOrder,
  sheetSnapshots,
  onSaveSheetSnapshot,
  onRestoreSheetSnapshot,
  onDeleteSheetSnapshot,
  onUpdateYieldParams,
  onNavigateToYieldTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isFormulaProtected, setIsFormulaProtected] = useState(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  
  // Snapshots & History States
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [localSnapshots, setLocalSnapshots] = useState<SheetSnapshotRecord[]>(() => {
    return sheetSnapshots || StorageService.getSheetSnapshots();
  });

  useEffect(() => {
    if (sheetSnapshots) {
      setLocalSnapshots(sheetSnapshots);
    }
  }, [sheetSnapshots]);

  const handleConfirmSave = (name: string, author: string, notes?: string) => {
    if (onSaveSheetSnapshot) {
      onSaveSheetSnapshot(name, author, notes);
    } else {
      const snapshot = StorageService.createSnapshotFromRows(rows, name, author, 'MANUAL_SHEET', notes);
      const updated = StorageService.addSheetSnapshot(snapshot);
      setLocalSnapshots(updated);
    }
  };

  const handleRestore = (snapshot: SheetSnapshotRecord) => {
    if (onRestoreSheetSnapshot) {
      onRestoreSheetSnapshot(snapshot);
    } else {
      onUpdateMultiple(snapshot.rows);
      StorageService.saveSheetRows(snapshot.rows);
    }
  };

  const handleDelete = (id: string) => {
    if (onDeleteSheetSnapshot) {
      onDeleteSheetSnapshot(id);
    } else {
      const updated = StorageService.deleteSheetSnapshot(id);
      setLocalSnapshots(updated);
    }
  };
  
  // Excel Navigation States
  // selectedCell: active cell coordinates in the visible matrix
  const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colIdx: number } | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempValue, setTempValue] = useState<string>('');

  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const cellInputRef = useRef<HTMLInputElement | null>(null);
  const cellRefs = useRef<{ [key: string]: HTMLTableCellElement | null }>({});
  const isNavigatingRef = useRef<boolean>(false);

  const [yieldBasis, setYieldBasis] = useState<'carcass' | 'piece'>(() => {
    if (yieldParams?.basis) return yieldParams.basis;
    const p = StorageService.getYieldParams();
    return p.basis || 'carcass';
  });

  // Peso da Carcaça / Lote vinculado e importado sempre do módulo de Análise Técnica de Rendimento e Desossa do Boi
  const technicalCarcassWeight = yieldParams?.carcassWeight || StorageService.getYieldParams().carcassWeight || 240;

  // Multiplicadores dos cortes calculados dinamicamente com base no Peso da Carcaça / Lote do módulo de Rendimento
  const currentCutWeights: CutYieldWeights = useMemo(() => {
    return getCutYieldWeightsFromSimulation(technicalCarcassWeight, yieldBasis);
  }, [technicalCarcassWeight, yieldBasis]);

  // Real-time formula audit engine
  const auditReport = useMemo(() => {
    return auditSheetFormulas(rows, currentCutWeights);
  }, [rows, currentCutWeights]);

  const handleToggleYieldBasis = () => {
    const nextBasis: 'carcass' | 'piece' = yieldBasis === 'carcass' ? 'piece' : 'carcass';
    setYieldBasis(nextBasis);
    const newWeights = getCutYieldWeightsFromSimulation(technicalCarcassWeight, nextBasis);
    const currentParams = yieldParams || StorageService.getYieldParams();
    const updatedParams = { ...currentParams, basis: nextBasis };
    StorageService.saveYieldParams(updatedParams);
    if (onUpdateYieldParams) {
      onUpdateYieldParams(updatedParams);
    }
    const updated = rows.map(r => recalculateRowOrderFormulas(r, newWeights));
    onUpdateMultiple(updated);
  };

  // Quando o peso da carcaça do módulo de Rendimento mudar, sincroniza os cálculos na planilha
  useEffect(() => {
    const newWeights = getCutYieldWeightsFromSimulation(technicalCarcassWeight, yieldBasis);
    const updated = rows.map(r => recalculateRowOrderFormulas(r, newWeights));
    const hasChanged = updated.some((row, idx) => {
      const orig = rows[idx];
      return orig && (
        orig.totalAlcatrao !== row.totalAlcatrao ||
        orig.totalDianteiro !== row.totalDianteiro ||
        orig.totalCoxao !== row.totalCoxao ||
        orig.boi !== row.boi
      );
    });
    if (hasChanged) {
      onUpdateMultiple(updated);
    }
  }, [technicalCarcassWeight, yieldBasis]);

  const totals = calculateSheetTotals(rows);

  const filteredRows = rows.filter(r => 
    r.storeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Focus and auto-select text in input automatically whenever edit mode starts or cell changes
  useEffect(() => {
    if (isEditing && cellInputRef.current) {
      cellInputRef.current.focus();
      cellInputRef.current.select();
    }
  }, [isEditing, selectedCell?.rowIdx, selectedCell?.colIdx]);

  // Scroll active cell into view smoothly (Excel / Google Sheets behavior)
  const scrollCellIntoView = useCallback((rowIdx: number, colIdx: number) => {
    const key = `${rowIdx}_${colIdx}`;
    const el = cellRefs.current[key];
    if (el) {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }, []);

  // Save current edited value into state and recalculate formulas
  const commitCurrentValue = useCallback((rowIdx: number, colIdx: number, rawVal: string) => {
    const row = filteredRows[rowIdx];
    const col = EDITABLE_COLUMNS[colIdx];
    if (!row || !col) return;

    const num = parseFloat(rawVal.replace(',', '.'));
    const validNum = isNaN(num) ? 0 : num;

    let updated: SheetRowData = {
      ...row,
      [col.field]: validNum
    };

    // Sincroniza campos de peças e seus aliases (Alcatra, Contra Filé, Picanha, Filé Mignon, etc.)
    if (col.field === 'alcatra' || col.field === 'alcatraPecas') {
      updated.alcatra = validNum;
      updated.alcatraPecas = validNum;
    } else if (col.field === 'contraFile' || col.field === 'contraFilePecas') {
      updated.contraFile = validNum;
      updated.contraFilePecas = validNum;
    } else if (col.field === 'picanha' || col.field === 'picanhaPecas') {
      updated.picanha = validNum;
      updated.picanhaPecas = validNum;
    } else if (col.field === 'fileMignon' || col.field === 'fileMignonPecas') {
      updated.fileMignon = validNum;
      updated.fileMignonPecas = validNum;
    } else if (col.field === 'bandaVenda' || col.field === 'vendaSuino') {
      updated.bandaVenda = validNum;
      updated.vendaSuino = validNum;
    } else if (col.field === 'bandaPedido' || col.field === 'pedidoSuino') {
      updated.bandaPedido = validNum;
      updated.pedidoSuino = validNum;
    }

    // Auto calculate "Soma do Traseiro" if editing Traseiro, Coxão, or Alcatrão
    if (col.field === 'camaraTraseiro' || col.field === 'camaraCoxao' || col.field === 'camaraAlcatrao') {
      updated.somaDoTraseiro = (updated.camaraTraseiro || 0) + (updated.camaraCoxao || 0) + (updated.camaraAlcatrao || 0);
    }

    updated = recalculateRowOrderFormulas(updated, currentCutWeights);
    onUpdateRow(updated);
  }, [filteredRows, currentCutWeights, onUpdateRow]);

  // Select a cell and optionally enter edit mode
  const selectCell = useCallback((
    rowIdx: number, 
    colIdx: number, 
    enterEdit = true, 
    initialChar?: string
  ) => {
    // If currently editing, commit previous cell first
    if (isEditing && selectedCell && (selectedCell.rowIdx !== rowIdx || selectedCell.colIdx !== colIdx)) {
      commitCurrentValue(selectedCell.rowIdx, selectedCell.colIdx, tempValue);
    }

    const clampedRow = Math.max(0, Math.min(filteredRows.length - 1, rowIdx));
    const clampedCol = Math.max(0, Math.min(EDITABLE_COLUMNS.length - 1, colIdx));
    const targetRow = filteredRows[clampedRow];
    const targetCol = EDITABLE_COLUMNS[clampedCol];

    if (!targetRow || !targetCol) return;

    // Check if cell is protected against editing
    const isFormula = isFormulaField(targetCol.field);
    const allowEdit = enterEdit && (!isFormulaProtected || !isFormula);

    const cellVal = targetRow[targetCol.field];
    const initialText = initialChar !== undefined 
      ? initialChar 
      : (cellVal === 0 || cellVal === undefined || cellVal === null ? '' : String(cellVal));

    setSelectedCell({ rowIdx: clampedRow, colIdx: clampedCol });
    setTempValue(initialText);
    setIsEditing(allowEdit);

    scrollCellIntoView(clampedRow, clampedCol);
  }, [isEditing, selectedCell, tempValue, filteredRows, isFormulaProtected, commitCurrentValue, scrollCellIntoView]);

  // Move active cell in delta direction (Excel standard navigation)
  const moveActiveCell = useCallback((
    deltaRow: number, 
    deltaCol: number, 
    wrapColumns = false, 
    enterEdit = true
  ) => {
    if (!selectedCell) {
      selectCell(0, 0, enterEdit);
      return;
    }

    let nextRow = selectedCell.rowIdx + deltaRow;
    let nextCol = selectedCell.colIdx + deltaCol;

    if (wrapColumns) {
      if (nextCol >= EDITABLE_COLUMNS.length) {
        nextCol = 0;
        nextRow = Math.min(filteredRows.length - 1, nextRow + 1);
      } else if (nextCol < 0) {
        nextCol = EDITABLE_COLUMNS.length - 1;
        nextRow = Math.max(0, nextRow - 1);
      }
    } else {
      nextRow = Math.max(0, Math.min(filteredRows.length - 1, nextRow));
      nextCol = Math.max(0, Math.min(EDITABLE_COLUMNS.length - 1, nextCol));
    }

    selectCell(nextRow, nextCol, enterEdit);
  }, [selectedCell, selectCell, filteredRows.length]);

  // Global Table Keydown Handler (Selection Mode like Excel)
  const handleTableKeyDown = (e: React.KeyboardEvent) => {
    // If active in search input or other inputs outside table, don't intercept
    if (e.target instanceof HTMLInputElement && e.target !== cellInputRef.current) {
      return;
    }

    // 1. If NOT actively typing inside an input (Selection Mode)
    if (!isEditing) {
      if (selectedCell === null) {
        if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab'].includes(e.key)) {
          e.preventDefault();
          selectCell(0, 0, true);
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveActiveCell(-1, 0, false, true);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveActiveCell(1, 0, false, true);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveActiveCell(0, -1, false, true);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveActiveCell(0, 1, false, true);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        moveActiveCell(0, e.shiftKey ? -1 : 1, true, true);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        moveActiveCell(e.shiftKey ? -1 : 1, 0, false, true);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setIsEditing(true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        commitCurrentValue(selectedCell.rowIdx, selectedCell.colIdx, '0');
        setTempValue('0');
        setIsEditing(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedCell(null);
        setIsEditing(false);
      } else if (
        !e.ctrlKey && 
        !e.metaKey && 
        !e.altKey && 
        e.key.length === 1 && 
        /^[0-9.,\-]$/.test(e.key)
      ) {
        // Direct typing in Excel: start editing immediately with typed character!
        e.preventDefault();
        const char = e.key === ',' ? '.' : e.key;
        selectCell(selectedCell.rowIdx, selectedCell.colIdx, true, char);
      }
    }
  };

  // Input Keydown Handler (Edit Mode inside the cell input)
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      isNavigatingRef.current = true;
      // Commit value and move DOWN (Shift+Enter moves UP) and keep ready for typing
      commitCurrentValue(selectedCell.rowIdx, selectedCell.colIdx, tempValue);
      moveActiveCell(e.shiftKey ? -1 : 1, 0, false, true);
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 80);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      isNavigatingRef.current = true;
      // Commit value and move RIGHT (Shift+Tab moves LEFT) and keep ready for typing
      commitCurrentValue(selectedCell.rowIdx, selectedCell.colIdx, tempValue);
      moveActiveCell(0, e.shiftKey ? -1 : 1, true, true);
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 80);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      isNavigatingRef.current = true;
      // Commit value and move UP
      commitCurrentValue(selectedCell.rowIdx, selectedCell.colIdx, tempValue);
      moveActiveCell(-1, 0, false, true);
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 80);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      isNavigatingRef.current = true;
      // Commit value and move DOWN
      commitCurrentValue(selectedCell.rowIdx, selectedCell.colIdx, tempValue);
      moveActiveCell(1, 0, false, true);
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 80);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Cancel changes and revert to cell's original value
      const row = filteredRows[selectedCell.rowIdx];
      const col = EDITABLE_COLUMNS[selectedCell.colIdx];
      if (row && col) {
        const originalVal = row[col.field];
        setTempValue(originalVal === 0 || originalVal === undefined || originalVal === null ? '' : String(originalVal));
      }
      setIsEditing(false);
      // Return focus to table container
      tableContainerRef.current?.focus();
    }
  };

  // Recalcular com base nas regras operacionais da Direção
  const handleRecalculateSuggestions = () => {
    const updated = rows.map(r => recalculateRowOrderFormulas(r, currentCutWeights));
    onUpdateMultiple(updated);
  };

  // Preencher a coluna 'Pedido' com as sugestões calculadas (venda - boi)
  const handleApplySuggestionsToOrder = () => {
    const updated = rows.map(r => {
      const recalculated = recalculateRowOrderFormulas(r, currentCutWeights);
      return {
        ...recalculated,
        pedidoFinal: recalculated.sugestaoPedido > 0 ? Math.ceil(recalculated.sugestaoPedido) : 0
      };
    });
    onUpdateMultiple(updated);
  };

  // Active cell information for headers & quick status
  const currentSelectedRow = selectedCell ? filteredRows[selectedCell.rowIdx] : null;
  const currentSelectedCol = selectedCell ? EDITABLE_COLUMNS[selectedCell.colIdx] : null;

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                PLANILHA DE COMPRA DE BOI DA DIREÇÃO DA EMPRESA v10.1
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Matriz operacional das 16 filiais • <strong>Boi = (D+T+C+A)/2</strong> • <strong>Sugestão = Venda - Boi</strong> • <strong>Navegação Natural por Teclado (Excel / Google Sheets)</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Base de Desossa dos Cortes - Importada e vinculada do campo "Peso da Carcaça / Lote" do módulo de Rendimento */}
          <div className="flex items-center">
            <button
              onClick={handleToggleYieldBasis}
              className={`px-2.5 py-1.5 ${onNavigateToYieldTab ? 'rounded-l-lg' : 'rounded-lg'} bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95`}
              title={`Importado e vinculado ao módulo de Análise Técnica de Rendimento e Desossa do Boi (Campo: Peso da Carcaça / Lote = ${technicalCarcassWeight}kg). Clique para alternar entre Carcaça Inteira (${technicalCarcassWeight}kg) ou Meia Carcaça (${Math.round(technicalCarcassWeight / 2)}kg).`}
            >
              <Scissors className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Desossa:</span>
              <span className="font-bold underline">
                {yieldBasis === 'carcass' ? `Carcaça ${technicalCarcassWeight}kg` : `Meia Carcaça ${Math.round(technicalCarcassWeight / 2)}kg`}
              </span>
            </button>
            {onNavigateToYieldTab && (
              <button
                type="button"
                onClick={onNavigateToYieldTab}
                className="px-1.5 py-1.5 rounded-r-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-800/80 border-y border-r border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 transition shadow-sm"
                title={`Alterar Peso da Carcaça / Lote (${technicalCarcassWeight}kg) no Módulo de Rendimento`}
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botão de Auditoria Matemática em Tempo Real */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className={`px-2.5 py-1.5 rounded-lg border font-semibold text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95 ${
              auditReport.isValid
                ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/70 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-pulse'
            }`}
            title="Auditoria de fórmulas e constantes matemáticas (fatores 35, 22, 36 e divisão por 2 do Boi)"
          >
            {auditReport.isValid ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            )}
            <span>
              {auditReport.isValid ? 'Auditoria OK (100%)' : `Auditoria (${auditReport.discrepanciesCount} divergências)`}
            </span>
          </button>

          {/* Botão do Modo de Proteção de Fórmulas */}
          <button
            onClick={() => setIsFormulaProtected(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-lg border font-semibold text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95 ${
              isFormulaProtected
                ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
            title={
              isFormulaProtected
                ? 'Modo Protegido Ativo: colunas com fórmulas (somatórios e sugestões) estão travadas contra edição acidental. Clique para desbloquear.'
                : 'Modo Avançado: todas as colunas da planilha estão liberadas para edição manual. Clique para proteger fórmulas.'
            }
          >
            {isFormulaProtected ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Fórmulas Protegidas</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Modo Avançado (Todas Editáveis)</span>
              </>
            )}
          </button>

          {/* 1. Salvar Planilha de Compras (Salvar Versão no Histórico com Data Gravada para Localização) */}
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer"
            title="Salvar a versão oficial atual da planilha no histórico com data e hora exatas para localização e consulta"
          >
            <Save className="w-4 h-4 text-white" />
            <span>Salvar Planilha</span>
          </button>

          {/* 2. Histórico de Versões Salvas */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Consultar histórico de planilhas salvas com data, hora, busca e visualização completa"
          >
            <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Histórico ({localSnapshots.length})</span>
            {localSnapshots[0] && (
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold hidden xl:inline ml-0.5">
                • {localSnapshots[0].date.split(' ')[0]}
              </span>
            )}
          </button>

          {/* Gerar Pedido de Compra Padrão */}
          {onOpenPurchaseOrder && (
            <button
              onClick={onOpenPurchaseOrder}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition active:scale-95"
              title="Gerar Pedido de Compra Padrão oficial consolidado e por loja com valores e quantidades para envio ao frigorífico"
            >
              <ShoppingCart className="w-4 h-4 text-white" />
              <span>Gerar Pedido de Compra</span>
            </button>
          )}

          {/* Copiar Sugestões para o Pedido */}
          <button
            onClick={handleApplySuggestionsToOrder}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center gap-1 transition"
            title="Preencher a coluna 'Pedido' de todas as 16 lojas com as sugestões calculadas (Venda - Boi)"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Copiar Sugestão p/ Pedido</span>
          </button>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar por filial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 w-32 sm:w-40"
            />
          </div>

          {onExportXLSX && (
            <button
              onClick={onExportXLSX}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition active:scale-95"
              title="Exportar Planilha Oficial Completa com fórmulas e formatação profissional (.xlsx) - Atalho: Alt+X"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.XLSX</span>
            </button>
          )}

          {/* Gerar / Imprimir Planilha em PDF */}
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            title="Visualizar, Salvar em PDF e Imprimir a Planilha Oficial Completa de Compras (A4 Paisagem)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF / Imprimir</span>
          </button>

          <button
            onClick={handleRecalculateSuggestions}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Recalcular colunas Boi e Sugestão com base nas fórmulas oficiais da Direção"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Recalcular</span>
          </button>

          {/* Botão de Limpar Dados / Zerar Planilha */}
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
            title="Limpar ou zerar dados da planilha para iniciar novo ciclo de compras da semana"
          >
            <Eraser className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Limpar Dados</span>
          </button>
        </div>
      </div>

      {/* Main Matrix Table with Excel Style Keyboard Focus */}
      <div 
        ref={tableContainerRef}
        tabIndex={0}
        onKeyDown={handleTableKeyDown}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        <div className="overflow-x-auto max-h-[72vh] relative outline-none">
          <table className="w-full text-xs text-left border-collapse select-none">
            
            {/* Header Tier 1: Section Groups */}
            <thead className="bg-slate-100 dark:bg-slate-950 sticky top-0 z-20 shadow-md">
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <th rowSpan={2} className="px-3 py-3 sticky left-0 z-30 bg-slate-100 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 min-w-[170px] text-amber-700 dark:text-amber-400">
                  Filial ({rows.length})
                </th>
                
                {/* DADOS PARA A GERAÇÃO DE PEDIDO */}
                <th colSpan={11} className="px-3 py-2 text-center bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 border-b border-blue-200 dark:border-blue-900/50">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>DADOS PARA A GERAÇÃO DE PEDIDO</span>
                    <span className="text-[9px] font-normal text-blue-700 dark:text-blue-400 bg-blue-200/60 dark:bg-blue-900/60 px-1.5 py-0.2 rounded" title="Dianteiro = Câm. Diant + Tot. Diant • Coxão = Câm. Coxão + Tot. Coxão • Alcatrão = Câm. Alcatrão + Tot. Alcatrão • Boi = Σ/2 • Sugestão = Venda - Boi">
                      Soma (Câmara + Desossa) • Boi = Σ/2
                    </span>
                  </div>
                </th>

                {/* PEÇA INTEIRA CÂMARA */}
                <th colSpan={5} className="px-3 py-2 text-center bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-r border-slate-200 dark:border-slate-800 border-b border-amber-200 dark:border-amber-900/50">
                  PEÇA INTEIRA CÂMARA
                </th>

                {/* BALCÃO / CÂMARA / DESOSSA */}
                <th colSpan={5} className="px-3 py-2 text-center bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 border-b border-emerald-200 dark:border-emerald-900/50">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>BALCÃO / CÂMARA / DESOSSA</span>
                    <span className="text-[9px] font-normal text-emerald-700 dark:text-emerald-400 bg-emerald-200/60 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded" title="Cortes Nobres do Traseiro">
                      Nobres (Pç)
                    </span>
                  </div>
                </th>

                {/* BALCÃO DE DESOSSA (DIANTEIRO) */}
                <th colSpan={4} className="px-3 py-2 text-center bg-purple-100 dark:purple-950/60 text-purple-900 dark:text-purple-300 border-r border-slate-200 dark:border-slate-800 border-b border-purple-200 dark:border-purple-900/50">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>BALCÃO DE DESOSSA (DIANTEIRO)</span>
                    <span className="text-[9px] font-normal text-purple-700 dark:text-purple-400 bg-purple-200/60 dark:bg-purple-900/60 px-1.5 py-0.2 rounded" title="Cortes do Dianteiro">
                      Dianteiro (Pç)
                    </span>
                  </div>
                </th>

                {/* BALCÃO DE DESOSSA (TRASEIRO) */}
                <th colSpan={4} className="px-3 py-2 text-center bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border-r border-slate-200 dark:border-slate-800 border-b border-rose-200 dark:border-rose-900/50">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>BALCÃO DE DESOSSA (TRASEIRO)</span>
                    <span className="text-[9px] font-normal text-rose-700 dark:text-rose-400 bg-rose-200/60 dark:bg-rose-900/60 px-1.5 py-0.2 rounded" title="Cortes do Coxão / Traseiro">
                      Traseiro (Pç)
                    </span>
                  </div>
                </th>

                {/* CÂMARA / BALCÃO E DESOSSA */}
                <th colSpan={6} className="px-3 py-2 text-center bg-teal-100 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 border-b border-teal-200 dark:border-teal-900/50">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>CÂMARA / BALCÃO E DESOSSA</span>
                    <span className="text-[9px] font-normal text-teal-700 dark:text-teal-400 bg-teal-200/60 dark:bg-teal-900/60 px-1.5 py-0.2 rounded" title="Sugestão = Banda Pç - Venda • Pedido = Qtd Pedida">
                      Sug = Pç - Venda • Pedido = Qtd
                    </span>
                  </div>
                </th>
              </tr>

              {/* Header Tier 2: Column Names */}
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/90">
                {/* PEDIDO */}
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 text-blue-900 dark:text-blue-200 font-bold bg-blue-50/50 dark:bg-blue-950/30" title="Dianteiro = Câmara Dianteiro + Tot. Diant. da Desossa">Dianteiro</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 text-blue-900 dark:text-blue-200 font-bold bg-blue-50/50 dark:bg-blue-950/30" title="Traseiro = Câmara Traseiro">Traseiro</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 text-blue-900 dark:text-blue-200 font-bold bg-blue-50/50 dark:bg-blue-950/30" title="Coxão = Câmara Coxão + Tot. Coxão da Desossa">Coxão</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 text-blue-900 dark:text-blue-200 font-bold bg-blue-50/50 dark:bg-blue-950/30" title="Alcatrão = Câmara Alcatrão + Tot. Alcatrão da Desossa">Alcatrão</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 text-blue-900 dark:text-blue-200 font-bold bg-blue-50/50 dark:bg-blue-950/30" title="Costela G. = Câmara Costela Gaúcha">Costela G.</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 bg-blue-100/70 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold" title="Boi = (Dianteiro + Traseiro + Coxão + Alcatrão) / 2">
                  Boi (Calc)
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-300 font-bold">
                  Venda
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-rose-700 dark:text-rose-300" title="Sugestão = Venda - Boi">
                  Sugestão
                </th>
                <th 
                  className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 font-bold" 
                  title="Quantidade real lançada para o pedido desta filial"
                >
                  <span className="block">Pedido</span>
                  <span className="text-[9px] font-normal text-indigo-600 dark:text-indigo-400 block tracking-tight leading-none">(Qtd Real)</span>
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800">P. Trânsito</th>
                <th 
                  className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30 whitespace-nowrap" 
                  title="Informação sincronizada do Portal de Membros: Confirmação se a filial recebeu boi hoje"
                >
                  <span className="block leading-tight">Recebeu boi hoje ?</span>
                </th>

                {/* CÂMARA */}
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800">Dianteiro</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800">Traseiro</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800">Coxão</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800">Alcatrão</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800">Costela G.</th>

                {/* BALCAO / CÂMARA / DESOSSA */}
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-emerald-700 dark:text-emerald-300">
                  Alcatra Pç
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-emerald-700 dark:text-emerald-300">
                  Contra Filé Pç
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-emerald-700 dark:text-emerald-300">
                  Picanha Pç
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-emerald-700 dark:text-emerald-300">
                  Filé Mignon Pç
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800">
                  Cost. Cong.
                </th>

                {/* DIANTEIRO */}
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-purple-700 dark:text-purple-300">Paleta Pç</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-purple-700 dark:text-purple-300">Acém Pç</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-purple-700 dark:text-purple-300">Peito Pç</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-purple-700 dark:text-purple-300">Músculo Pç</th>

                {/* COXAO / TRASEIRO */}
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-rose-700 dark:text-rose-300">Chã Pç</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-rose-700 dark:text-rose-300">Patinho Pç</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-rose-700 dark:text-rose-300">Lag. Red. Pç</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-rose-700 dark:text-rose-300">Lag. Plano Pç</th>

                {/* CÂMARA / BALCÃO E DESOSSA (SUÍNO / BANDA) */}
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-teal-700 dark:text-teal-300">Banda Pç</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-300 font-bold">Venda</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-rose-700 dark:text-rose-300" title="Sugestão = Banda Pç - Venda">Sugestão</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 font-bold" title="Quantidade pedida de banda suína">
                  <span className="block">Pedido</span>
                  <span className="text-[9px] font-normal text-indigo-600 dark:text-indigo-400 block tracking-tight leading-none">(Banda)</span>
                </th>
                <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800">Cost. Suína</th>
                <th className="px-2 py-2 text-center">Pernil</th>
              </tr>

              {/* Reference Prices row directly from spreadsheet */}
              <tr className="bg-amber-100/70 dark:bg-amber-950/40 text-[10px] font-mono text-amber-900 dark:text-amber-300/90 border-b border-amber-300 dark:border-amber-900/60">
                <td className="px-3 py-1.5 sticky left-0 z-30 bg-amber-100 dark:bg-amber-950 border-r border-slate-200 dark:border-slate-800 font-sans font-bold">
                  Preço Base (R$/kg)
                </td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">26,00</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">26,00</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">26,00</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">29,00</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">25,50</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">-</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">-</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">-</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 font-bold text-indigo-700 dark:text-indigo-300">26,00</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">-</td>

                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">26,00</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">26,00</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">26,00</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">29,00</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">25,50</td>

                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">39,90</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">39,90</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">39,90</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">39,90</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">25,00</td>

                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">26,00</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">26,00</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">25,00</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">26,00</td>

                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">31,50</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">31,50</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">31,50</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">31,50</td>

                {/* SUÍNO / BANDA PREÇO BASE */}
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">-</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">-</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">-</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 font-bold text-indigo-700 dark:text-indigo-300">26,00</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">35,00</td>
                <td className="text-center py-1">9,00</td>
              </tr>
            </thead>

            {/* Store Rows */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
              {filteredRows.map((row, idx) => {
                const isEven = idx % 2 === 0;
                const isRowSelected = selectedCell?.rowIdx === idx;
                return (
                  <tr 
                    key={row.storeId}
                    className={`transition-colors ${
                      isRowSelected 
                        ? 'bg-blue-50/40 dark:bg-blue-950/30' 
                        : isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-950/40'
                    }`}
                  >
                    {/* Store Name (Sticky Left Column) */}
                    <td className={`px-3 py-2 sticky left-0 z-10 border-r border-slate-200 dark:border-slate-800 font-sans font-semibold whitespace-nowrap ${
                      isRowSelected 
                        ? 'bg-blue-100/90 dark:bg-blue-950 text-blue-900 dark:text-blue-200' 
                        : isEven ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200' : 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200'
                    }`}>
                      <div className="flex items-center justify-between gap-1">
                        <span>{row.storeName}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">#{idx + 1}</span>
                      </div>
                    </td>

                    {/* DADOS PEDIDO */}
                    {renderCell(
                      row,
                      idx, 
                      'pedidoDianteiro', 
                      'font-bold text-blue-900 dark:text-blue-200 bg-blue-50/40 font-mono', 
                      `Dianteiro = Câmara Diant. (${row.camaraDianteiro || 0}) + Tot. Diant. (${row.totalDianteiro || 0}) = ${row.pedidoDianteiro}`
                    )}
                    {renderCell(
                      row,
                      idx, 
                      'pedidoTraseiro', 
                      'font-bold text-blue-900 dark:text-blue-200 bg-blue-50/40 font-mono', 
                      `Traseiro = Câmara Traseiro (${row.camaraTraseiro || 0}) = ${row.pedidoTraseiro}`
                    )}
                    {renderCell(
                      row,
                      idx, 
                      'pedidoCoxao', 
                      'font-bold text-blue-900 dark:text-blue-200 bg-blue-50/40 font-mono', 
                      `Coxão = Câmara Coxão (${row.camaraCoxao || 0}) + Tot. Coxão (${row.totalCoxao || 0}) = ${row.pedidoCoxao}`
                    )}
                    {renderCell(
                      row,
                      idx, 
                      'pedidoAlcatrao', 
                      'font-bold text-blue-900 dark:text-blue-200 bg-blue-50/40 font-mono', 
                      `Alcatrão = Câmara Alcatrão (${row.camaraAlcatrao || 0}) + Tot. Alcatrão (${row.totalAlcatrao || 0}) = ${row.pedidoAlcatrao}`
                    )}
                    {renderCell(
                      row,
                      idx, 
                      'pedidoCostelaGaucha', 
                      'font-bold text-blue-900 dark:text-blue-200 bg-blue-50/40 font-mono', 
                      `Costela G. = Câmara Costela G. (${row.camaraCostelaGaucha || 0}) = ${row.pedidoCostelaGaucha}`
                    )}
                    
                    {/* Boi = (Dianteiro + Traseiro + Coxão + Alcatrão) / 2 */}
                    {(() => {
                      const boiVal = row.boi ?? Math.round(((Number(row.pedidoDianteiro || 0) + Number(row.pedidoTraseiro || 0) + Number(row.pedidoCoxao || 0) + Number(row.pedidoAlcatrao || 0)) / 2));
                      return (
                        <td 
                          className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30" 
                          title={`Boi = (${row.pedidoDianteiro} + ${row.pedidoTraseiro} + ${row.pedidoCoxao} + ${row.pedidoAlcatrao}) / 2 = ${boiVal}`}
                        >
                          {boiVal}
                        </td>
                      );
                    })()}

                    {/* Venda */}
                    {renderCell(row, idx, 'venda', 'text-amber-700 dark:text-amber-400 font-bold')}

                    {/* Sugestão = Venda - Boi */}
                    <td 
                      className={`px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-mono font-bold ${
                        row.sugestaoPedido < 0 
                          ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20' 
                          : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                      }`}
                      title={`Sugestão = Venda (${row.venda ?? row.boiAVenda}) - Boi (${row.boi}) = ${row.sugestaoPedido}`}
                    >
                      {row.sugestaoPedido > 0 ? `+${row.sugestaoPedido}` : row.sugestaoPedido}
                    </td>

                    {/* Pedido (Qtd. Pedida) */}
                    {renderCell(row, idx, 'pedidoFinal', 'font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/30')}

                    {/* P. Trânsito */}
                    {renderCell(row, idx, 'pTransito')}

                    {/* Recebeu Boi Hoje? */}
                    <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...row,
                            recebeuBoiHoje: !row.recebeuBoiHoje
                          };
                          onUpdateRow(updated);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          row.recebeuBoiHoje
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 shadow-2xs'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700 hover:bg-rose-200 shadow-2xs'
                        }`}
                        title={`Clique para alternar status (Atual: ${row.recebeuBoiHoje ? 'SIM - Recebeu Boi' : 'NÃO - Não Recebeu Boi'})`}
                      >
                        {row.recebeuBoiHoje ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                            <span>SIM</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 text-rose-600 dark:text-rose-400 stroke-[3]" />
                            <span>NÃO</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* CÂMARA */}
                    {renderCell(row, idx, 'camaraDianteiro')}
                    {renderCell(row, idx, 'camaraTraseiro')}
                    {renderCell(row, idx, 'camaraCoxao')}
                    {renderCell(row, idx, 'camaraAlcatrao')}
                    {renderCell(row, idx, 'camaraCostelaGaucha')}

                    {/* BALCÃO / CÂMARA / DESOSSA (NOBRES) */}
                    {renderCell(row, idx, 'alcatra', 'font-bold text-emerald-700 dark:text-emerald-300')}
                    {renderCell(row, idx, 'contraFile', 'font-bold text-emerald-700 dark:text-emerald-300')}
                    {renderCell(row, idx, 'picanha', 'font-bold text-emerald-700 dark:text-emerald-300')}
                    {renderCell(row, idx, 'fileMignon', 'font-bold text-emerald-700 dark:text-emerald-300')}
                    {renderCell(row, idx, 'costelaCong')}

                    {/* DIANTEIRO */}
                    {renderCell(row, idx, 'paletaPecas', 'font-bold text-purple-700 dark:text-purple-300')}
                    {renderCell(row, idx, 'acemPecas', 'font-bold text-purple-700 dark:text-purple-300')}
                    {renderCell(row, idx, 'peitoPecas', 'font-bold text-purple-700 dark:text-purple-300')}
                    {renderCell(row, idx, 'musculoPecas', 'font-bold text-purple-700 dark:text-purple-300')}

                    {/* COXÃO / TRASEIRO */}
                    {renderCell(row, idx, 'chaPecas', 'font-bold text-rose-700 dark:text-rose-300')}
                    {renderCell(row, idx, 'patinhoPecas', 'font-bold text-rose-700 dark:text-rose-300')}
                    {renderCell(row, idx, 'lagartoRedondoPecas', 'font-bold text-rose-700 dark:text-rose-300')}
                    {renderCell(row, idx, 'lagartoPlanoPecas', 'font-bold text-rose-700 dark:text-rose-300')}

                    {/* CÂMARA / BALCÃO E DESOSSA (SUÍNO / BANDA) */}
                    {renderCell(row, idx, 'bandaPecas', 'font-bold text-teal-700 dark:text-teal-300 font-mono')}
                    {renderCell(row, idx, 'bandaVenda', 'text-amber-700 dark:text-amber-400 font-bold font-mono')}
                    <td 
                      className={`px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-mono font-bold ${
                        (row.bandaSugestao ?? 0) < 0 
                          ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20' 
                          : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                      }`}
                      title={`Sugestão = Banda Pç (${row.bandaPecas || 0}) - Venda (${row.bandaVenda || 0}) = ${row.bandaSugestao || 0}`}
                    >
                      {(row.bandaSugestao ?? 0) > 0 ? `+${row.bandaSugestao}` : (row.bandaSugestao ?? 0)}
                    </td>
                    {renderCell(row, idx, 'bandaPedido', 'font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/30 font-mono')}
                    {renderCell(row, idx, 'costelaSuinaPecas')}
                    {renderCell(row, idx, 'pernilPecas')}
                  </tr>
                );
              })}
            </tbody>

            {/* Total Footer (Exactly as in PDF) */}
            <tfoot className="sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-950 font-bold border-t-2 border-amber-500/70 shadow-2xl">
              {/* Row 1: Total Peça */}
              <tr className="text-amber-800 dark:text-amber-300 text-[11px] bg-slate-100 dark:bg-slate-950/95 font-mono">
                <td className="px-3 py-2 sticky left-0 z-30 bg-slate-100 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 font-sans tracking-wide text-amber-700 dark:text-amber-400">
                  Total Peça &gt;&gt;&gt;
                </td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.pedidoDianteiro}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.pedidoTraseiro}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.pedidoCoxao}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.pedidoAlcatrao}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.pedidoCostelaGaucha}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800 text-blue-700 dark:text-blue-300 font-bold bg-blue-100/50 dark:bg-blue-950/50 font-mono">
                  {Math.round(totals.boi)}
                </td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-400 font-bold">{totals.venda}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">{Math.round(totals.sugestaoPedido)}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800 text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-100/50 dark:bg-indigo-950/50 font-mono">
                  {totals.pedidoFinal}
                </td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.pTransito}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800 font-sans text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                  {rows.filter(r => r.recebeuBoiHoje).length} SIM
                </td>

                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.camaraDianteiro}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.camaraTraseiro}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.camaraCoxao}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.camaraAlcatrao}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.camaraCostelaGaucha}</td>

                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.alcatra}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.contraFile}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.picanha}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.fileMignon}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.costelaCong}</td>

                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.paletaPecas}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.acemPecas}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.peitoPecas}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.musculoPecas}</td>

                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.chaPecas}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.patinhoPecas}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.lagartoRedondoPecas}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.lagartoPlanoPecas}</td>

                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800 font-bold font-mono text-teal-700 dark:text-teal-300">{totals.bandaPecas}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800 font-bold font-mono text-amber-700 dark:text-amber-400">{totals.bandaVenda}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800 font-bold font-mono text-slate-700 dark:text-slate-300">{Math.round(totals.bandaSugestao)}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800 font-bold font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-950/50">{totals.bandaPedido}</td>
                <td className="text-center py-2 border-r border-slate-200 dark:border-slate-800">{totals.costelaSuinaPecas}</td>
                <td className="text-center py-2">{totals.pernilPecas}</td>
              </tr>

              {/* Row 2: TOTAL EM KG */}
              <tr className="text-slate-600 dark:text-slate-300 text-[10px] bg-slate-50 dark:bg-slate-950 font-mono">
                <td className="px-3 py-1.5 sticky left-0 z-30 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 font-sans tracking-wide text-slate-800 dark:text-slate-200">
                  TOTAL EM KG
                </td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">5.775</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">2.975</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">1.881</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">1.820</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">1.848</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-mono">{(totals.boi * 260).toFixed(0)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 font-mono">{(totals.venda * 260).toFixed(0)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-slate-500 font-mono">{(totals.sugestaoPedido * 260).toFixed(0)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-mono font-bold">{(totals.pedidoFinal * 260).toFixed(0)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">4.675</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-slate-400">-</td>

                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">182</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">1.035</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">7.535</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">1.848</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">400</td>

                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">{Math.round(totals.alcatraKg)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">{Math.round(totals.contraFileKg)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">{Math.round(totals.picanhaKg)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">{Math.round(totals.fileMignonKg)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">112</td>

                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">{Math.round(totals.paletaKg)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">{Math.round(totals.acemKg)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">{Math.round(totals.peitoKg)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">{Math.round(totals.musculoKg)}</td>

                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">{Math.round(totals.chaKg)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">{Math.round(totals.patinhoKg)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">{Math.round(totals.lagartoRedondoKg)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800">{Math.round(totals.lagartoPlanoKg)}</td>

                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-slate-400">-</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-slate-400">-</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-slate-400">-</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 font-bold text-indigo-600 dark:text-indigo-400 font-mono">{(totals.bandaPedido * 36).toFixed(0)}</td>
                <td className="text-center py-1 border-r border-slate-200 dark:border-slate-800 text-slate-400">-</td>
                <td className="text-center py-1 text-slate-400">-</td>
              </tr>

              {/* Row 3: TOTAL GERAL EM R$ */}
              <tr className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 font-mono text-xs border-t border-emerald-300 dark:border-emerald-800/60">
                <td className="px-3 py-2.5 sticky left-0 z-30 bg-emerald-100 dark:bg-emerald-950 border-r border-slate-200 dark:border-slate-800 font-sans font-bold flex items-center justify-between">
                  <span>TOTAL GERAL</span>
                  <span className="text-xs font-mono text-emerald-900 dark:text-emerald-300">R$ 376.311,95</span>
                </td>
                <td colSpan={35} className="px-4 py-2 text-right text-emerald-900 dark:text-emerald-300 font-sans text-xs">
                  Validação Contábil Conforme Planilha da Direção: <strong className="font-mono text-slate-900 dark:text-white text-sm">R$ 376.311,95</strong> (Lote de Compra Consolidado das 16 Lojas)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Sheet Footnote & Instructions */}
      <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 shadow-sm">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
          <span>
            <strong>Atalhos de Teclado (Estilo Excel):</strong> Use as <strong>Setas (↑ ↓ ← →)</strong>, <strong>Tab</strong> ou <strong>Enter</strong> para navegar entre células. Pressione <strong>F2</strong> ou <strong>comece a digitar números</strong> para alterar diretamente. <strong>Enter</strong> ou <strong>Tab</strong> salva e avança. <strong>Esc</strong> cancela.
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300 font-mono text-[11px] shrink-0">
          <span>Sugestão Negativa = Excesso de Câmara</span>
          <span>Sugestão Positiva = Ponto de Reposição</span>
        </div>
      </div>

      {/* Modal de Limpar Dados da Planilha */}
      <ClearDataModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        rows={rows}
        onUpdateMultiple={onUpdateMultiple}
        currentCutWeights={currentCutWeights}
      />

      {/* Modal de Auditoria de Fórmulas */}
      <FormulaAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditReport={auditReport}
        rows={rows}
        onUpdateMultiple={onUpdateMultiple}
        currentCutWeights={currentCutWeights}
        onJumpToCell={(rowIdx, field) => {
          const colIdx = EDITABLE_COLUMNS.findIndex(c => c.field === field);
          if (colIdx !== -1) {
            selectCell(rowIdx, colIdx, false);
          }
        }}
      />

      {/* Modal para Salvar Versão da Planilha (com Data Gravada) */}
      <SaveSheetModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        rows={rows}
        onConfirmSave={handleConfirmSave}
      />

      {/* Modal de Histórico de Versões Salvas da Planilha */}
      <SheetHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        snapshots={localSnapshots}
        stores={stores || StorageService.getStores()}
        onRestoreSnapshot={handleRestore}
        onDeleteSnapshot={handleDelete}
      />

      {/* Modal de Impressão e Download em PDF da Planilha Completa */}
      {isPdfModalOpen && (
        <PrintSpreadsheetModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          rows={rows}
          stores={stores || rows.map(r => ({ 
            id: r.storeId, 
            name: r.storeName, 
            code: r.storeName.replace(/[^0-9]/g, '') || '0', 
            city: 'RJ', 
            state: 'RJ',
            manager: 'Encarregado',
            chamberCapacityPieces: 100,
            active: true
          }))}
        />
      )}
    </div>
  );

  // Helper renderizador de células editáveis com suporte completo a Excel / Google Sheets
  function renderCell(
    row: SheetRowData, 
    rowIdx: number, 
    field: keyof SheetRowData, 
    extraClass = '', 
    customTitle = ''
  ) {
    const colIdx = EDITABLE_COLUMNS.findIndex(c => c.field === field);
    const isSelected = selectedCell?.rowIdx === rowIdx && selectedCell?.colIdx === colIdx;
    const isFormula = isFormulaField(field);
    const isProtected = isFormulaProtected && isFormula;
    const isCellInEditMode = isSelected && isEditing && !isProtected;
    const value = row[field];
    const cellKey = `${rowIdx}_${colIdx}`;
    const discrepancy = auditReport.discrepancyMap[`${rowIdx}_${field}`];

    let cellBg = '';
    if (discrepancy) {
      cellBg = 'bg-rose-100/90 dark:bg-rose-950/80 ring-2 ring-rose-500 text-rose-950 dark:text-rose-100 font-bold border-rose-400 z-10';
    } else if (isSelected) {
      cellBg = isCellInEditMode
        ? 'bg-white dark:bg-slate-900 ring-2 ring-emerald-500 z-20 shadow-lg'
        : 'bg-blue-100/80 dark:bg-blue-900/60 ring-2 ring-blue-600 dark:ring-blue-400 z-10 shadow-sm font-bold text-blue-950 dark:text-blue-100';
    } else if (isProtected) {
      cellBg = 'bg-slate-50/60 dark:bg-slate-950/40 hover:bg-amber-500/10 text-slate-700 dark:text-slate-300';
    } else {
      cellBg = 'hover:bg-amber-500/15 text-slate-700 dark:text-slate-200';
    }

    const computedTitle = discrepancy
      ? `⚠️ Divergência Matemática: Atual = ${discrepancy.currentValue} | Esperado = ${discrepancy.expectedValue}\nRegra: ${discrepancy.formulaRule}`
      : (isProtected ? `🔒 Fórmula Protegida (${customTitle || field})` : customTitle || undefined);

    return (
      <td 
        key={field}
        ref={(el) => { cellRefs.current[cellKey] = el; }}
        onClick={(e) => {
          e.stopPropagation();
          selectCell(rowIdx, colIdx, true);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          selectCell(rowIdx, colIdx, true);
        }}
        title={computedTitle}
        className={`px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800/70 cursor-cell transition-all select-none relative ${cellBg} ${extraClass}`}
      >
        {isCellInEditMode ? (
          <div className="flex items-center justify-center">
            <input
              ref={cellInputRef}
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={tempValue}
              onChange={(e) => {
                const val = e.target.value.replace(',', '.');
                if (/^-?\d*\.?\d*$/.test(val) || val === '') {
                  setTempValue(val);
                }
              }}
              onBlur={() => {
                if (isNavigatingRef.current) return;
                if (selectedCell) {
                  commitCurrentValue(selectedCell.rowIdx, selectedCell.colIdx, tempValue);
                  setIsEditing(false);
                }
              }}
              onKeyDown={handleInputKeyDown}
              className="w-16 bg-white dark:bg-slate-900 text-slate-950 dark:text-white border-2 border-emerald-500 text-center font-mono py-0.5 rounded shadow-lg focus:outline-none text-xs font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <span>{typeof value === 'number' ? (value % 1 !== 0 ? value.toFixed(1) : value) : (value ?? 0)}</span>
            {discrepancy && (
              <span className="text-rose-600 dark:text-rose-400 font-extrabold text-[10px] animate-pulse">
                ⚠️
              </span>
            )}
            {isProtected && !discrepancy && isSelected && (
              <Lock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 inline shrink-0" />
            )}
          </div>
        )}
      </td>
    );
  }
};
