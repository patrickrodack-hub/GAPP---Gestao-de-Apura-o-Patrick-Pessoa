import React, { useState, useEffect, useMemo } from 'react';
import { SystemUser, UserRole, Store } from '../../types/erp';
import { StorageService } from '../../services/storageService';
import { ALL_SYSTEM_MODULES, SystemModuleItem } from '../../data/initialData';
import { ReportBrandingService } from '../../services/reportBrandingService';
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
  UserX,
  Printer,
  Search,
  Filter,
  Layers,
  Building2,
  FileText,
  Copy,
  CheckSquare,
  Square,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SystemUser | null;
  onUsersUpdated?: () => void;
}

type ModalViewTab = 'users' | 'matrix' | 'report';

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUsersUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<ModalViewTab>('users');
  const [users, setUsers] = useState<SystemUser[]>(() => StorageService.getUsers());
  const [stores, setStores] = useState<Store[]>(() => StorageService.getStores());
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  // Filtros de busca e visualização
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Sincroniza usuários e filiais ao abrir
  useEffect(() => {
    if (isOpen) {
      setUsers(StorageService.getUsers());
      setStores(StorageService.getStores());
      StorageService.syncUsersFromCloud().then(latest => {
        if (latest && latest.length > 0) {
          setUsers(latest);
        }
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
  const [formStoreId, setFormStoreId] = useState<string>('matriz');
  const [formActive, setFormActive] = useState(true);
  const [formAllowedModules, setFormAllowedModules] = useState<string[]>([
    'dashboard', 'sheet', 'inventory', 'perishables'
  ]);
  const [formPreferredTheme, setFormPreferredTheme] = useState<'solidcon' | 'light' | 'dark' | 'gapp-new'>('gapp-new');
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const canManageUsers = currentUser?.role === 'DESENVOLVEDOR' || currentUser?.role === 'DIRETOR';

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3800);
  };

  // Filtragem de usuários
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter(u => {
      const matchSearch = !q || 
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.roleTitle && u.roleTitle.toLowerCase().includes(q));

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && u.active) || 
        (statusFilter === 'INACTIVE' && !u.active);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Estatísticas do módulo
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.active).length;
    const inactive = total - active;
    const managementCount = users.filter(u => u.role === 'DESENVOLVEDOR' || u.role === 'DIRETOR').length;
    const storeOperatorsCount = users.filter(u => u.role === 'OPERACIONAL').length;
    const totalModules = ALL_SYSTEM_MODULES.length;
    return { total, active, inactive, managementCount, storeOperatorsCount, totalModules };
  }, [users]);

  // Agrupamento dos 14 módulos por categoria
  const moduleCategories = useMemo(() => {
    const categories: Record<string, { label: string; modules: SystemModuleItem[] }> = {
      GESTAO: { label: 'Gestão Executiva & Parâmetros', modules: [] },
      COMPRAS: { label: 'Mesa de Compras Matriz (Bovino)', modules: [] },
      MERCADO: { label: 'Cotações & Inteligência de Mercado RJ', modules: [] },
      OPERACIONAL: { label: 'Operações de Loja & Câmaras', modules: [] },
      FINANCAS: { label: 'Controladoria & Margens', modules: [] },
      SEGURANCA: { label: 'Segurança & Infraestrutura', modules: [] },
    };

    ALL_SYSTEM_MODULES.forEach(mod => {
      if (categories[mod.category]) {
        categories[mod.category].modules.push(mod);
      }
    });

    return categories;
  }, []);

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
    setFormRoleTitle('Encarregado de Açougue / Câmaras');
    setFormEmail('');
    setFormStoreId('str_1');
    setFormActive(true);
    setFormAllowedModules(['dashboard', 'inventory', 'portal', 'yield', 'waste', 'perishables']);
    setFormPreferredTheme('gapp-new');
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
    setFormStoreId(user.storeId || 'matriz');
    setFormActive(user.active);
    setFormAllowedModules(user.allowedModules || []);
    setFormPreferredTheme(user.preferredTheme || 'gapp-new');
    setIsEditing(true);
  };

  const handleApplyRolePreset = (role: UserRole) => {
    setFormRole(role);
    switch (role) {
      case 'DESENVOLVEDOR':
        setFormRoleTitle('Desenvolvedor do Software');
        setFormAllowedModules(ALL_SYSTEM_MODULES.map(m => m.id));
        setFormStoreId('matriz');
        break;
      case 'DIRETOR':
        setFormRoleTitle('Diretor Geral de Carnes');
        setFormAllowedModules(ALL_SYSTEM_MODULES.filter(m => m.id !== 'users').map(m => m.id));
        setFormStoreId('matriz');
        break;
      case 'COMPRADOR':
        setFormRoleTitle('Mesa de Compras Matriz');
        setFormAllowedModules(['dashboard', 'parameters', 'sheet', 'purchases', 'yield', 'quotes', 'perishables']);
        setFormStoreId('matriz');
        break;
      case 'OPERACIONAL':
        setFormRoleTitle('Encarregado de Câmaras & Açougue');
        setFormAllowedModules(['dashboard', 'inventory', 'portal', 'yield', 'waste', 'perishables']);
        break;
      case 'VISUALIZADOR':
        setFormRoleTitle('Auditor Fiscal e Contábil');
        setFormAllowedModules(['dashboard', 'results', 'sheet', 'quotes', 'perishables']);
        setFormStoreId('matriz');
        break;
    }
  };

  const handleToggleModule = (moduleId: string) => {
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
    setFormAllowedModules(['dashboard']);
  };

  const handleToggleCategoryModules = (categoryKey: string) => {
    if (formRole === 'DESENVOLVEDOR') return;
    const catMods = moduleCategories[categoryKey]?.modules.map(m => m.id) || [];
    const allSelected = catMods.every(id => formAllowedModules.includes(id));

    if (allSelected) {
      setFormAllowedModules(prev => prev.filter(id => !catMods.includes(id)));
    } else {
      setFormAllowedModules(prev => Array.from(new Set([...prev, ...catMods])));
    }
  };

  const handleQuickToggleActive = (user: SystemUser) => {
    if (!canManageUsers) {
      showNotification('Somente os usuários Desenvolvedor e Diretor podem ativar ou inativar contas.', 'error');
      return;
    }
    if (user.role === 'DESENVOLVEDOR' || user.username.toLowerCase() === 'desenvolvedor') {
      showNotification('A conta do Desenvolvedor principal não pode ser inativada.', 'error');
      return;
    }

    try {
      const updated: SystemUser = {
        ...user,
        active: !user.active
      };
      const newUsersList = StorageService.updateUser(updated);
      setUsers(newUsersList);
      showNotification(`Status do usuário "${user.name}" alterado para ${updated.active ? 'ATIVO' : 'INATIVO'}.`);
      if (onUsersUpdated) onUsersUpdated();
    } catch (err: any) {
      showNotification(err.message || 'Erro ao alterar status.', 'error');
    }
  };

  // Alternar permissão instantaneamente direto da Matriz de Acessos
  const handleMatrixToggle = (user: SystemUser, moduleId: string) => {
    if (!canManageUsers) {
      showNotification('Somente Desenvolvedor e Diretor podem gerenciar matriz de permissões.', 'error');
      return;
    }
    if (user.role === 'DESENVOLVEDOR') {
      showNotification('O perfil Desenvolvedor tem bypass e acesso irrestrito a todos os módulos.', 'error');
      return;
    }

    const currentModules = user.allowedModules || [];
    const hasModule = currentModules.includes(moduleId);
    const nextModules = hasModule 
      ? currentModules.filter(m => m !== moduleId)
      : [...currentModules, moduleId];

    try {
      const updated: SystemUser = {
        ...user,
        allowedModules: nextModules
      };
      const newUsersList = StorageService.updateUser(updated);
      setUsers(newUsersList);
      const modInfo = ALL_SYSTEM_MODULES.find(m => m.id === moduleId);
      showNotification(`${hasModule ? 'Revogado' : 'Liberado'} acesso ao módulo "${modInfo?.shortLabel || moduleId}" para ${user.name}.`);
      if (onUsersUpdated) onUsersUpdated();
    } catch (err: any) {
      showNotification(err.message || 'Erro ao salvar permissão.', 'error');
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pass = '';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(pass);
    setShowPassword(true);
    showNotification(`Senha gerada: ${pass}`);
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
        const isTargetDev = selectedUser.role === 'DESENVOLVEDOR' || selectedUser.username.toLowerCase() === 'desenvolvedor';
        
        const updated: SystemUser = {
          ...selectedUser,
          name: trimmedName,
          username: isTargetDev ? 'desenvolvedor' : trimmedUser,
          password: trimmedPass,
          role: isTargetDev ? 'DESENVOLVEDOR' : formRole,
          roleTitle: formRoleTitle.trim() || undefined,
          email: formEmail.trim() || undefined,
          storeId: formStoreId,
          active: isTargetDev ? true : formActive,
          allowedModules: isTargetDev ? ALL_SYSTEM_MODULES.map(m => m.id) : formAllowedModules,
          preferredTheme: formPreferredTheme,
        };

        const newUsersList = StorageService.updateUser(updated);
        setUsers(newUsersList);
        showNotification(`Usuário "${updated.name}" atualizado com sucesso!`);
      } else {
        const newUser: SystemUser = {
          id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: trimmedName,
          username: trimmedUser,
          password: trimmedPass,
          role: formRole,
          roleTitle: formRoleTitle.trim() || undefined,
          email: formEmail.trim() || undefined,
          storeId: formStoreId,
          active: formActive,
          allowedModules: formRole === 'DESENVOLVEDOR' ? ALL_SYSTEM_MODULES.map(m => m.id) : formAllowedModules,
          preferredTheme: formPreferredTheme,
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

  const handlePrintAuditReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showNotification('Permita pop-ups no navegador para emitir o relatório impresso.', 'error');
      return;
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const emissionStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} às ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Usuários e Permissões - GAPP - PATRICK PESSOA</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; color: #1e293b; font-size: 11px; }
          .header-box { background: #113829; color: #ffffff; padding: 12px 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #b5e550; margin-bottom: 12px; }
          .brand-title { font-size: 15px; font-weight: 900; letter-spacing: 0.5px; }
          .sub-title { font-size: 10px; color: #a7f3d0; margin-top: 2px; }
          .meta-box { text-align: right; font-size: 10px; color: #e2e8f0; }
          .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 12px; }
          .stat-card { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px; text-align: center; }
          .stat-val { font-size: 14px; font-weight: bold; color: #0f172a; }
          .stat-lbl { font-size: 9px; color: #64748b; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #f1f5f9; color: #334155; font-size: 9px; text-transform: uppercase; padding: 6px; border: 1px solid #cbd5e1; text-align: left; }
          td { padding: 5px 6px; border: 1px solid #e2e8f0; font-size: 10px; }
          tr:nth-child(even) { background: #f8fafc; }
          .role-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
          .role-dev { background: #f3e8ff; color: #6b21a8; }
          .role-dir { background: #fef3c7; color: #92400e; }
          .role-comp { background: #e0f2fe; color: #0369a1; }
          .role-oper { background: #dcfce7; color: #166534; }
          .role-vis { background: #f1f5f9; color: #475569; }
          .mod-tag { display: inline-block; background: #e2e8f0; font-size: 8px; padding: 1px 4px; border-radius: 2px; margin: 1px; }
          .signatures { margin-top: 30px; display: flex; justify-content: space-around; text-align: center; font-size: 10px; }
          .sig-line { width: 220px; border-top: 1px solid #94a3b8; padding-top: 4px; }
          .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <div class="brand-title">GAPP - PATRICK PESSOA • GESTÃO INTEGRAL DE COMPRA PERSONALIZADO</div>
            <div class="sub-title">RELATÓRIO AUDITADO DE USUÁRIOS & MATRIZ DE PERMISSÕES DOS 14 MÓDULOS (v10.8)</div>
          </div>
          <div class="meta-box">
            <div><strong>Emissão:</strong> ${emissionStr}</div>
            <div><strong>Emitido por:</strong> ${currentUser?.name || 'Patrick Pessoa'}</div>
            <div><strong>Ambiente:</strong> Homologado & Seguro</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-val">${stats.total}</div>
            <div class="stat-lbl">Total de Usuários</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: #16a34a;">${stats.active}</div>
            <div class="stat-lbl">Usuários Ativos</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: #7c3aed;">${stats.managementCount}</div>
            <div class="stat-lbl">Diretoria / Gestão</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${stats.storeOperatorsCount}</div>
            <div class="stat-lbl">Encarregados de Lojas</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${ALL_SYSTEM_MODULES.length} Módulos</div>
            <div class="stat-lbl">Estrutura Integral</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 20px;">#</th>
              <th>Nome Completo</th>
              <th>Login / Acesso</th>
              <th>Perfil / Cargo</th>
              <th>Filial Vinculada</th>
              <th>Status</th>
              <th>Módulos Autorizados (${ALL_SYSTEM_MODULES.length})</th>
            </tr>
          </thead>
          <tbody>
            ${users.map((u, idx) => {
              const storeObj = stores.find(s => s.id === u.storeId);
              const storeLabel = u.storeId === 'matriz' ? 'Matriz / Todas as 16 Lojas' : (storeObj ? `${storeObj.code} - ${storeObj.name}` : 'Geral');
              const roleClass = u.role === 'DESENVOLVEDOR' ? 'role-dev' : u.role === 'DIRETOR' ? 'role-dir' : u.role === 'COMPRADOR' ? 'role-comp' : u.role === 'OPERACIONAL' ? 'role-oper' : 'role-vis';
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${u.name}</strong></td>
                  <td><code>${u.username}</code></td>
                  <td>
                    <span class="role-badge ${roleClass}">${u.role}</span>
                    <div style="font-size: 8px; color: #64748b;">${u.roleTitle || ''}</div>
                  </td>
                  <td>${storeLabel}</td>
                  <td><span style="font-weight: bold; color: ${u.active ? '#16a34a' : '#e11d48'};">${u.active ? 'ATIVO' : 'INATIVO'}</span></td>
                  <td>
                    ${u.role === 'DESENVOLVEDOR' 
                      ? '<strong style="color: #7c3aed;">✓ ACESSO TOTAL (100% DOS 14 MÓDULOS)</strong>' 
                      : (u.allowedModules || []).map(mId => {
                          const mInfo = ALL_SYSTEM_MODULES.find(m => m.id === mId);
                          return `<span class="mod-tag">${mInfo?.shortLabel || mId}</span>`;
                        }).join(' ')
                    }
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-line">
            <strong>Patrick Pessoa</strong><br>
            Desenvolvedor do Software & Gestão<br>
            GAPP - PATRICK PESSOA
          </div>
          <div class="sig-line">
            <strong>Diretoria de Operações</strong><br>
            Aprovação e Controle de Acessos<br>
            Mesa de Carnes & Perecíveis
          </div>
        </div>

        <div class="footer">
          Documento gerado automaticamente pelo Sistema ERP GAPP - PATRICK PESSOA v10.8 • Impresso em ${emissionStr}
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
            <span>MESA DE COMPRAS</span>
          </span>
        );
      case 'OPERACIONAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40">
            <span>OPERACIONAL FILIAL</span>
          </span>
        );
      case 'VISUALIZADOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/40">
            <span>AUDITORIA / LEITURA</span>
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header Oficial GAPP - PATRICK PESSOA */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950 tracking-wider">
                  GAPP - PATRICK PESSOA v10.8
                </span>
                <span className="text-xs font-mono text-emerald-300">
                  • Módulo Central de Gestão & Permissões
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                Controle de Usuários, Credenciais & Acessos aos 14 Módulos
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handlePrintAuditReport}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Imprimir relatório oficial de usuários e permissões"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Relatório PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div className={`px-4 py-2 text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-rose-600 text-white'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Barra de Navegação Interna do Módulo (Usuários, Matriz, Relatório) */}
        {!isEditing && (
          <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'users'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Lista de Usuários ({users.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'matrix'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Matriz de Permissões ({ALL_SYSTEM_MODULES.length} Módulos)</span>
              </button>

              <button
                onClick={() => setActiveTab('report')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'report'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Auditoria & Resumo</span>
              </button>
            </div>

            {canManageUsers && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Novo Usuário</span>
              </button>
            )}
          </div>
        )}

        {/* Body do Modal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Se estiver no formulário de edição/criação */}
          {isEditing ? (
            <form onSubmit={handleSaveUser} className="space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedUser ? `Editar Usuário: ${selectedUser.name}` : 'Cadastrar Novo Usuário no ERP'}
                    </h4>
                    <span className="text-[11px] text-slate-500">Configure credenciais, filial associada e os 14 módulos permitidos</span>
                  </div>
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
                    placeholder="Ex: Patrick Pessoa"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Login de Acesso */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Login / Usuário de Acesso *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={selectedUser?.role === 'DESENVOLVEDOR'}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Ex: patrick.pessoa"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                  />
                  {selectedUser?.role === 'DESENVOLVEDOR' && (
                    <span className="text-[10px] text-amber-600 block mt-0.5">Login protegido do desenvolvedor</span>
                  )}
                </div>

                {/* Senha com Gerador */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Senha de Acesso *
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Gerar PIN
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Senha de acesso"
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

                {/* Perfil / Cargo com Presets */}
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
                    <option value="OPERACIONAL">OPERACIONAL (Filiais, Estoque & Perecíveis)</option>
                    <option value="COMPRADOR">COMPRADOR (Compras, Planilha, Cotações & Parâmetros)</option>
                    <option value="DIRETOR">DIRETOR (Gestão Geral)</option>
                    <option value="VISUALIZADOR">VISUALIZADOR (Auditoria & Consulta)</option>
                    <option value="DESENVOLVEDOR">DESENVOLVEDOR (100% Acesso Total)</option>
                  </select>
                </div>

                {/* Cargo / Título de Exibição */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cargo / Descrição Profissional
                  </label>
                  <input
                    type="text"
                    value={formRoleTitle}
                    onChange={(e) => setFormRoleTitle(e.target.value)}
                    placeholder="Ex: Gerente de Açougue / Comprador"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Filial Vinculada (StoreId) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Filial Associada
                  </label>
                  <select
                    value={formStoreId}
                    onChange={(e) => setFormStoreId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="matriz">Matriz / Geral (Todas as 16 Filiais)</option>
                    {stores.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.code} - {st.name} ({st.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Ex: usuario@grupogapp.com.br"
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

                {/* Tema Visual Padrão */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tema Visual Padrão
                  </label>
                  <select
                    value={formPreferredTheme}
                    onChange={(e) => setFormPreferredTheme(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="gapp-new">GAPP-NEW (Executivo Pro)</option>
                    <option value="light">Moderno Claro</option>
                    <option value="dark">Moderno Escuro</option>
                    <option value="solidcon">GAPP Classic (ERP Desktop)</option>
                  </select>
                </div>

              </div>

              {/* Seção: Permissões Granulares por Módulo (14 Módulos) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span>Matriz de Acesso aos 14 Módulos do Sistema</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                        {formRole === 'DESENVOLVEDOR' ? ALL_SYSTEM_MODULES.length : formAllowedModules.length} de {ALL_SYSTEM_MODULES.length} Liberados
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Marque individualmente ou por grupo quais recursos este usuário tem autorização para visualizar e operar
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllModules}
                      className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition cursor-pointer"
                    >
                      Liberar Todos ({ALL_SYSTEM_MODULES.length})
                    </button>
                    {formRole !== 'DESENVOLVEDOR' && (
                      <button
                        type="button"
                        onClick={handleClearModules}
                        className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                {/* Categorias dos Módulos */}
                <div className="space-y-4">
                  {Object.entries(moduleCategories).map(([catKey, catData]) => {
                    const allCatSelected = catData.modules.every(m => formAllowedModules.includes(m.id));
                    return (
                      <div key={catKey} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>{catData.label}</span>
                          </span>
                          {formRole !== 'DESENVOLVEDOR' && (
                            <button
                              type="button"
                              onClick={() => handleToggleCategoryModules(catKey)}
                              className="text-[10px] text-amber-600 hover:underline cursor-pointer"
                            >
                              {allCatSelected ? 'Desmarcar Grupo' : 'Marcar Grupo'}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {catData.modules.map(mod => {
                            const isChecked = formRole === 'DESENVOLVEDOR' || formAllowedModules.includes(mod.id);
                            return (
                              <label
                                key={mod.id}
                                className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition select-none ${
                                  isChecked
                                    ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white shadow-xs'
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
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="block text-xs font-bold truncate">
                                      {mod.label}
                                    </span>
                                    {mod.badge && (
                                      <span className="text-[9px] font-bold px-1 py-0.1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                        {mod.badge}
                                      </span>
                                    )}
                                  </div>
                                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-tight mt-0.5">
                                    {mod.description}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {formRole === 'DESENVOLVEDOR' && (
                  <div className="p-3 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs flex items-center gap-2">
                    <Terminal className="w-4 h-4 shrink-0" />
                    <span>O perfil Desenvolvedor possui bypass e acesso integral a 100% dos 14 módulos do sistema.</span>
                  </div>
                )}
              </div>

              {/* Botões do Formulário */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Usuário</span>
                </button>
              </div>

            </form>
          ) : activeTab === 'matrix' ? (
            // ==========================================
            // ABA 2: MATRIZ INTERATIVA DE PERMISSÕES
            // ==========================================
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span>Matriz de Acessos: Usuários x 14 Módulos</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Clique nas células para liberar ou revogar o acesso instantaneamente para cada usuário
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Liberado
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" /> Bloqueado
                  </span>
                </div>
              </div>

              {/* Tabela Matriz com rolagem horizontal suave */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase font-black">
                      <th className="p-3 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 min-w-[180px]">
                        Usuário / Perfil
                      </th>
                      {ALL_SYSTEM_MODULES.map(m => (
                        <th key={m.id} className="p-2.5 text-center min-w-[90px] border-l border-slate-200 dark:border-slate-800">
                          <span className="block truncate" title={m.label}>{m.shortLabel}</span>
                          <span className="text-[8px] font-normal text-slate-400 lowercase">{m.category}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {users.map(user => {
                      const isDev = user.role === 'DESENVOLVEDOR';
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                          <td className="p-3 sticky left-0 bg-white dark:bg-slate-950 z-10 border-r border-slate-200 dark:border-slate-800">
                            <div className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                              {user.name}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                              <span>{user.username}</span>
                              <span>•</span>
                              <span className="text-amber-600 font-sans">{user.role}</span>
                            </div>
                          </td>

                          {ALL_SYSTEM_MODULES.map(m => {
                            const hasAccess = isDev || user.allowedModules?.includes(m.id);
                            return (
                              <td 
                                key={m.id} 
                                className="p-2 text-center border-l border-slate-100 dark:border-slate-800/60"
                              >
                                <button
                                  type="button"
                                  disabled={isDev || !canManageUsers}
                                  onClick={() => handleMatrixToggle(user, m.id)}
                                  className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition cursor-pointer disabled:cursor-default ${
                                    hasAccess
                                      ? isDev
                                        ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 font-black'
                                        : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-bold'
                                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-300 dark:text-slate-600'
                                  }`}
                                  title={hasAccess ? `Liberado (${m.label})` : `Bloqueado (${m.label})`}
                                >
                                  {hasAccess ? <Check className="w-3.5 h-3.5" /> : <X className="w-3 h-3" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'report' ? (
            // ==========================================
            // ABA 3: AUDITORIA & RELATÓRIO DO MÓDULO
            // ==========================================
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 text-white border border-emerald-800/40 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/50">
                  <div>
                    <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                      GAPP - PATRICK PESSOA • RELATÓRIO DE AUDITORIA
                    </div>
                    <h4 className="text-base font-black text-white">
                      Status de Homologação dos 14 Módulos do Sistema
                    </h4>
                  </div>
                  <button
                    onClick={handlePrintAuditReport}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition cursor-pointer self-start sm:self-auto"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Documento Completo</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 text-[10px] block">USUÁRIOS ATIVOS</span>
                    <span className="text-xl font-black text-emerald-400">{stats.active}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">de {stats.total} cadastrados</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 text-[10px] block">MÓDULOS DE MERCADO RJ</span>
                    <span className="text-xl font-black text-amber-400">2 Módulos</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Atacado + Perecíveis 12 Redes</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 text-[10px] block">MESA DE COMPRAS</span>
                    <span className="text-xl font-black text-sky-400">3 Módulos</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Planilha, Lotes & Desossa</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 text-[10px] block">SEGURANÇA & CLOUD</span>
                    <span className="text-xl font-black text-purple-400">Firestore Nuvem</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Sincronização Ativa</span>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-200/80 bg-black/30 p-3 rounded-xl">
                  <strong>Padrão de Segurança:</strong> As permissões são validadas na inicialização do sistema, na navegação de abas e sincronizadas com a base central. O usuário <strong>Patrick Pessoa (desenvolvedor)</strong> possui bypass integral permanente garantindo a manutenção do software.
                </div>
              </div>
            </div>
          ) : (
            // ==========================================
            // ABA 1: LISTA PRINCIPAL DE USUÁRIOS
            // ==========================================
            <div className="space-y-4">
              
              {/* Barra de Filtros & Busca */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nome, login, e-mail ou cargo..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="ALL">Todos os Cargos</option>
                    <option value="DESENVOLVEDOR">Desenvolvedor</option>
                    <option value="DIRETOR">Diretoria</option>
                    <option value="COMPRADOR">Comprador</option>
                    <option value="OPERACIONAL">Operacional</option>
                    <option value="VISUALIZADOR">Visualizador</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="ALL">Status: Todos</option>
                    <option value="ACTIVE">Somente Ativos</option>
                    <option value="INACTIVE">Somente Inativos</option>
                  </select>
                </div>
              </div>

              {/* Cards de Usuários */}
              <div className="grid grid-cols-1 gap-3">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isDev = user.role === 'DESENVOLVEDOR';
                    const isCurrent = currentUser?.id === user.id;
                    const storeObj = stores.find(s => s.id === user.storeId);
                    const storeLabel = user.storeId === 'matriz' ? 'Matriz / Todas as 16 Lojas' : (storeObj ? `${storeObj.code} - ${storeObj.name}` : 'Geral');

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
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                              isDev
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                : user.active
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                            }`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                  {user.name}
                                </span>
                                {getRoleBadge(user.role)}
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/40">
                                    SUA CONTA
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
                                <span>Senha: <strong className="text-slate-800 dark:text-slate-200">••••••</strong></span>
                                <span className="font-sans flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  <span>{storeLabel}</span>
                                </span>
                              </div>

                              {/* Tags de Módulos Autorizados */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                                <span className="text-[10px] text-slate-400 font-semibold mr-1">
                                  Módulos:
                                </span>
                                {isDev ? (
                                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                    ✓ Acesso Total • Todos os {ALL_SYSTEM_MODULES.length} Módulos (100%)
                                  </span>
                                ) : (
                                  <>
                                    <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                                      {user.allowedModules?.length || 0} de {ALL_SYSTEM_MODULES.length} Módulos Liberados
                                    </span>
                                    {(user.allowedModules || []).slice(0, 5).map(modId => {
                                      const modInfo = ALL_SYSTEM_MODULES.find(m => m.id === modId);
                                      return (
                                        <span 
                                          key={modId}
                                          className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                                        >
                                          {modInfo?.shortLabel || modId}
                                        </span>
                                      );
                                    })}
                                    {(user.allowedModules?.length || 0) > 5 && (
                                      <span className="text-[10px] text-slate-400 font-bold">
                                        +{(user.allowedModules?.length || 0) - 5} módulos
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Ações */}
                          {canManageUsers && (
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              {!isDev && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickToggleActive(user)}
                                  className={`p-2 rounded-lg transition cursor-pointer ${
                                    user.active
                                      ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                  }`}
                                  title={user.active ? 'Inativar conta de acesso' : 'Ativar conta de acesso'}
                                >
                                  {user.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                </button>
                              )}

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
                  })
                )}
              </div>

            </div>
          )}

        </div>

        {/* Rodapé com Fechamento & Créditos */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Sistema GAPP - PATRICK PESSOA • 14 Módulos Homologados • Nuvem Firestore</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>

      </div>
    </div>
  );
};
