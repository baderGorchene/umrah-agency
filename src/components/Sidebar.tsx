import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Scan,
  UserCheck,
  Plane,
  QrCode,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
  User,
  UserCheck as StaffIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Language, UserProfile, UserRole } from "../types";
import { useTranslation } from "react-i18next";

interface SidebarProps {
  onLogout: () => void;
  lang?: Language;
  currentUser: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, currentUser }) => {
  const { t, i18n } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isAr = i18n.language === "ar";
  const userRole: UserRole = currentUser?.role || "admin";

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const menuItems: {
    path: string;
    labelKey: string;
    icon: React.ElementType;
    allowedRoles: UserRole[];
  }[] = [
    {
      path: "/",
      labelKey: "menu.dashboard",
      icon: LayoutDashboard,
      allowedRoles: ["admin", "agent", "pilgrim"],
    },
    {
      path: "/pilgrims",
      labelKey: "menu.pilgrims",
      icon: Users,
      allowedRoles: ["admin", "agent"],
    },
    {
      path: "/passports",
      labelKey: "menu.passports",
      icon: Scan,
      allowedRoles: ["admin", "agent"],
    },
    {
      path: "/staff",
      labelKey: "menu.staff",
      icon: UserCheck,
      allowedRoles: ["admin", "agent"],
    },
    {
      path: "/trips",
      labelKey: "menu.trips",
      icon: Plane,
      allowedRoles: ["admin", "agent"],
    },
    {
      path: "/qr-center",
      labelKey: "menu.qr_center",
      icon: QrCode,
      allowedRoles: ["admin", "agent", "pilgrim"],
    },
    {
      path: "/documents",
      labelKey: "menu.documents",
      icon: FileText,
      allowedRoles: ["admin", "agent"],
    },
    {
      path: "/settings",
      labelKey: "menu.settings",
      icon: Settings,
      allowedRoles: ["admin"],
    },
  ];

  const visibleMenuItems = menuItems.filter((item) =>
    item.allowedRoles.includes(userRole),
  );

  const roleBadgeInfo = {
    admin: {
      labelKey: "roles.admin",
      bg: "bg-amber-100 border-amber-300 text-amber-900",
      icon: ShieldCheck,
    },
    agent: {
      labelKey: "roles.agent",
      bg: "bg-blue-100 border-blue-300 text-blue-900",
      icon: StaffIcon,
    },
    pilgrim: {
      labelKey: "roles.pilgrim",
      bg: "bg-emerald-100 border-emerald-300 text-emerald-900",
      icon: User,
    },
  }[userRole];

  const RoleIcon = roleBadgeInfo.icon;

  // Arrow orientation logic based on Arabic (RTL) vs LTR
  const renderCollapseIcon = () => {
    if (isAr) {
      return isCollapsed ? (
        <ChevronLeft className="w-5 h-5 text-slate-600" />
      ) : (
        <ChevronRight className="w-5 h-5 text-slate-600" />
      );
    }
    return isCollapsed ? (
      <ChevronRight className="w-5 h-5 text-slate-600" />
    ) : (
      <ChevronLeft className="w-5 h-5 text-slate-600" />
    );
  };

  return (
    <aside
      className={`relative bg-white flex flex-col justify-between h-screen sticky top-0 shrink-0 z-30 select-none print:hidden transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* 
        =======================================================
        CENTERED TOGGLE BUTTON
        Using `top-1/2 -translate-y-1/2` to center vertically.
        =======================================================
      */}
      <button
        onClick={toggleSidebar}
        title={
          isCollapsed ? (isAr ? "توسيع" : "Déplier") : isAr ? "طي" : "Replier"
        }
        className={`absolute top-1/2 -translate-y-1/2 ${
          isAr ? "-left-3.5" : "-right-3.5"
        } flex items-center justify-center bg-white border border-slate-200 rounded-full p-1 shadow-md hover:bg-slate-50 transition-colors cursor-pointer z-40`}
      >
        {renderCollapseIcon()}
      </button>

      <div>
        {/* Centered & Larger Logo Header */}
        <div className="p-4 flex items-center justify-center">
          <div
            className={`rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-all duration-300 ${
              isCollapsed ? "w-12 h-12" : "w-28 h-28"
            }`}
          >
            <img
              src={`${import.meta.env.BASE_URL}logo.jpeg`}
              alt="Agency logo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const label = t(item.labelKey);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                title={isCollapsed ? label : undefined}
                className={({ isActive }) =>
                  `w-full flex items-center ${
                    isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                  } py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-black text-white rounded-lg shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isActive ? "text-white" : "text-slate-500"
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / Profile & Role Badge */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center p-2" : "justify-between p-2.5"
          } rounded-xl bg-white border border-slate-200/80 shadow-2xs`}
        >
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "gap-2"
            } overflow-hidden`}
          >
            <div
              className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${roleBadgeInfo.bg}`}
              title={
                isCollapsed
                  ? `${currentUser?.fullName || t("users.user")} (${t(
                      roleBadgeInfo.labelKey,
                    )})`
                  : undefined
              }
            >
              <RoleIcon className="w-4 h-4" />
            </div>

            {!isCollapsed && (
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.fullName || t("users.user")}
                </p>
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  {t(roleBadgeInfo.labelKey)}
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onLogout}
              title={isAr ? "تسجيل الخروج" : "Déconnexion"}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
