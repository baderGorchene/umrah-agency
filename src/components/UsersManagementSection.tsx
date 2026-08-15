import React, { useState, useEffect } from 'react';
import { Users, UserPlus, ShieldCheck, UserCheck, User, Edit3, Trash2, Loader2, CheckCircle2, Phone, Mail, AlertCircle } from 'lucide-react';
import { Language, UserProfile, UserRole } from '../types';
import { getUsers, createUser, updateUser, deleteUser } from '../services/usersService';
import { useTranslation } from 'react-i18next';

interface UsersManagementSectionProps {
  lang?: Language;
}

export const UsersManagementSection: React.FC<UsersManagementSectionProps> = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('agent');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load Users
  const loadUsersList = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersList();
  }, []);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('agent');
    setPhone('');
    setEditingUser(null);
    setErrorMsg(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setFullName(u.fullName || '');
    setEmail(u.email || '');
    setPassword('');
    setRole(u.role || 'agent');
    setPhone(u.phone || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (editingUser) {
        const updated: UserProfile = {
          ...editingUser,
          fullName,
          role,
          phone,
        };
        const ok = await updateUser(updated);
        if (ok) {
          setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
          setSuccessMsg(t('users.user_updated'));
          setIsModalOpen(false);
        } else {
          setErrorMsg('Échec de la mise à jour.');
        }
      } else {
        const newU = await createUser({
          email,
          fullName,
          role,
          phone,
          password,
        });

        if (newU) {
          setUsers(prev => [newU, ...prev]);
          setSuccessMsg(t('users.user_added'));
          setIsModalOpen(false);
        } else {
          setErrorMsg('Échec de la création.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur inattendue.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer ${name} ?`)) {
      return;
    }

    const ok = await deleteUser(id);
    if (ok) {
      setUsers(prev => prev.filter(u => u.id !== id));
      setSuccessMsg(t('users.user_deleted'));
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const roleBadges: Record<UserRole, { labelKey: string; bg: string; icon: React.ElementType }> = {
    admin: {
      labelKey: 'roles.admin',
      bg: 'bg-amber-100 border-amber-300 text-amber-900',
      icon: ShieldCheck,
    },
    agent: {
      labelKey: 'roles.agent',
      bg: 'bg-blue-100 border-blue-300 text-blue-900',
      icon: UserCheck,
    },
    pilgrim: {
      labelKey: 'roles.pilgrim',
      bg: 'bg-emerald-100 border-emerald-300 text-emerald-900',
      icon: User,
    },
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1 text-start">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>{t('users.user_title')}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {t('users.user_subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-black hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4 text-amber-400" />
          <span>{t('users.add_user')}</span>
        </button>
      </div>

      {/* Alert Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users List Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs">Chargement...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-slate-400 space-y-2">
          <Users className="w-10 h-10 mx-auto stroke-1" />
          <p className="text-xs">{t('users.no_user')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-y border-slate-100">
                <th className="p-3 text-start">{t('users.user')}</th>
                <th className="p-3 text-start">E-mail</th>
                <th className="p-3 text-start">{t('users.phone')}</th>
                <th className="p-3 text-start">{t('staff.table.role')}</th>
                <th className="p-3 text-end">{t('staff.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const badge = roleBadges[u.role || 'agent'];
                const Icon = badge.icon;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                          {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.fullName || u.email}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {u.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-mono text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{u.email}</span>
                      </div>
                    </td>

                    <td className="p-3 font-mono text-slate-700">
                      {u.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t(badge.labelKey)}</span>
                      </span>
                    </td>

                    <td className="p-3 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 text-slate-500 hover:text-black hover:bg-slate-100 rounded-lg transition-colors"
                          title={t('buttons.edit')}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.fullName || u.email)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('buttons.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white border border-slate-100 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <span>
                  {editingUser 
                    ? t('users.edit_user')
                    : t('users.create_user')}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label={t('buttons.close')}
                className="text-slate-400 hover:text-black text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitUser} className="space-y-4">
              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {t('users.fullname')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Mohamed Ali"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                  required
                />
              </div>

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {t('users.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={Boolean(editingUser)}
                  placeholder="user@misktiba.tn"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-60"
                  required
                />
              </div>

              {!editingUser && (
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {t('users.password')}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                    required
                  />
                </div>
              )}

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {t('users.phone')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+216 98 123 456"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {t('users.role')}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  <option value="admin">{t('roles.admin')}</option>
                  <option value="agent">{t('roles.agent')}</option>
                  <option value="pilgrim">{t('roles.pilgrim')}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-black hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingUser ? t('buttons.save') : t('users.create_account')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
