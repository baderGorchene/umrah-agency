import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  ChevronDown,
  Building,
} from "lucide-react";
import { Language, UserProfile, UserRole, AgencySettings } from "../types";
import { useTranslation } from "react-i18next";

interface SidebarProps {
  onLogout: () => void;
  lang?: Language;
  currentUser: UserProfile | null;
  agencySettings?: AgencySettings;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, currentUser, agencySettings }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isAr = i18n.language === "ar";
  const userRole: UserRole = currentUser?.role || "admin";

  const isConfigActive =
    location.pathname.startsWith("/settings") ||
    location.pathname.startsWith("/users");

  const [isConfigExpanded, setIsConfigExpanded] = useState(true);

  // Auto-expand configuration menu if currently on a configuration route
  useEffect(() => {
    if (isConfigActive) {
      setIsConfigExpanded(true);
    }
  }, [isConfigActive]);

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
      <button
        onClick={toggleSidebar}
        title={isCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        aria-label={isCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        className={`absolute top-1/2 -translate-y-1/2 ${
          isAr ? "-left-3.5" : "-right-3.5"
        } flex items-center justify-center bg-white border border-slate-200 rounded-full p-1 shadow-md hover:bg-slate-50 transition-colors cursor-pointer z-40`}
      >
        {renderCollapseIcon()}
      </button>

      <div className="overflow-y-auto overflow-x-hidden flex-1">
        <div className="p-4 flex items-center justify-center">
          <div
            className={`rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-all duration-300 ${
              isCollapsed ? "w-12 h-12" : "w-28 h-28"
            }`}
          >
            <img
              src={
                agencySettings?.logoUrl || `${import.meta.env.BASE_URL}logo.jpeg`
              }
              alt={agencySettings?.name || "Agency logo"}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `${
                  import.meta.env.BASE_URL
                }logo.jpeg`;
              }}
            />
          </div>
        </div>

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

          {/* Expandable Configuration Section for Admin */}
          {userRole === "admin" && (
            <div className="pt-1">
              {!isCollapsed ? (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsConfigExpanded((prev) => !prev)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-all cursor-pointer rounded-lg ${
                      isConfigActive && !isConfigExpanded
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Settings
                        className={`w-5 h-5 shrink-0 ${
                          isConfigActive ? "text-slate-900" : "text-slate-500"
                        }`}
                      />
                      <span className="truncate">{t("menu.configuration")}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isConfigExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isConfigExpanded && (
                    <div className="ps-4 ms-3 border-s-2 border-slate-100 space-y-1 mt-1">
                      {/* Agency Profile */}
                      <NavLink
                        to="/settings"
                        end
                        className={({ isActive }) =>
                          `w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all ${
                            isActive
                              ? "bg-black text-white rounded-lg shadow-xs font-bold"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Building
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? "text-white" : "text-slate-400"
                              }`}
                            />
                            <span className="truncate">
                              {t("menu.agency_profile")}
                            </span>
                          </>
                        )}
                      </NavLink>

                      {/* Users Management */}
                      <NavLink
                        to="/users"
                        className={({ isActive }) =>
                          `w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all ${
                            isActive
                              ? "bg-black text-white rounded-lg shadow-xs font-bold"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <ShieldCheck
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? "text-white" : "text-slate-400"
                              }`}
                            />
                            <span className="truncate">
                              {t("menu.users_management")}
                            </span>
                          </>
                        )}
                      </NavLink>
                    </div>
                  )}
                </div>
              ) : (
                /* Collapsed Sidebar mode */
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsConfigExpanded((prev) => !prev)}
                    title={t("menu.configuration")}
                    className={`w-full flex items-center justify-center px-2 py-2.5 text-sm font-medium transition-all cursor-pointer rounded-lg ${
                      isConfigActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Settings
                      className={`w-5 h-5 shrink-0 ${
                        isConfigActive ? "text-slate-900" : "text-slate-500"
                      }`}
                    />
                  </button>

                  {isConfigExpanded && (
                    <div className="space-y-1 pt-1 border-t border-slate-100 flex flex-col items-center">
                      <NavLink
                        to="/settings"
                        end
                        title={t("menu.agency_profile")}
                        className={({ isActive }) =>
                          `w-10 h-10 flex items-center justify-center text-xs font-medium transition-all rounded-lg ${
                            isActive
                              ? "bg-black text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <Building
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? "text-white" : "text-slate-500"
                            }`}
                          />
                        )}
                      </NavLink>

                      <NavLink
                        to="/users"
                        title={t("menu.users_management")}
                        className={({ isActive }) =>
                          `w-10 h-10 flex items-center justify-center text-xs font-medium transition-all rounded-lg ${
                            isActive
                              ? "bg-black text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <ShieldCheck
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? "text-white" : "text-slate-500"
                            }`}
                          />
                        )}
                      </NavLink>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

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
              title={t("sidebar.logout")}
              aria-label={t("sidebar.logout")}
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
