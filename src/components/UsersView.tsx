import React from "react";
import { Language } from "../types";
import { UsersManagementSection } from "./UsersManagementSection";
import { useTranslation } from "react-i18next";

interface UsersViewProps {
  lang?: Language;
}

export const UsersView: React.FC<UsersViewProps> = ({ lang }) => {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t("users.manage_users")}
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {t("users.user_subtitle")}
        </p>
      </div>

      {/* Users Management Section */}
      <UsersManagementSection lang={lang} />
    </div>
  );
};
