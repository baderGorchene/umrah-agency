import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Plane, 
  QrCode, 
  FileText, 
  Newspaper, 
  Settings, 
  LogOut,
  ShieldCheck,
  User,
  UserCheck as StaffIcon
} from 'lucide-react';
import { Language, UserProfile, UserRole } from '../types';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  onLogout: () => void;
  lang: Language;
  currentUser: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onLogout,
  lang,
  currentUser
}) => {
  const userRole: UserRole = currentUser?.role || 'admin';

  const menuItems: { path: string; labelKey: string; icon: React.ElementType; allowedRoles: UserRole[] }[] = [
    { path: '/', labelKey: 'menu.dashboard', icon: LayoutDashboard, allowedRoles: ['admin', 'agent', 'pilgrim'] },
    { path: '/pilgrims', labelKey: 'menu.pilgrims', icon: Users, allowedRoles: ['admin', 'agent'] },
    { path: '/staff', labelKey: 'menu.staff', icon: UserCheck, allowedRoles: ['admin', 'agent'] },
    { path: '/trips', labelKey: 'menu.trips', icon: Plane, allowedRoles: ['admin', 'agent'] },
    { path: '/qr-center', labelKey: 'menu.qr_center', icon: QrCode, allowedRoles: ['admin', 'agent', 'pilgrim'] },
    { path: '/documents', labelKey: 'menu.documents', icon: FileText, allowedRoles: ['admin', 'agent'] },
    { path: '/news', labelKey: 'menu.news', icon: Newspaper, allowedRoles: ['admin', 'agent', 'pilgrim'] },
    { path: '/settings', labelKey: 'menu.settings', icon: Settings, allowedRoles: ['admin'] },
  ];

  const { t } = useTranslation();

  const visibleMenuItems = menuItems.filter(item => item.allowedRoles.includes(userRole));

  const roleBadgeInfo = {
    admin: {
      titleKey: 'roles.admin',
      bg: 'bg-amber-100 border-amber-300 text-amber-900',
      icon: ShieldCheck,
    },
    agent: {
      titleKey: 'roles.agent',
      bg: 'bg-blue-100 border-blue-300 text-blue-900',
      icon: StaffIcon,
    },
    pilgrim: {
      titleKey: 'roles.pilgrim',
      bg: 'bg-emerald-100 border-emerald-300 text-emerald-900',
      icon: User,
    },
  }[userRole];

  const RoleIcon = roleBadgeInfo.icon;

  return (
    <aside className="w-64 bg-white border-r rtl:border-r-0 rtl:border-l border-slate-100 flex flex-col justify-between h-screen sticky top-0 shrink-0 z-30 select-none print:hidden">
      <div>
        {/* Logo Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black border border-amber-500/40 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Agency logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm leading-tight">مسك طيبة للاسفار و السياحة</h1>
            <p className="text-xs text-slate-500 font-medium">Umrah Compagnon</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-black text-white rounded-lg shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">
                      {t(item.labelKey)}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / Profile & Role Badge */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${roleBadgeInfo.bg}`}>
              <RoleIcon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate">
              {currentUser?.fullName || t('users.user')}
              </p>
              <p className="text-[10px] text-slate-500 font-medium truncate">
              {t(roleBadgeInfo.titleKey)}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title={lang === 'FR' ? 'Déconnexion' : 'تسجيل الخروج'}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
