import React, { useState, useEffect } from 'react';
import { SystemUser, UserRole } from '../../types/erp';
import { StorageService } from '../../services/storageService';
import { ALL_SYSTEM_MODULES } from '../../data/initialData';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  Terminal,
  Eye,
  EyeOff,
  UserCheck,
  UserX
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SystemUser | null;
  onUsersUpdated?: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUsersUpdated,
}) => {
  const [users, setUsers] = useState<SystemUser[]>(() => StorageService.getUsers());
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  // Sincroniza usuários da nuvem Firestore sempre que o modal for aberto
  useEffect(() => {
    if (isOpen) {
      setUsers(StorageService.getUsers());
      StorageService.syncUsersFromCloud().then(latest => {
        setUsers(latest);
      }).catch(() => {});
    }
  }, [isOpen]);

  // Form states
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('OPERACIONAL');
  const [formRoleTitle, setFormRoleTitle] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formAllowedModules, setFormAllowedModules] = useState<string[]>([
    'dashboard', 'sheet', 'inventory'
  ]);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const canManageUsers = currentUser?.role === 'DESENVOLVEDOR' || currentUser?.role === 'DIRETOR';

  if (!isOpen) return null;

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleStartCreate = () => {
    if (!canManageUsers) {
      showNotification('Somente os usuários Desenvolvedor e Diretor podem cadastrar novos usuários.', 'error');
      return;
    }
    setSelectedUser(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('OPERACIONAL');
    setFormRoleTitle('Operador de Filial');
    setFormEmail('');
    setFormActive(true);
    setFormAllowedModules(['dashboard', 'sheet', 'inventory']);
    setIsEditing(true);
  };

  const handleStartEdit = (user: SystemUser) => {
    if (!canManageUsers) {
      showNotification('Somente os usuários Desenvolvedor e Diretor podem editar usuários.', 'error');
      return;
    }
    setSelectedUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword(user.password);
    setFormRole(user.role);
    setFormRoleTitle(user.roleTitle || '');
    setFormEmail(user.email || '');
    setFormActive(user.active);
    setFormAllowedModules(user.allowedModules || []);
    setIsEditing(true);
  };

  const handleApplyRolePreset = (role: UserRole) => {
    setFormRole(role);
    switch (role) {
      case 'DESENVOLVEDOR':
        setFormRoleTitle('Desenvolvedor do Software');
        setFormAllowedModules(ALL_SYSTEM_MODULES.map(m => m.id));
        break;
      case 'DIRETOR':
        setFormRoleTitle('Diretor de Operações');
        setFormAllowedModules(ALL_SYSTEM_MODULES.filter(m => m.id !== 'users').map(m => m.id));
        break;
      case 'COMPRADOR':
        setFormRoleTitle('Mesa de Compras Matriz');
        setFormAllowedModules(['dashboard', 'sheet', 'purchases', 'parameters']);
        break;
      case 'OPERACIONAL':
        setFormRoleTitle('Encarregado / Conferente');
        setFormAllowedModules(['dashboard', 'inventory', 'yield']);
        break;
      case 'VISUALIZADOR':
        setFormRoleTitle('Visualizador / Auditor');
        setFormAllowedModules(['dashboard', 'results']);
        break;
    }
  };

  const handleToggleModule = (moduleId: string) => {
    // Desenvolvedor sempre tem todos os módulos
    if (formRole === 'DESENVOLVEDOR') return;

    setFormAllowedModules(prev => {
      if (prev.includes(moduleId)) {
        return prev.filter(m => m !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  const handleSelectAllModules = () => {
    setFormAllowedModules(ALL_SYSTEM_MODULES.map(m => m.id));
  };

  const handleClearModules = () => {
    if (formRole === 'DESENVOLVEDOR') return;
    setFormAllowedModules(['dashboard']); // Mantém pelo menos o dashboard
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManageUsers) {
      showNotification('Somente os usuários Desenvolvedor e Diretor podem cadastrar ou alterar usuários.', 'error');
      return;
    }

    const trimmedName = formName.trim();
    const trimmedUser = formUsername.trim().toLowerCase();
    const trimmedPass = formPassword.trim();

    if (!trimmedName) {
      showNotification('Informe o nome completo do usuário.', 'error');
      return;
    }

    if (!trimmedUser) {
      showNotification('Informe o login de acesso.', 'error');
      return;
    }

    if (!trimmedPass) {
      showNotification('Defina uma senha de acesso.', 'error');
      return;
    }

    try {
      if (selectedUser) {
        // Atualização de usuário existente
        const isTargetDev = selectedUser.role === 'DESENVOLVEDOR' || selectedUser.username.toLowerCase() === 'desenvolvedor';
        
        const updated: SystemUser = {
          ...selectedUser,
          name: trimmedName,
          username: isTargetDev ? 'desenvolvedor' : trimmedUser,
          password: trimmedPass,
          role: isTargetDev ? 'DESENVOLVEDOR' : formRole,
          roleTitle: formRoleTitle.trim() || undefined,
          email: formEmail.trim() || undefined,
          active: isTargetDev ? true : formActive,
          allowedModules: isTargetDev ? ALL_SYSTEM_MODULES.map(m => m.id) : formAllowedModules,
        };

        const newUsersList = StorageService.updateUser(updated);
        setUsers(newUsersList);
        showNotification(`Usuário "${updated.name}" atualizado com sucesso!`);
      } else {
        // Criação de novo usuário
        const newUser: SystemUser = {
          id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: trimmedName,
          username: trimmedUser,
          password: trimmedPass,
          role: formRole,
          roleTitle: formRoleTitle.trim() || undefined,
          email: formEmail.trim() || undefined,
          active: formActive,
          allowedModules: formRole === 'DESENVOLVEDOR' ? ALL_SYSTEM_MODULES.map(m => m.id) : formAllowedModules,
          createdAt: Date.now()
        };

        const newUsersList = StorageService.addUser(newUser);
        setUsers(newUsersList);
        showNotification(`Usuário "${newUser.name}" cadastrado com sucesso!`);
      }

      setIsEditing(false);
      setSelectedUser(null);
      if (onUsersUpdated) onUsersUpdated();
    } catch (err: any) {
      showNotification(err.message || 'Erro ao salvar usuário.', 'error');
    }
  };

  const handleDeleteUser = (user: SystemUser) => {
    if (!canManageUsers) {
      showNotification('Somente os usuários Desenvolvedor e Diretor podem excluir usuários.', 'error');
      return;
    }

    if (user.role === 'DESENVOLVEDOR' || user.username.toLowerCase() === 'desenvolvedor') {
      showNotification('O usuário Desenvolvedor principal não pode ser excluído.', 'error');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o acesso de "${user.name}" (${user.username})?`)) {
      try {
        const newUsersList = StorageService.deleteUser(user.id);
        setUsers(newUsersList);
        showNotification(`Usuário "${user.name}" excluído.`);
        if (onUsersUpdated) onUsersUpdated();
      } catch (err: any) {
        showNotification(err.message || 'Erro ao excluir usuário.', 'error');
      }
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'DESENVOLVEDOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40">
            <Terminal className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>DESENVOLVEDOR (100% ACESSO)</span>
          </span>
        );
      case 'DIRETOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            <span>DIRETORIA</span>
          </span>
        );
      case 'COMPRADOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-500/40">
            <span>COMPRAS</span>
          </span>
        );
      case 'OPERACIONAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40">
            <span>OPERACIONAL</span>
          </span>
        );
      case 'VISUALIZADOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/40">
            <span>LEITURA</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Cadastro de Usuários & Permissões de Acesso
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  {users.length} {users.length === 1 ? 'Usuário' : 'Usuários'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gerencie credenciais, senhas e controle granular de módulos do ERP para filiais e diretoria
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div className={`px-4 py-2 text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success' 
              ? 'bg-emerald-500 text-white' 
              : 'bg-rose-500 text-white'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Body do Modal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Se estiver no formulário de edição/criação */}
          {isEditing ? (
            <form onSubmit={handleSaveUser} className="space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedUser ? `Editar Usuário: ${selectedUser.name}` : 'Cadastrar Novo Usuário'}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Voltar para Lista
                </button>
              </div>

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
                {/* Nome Completo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Login de Acesso */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Login / Usuário *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={selectedUser?.role === 'DESENVOLVEDOR'}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Ex: carlos.silva"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                  />
                  {selectedUser?.role === 'DESENVOLVEDOR' && (
                    <span className="text-[10px] text-amber-600 block mt-0.5">Login protegido</span>
                  )}
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Senha de Acesso *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Senha do usuário"
                      className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Perfil / Cargo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Perfil / Função no Sistema
                  </label>
                  <select
                    value={formRole}
                    disabled={selectedUser?.role === 'DESENVOLVEDOR'}
                    onChange={(e) => handleApplyRolePreset(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                  >
                    <option value="OPERACIONAL">OPERACIONAL (Filiais & Estoque)</option>
                    <option value="COMPRADOR">COMPRADOR (Compras & Planilha)</option>
                    <option value="DIRETOR">DIRETOR (Gestão Geral)</option>
                    <option value="VISUALIZADOR">VISUALIZADOR (Somente Leitura)</option>
                    <option value="DESENVOLVEDOR">DESENVOLVEDOR (100% Acesso Total)</option>
                  </select>
                </div>

                {/* Título de Exibição */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cargo / Descrição
                  </label>
                  <input
                    type="text"
                    value={formRoleTitle}
                    onChange={(e) => setFormRoleTitle(e.target.value)}
                    placeholder="Ex: Gerente Geral de Loja"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Status Ativo/Inativo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status da Conta
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="activeStatus"
                        checked={formActive}
                        disabled={selectedUser?.role === 'DESENVOLVEDOR'}
                        onChange={() => setFormActive(true)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-emerald-600">Ativo</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="activeStatus"
                        checked={!formActive}
                        disabled={selectedUser?.role === 'DESENVOLVEDOR'}
                        onChange={() => setFormActive(false)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span className="font-bold text-rose-600">Inativo</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Seção: Permissões Granulares por Módulo */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span>Permissões de Acesso por Módulo do Sistema</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Marque individualmente quais abas e módulos este usuário tem autorização para visualizar e operar
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllModules}
                      className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition"
                    >
                      Marcar Todos
                    </button>
                    {formRole !== 'DESENVOLVEDOR' && (
                      <button
                        type="button"
                        onClick={handleClearModules}
                        className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid de Checkboxes de Módulos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                  {ALL_SYSTEM_MODULES.map((mod) => {
                    const isChecked = formRole === 'DESENVOLVEDOR' || formAllowedModules.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={formRole === 'DESENVOLVEDOR'}
                          onChange={() => handleToggleModule(mod.id)}
                          className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 disabled:opacity-50"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="block text-xs font-bold truncate">
                            {mod.label}
                          </span>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-tight">
                            {mod.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {formRole === 'DESENVOLVEDOR' && (
                  <div className="p-2.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs flex items-center gap-2">
                    <Terminal className="w-4 h-4 shrink-0" />
                    <span>O perfil Desenvolvedor possui bypass e acesso integral e irrestrito a 100% dos módulos do sistema.</span>
                  </div>
                )}
              </div>

              {/* Botões do Formulário */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Usuário</span>
                </button>
              </div>

            </form>
          ) : (
            // Lista de Usuários
            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Usuários com Acesso ao Módulo de Gestão
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Clique em um usuário para gerenciar módulos permitidos ou adicione novos acessos
                  </p>
                </div>

                {canManageUsers ? (
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer self-start sm:self-auto"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Novo Usuário</span>
                  </button>
                ) : (
                  <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Modo Consulta (Cadastro restrito a Desenvolvedor e Diretor)</span>
                  </div>
                )}
              </div>

              {/* Tabela / Cards de Usuários */}
              <div className="grid grid-cols-1 gap-3">
                {users.map((user) => {
                  const isDev = user.role === 'DESENVOLVEDOR';
                  const isCurrent = currentUser?.id === user.id;

                  return (
                    <div
                      key={user.id}
                      className={`p-4 rounded-xl border transition ${
                        isDev
                          ? 'bg-gradient-to-r from-purple-500/10 via-slate-50 to-amber-500/10 dark:from-purple-950/30 dark:via-slate-900 dark:to-amber-950/20 border-purple-500/40 shadow-sm'
                          : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        
                        {/* Info Usuário */}
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                            isDev
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                              : user.active
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {user.name}
                              </span>
                              {getRoleBadge(user.role)}
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/40">
                                  SUA CONTA ATUAL
                                </span>
                              )}
                              {!user.active && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-600 border border-rose-500/30">
                                  INATIVO
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                              <span>Login: <strong className="text-slate-800 dark:text-slate-200">{user.username}</strong></span>
                              <span>Senha: <strong className="text-slate-800 dark:text-slate-200">••••••••</strong></span>
                              {user.roleTitle && (
                                <span className="text-slate-600 dark:text-slate-300 font-sans">
                                  {user.roleTitle}
                                </span>
                              )}
                            </div>

                            {/* Tags de Módulos Autorizados */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                              <span className="text-[10px] text-slate-400 font-semibold mr-1">
                                Módulos Liberados:
                              </span>
                              {isDev ? (
                                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                  ✓ Todos os 9 Módulos do ERP (100%)
                                </span>
                              ) : (
                                (user.allowedModules || []).map(modId => {
                                  const modInfo = ALL_SYSTEM_MODULES.find(m => m.id === modId);
                                  return (
                                    <span 
                                      key={modId}
                                      className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                                    >
                                      {modInfo?.label || modId}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        {canManageUsers && (
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(user)}
                              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Editar credenciais e permissões"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {!isDev && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user)}
                                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                                title="Excluir usuário"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

        {/* Rodapé com Fechamento */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Permissões persistidas localmente e sincronizadas com a base central.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
