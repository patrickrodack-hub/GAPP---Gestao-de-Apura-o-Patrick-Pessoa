import React, { useState } from 'react';
import { Supplier } from '../../types/erp';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Printer, 
  Search, 
  X, 
  Check, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  CreditCard,
  Scale,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface SupplierManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
}

export const SupplierManagementModal: React.FC<SupplierManagementModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formTradeName, setFormTradeName] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formIe, setFormIe] = useState('');
  const [formSif, setFormSif] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('MT');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPaymentTerms, setFormPaymentTerms] = useState('14 dias');
  const [formCarcassWeight, setFormCarcassWeight] = useState(260);
  const [formActive, setFormActive] = useState(true);
  const [formNotes, setFormNotes] = useState('');

  if (!isOpen) return null;

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.tradeName && s.tradeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    s.cnpj.includes(searchTerm) ||
    (s.sifNumber && s.sifNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    const nextNum = suppliers.length + 1;
    setFormCode(`FORN-${nextNum.toString().padStart(2, '0')}`);
    setFormName('');
    setFormTradeName('');
    setFormCnpj('');
    setFormIe('');
    setFormSif('');
    setFormCity('');
    setFormState('MT');
    setFormContact('');
    setFormPhone('');
    setFormEmail('');
    setFormPaymentTerms('14 dias');
    setFormCarcassWeight(260);
    setFormActive(true);
    setFormNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormCode(s.code);
    setFormName(s.name);
    setFormTradeName(s.tradeName || '');
    setFormCnpj(s.cnpj);
    setFormIe(s.stateRegistration || '');
    setFormSif(s.sifNumber || '');
    setFormCity(s.city);
    setFormState(s.state);
    setFormContact(s.contactName);
    setFormPhone(s.phone);
    setFormEmail(s.email);
    setFormPaymentTerms(s.paymentTerms || '14 dias');
    setFormCarcassWeight(s.standardCarcassWeightKg || 260);
    setFormActive(s.active);
    setFormNotes(s.notes || '');
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCnpj.trim()) {
      alert('Preencha os campos obrigatórios (Razão Social e CNPJ).');
      return;
    }

    if (editingSupplier) {
      const updated: Supplier = {
        ...editingSupplier,
        code: formCode,
        name: formName.trim(),
        tradeName: formTradeName.trim() || undefined,
        cnpj: formCnpj.trim(),
        stateRegistration: formIe.trim() || undefined,
        sifNumber: formSif.trim() || undefined,
        city: formCity.trim(),
        state: formState.trim().toUpperCase(),
        contactName: formContact.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        paymentTerms: formPaymentTerms.trim() || undefined,
        standardCarcassWeightKg: Number(formCarcassWeight) || 260,
        active: formActive,
        notes: formNotes.trim() || undefined,
      };
      onUpdateSupplier(updated);
    } else {
      const newSupplier: Supplier = {
        id: `sup_${Date.now()}`,
        code: formCode.trim() || `FORN-${Date.now().toString().slice(-4)}`,
        name: formName.trim(),
        tradeName: formTradeName.trim() || undefined,
        cnpj: formCnpj.trim(),
        stateRegistration: formIe.trim() || undefined,
        sifNumber: formSif.trim() || undefined,
        city: formCity.trim(),
        state: formState.trim().toUpperCase(),
        contactName: formContact.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        paymentTerms: formPaymentTerms.trim() || undefined,
        standardCarcassWeightKg: Number(formCarcassWeight) || 260,
        active: formActive,
        notes: formNotes.trim() || undefined,
      };
      onAddSupplier(newSupplier);
    }

    setIsFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingSupplier) {
      onDeleteSupplier(deletingSupplier.id);
      setDeletingSupplier(null);
    }
  };

  // Se o usuário clicou em imprimir a lista
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-5xl w-full shadow-2xl flex flex-col my-auto max-h-[95vh] overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-600 text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Cadastro de Frigoríficos & Fornecedores de Gado
              </h2>
              <p className="text-xs text-white/80">
                Grupo GAPP Sistemas • Gestão Central de Parceiros Frigoríficos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrintPreview(!isPrintPreview)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                isPrintPreview
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title="Alternar modo de impressão oficial"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrintPreview ? 'Voltar à Gestão' : 'Imprimir Ficha'}</span>
            </button>

            {isPrintPreview && (
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Agora</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition ml-1"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINT PREVIEW VIEW */}
        {isPrintPreview ? (
          <div className="p-8 overflow-y-auto bg-slate-50 print:bg-white print:p-0 space-y-6">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 space-y-6 text-slate-900">
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    GRUPO GAPP SISTEMAS
                  </h1>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    CATÁLOGO OFICIAL DE FORNECEDORES & FRIGORÍFICOS HOMOLOGADOS
                  </p>
                  <p className="text-xs text-slate-600">
                    Direção de Compras e Abastecimento de Carne • Patrick Pessoa
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Data de Emissão: <strong>{new Date().toLocaleDateString('pt-BR')}</strong></div>
                  <div>Total de Frigoríficos: <strong>{suppliers.length}</strong></div>
                  <div>Ativos: <strong>{suppliers.filter(s => s.active).length}</strong></div>
                </div>
              </div>

              {/* Tabela de Impressão */}
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 border-b-2 border-slate-400 font-bold uppercase text-slate-700 text-[10px]">
                  <tr>
                    <th className="p-2 border">Cód</th>
                    <th className="p-2 border">Razão Social / Nome Fantasia</th>
                    <th className="p-2 border">CNPJ / IE</th>
                    <th className="p-2 border">Selo SIF</th>
                    <th className="p-2 border">Origem (Cidade/UF)</th>
                    <th className="p-2 border">Contato & Telefone</th>
                    <th className="p-2 border">Cond. Pgto</th>
                    <th className="p-2 border text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {suppliers.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-2 border font-bold text-blue-800">{s.code}</td>
                      <td className="p-2 border font-sans font-semibold">
                        <div>{s.name}</div>
                        {s.tradeName && <div className="text-[10px] text-slate-500">{s.tradeName}</div>}
                      </td>
                      <td className="p-2 border">
                        <div>{s.cnpj}</div>
                        {s.stateRegistration && <div className="text-[10px] text-slate-500">IE: {s.stateRegistration}</div>}
                      </td>
                      <td className="p-2 border font-bold text-amber-800">{s.sifNumber || '-'}</td>
                      <td className="p-2 border font-sans">{s.city} / {s.state}</td>
                      <td className="p-2 border font-sans">
                        <div>{s.contactName || '-'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{s.phone}</div>
                      </td>
                      <td className="p-2 border font-sans">{s.paymentTerms || '14 dias'}</td>
                      <td className="p-2 border text-center font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {s.active ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-6 border-t border-slate-300 flex justify-between text-xs text-slate-500">
                <span>Relatório gerado pelo ERP Grupo GAPP Sistemas v10.1</span>
                <span>Responsável: Patrick Pessoa (Direção)</span>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD MANAGEMENT VIEW */
          <div className="p-6 overflow-y-auto space-y-5">
            
            {/* Control Bar: Search + Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por razão social, CNPJ, SIF ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {filteredSuppliers.length} frigoríficos cadastrados
                </span>

                <button
                  onClick={handleOpenAdd}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Fornecedor</span>
                </button>
              </div>
            </div>

            {/* Suppliers Grid / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSuppliers.map((s) => (
                <div 
                  key={s.id}
                  className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-sm hover:shadow transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            {s.code}
                          </span>
                          {s.sifNumber && (
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              {s.sifNumber}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${s.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'}`}>
                            {s.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">
                          {s.name}
                        </h3>
                        {s.tradeName && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {s.tradeName}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                          title="Editar cadastro do fornecedor"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={() => setDeletingSupplier(s)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-600 dark:text-slate-300 transition"
                          title="Excluir fornecedor"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        </button>
                      </div>
                    </div>

                    {/* Details Info */}
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">CNPJ: <strong>{s.cnpj}</strong></span>
                        {s.stateRegistration && <span className="text-slate-400 font-mono text-[11px]">• IE: {s.stateRegistration}</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{s.city} - {s.state}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{s.contactName || 'Contato Comercial'}: <strong>{s.phone || 'Não informado'}</strong></span>
                      </div>

                      {s.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{s.email}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          Prazo: <strong className="text-slate-700 dark:text-slate-200">{s.paymentTerms || '14 dias'}</strong>
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Scale className="w-3 h-3 text-slate-400" />
                          Peso Médio: <strong>{s.standardCarcassWeightKg || 260} kg</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {s.notes && (
                    <div className="mt-3 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 italic">
                      "{s.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredSuppliers.length === 0 && (
              <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">Nenhum fornecedor encontrado</p>
                <p className="text-xs mt-1">Tente outro termo de busca ou adicione um novo fornecedor.</p>
              </div>
            )}
          </div>
        )}

        {/* MODAL ADICIONAR / EDITAR FORNECEDOR */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {editingSupplier ? 'Editar Fornecedor Frigorífico' : 'Novo Fornecedor Frigorífico'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Código Interno:
                    </label>
                    <input
                      type="text"
                      required
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Selo SIF (Inspeção Federal):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: SIF 42"
                      value={formSif}
                      onChange={(e) => setFormSif(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Status Operacional:
                    </label>
                    <select
                      value={formActive ? 'ativo' : 'inativo'}
                      onChange={(e) => setFormActive(e.target.value === 'ativo')}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold"
                    >
                      <option value="ativo">Ativo (Habilitado para Compras)</option>
                      <option value="inativo">Inativo / Bloqueado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Razão Social / Nome Frigorífico: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: JBS S.A. / Friboi"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome Fantasia / Unidade:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Friboi Barra do Garças"
                      value={formTradeName}
                      onChange={(e) => setFormTradeName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      CNPJ: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="00.000.000/0000-00"
                      value={formCnpj}
                      onChange={(e) => setFormCnpj(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Inscrição Estadual (IE):
                    </label>
                    <input
                      type="text"
                      placeholder="Número da IE"
                      value={formIe}
                      onChange={(e) => setFormIe(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cidade da Planta Frigorífica:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Barra do Garças"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      UF (Estado):
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="MT"
                      value={formState}
                      onChange={(e) => setFormState(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-center uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Contato / Representante:
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do vendedor/gerente"
                      value={formContact}
                      onChange={(e) => setFormContact(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Telefone / WhatsApp:
                    </label>
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      E-mail Comercial:
                    </label>
                    <input
                      type="email"
                      placeholder="vendas@frigorifico.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Condições de Pagamento:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 7 / 14 / 21 dias / Boleto"
                      value={formPaymentTerms}
                      onChange={(e) => setFormPaymentTerms(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Peso Médio da Carcaça (kg/boi):
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formCarcassWeight}
                      onChange={(e) => setFormCarcassWeight(Number(e.target.value) || 260)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Observações Operacionais:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Padrão de acabamento, tipo de gado predominante, tempo médio de frete até o RJ..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingSupplier ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DIALOG CONFIRMAÇÃO DE EXCLUSÃO */}
        {deletingSupplier && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Confirmar Exclusão
                  </h3>
                  <p className="text-xs text-slate-500">Ação irreversível de cadastro</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                Deseja realmente excluir o fornecedor <strong>{deletingSupplier.name}</strong> ({deletingSupplier.code})?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setDeletingSupplier(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Fornecedor</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
