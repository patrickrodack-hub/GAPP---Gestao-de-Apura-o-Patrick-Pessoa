import React, { useState } from 'react';
import { Product, Store, SheetRowData, Supplier, SystemUser } from '../../types/erp';
import { formatCurrencyBRL, calculateSheetTotals } from '../../services/calculationService';
import { 
  SlidersHorizontal, 
  Package, 
  DollarSign, 
  Scale, 
  Building2, 
  Layers, 
  Calculator, 
  FileText,
  Plus,
  Edit2,
  Trash2,
  Check,
  CheckCircle2,
  Users,
  Key
} from 'lucide-react';

interface ParametersTabProps {
  products: Product[];
  stores: Store[];
  sheetRows: SheetRowData[];
  suppliers?: Supplier[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateStores: (stores: Store[]) => void;
  onOpenSupplierManager?: () => void;
  onOpenUserManagement?: () => void;
  onOpenChangePassword?: () => void;
  currentUser?: SystemUser | null;
}

export const ParametersTab: React.FC<ParametersTabProps> = ({
  products,
  stores,
  sheetRows,
  suppliers = [],
  onUpdateProducts,
  onUpdateStores,
  onOpenSupplierManager,
  onOpenUserManagement,
  onOpenChangePassword,
  currentUser,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totals = calculateSheetTotals(sheetRows);

  const steps = [
    { num: 1, title: 'Cadastro dos Produtos', icon: Package, desc: 'Códigos, nomes e categorias dos cortes' },
    { num: 2, title: 'Preço dos Produtos', icon: DollarSign, desc: 'Custo de compra e preço de venda' },
    { num: 3, title: 'Quantidades & Pesos', icon: Scale, desc: 'Peso médio/peça e rendimento padrão' },
    { num: 4, title: 'Número de Lojas', icon: Building2, desc: 'Gestão das 16 filiais e câmaras' },
    { num: 5, title: 'Consolidações', icon: Layers, desc: 'Agrupamentos e rateios por categoria' },
    { num: 6, title: 'Totais Gerais', icon: Calculator, desc: 'Métricas gerais da matriz v10.1' },
    { num: 7, title: 'Informações Adicionais', icon: FileText, desc: 'Premissas e notas operacionais' },
  ];

  // Salvar produto editado
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const updated = products.map(p => p.id === editingProduct.id ? editingProduct : p);
    onUpdateProducts(updated);
    setEditingProduct(null);
    showToast('Produto atualizado com sucesso!');
  };

  // Salvar loja editada
  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    const updated = stores.map(s => s.id === editingStore.id ? editingStore : s);
    onUpdateStores(updated);
    setEditingStore(null);
    showToast('Filial atualizada com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-md transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Módulo 1: Cadastro de Informações e Parâmetros
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Base Operacional Configurada
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estruturação das etapas fundamentais do sistema a partir da Planilha de Compra da Direção
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {onOpenSupplierManager && (
              <button
                onClick={onOpenSupplierManager}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                title="Cadastro e Gestão de Fornecedores e Frigoríficos (Adicionar, Editar, Excluir, Imprimir)"
              >
                <Building2 className="w-4 h-4" />
                <span>Fornecedores ({suppliers.length})</span>
              </button>
            )}

            {/* Alterar Minha Senha - Para qualquer usuário logado */}
            {onOpenChangePassword && currentUser && (
              <button
                onClick={onOpenChangePassword}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="Alterar a senha da sua conta no sistema"
              >
                <Key className="w-4 h-4" />
                <span>Alterar Senha</span>
              </button>
            )}

            {/* Gestão de Usuários & Acessos - Somente Desenvolvedor e Diretor */}
            {(currentUser?.role === 'DESENVOLVEDOR' || currentUser?.role === 'DIRETOR') && onOpenUserManagement && (
              <button
                onClick={onOpenUserManagement}
                className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                title="Cadastro de Usuários, Senhas e Permissões por Módulo"
              >
                <Users className="w-4 h-4" />
                <span>Gestão de Usuários & Acessos</span>
              </button>
            )}
          </div>
        </div>

        {/* 7 Steps Navigation Bar */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {steps.map((st) => {
            const Icon = st.icon;
            const isCurrent = activeStep === st.num;
            return (
              <button
                key={st.num}
                onClick={() => setActiveStep(st.num)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                  }`}>
                    {st.num}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
                </div>
                <div className="text-xs font-semibold truncate text-slate-900 dark:text-white">{st.title}</div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{st.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-md transition-colors">
        {/* ETAPA 1: Cadastro dos Produtos */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>1. Cadastro dos Produtos ({products.length} itens cadastrados)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Produtos bovinos, suínos e subprodutos da desossa extraídos da planilha matriz v10.1
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Nome do Produto / Corte</th>
                    <th className="px-3 py-3">Categoria</th>
                    <th className="px-3 py-3 text-center">Unidade</th>
                    <th className="px-3 py-3 text-right">Peso Médio (pç)</th>
                    <th className="px-3 py-3 text-right">Preço de Referência</th>
                    <th className="px-3 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{p.code}</td>
                      <td className="px-4 py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200">{p.name}</td>
                      <td className="px-3 py-2.5 font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300">{p.unit}</td>
                      <td className="px-3 py-2.5 text-right text-slate-800 dark:text-slate-200 font-bold">{p.averageWeightPieceKg} kg</td>
                      <td className="px-3 py-2.5 text-right font-bold text-amber-700 dark:text-amber-300">{formatCurrencyBRL(p.defaultPriceKg)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 rounded transition"
                          title="Editar produto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ETAPA 2: Preço dos Produtos */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>2. Preço dos Produtos & Política de Margens</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preços base de aquisição da planilha (R$ 26/kg dianteiro, R$ 26/kg traseiro, R$ 29/kg alcatrão, R$ 39,90 cortes nobres) e preços sugeridos
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-3 py-3 text-right">Custo Base (Planilha)</th>
                    <th className="px-3 py-3 text-right">Preço Venda Balcão</th>
                    <th className="px-3 py-3 text-right">Margem s/ Compra (Markup)</th>
                    <th className="px-3 py-3 text-right">Margem s/ Venda</th>
                    <th className="px-3 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
                  {products.map((p) => {
                    const markup = p.defaultPriceKg > 0 ? ((p.sellingPriceKg - p.defaultPriceKg) / p.defaultPriceKg) * 100 : 0;
                    const margin = p.sellingPriceKg > 0 ? ((p.sellingPriceKg - p.defaultPriceKg) / p.sellingPriceKg) * 100 : 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200">{p.name}</td>
                        <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-300">{formatCurrencyBRL(p.defaultPriceKg)}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrencyBRL(p.sellingPriceKg)}</td>
                        <td className="px-3 py-2.5 text-right text-purple-600 dark:text-purple-300 font-medium">+{markup.toFixed(1)}%</td>
                        <td className="px-3 py-2.5 text-right font-bold text-amber-700 dark:text-amber-300">{margin.toFixed(1)}%</td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 rounded transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ETAPA 3: Informações de Quantidade dos Produtos */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>3. Informações de Quantidade & Fatores de Conversão (Peça &lt;-&gt; Kg)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pesos médios padronizados para conversão de pedidos em peças para quilogramas e rendimento esperado
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Quartos com Osso</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  • <strong>Dianteiro c/ osso:</strong> ~65 kg / peça<br />
                  • <strong>Traseiro c/ osso:</strong> ~68 kg / peça<br />
                  • <strong>Costela Gaúcha:</strong> ~28 kg / peça<br />
                  • <strong>Meia-Carcaça (Banda):</strong> ~135 kg / peça
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Cortes Nobres Traseiro</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  • <strong>Picanha:</strong> ~1.5 a 1.6 kg<br />
                  • <strong>Filé Mignon:</strong> ~2.0 a 2.3 kg<br />
                  • <strong>Contra Filé:</strong> ~10.0 a 11.0 kg<br />
                  • <strong>Alcatra c/ Maminha:</strong> ~8.5 kg
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Cortes de Coxão & Dianteiro</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  • <strong>Chã de Dentro:</strong> ~11.0 kg<br />
                  • <strong>Patinho:</strong> ~9.5 kg<br />
                  • <strong>Acém desossado:</strong> ~14.5 kg<br />
                  • <strong>Paleta desossada:</strong> ~12.0 kg
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 4: Número de Lojas */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>4. Número de Lojas ({stores.length} Filiais)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rede de lojas alimentada pela matriz da Planilha da Direção
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Nome da Filial</th>
                    <th className="px-4 py-3">Município / Estado</th>
                    <th className="px-4 py-3">Gerente / Responsável</th>
                    <th className="px-3 py-3 text-center">Capacidade Câmara</th>
                    <th className="px-3 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
                  {stores.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{s.code}</td>
                      <td className="px-4 py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200">{s.name}</td>
                      <td className="px-4 py-2.5 font-sans text-slate-700 dark:text-slate-300">{s.city}</td>
                      <td className="px-4 py-2.5 font-sans text-slate-700 dark:text-slate-300">{s.manager}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-amber-700 dark:text-amber-300">{s.chamberCapacityPieces} peças</td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => setEditingStore(s)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 rounded transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ETAPA 5: Consolidações */}
        {activeStep === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>5. Consolidações Operacionais por Categoria</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Agrupamentos consolidados de peças e quilogramas solicitados pelas 16 lojas
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                  Total Pedido Dianteiro
                </span>
                <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
                  {totals.pedidoDianteiro} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">peças</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                  {(totals.pedidoDianteiro * 65).toLocaleString('pt-BR')} kg estimados
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                  Total Pedido Traseiro
                </span>
                <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                  {totals.pedidoTraseiro} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">peças</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                  {(totals.pedidoTraseiro * 68).toLocaleString('pt-BR')} kg estimados
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                  Total Pedido Coxão
                </span>
                <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                  {totals.pedidoCoxao} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">peças</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                  {(totals.pedidoCoxao * 42).toLocaleString('pt-BR')} kg estimados
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                  Total Pedido Alcatrão
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {totals.pedidoAlcatrao} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">peças</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                  {(totals.pedidoAlcatrao * 38).toLocaleString('pt-BR')} kg estimados
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 6: Totais */}
        {activeStep === 6 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>6. Totais e Fechamento da Matriz v10.1</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Conferência dos totais oficiais constantes no rodapé da planilha enviada
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-sans text-slate-700 dark:text-slate-300">Total Peças Pedido Dianteiro:</span>
                <span className="text-slate-900 dark:text-white font-bold">{totals.pedidoDianteiro} peças</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-sans text-slate-700 dark:text-slate-300">Total Peças Pedido Traseiro:</span>
                <span className="text-slate-900 dark:text-white font-bold">{totals.pedidoTraseiro} peças</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-sans text-slate-700 dark:text-slate-300">Total Peças Pedido Coxão:</span>
                <span className="text-slate-900 dark:text-white font-bold">{totals.pedidoCoxao} peças</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-sans text-slate-700 dark:text-slate-300">Total Peças Pedido Alcatrão:</span>
                <span className="text-slate-900 dark:text-white font-bold">{totals.pedidoAlcatrao} peças</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-sans text-slate-700 dark:text-slate-300">Total Peças Costela Gaúcha:</span>
                <span className="text-slate-900 dark:text-white font-bold">{totals.pedidoCostelaGaucha} peças</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="font-sans">VALOR TOTAL DA COMPRA CONSOLIDADA:</span>
                <span>R$ 376.311,95</span>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 7: Informações Adicionais */}
        {activeStep === 7 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>7. Informações Adicionais Presentes no Documento</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Premissas de negócio, regras de desossa e observações da direção
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <p>
                • <strong>Versão da Matriz:</strong> Planilha de Compra de Boi da Direção da Empresa v10.1 (Data de referência: quinta-feira, 1 de outubro de 2026).
              </p>
              <p>
                • <strong>Divisão de Quartos:</strong> A direção gerencia a compra entre <em>Dianteiro</em>, <em>Traseiro</em>, <em>Coxão</em> e <em>Alcatrão</em> de forma fracionada para abastecer lojas com perfis de consumo distintos (algumas lojas vendem mais dianteiro/acém e outras mais traseiro/alcatra).
              </p>
              <p>
                • <strong>Sugestão de Pedido:</strong> O cálculo de sugestão é negativo quando a câmara possui estoque suficiente para cobrir o giro imediato (evitando acúmulo excessivo e quebra por resfriamento/gotejamento).
              </p>
              <p>
                • <strong>Subprodutos e Descarte:</strong> O descarte de sebo e osso é pesado e registrado diariamente para faturamento junto às graxarias homologadas, garantindo a amortização real no custo dos cortes limpos no balcão.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Editar Produto */}
      {editingProduct && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveProduct} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Editar Produto: {editingProduct.name}</h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Custo de Referência (R$/kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingProduct.defaultPriceKg}
                  onChange={(e) => setEditingProduct({ ...editingProduct, defaultPriceKg: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Preço de Venda Balcão (R$/kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingProduct.sellingPriceKg}
                  onChange={(e) => setEditingProduct({ ...editingProduct, sellingPriceKg: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Peso Médio por Peça (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingProduct.averageWeightPieceKg}
                  onChange={(e) => setEditingProduct({ ...editingProduct, averageWeightPieceKg: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Editar Loja */}
      {editingStore && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveStore} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Editar Loja: {editingStore.name}</h3>
              <button
                type="button"
                onClick={() => setEditingStore(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Gerente / Responsável</label>
                <input
                  type="text"
                  value={editingStore.manager}
                  onChange={(e) => setEditingStore({ ...editingStore, manager: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Município / Estado</label>
                <input
                  type="text"
                  value={editingStore.city}
                  onChange={(e) => setEditingStore({ ...editingStore, city: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Capacidade da Câmara Fria (Peças)</label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={editingStore.chamberCapacityPieces}
                  onChange={(e) => setEditingStore({ ...editingStore, chamberCapacityPieces: Number(e.target.value) || 10 })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingStore(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
