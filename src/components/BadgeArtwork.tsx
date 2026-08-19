import React from "react";
import { BadgeTemplate, Pilgrim, Trip, DEFAULT_AVATAR_URL } from "../types";
import { QRCodeView } from "./QRCodeView";
import { QRPayload } from "../lib/qrCode";
import { useTranslation } from "react-i18next";

export const getTemplateVisuals = (variant?: string, accentColor: string = "#d97706") => {
  const base = {
    headerBg: accentColor,
    bodyBg: "#FFFFFF",
    detailBg: "#F8FAFC",
    borderColor: accentColor,
    chipBg: "#FFFFFF",
    chipTextColor: "#0F172A",
    textColor: "#0F172A",
    highlightColor: accentColor,
    pattern: "none",
  };

  switch (variant) {
    case "royal":
      return {
        ...base,
        headerBg: "linear-gradient(135deg, #111827 0%, #7c3aed 100%)",
        bodyBg: "#FCF7FF",
        detailBg: "#FFF7ED",
        borderColor: "#7C3AED",
        chipBg: "#FFFFFF",
        chipTextColor: "#7C3AED",
        highlightColor: "#7C3AED",
        pattern:
          "radial-gradient(circle at top right, rgba(255,255,255,0.3) 0 12%, transparent 13%)",
      };
    case "islamic":
      return {
        ...base,
        headerBg: "linear-gradient(135deg, #14532D 0%, #15803D 100%)",
        bodyBg: "#F6FDF8",
        detailBg: "#F0FDF4",
        borderColor: "#166534",
        chipBg: "#FFFFFF",
        chipTextColor: "#166534",
        highlightColor: "#166534",
        pattern:
          "linear-gradient(135deg, rgba(255,255,255,0.25) 0 18%, transparent 18% 36%, rgba(255,255,255,0.15) 36% 54%, transparent 54%)",
      };
    case "modern":
      return {
        ...base,
        headerBg: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
        bodyBg: "#F8FBFF",
        detailBg: "#EFF6FF",
        borderColor: "#2563EB",
        chipBg: "#FFFFFF",
        chipTextColor: "#1D4ED8",
        highlightColor: "#1D4ED8",
        pattern:
          "repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0 2px, transparent 2px 18px)",
      };
    case "elegant":
      return {
        ...base,
        headerBg: "linear-gradient(135deg, #A16207 0%, #F59E0B 100%)",
        bodyBg: "#FFFDF7",
        detailBg: "#FFF7ED",
        borderColor: "#A16207",
        chipBg: "#FFF7ED",
        chipTextColor: "#A16207",
        highlightColor: "#A16207",
        pattern:
          "linear-gradient(90deg, rgba(255,255,255,0.28) 0 70%, transparent 70%)",
      };
    case "noir":
      return {
        ...base,
        headerBg: "linear-gradient(135deg, #020617 0%, #111827 100%)",
        bodyBg: "#F8FAFC",
        detailBg: "#F1F5F9",
        borderColor: "#0F172A",
        chipBg: "#111827",
        chipTextColor: "#F8FAFC",
        highlightColor: "#EAB308",
        pattern:
          "radial-gradient(circle at 20% 20%, rgba(250,204,21,0.32) 0 8%, transparent 9%)",
      };
    case "boarding":
      return {
        ...base,
        headerBg: "linear-gradient(135deg, #115E59 0%, #0F766E 100%)",
        bodyBg: "#F7FEFD",
        detailBg: "#ECFEFF",
        borderColor: "#0F766E",
        chipBg: "#FFFFFF",
        chipTextColor: "#115E59",
        highlightColor: "#0F766E",
        pattern:
          "linear-gradient(90deg, transparent 0 10px, rgba(255,255,255,0.2) 10px 12px, transparent 12px 24px)",
      };
    case "atlas":
      return {
        ...base,
        headerBg: "linear-gradient(135deg, #164E63 0%, #0F766E 100%)",
        bodyBg: "#F4FBFD",
        detailBg: "#ECFEFF",
        borderColor: "#0F766E",
        chipBg: "#FFFFFF",
        chipTextColor: "#0F766E",
        highlightColor: "#F59E0B",
        pattern:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.16) 0 2px, transparent 2px 18px), repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 2px, transparent 2px 24px)",
      };
    case "horizon":
      return {
        ...base,
        headerBg: "linear-gradient(135deg, #FB923C 0%, #F43F5E 100%)",
        bodyBg: "#FFF8F3",
        detailBg: "#FFF7ED",
        borderColor: "#EA580C",
        chipBg: "#FFFFFF",
        chipTextColor: "#EA580C",
        highlightColor: "#FB923C",
        pattern:
          "radial-gradient(circle at 15% 15%, rgba(255,255,255,0.34) 0 10%, transparent 11%)",
      };
    case "diplomat":
      return {
        ...base,
        headerBg: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
        bodyBg: "#F8FAFF",
        detailBg: "#EFF6FF",
        borderColor: "#1E3A8A",
        chipBg: "#FFFFFF",
        chipTextColor: "#1E3A8A",
        highlightColor: "#FBBF24",
        pattern:
          "linear-gradient(135deg, rgba(255,255,255,0.18) 0 30%, transparent 30%)",
      };
    case "prism":
      return {
        ...base,
        headerBg: "linear-gradient(135deg, #6D28D9 0%, #38BDF8 100%)",
        bodyBg: "#F7F8FF",
        detailBg: "#F5F3FF",
        borderColor: "#7C3AED",
        chipBg: "#FFFFFF",
        chipTextColor: "#7C3AED",
        highlightColor: "#38BDF8",
        pattern:
          "linear-gradient(135deg, rgba(255,255,255,0.2) 0 20%, transparent 20% 40%, rgba(255,255,255,0.16) 40% 60%, transparent 60%)",
      };
    case "folio":
      return {
        ...base,
        headerBg: "linear-gradient(135deg, #92400E 0%, #B45309 100%)",
        bodyBg: "#FFF8ED",
        detailBg: "#FFF7ED",
        borderColor: "#92400E",
        chipBg: "#FFFFFF",
        chipTextColor: "#92400E",
        highlightColor: "#92400E",
        pattern:
          "linear-gradient(90deg, rgba(255,255,255,0.18) 0 4px, transparent 4px 18px)",
      };
    case "wave":
      return {
        ...base,
        headerBg: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)",
        bodyBg: "#F3FEFC",
        detailBg: "#ECFEFF",
        borderColor: "#0EA5A4",
        chipBg: "#FFFFFF",
        chipTextColor: "#0F766E",
        highlightColor: "#0EA5A4",
        pattern:
          "radial-gradient(circle at top left, rgba(255,255,255,0.28) 0 8%, transparent 9%), linear-gradient(90deg, transparent 0 15px, rgba(255,255,255,0.22) 15px 18px, transparent 18px 36px)",
      };
    default:
      return base;
  }
};

export const resolvePilgrimAvatar = (
  pilgrim: Pilgrim | null | undefined,
): string => {
  if (!pilgrim) return DEFAULT_AVATAR_URL;
  if (
    pilgrim.avatarUrl &&
    pilgrim.avatarUrl !== DEFAULT_AVATAR_URL &&
    !pilgrim.avatarUrl.includes("unsplash.com")
  ) {
    return pilgrim.avatarUrl;
  }
  if (typeof window !== "undefined") {
    try {
      const rawPassports = window.localStorage.getItem(
        "umrah_passports_registry",
      );
      if (rawPassports) {
        const passports = JSON.parse(rawPassports);
        if (Array.isArray(passports)) {
          const match = passports.find(
            (p: any) =>
              (p.passportNumber &&
                pilgrim.passportNumber &&
                p.passportNumber.trim().toUpperCase() ===
                  pilgrim.passportNumber.trim().toUpperCase()) ||
              (p.fullNameArabic &&
                pilgrim.nameArabic &&
                p.fullNameArabic.trim() === pilgrim.nameArabic.trim()),
          );
          if (match?.avatarUrl && match.avatarUrl !== DEFAULT_AVATAR_URL) {
            return match.avatarUrl;
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return pilgrim.avatarUrl || DEFAULT_AVATAR_URL;
};

export interface BadgeArtworkProps {
  template?: BadgeTemplate;
  pilgrim: Pilgrim | null;
  trip?: Trip;
  guide1Name?: string;
  guide1Phone?: string;
  qrPayload?: string | QRPayload;
  qrSize?: number;
  compact?: boolean;
  className?: string;
}

export const BadgeArtwork: React.FC<BadgeArtworkProps> = ({
  template,
  pilgrim,
  trip,
  guide1Name,
  guide1Phone,
  qrPayload,
  qrSize = 90,
  compact = false,
  className = "",
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const visuals = getTemplateVisuals(
    template?.variant,
    template?.accentColor || "#d97706",
  );
  const displayName = pilgrim?.nameArabic || pilgrim?.nameLatin || "معتمر";
  const displayCode = pilgrim?.uniqueCode || "—";
  const avatarInitial = displayName.slice(0, 1).toUpperCase();
  const effectiveAvatar = resolvePilgrimAvatar(pilgrim);
  const hasCustomAvatar = Boolean(
    effectiveAvatar && effectiveAvatar !== DEFAULT_AVATAR_URL,
  );

  const InfoRow = ({
    label,
    value,
    isPhone,
  }: {
    label: string;
    value?: string;
    isPhone?: boolean;
  }) => (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5">
      <span className="text-[14px] font-semibold text-slate-950 shrink-0 text-start">
        {label}
      </span>
      <span
        className={`text-[14px] font-bold text-slate-800 text-end truncate ${
          isPhone ? "font-mono" : ""
        }`}
        dir={isPhone ? "ltr" : undefined}
      >
        {value || "—"}
      </span>
    </div>
  );

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={`relative mx-auto flex overflow-hidden rounded-[24px] border bg-white text-center shadow-[0_18px_45px_rgba(15,23,42,0.14)] ${
        compact ? "w-full max-w-md flex-row items-center gap-4 p-4" : "flex-col"
      } ${className}`}
      style={{ borderColor: visuals.borderColor }}
    >
      {compact ? (
        <>
          <div
            className="relative shrink-0 basis-[30%] overflow-hidden rounded-2xl"
            style={{
              minWidth: "88px",
              aspectRatio: "1 / 1",
            }}
          >
            {hasCustomAvatar ? (
              <img
                src={effectiveAvatar}
                alt={displayName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;
                }}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-3xl font-black text-white"
                style={{ background: visuals.headerBg }}
              >
                {avatarInitial}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-start">
            <p className="truncate text-sm font-black text-slate-900">
              {displayName}
            </p>
            <p
              className="mt-0.5 text-[14px] font-semibold"
              style={{ color: visuals.highlightColor }}
            >
              {template?.name || "بطاقة تعريف المعتمر"}
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Header */}
          <div className="relative h-20 w-full flex items-center justify-between bg-black px-6">
            <div
              className="flex items-center justify-center"
              style={{ width: "100px", height: "100%" }}
            >
              <img
                src={`${import.meta.env.BASE_URL}logob.jpeg`}
                alt="Logo"
                className="h-20 w-auto"
              />
            </div>
            <div
              className="flex items-center justify-center"
              style={{ width: "70px", height: "100%" }}
            >
              <svg
                width="100"
                height="67"
                viewBox="-60 -40 120 80"
                xmlns="http://www.w3.org/2000/svg"
                fill="#e70013"
              >
                <path d="M-60-40H60v80H-60z" />
                <circle fill="#fff" r="20" />
                <circle r="15" />
                <circle fill="#fff" cx="4" r="12" />
                <path d="M-5 0l16.281-5.29L1.22 8.56V-8.56L11.28 5.29z" />
              </svg>
            </div>
          </div>

          {/* Avatar */}
          <div className="relative flex w-full shrink-0 justify-center bg-slate-50 px-6 pt-5 pb-3">
            <div
              className="relative overflow-hidden rounded-2xl p-[3px] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              style={{
                width: "70%",
                minWidth: "72px",
                aspectRatio: "9 / 9",
                background: `linear-gradient(135deg, ${visuals.highlightColor}, ${visuals.borderColor})`,
              }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-[13px] ring-1 ring-inset ring-white/60">
                {hasCustomAvatar ? (
                  <img
                    src={effectiveAvatar}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 text-2xl font-black text-slate-400">
                    {avatarInitial}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-4 py-3 text-start">
            <InfoRow label={t("pilgrims.table_header_pilgrim")} value={displayName} />
            <InfoRow label={t("trips.form.makkah_hotel")} value={trip?.makkahHotel} />
            <InfoRow label={t("trips.form.madinah_hotel")} value={trip?.madinahHotel} />
            <InfoRow label={t("badge.accompanist")} value={guide1Name} />
            <InfoRow label={t("scanner.phone_tunisia")} value={guide1Phone} isPhone />

            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-start">
              <div className="flex shrink-0 justify-center rounded-xl border border-slate-200/70 bg-white p-2">
                <QRCodeView
                  payload={
                    qrPayload || {
                      agency: "مسك طيبة للأسفار و السياحة",
                      uniqueCode: displayCode,
                      nameArabic: displayName,
                      tripName: trip?.name || pilgrim?.tripName || "رحلة مخصصة",
                      makkahHotel: trip?.makkahHotel,
                      madinahHotel: trip?.madinahHotel,
                      emergencyGuide1: `${guide1Name || "—"} (${guide1Phone || "—"})`,
                    }
                  }
                  size={qrSize}
                />
              </div>
              <div className="min-w-0 flex-1 text-start">
                <p className="text-[14px] font-bold text-slate-700">
                  {t("badge.scan_me_help")}
                </p>
                <p className="mt-0.5 text-[14px] text-slate-400">
                  {t("badge.accompany_faith")}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="border-t border-slate-100 py-2 text-[14px] font-semibold text-slate-500"
            style={{ color: visuals.highlightColor }}
          >
            {t("badge.agency_name")}
          </div>
        </>
      )}
    </div>
  );
};
