import React, { useState } from 'react';
import { 
  PriceDiscrepancyItem, 
  PerishablesAuditReport 
} from '../../types/perishablesQuotes';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  RotateCcw, 
  ArrowRight, 
  Check, 
  Building2, 
  Tv, 
  FileSpreadsheet, 
  Tag, 
  Layers, 
  Radio, 
  Wrench, 
  Sparkles, 
  ExternalLink,
  History,
  Lock
} from 'lucide-react';

interface DiscrepancyAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PerishablesAuditReport | null;
  onHarmonizeAll: () => Promise<void> | void;
  onHarmonizeSingle?: (discrepancy: PriceDiscrepancyItem) => Promise<void> | void;
  isHarmonizing?: boolean;
}

export const DiscrepancyAuditModal: React.FC<DiscrepancyAuditModalProps> = ({
  isOpen,
  onClose,
  report,
  onHarmonizeAll,
  onHarmonizeSingle,
  isHarmonizing = false
}) => {
  const [activeTab, setActiveTab] = useState<'discrepancies' | 'sources' | 'protocol'>('discrepancies');

  if (!isOpen || !report) return null;

  const hasDiscrepancies = report.discrepancyCount > 0;

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className={`px-6 py-4 text-white flex items-center justify-between shadow-md shrink-0 ${
          hasDiscrepancies 
            ? 'bg-gradient-to-r from-rose-700 via-rose-800 to-amber-900' 
            : 'bg-gradient-to-r from-emerald-700 via-[#113829] to-teal-900'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-inner shrink-0">
              {hasDiscrepancies ? (
                <ShieldAlert className="w-6 h-6 text-rose-200" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-200" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-black uppercase font-mono tracking-wider px-2.5 py-0.5 rounded-full shadow-sm ${
                  hasDiscrepancies 
                    ? 'bg-rose-400 text-slate-950' 
                    : 'bg-emerald-400 text-slate-950'
                }`}>
                  {hasDiscrepancies ? 'ALERTA DE AUDITORIA DE PREÇOS' : 'AUDITORIA CONFORME • 100% PARIDADE'}
                </span>
                <span className="text-xs text-white/90 font-mono">
                  {report.timestamp} • Latência: {report.latencyMs}ms
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight leading-tight mt-0.5">
                Log de Integridade: Preço Anunciado vs. Preço Processado no ERP
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 text-white transition cursor-pointer"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Cards de Resumo Executivo */}
        <div className="p-6 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total de Cortes Auditados</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {report.totalProductsAudited}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">11 Sub-Abas do Varejo RJ</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Ofertas de Mídia Auditadas</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
              {report.promosAudited}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">TV, Encartes, Apps e Redes</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Preços em Paridade Exata</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {report.parityCount}
            </div>
            <span className="text-[10px] text-emerald-600/80 font-bold mt-0.5 block">Score: {report.integrityScore}%</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            hasDiscrepancies
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400'
              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400'
          }`}>
            <span className="text-[10px] font-bold uppercase block">Discrepâncias Detectadas</span>
            <div className="text-2xl font-black mt-0.5">
              {report.discrepancyCount}
            </div>
            <span className="text-[10px] font-semibold mt-0.5 block">
              {hasDiscrepancies ? 'Ação de correção recomendada' : 'Nenhuma divergência ativa'}
            </span>
          </div>
        </div>

        {/* Abas Internas */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('discrepancies')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'discrepancies'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Log de Discrepâncias ({report.discrepancyCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sources')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'sources'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Fontes & Clipping RJ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('protocol')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'protocol'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Protocolo de Credibilidade
            </button>
          </div>

          {hasDiscrepancies && (
            <button
              type="button"
              onClick={onHarmonizeAll}
              disabled={isHarmonizing}
              className="mb-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Wrench className={`w-3.5 h-3.5 ${isHarmonizing ? 'animate-spin' : ''}`} />
              <span>{isHarmonizing ? 'Harmonizando...' : 'Harmonizar Todos os Preços'}</span>
            </button>
          )}
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {activeTab === 'discrepancies' && (
            <>
              {hasDiscrepancies ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/60 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-rose-900 dark:text-rose-200 text-xs">
                        Atenção de Auditoria: {report.discrepancyCount} preços processados divergem dos anúncios oficiais!
                      </h4>
                      <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-0.5 leading-relaxed">
                        Foram detectados cortes onde o valor na coluna da rede concorrente está diferente da oferta veiculada na TV Aberta, Encarte ou Rede Social. Para restabelecer 100% de precisão e credibilidade, clique em <strong>Harmonizar Todos os Preços</strong> ou corrija item a item.
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#113829] text-white font-bold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Corte / Categoria</th>
                          <th className="py-2.5 px-3">Rede Concorrente</th>
                          <th className="py-2.5 px-3 text-right">Preço Anunciado</th>
                          <th className="py-2.5 px-3 text-right">Preço Processado</th>
                          <th className="py-2.5 px-3 text-center">Divergência</th>
                          <th className="py-2.5 px-3">Veículo / Mídia</th>
                          <th className="py-2.5 px-3 text-center">Ação Corretiva</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {report.discrepancies.map(disc => (
                          <tr key={disc.id} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                            <td className="py-2.5 px-3 font-sans">
                              <div className="font-bold text-slate-900 dark:text-white">{disc.productName}</div>
                              <span className="text-[10px] text-slate-400 font-mono">{disc.productCode} • {disc.categoryId}</span>
                            </td>

                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{disc.chainName}</span>
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                              R$ {disc.announcedPrice.toFixed(2)}
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20">
                              R$ {disc.processedPrice.toFixed(2)}
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono text-rose-600 dark:text-rose-400 font-bold">
                              {disc.diffValue > 0 ? `+R$ ${disc.diffValue.toFixed(2)}` : `-R$ ${Math.abs(disc.diffValue).toFixed(2)}`}
                              <span className="text-[10px] block opacity-80">({disc.diffPercent > 0 ? `+${disc.diffPercent}%` : `${disc.diffPercent}%`})</span>
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                {disc.mediaChannel}
                              </span>
                              <div className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5" title={disc.mediaLabel}>
                                {disc.mediaLabel}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              {onHarmonizeSingle && (
                                <button
                                  type="button"
                                  onClick={() => onHarmonizeSingle(disc)}
                                  className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition cursor-pointer"
                                >
                                  Harmonizar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-12 px-6 text-center space-y-3 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/60">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-emerald-900 dark:text-emerald-200">
                      Integridade e Paridade Concorrencial de 100% Confirmadas!
                    </h4>
                    <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 max-w-lg mx-auto mt-1 leading-relaxed">
                      Todas as ofertas ativas anunciadas em TV Globo RJ, Record RJ, SBT Rio, Tabloides, Clubes de Benefícios, Lâminas e Redes Sociais coincidem rigorosamente com os preços processados nas colunas das 12 redes supermercadistas.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-mono text-[11px] font-bold">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                    <span>Hash de Auditoria: {report.auditHash}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'sources' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Canais e Bases de Dados Monitoradas em Tempo Real:</span>
                </h5>
                <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span><strong>TV Aberta RJ:</strong> Clipping comercial contínuo na TV Globo RJ, Record TV Rio e SBT Rio.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>Tabloides & Encartes Impressos:</strong> Coleta semanal dos encartes do Guanabara, Mundial, Supermarket, Assaí e Atacadão.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-600 shrink-0" />
                    <span><strong>Clubes e Aplicativos Oficiais:</strong> Monitoramento com CPF do Clube Prezunic, App Guanabara Card e App Meu Assaí.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-600 shrink-0" />
                    <span><strong>Lâminas de Balcão e Açougue:</strong> Lâminas operacionais do setor de carnes e perecíveis.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>Redes Sociais Oficiais:</strong> Monitoramento de publicações oficiais de ofertas relâmpago.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'protocol' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Protocolo de Credibilidade Comercial GAPP v10.9</span>
              </h5>
              <p>
                O sistema de cotações de perecíveis do ERP possui um mecanismo de auditoria contínua que garante a conformidade entre o que os concorrentes anunciam na televisão aberta e tabloides e o que é computado nas tabelas analíticas.
              </p>
              <p>
                Qualquer edição manual ou inconsistência temporária é imediatamente identificada pelo motor de auditoria, gerando alertas visuais nas células correspondentes e permitindo a restauração instantânea dos dados oficiais.
              </p>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-mono">
            Integridade: <strong>{report.integrityScore}%</strong> • Conformes: {report.parityCount} / {report.promosAudited}
          </div>

          <div className="flex items-center gap-2">
            {hasDiscrepancies && (
              <button
                type="button"
                onClick={onHarmonizeAll}
                disabled={isHarmonizing}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Wrench className={`w-3.5 h-3.5 ${isHarmonizing ? 'animate-spin' : ''}`} />
                <span>Harmonizar Dados</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#113829] hover:bg-[#1b523c] text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <span>Fechar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
