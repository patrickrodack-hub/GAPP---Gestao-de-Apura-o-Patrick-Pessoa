import React, { useState, useMemo } from 'react';
import { Product, MeatCategory } from '../../types/erp';
import { formatCurrencyBRL } from '../../services/calculationService';
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  Check, 
  DollarSign,
  Scale, 
  Layers, 
  AlertTriangle,
  Tag,
  Printer
} from 'lucide-react';

interface ProductManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
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

export const ProductManagementModal: React.FC<ProductManagementModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Product>(initialProductFormState);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Contagem por categorias
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: products.length };
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filtragem dos produtos
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = searchTerm === '' || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  if (!isOpen) return null;

  // Abertura formulário novo produto
  const handleOpenAdd = () => {
    setFormData({
      ...initialProductFormState,
      id: `prd_${Date.now()}`,
    });
    setFormMode('create');
    setIsFormOpen(true);
  };

  // Abertura formulário edição
  const handleOpenEdit = (p: Product) => {
    setFormData({ ...p });
    setFormMode('edit');
    setIsFormOpen(true);
  };

  // Atualização interativa de preços e margens
  const handlePriceChange = (field: 'defaultPriceKg' | 'sellingPriceKg', val: number) => {
    const nextCusto = field === 'defaultPriceKg' ? val : formData.defaultPriceKg;
    const nextVenda = field === 'sellingPriceKg' ? val : formData.sellingPriceKg;
    let nextMargin = formData.targetMarginPercent;
    if (nextVenda > 0) {
      nextMargin = Number((((nextVenda - nextCusto) / nextVenda) * 100).toFixed(1));
    }
    setFormData(prev => ({
      ...prev,
      [field]: val,
      targetMarginPercent: nextMargin
    }));
  };

  const handleMarginChange = (val: number) => {
    let nextVenda = formData.sellingPriceKg;
    if (val < 100 && formData.defaultPriceKg > 0) {
      nextVenda = Number((formData.defaultPriceKg / (1 - val / 100)).toFixed(2));
    }
    setFormData(prev => ({
      ...prev,
      targetMarginPercent: val,
      sellingPriceKg: nextVenda
    }));
  };

  // Submissão do formulário
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Informe o nome do produto / corte.');
      return;
    }
    if (!formData.code.trim()) {
      alert('Informe o código do produto.');
      return;
    }

    const cleanCode = formData.code.trim().toUpperCase();
    const cleanName = formData.name.trim();

    if (formMode === 'create') {
      const codeExists = products.some(p => p.code.toUpperCase() === cleanCode);
      if (codeExists) {
        alert(`Já existe um produto com o código "${cleanCode}". Por favor, utilize um código único.`);
        return;
      }
      const newProduct: Product = {
        ...formData,
        id: formData.id || `prd_${Date.now()}`,
        code: cleanCode,
        name: cleanName,
        defaultPriceKg: Number(formData.defaultPriceKg) || 0,
        sellingPriceKg: Number(formData.sellingPriceKg) || 0,
        averageWeightPieceKg: Number(formData.averageWeightPieceKg) || 0,
        targetMarginPercent: Number(formData.targetMarginPercent) || 0,
        yieldPercentStandard: Number(formData.yieldPercentStandard) || 0,
      };
      onAddProduct(newProduct);
      setIsFormOpen(false);
    } else {
      const codeExists = products.some(p => p.id !== formData.id && p.code.toUpperCase() === cleanCode);
      if (codeExists) {
        alert(`Já existe outro produto cadastrado com o código "${cleanCode}".`);
        return;
      }
      const updatedProduct: Product = {
        ...formData,
        code: cleanCode,
        name: cleanName,
        defaultPriceKg: Number(formData.defaultPriceKg) || 0,
        sellingPriceKg: Number(formData.sellingPriceKg) || 0,
        averageWeightPieceKg: Number(formData.averageWeightPieceKg) || 0,
        targetMarginPercent: Number(formData.targetMarginPercent) || 0,
        yieldPercentStandard: Number(formData.yieldPercentStandard) || 0,
      };
      onUpdateProduct(updatedProduct);
      setIsFormOpen(false);
    }
  };

  // Confirmação de exclusão
  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    onDeleteProduct(productToDelete.id);
    setProductToDelete(null);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-white transition-colors">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Cadastro & Gestão de Produtos (CAD-01)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  {products.length} Cortes Homologados
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Catálogo de carnes bovinas, suínas e subprodutos de desossa para a planilha e pedidos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Fechar janela"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Busca e Filtros de Categoria */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categorias Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] overflow-x-auto">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Todos ({categoryCounts['ALL'] || 0})
            </button>
            {(Object.keys(CATEGORY_CONFIG) as MeatCategory[]).map(catKey => {
              const cfg = CATEGORY_CONFIG[catKey];
              const isSel = categoryFilter === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setCategoryFilter(catKey)}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    isSel
                      ? `${cfg.badge} font-bold shadow-2xs`
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cfg.label} ({categoryCounts[catKey] || 0})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nome do Produto / Corte</th>
                  <th className="px-3 py-3">Categoria</th>
                  <th className="px-3 py-3 text-center">Unidade</th>
                  <th className="px-3 py-3 text-right">Peso Médio</th>
                  <th className="px-3 py-3 text-right">Custo Base</th>
                  <th className="px-3 py-3 text-right">Preço Venda</th>
                  <th className="px-3 py-3 text-right">Margem s/ Venda</th>
                  <th className="px-3 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500 font-sans">
                      Nenhum produto cadastrado corresponde aos critérios de pesquisa.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const catConfig = CATEGORY_CONFIG[p.category] || { label: p.category, badge: 'bg-slate-100 text-slate-700' };
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400">{p.code}</td>
                        <td className="px-4 py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {p.isBoneOrFatWaste && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-sans">
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
                        <td className="px-3 py-2.5 text-right text-slate-800 dark:text-slate-200">{p.averageWeightPieceKg} kg</td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">
                          {formatCurrencyBRL(p.defaultPriceKg)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrencyBRL(p.sellingPriceKg)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-amber-600 dark:text-amber-400">
                          {p.targetMarginPercent.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded transition cursor-pointer"
                              title="Editar Produto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setProductToDelete(p)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition cursor-pointer"
                              title="Excluir Produto"
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

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between text-xs text-slate-500">
          <span>Total de {products.length} produtos cadastrados</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* SUBMODAL: Formulário Cadastrar / Editar Produto */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[10010] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleSubmitForm} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 text-slate-900 dark:text-white transition-colors animate-fade-in"
          >
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-sm">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {formMode === 'create' ? 'Cadastrar Novo Produto' : `Editar Produto: ${formData.name}`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preencha as informações do corte, custos e preços de venda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* 1. Identificação */}
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
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono font-bold uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Nome do Produto / Corte <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Picanha Grill Selection"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
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
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as MeatCategory })}
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
                      value={formData.unit || 'KG'}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'KG' | 'PECA' })}
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
                      checked={!!formData.isBoneOrFatWaste}
                      onChange={(e) => setFormData({ ...formData, isBoneOrFatWaste: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-600"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Classificar como Subproduto / Descarte de Graxaria (Sebo ou Osso)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. Precificação e Margens */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>3. Custos de Compra & Precificação de Venda</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Custo de Compra (R$/kg) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.defaultPriceKg}
                        onChange={(e) => handlePriceChange('defaultPriceKg', Number(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
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
                        value={formData.sellingPriceKg}
                        onChange={(e) => handlePriceChange('sellingPriceKg', Number(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Margem Alvo s/ Venda (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={formData.targetMarginPercent}
                        onChange={(e) => handleMarginChange(Number(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2.5 text-amber-600 dark:text-amber-400 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Lucro Bruto / kg</span>
                    <strong className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      R$ {(formData.sellingPriceKg - formData.defaultPriceKg).toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Margem s/ Venda</span>
                    <strong className={`text-xs font-mono font-bold ${formData.targetMarginPercent >= 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {formData.targetMarginPercent.toFixed(1)}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Markup s/ Compra</span>
                    <strong className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                      +{formData.defaultPriceKg > 0 ? (((formData.sellingPriceKg - formData.defaultPriceKg) / formData.defaultPriceKg) * 100).toFixed(1) : '0.0'}%
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
                        value={formData.averageWeightPieceKg}
                        onChange={(e) => setFormData({ ...formData, averageWeightPieceKg: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2.5 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">kg</span>
                    </div>
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
                        value={formData.yieldPercentStandard ?? 5.0}
                        onChange={(e) => setFormData({ ...formData, yieldPercentStandard: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2.5 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{formMode === 'create' ? 'Cadastrar Produto' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBMODAL: Confirmar Exclusão de Produto */}
      {productToDelete && (
        <div className="fixed inset-0 z-[10010] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
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
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Produto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
