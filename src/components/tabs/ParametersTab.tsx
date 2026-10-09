import React, { useState, useMemo } from 'react';
import { Product, Store, SheetRowData, Supplier, SystemUser, MeatCategory } from '../../types/erp';
import { formatCurrencyBRL, calculateSheetTotals } from '../../services/calculationService';
import { StorageService } from '../../services/storageService';
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
  Key,
  AlertTriangle,
  Search,
  X,
  Tag,
  Percent
} from 'lucide-react';

interface ParametersTabProps {
  products: Product[];
  stores: Store[];
  sheetRows: SheetRowData[];
  suppliers?: Supplier[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateStores: (stores: Store[]) => void;
  onOpenSupplierManager?: () => void;
  onOpenProductManager?: () => void;
  onOpenUserManagement?: () => void;
  onOpenChangePassword?: () => void;
  currentUser?: SystemUser | null;
}

const CATEGORY_CONFIG: Record<MeatCategory, { label: string; badge: string }> = {
  quarto_osso: { 
    label: 'Quarto c/ Osso', 
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800' 
  },
  corte_traseiro: { 
    label: 'Corte Traseiro', 
    badge: 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800' 
  },
  corte_dianteiro: { 
    label: 'Corte Dianteiro', 
    badge: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800' 
  },
  suino: { 
    label: 'Suíno', 
    badge: 'bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300 dark:border-teal-800' 
  },
  subproduto: { 
    label: 'Subproduto / Graxaria', 
    badge: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700' 
  },
};

const initialProductFormState: Product = {
  id: '',
  code: '',
  name: '',
  category: 'corte_traseiro',
  defaultPriceKg: 26.00,
  sellingPriceKg: 35.00,
  averageWeightPieceKg: 2.0,
  targetMarginPercent: 25.7,
  unit: 'KG',
  yieldPercentStandard: 5.0,
  isBoneOrFatWaste: false,
};

export const ParametersTab: React.FC<ParametersTabProps> = ({
  products,
  stores,
  sheetRows,
  suppliers = [],
  onUpdateProducts,
  onUpdateStores,
  onOpenSupplierManager,
  onOpenProductManager,
  onOpenUserManagement,
  onOpenChangePassword,
  currentUser,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create');
  const [productFormData, setProductFormData] = useState<Product>(initialProductFormState);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('ALL');

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
    { num: 6, title: 'Totais Gerais', icon: Calculator, desc: 'Métricas gerais da matriz v10.7' },
    { num: 7, title: 'Informações Adicionais', icon: FileText, desc: 'Premissas e notas operacionais' },
  ];

  // Abertura do Modal para NOVO Produto
  const handleOpenNewProduct = () => {
    setProductFormData({
      ...initialProductFormState,
      id: `prd_${Date.now()}`,
    });
    setProductModalMode('create');
    setIsProductModalOpen(true);
  };

  // Abertura do Modal para EDITAR Produto
  const handleOpenEditProduct = (p: Product) => {
    setProductFormData({ ...p });
    setProductModalMode('edit');
    setIsProductModalOpen(true);
  };

  // Manipulador de preços no formulário com recálculo automático de margem
  const handlePriceChangeInForm = (field: 'defaultPriceKg' | 'sellingPriceKg', val: number) => {
    const nextCusto = field === 'defaultPriceKg' ? val : productFormData.defaultPriceKg;
    const nextVenda = field === 'sellingPriceKg' ? val : productFormData.sellingPriceKg;
    let nextMargin = productFormData.targetMarginPercent;
    if (nextVenda > 0) {
      nextMargin = Number((((nextVenda - nextCusto) / nextVenda) * 100).toFixed(1));
    }
    setProductFormData(prev => ({
      ...prev,
      [field]: val,
      targetMarginPercent: nextMargin
    }));
  };

  // Manipulador de alteração de margem com ajuste no preço de venda
  const handleMarginChangeInForm = (val: number) => {
    let nextVenda = productFormData.sellingPriceKg;
    if (val < 100 && productFormData.defaultPriceKg > 0) {
      nextVenda = Number((productFormData.defaultPriceKg / (1 - val / 100)).toFixed(2));
    }
    setProductFormData(prev => ({
      ...prev,
      targetMarginPercent: val,
      sellingPriceKg: nextVenda
    }));
  };

  // Salvar Produto (Novo ou Editado)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productFormData.name.trim()) {
      alert('Informe o nome do produto / corte.');
      return;
    }
    if (!productFormData.code.trim()) {
      alert('Informe o código do produto.');
      return;
    }

    const cleanCode = productFormData.code.trim().toUpperCase();
    const cleanName = productFormData.name.trim();

    if (productModalMode === 'create') {
      const codeExists = products.some(p => p.code.toUpperCase() === cleanCode);
      if (codeExists) {
        alert(`Já existe um produto com o código "${cleanCode}". Por favor, utilize um código único.`);
        return;
      }
      const newProduct: Product = {
        ...productFormData,
        id: productFormData.id || `prd_${Date.now()}`,
        code: cleanCode,
        name: cleanName,
        defaultPriceKg: Number(productFormData.defaultPriceKg) || 0,
        sellingPriceKg: Number(productFormData.sellingPriceKg) || 0,
        averageWeightPieceKg: Number(productFormData.averageWeightPieceKg) || 0,
        targetMarginPercent: Number(productFormData.targetMarginPercent) || 0,
        yieldPercentStandard: Number(productFormData.yieldPercentStandard) || 0,
      };
      const updated = [...products, newProduct];
      StorageService.saveProducts(updated);
      onUpdateProducts(updated);
      setIsProductModalOpen(false);
      showToast(`Produto "${newProduct.name}" cadastrado com sucesso!`);
    } else {
      const codeExists = products.some(p => p.id !== productFormData.id && p.code.toUpperCase() === cleanCode);
      if (codeExists) {
        alert(`Já existe outro produto cadastrado com o código "${cleanCode}".`);
        return;
      }
      const updatedProduct: Product = {
        ...productFormData,
        code: cleanCode,
        name: cleanName,
        defaultPriceKg: Number(productFormData.defaultPriceKg) || 0,
        sellingPriceKg: Number(productFormData.sellingPriceKg) || 0,
        averageWeightPieceKg: Number(productFormData.averageWeightPieceKg) || 0,
        targetMarginPercent: Number(productFormData.targetMarginPercent) || 0,
        yieldPercentStandard: Number(productFormData.yieldPercentStandard) || 0,
      };
      const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      StorageService.saveProducts(updated);
      onUpdateProducts(updated);
      setIsProductModalOpen(false);
      showToast(`Produto "${updatedProduct.name}" atualizado com sucesso!`);
    }
  };

  // Excluir Produto após Confirmação
  const handleConfirmDeleteProduct = () => {
    if (!productToDelete) return;
    const deletedName = productToDelete.name;
    const updated = products.filter(p => p.id !== productToDelete.id);
    StorageService.deleteProduct(productToDelete.id);
    StorageService.saveProducts(updated);
    onUpdateProducts(updated);
    setProductToDelete(null);
    showToast(`Produto "${deletedName}" excluído com sucesso!`);
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

  // Filtragem dos produtos para a tabela da Etapa 1
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = productSearch === '' || 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat = productCategoryFilter === 'ALL' || p.category === productCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, productSearch, productCategoryFilter]);

  // Contagem por categoria
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: products.length };
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

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
            {onOpenProductManager && (
              <button
                onClick={onOpenProductManager}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="Gestão e Cadastro Central de Produtos e Cortes (CAD-01)"
              >
                <Package className="w-4 h-4" />
                <span>Gestão de Produtos ({products.length})</span>
              </button>
            )}

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
            {/* Header com Botão Novo Produto */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>1. Cadastro dos Produtos ({products.length} itens cadastrados)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Produtos bovinos, suínos e subprodutos da desossa extraídos da planilha matriz v10.7
                </p>
              </div>

              <button
                onClick={handleOpenNewProduct}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm self-start sm:self-auto active:scale-95 cursor-pointer"
                title="Cadastrar um novo produto ou corte na base de dados do sistema"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Produto</span>
              </button>
            </div>

            {/* Barra de Busca e Filtro de Categorias */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar por nome ou código..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {productSearch && (
                  <button 
                    onClick={() => setProductSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Categorias Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <button
                  onClick={() => setProductCategoryFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    productCategoryFilter === 'ALL'
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Todos ({categoryCounts['ALL'] || 0})
                </button>
                {(Object.keys(CATEGORY_CONFIG) as MeatCategory[]).map(catKey => {
                  const cfg = CATEGORY_CONFIG[catKey];
                  const isSel = productCategoryFilter === catKey;
                  return (
                    <button
                      key={catKey}
                      onClick={() => setProductCategoryFilter(catKey)}
                      className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                        isSel
                          ? `${cfg.badge} font-bold shadow-2xs`
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cfg.label} ({categoryCounts[catKey] || 0})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tabela de Produtos */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
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
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 font-sans">
                        Nenhum produto encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const catConfig = CATEGORY_CONFIG[p.category] || { label: p.category, badge: 'bg-slate-100 text-slate-700 border-slate-200' };
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-semibold">{p.code}</td>
                          <td className="px-4 py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {p.isBoneOrFatWaste && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-sans" title="Subproduto de descarte / graxaria">
                                  Graxaria
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-sans">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${catConfig.badge}`}>
                              {catConfig.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300 font-bold">{p.unit || 'KG'}</td>
                          <td className="px-3 py-2.5 text-right text-slate-800 dark:text-slate-200 font-bold">{p.averageWeightPieceKg} kg</td>
                          <td className="px-3 py-2.5 text-right font-bold text-amber-700 dark:text-amber-300">{formatCurrencyBRL(p.defaultPriceKg)}</td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 rounded transition cursor-pointer"
                                title="Editar dados e precificação do produto"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setProductToDelete(p)}
                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 rounded transition cursor-pointer"
                                title="Excluir produto do catálogo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
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

              <button
                onClick={handleOpenNewProduct}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="Cadastrar um novo produto na base de dados"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Produto</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
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
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 rounded transition cursor-pointer"
                              title="Editar precificação do produto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setProductToDelete(p)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 rounded transition cursor-pointer"
                              title="Excluir produto do catálogo"
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
                <span>6. Totais e Fechamento da Matriz v10.7</span>
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
                • <strong>Versão da Matriz:</strong> Planilha de Compra de Boi da Direção da Empresa v10.7 (Data de referência: quinta-feira, 1 de outubro de 2026).
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

      {/* Modal Cadastrar / Editar Produto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleSaveProduct} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 text-slate-900 dark:text-white transition-colors"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-sm">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {productModalMode === 'create' ? 'Cadastrar Novo Produto / Corte' : `Editar Produto: ${productFormData.name}`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Defina todos os parâmetros operacionais, precificação de compra e venda e rendimento
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* 1. Identificação Básica */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>1. Identificação do Produto</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Código do Produto <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: COR-PICANHA"
                      value={productFormData.code}
                      onChange={(e) => setProductFormData({ ...productFormData, code: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono font-bold uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Identificador único</span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Nome do Produto / Corte <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Picanha Grill Selection"
                      value={productFormData.name}
                      onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Nome completo exibido nas tabelas e relatórios</span>
                  </div>
                </div>
              </div>

              {/* 2. Categoria e Unidade */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>2. Classificação & Categoria de Carne</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Categoria Operacional
                    </label>
                    <select
                      value={productFormData.category}
                      onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value as MeatCategory })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                    >
                      <option value="quarto_osso">Quarto c/ Osso / Peça Inteira</option>
                      <option value="corte_traseiro">Corte Traseiro (Cortes Nobres)</option>
                      <option value="corte_dianteiro">Corte Dianteiro</option>
                      <option value="suino">Corte Suíno</option>
                      <option value="subproduto">Subproduto / Graxaria (Descarte)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Unidade de Medida
                    </label>
                    <select
                      value={productFormData.unit || 'KG'}
                      onChange={(e) => setProductFormData({ ...productFormData, unit: e.target.value as 'KG' | 'PECA' })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                    >
                      <option value="KG">KG (Quilogramas)</option>
                      <option value="PECA">PEÇA (Unidade)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition">
                    <input
                      type="checkbox"
                      checked={!!productFormData.isBoneOrFatWaste}
                      onChange={(e) => setProductFormData({ ...productFormData, isBoneOrFatWaste: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-600"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Classificar como Subproduto / Descarte de Graxaria (Sebo ou Osso)
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Itens de graxaria não geram corte comercial no balcão e entram no faturamento de subprodutos
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. Precificação Inteligente e Margens */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>3. Custos de Compra & Precificação de Venda</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Custo de Compra / Base (R$/kg) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={productFormData.defaultPriceKg}
                        onChange={(e) => handlePriceChangeInForm('defaultPriceKg', Number(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Custo oficial aplicado na matriz</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Preço Venda Balcão (R$/kg) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={productFormData.sellingPriceKg}
                        onChange={(e) => handlePriceChangeInForm('sellingPriceKg', Number(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Preço de venda ao consumidor</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Margem Alvo s/ Venda (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={productFormData.targetMarginPercent}
                        onChange={(e) => handleMarginChangeInForm(Number(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2.5 text-amber-600 dark:text-amber-400 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Ajusta preço de venda automaticamente</span>
                  </div>
                </div>

                {/* KPI Card com Margem e Markup em tempo real */}
                <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Lucro Bruto / kg</span>
                    <strong className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      R$ {(productFormData.sellingPriceKg - productFormData.defaultPriceKg).toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Margem s/ Venda</span>
                    <strong className={`text-xs font-mono font-bold ${productFormData.targetMarginPercent >= 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {productFormData.targetMarginPercent.toFixed(1)}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Markup s/ Compra</span>
                    <strong className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                      +{productFormData.defaultPriceKg > 0 ? (((productFormData.sellingPriceKg - productFormData.defaultPriceKg) / productFormData.defaultPriceKg) * 100).toFixed(1) : '0.0'}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* 4. Características Físicas e Rendimento */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-purple-500" />
                  <span>4. Especificações Físicas & Desossa</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Peso Médio por Peça (kg)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={productFormData.averageWeightPieceKg}
                        onChange={(e) => setProductFormData({ ...productFormData, averageWeightPieceKg: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2.5 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">kg</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Usado para conversão automática peça &lt;-&gt; kg</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Rendimento Padrão Esperado na Desossa (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={productFormData.yieldPercentStandard ?? 5.0}
                        onChange={(e) => setProductFormData({ ...productFormData, yieldPercentStandard: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2.5 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Participação esperada no boi ou carcaça</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{productModalMode === 'create' ? 'Cadastrar Produto' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Confirmar Exclusão de Produto */}
      {productToDelete && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-900 dark:text-white transition-colors animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Excluir Produto
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Confirmação de remoção definitiva do produto
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Produto:</span>
                <strong className="text-slate-900 dark:text-white font-semibold">{productToDelete.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Código:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{productToDelete.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Categoria:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {CATEGORY_CONFIG[productToDelete.category]?.label || productToDelete.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Custo Base / Venda:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {formatCurrencyBRL(productToDelete.defaultPriceKg)} / {formatCurrencyBRL(productToDelete.sellingPriceKg)}
                </span>
              </div>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed font-medium">
              Atenção: Ao excluir este produto, ele será removido do catálogo de cortes e dos cálculos de apuração no banco de dados. Esta ação não poderá ser desfeita.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Produto</span>
              </button>
            </div>
          </div>
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
