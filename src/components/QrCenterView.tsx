import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  QrCode,
  Printer,
  Download,
  RefreshCw,
  Palette,
  Eye,
  Info,
  SlidersHorizontal,
  ChevronRight,
  LayoutGrid,
  Users,
  UserRound,
  IdCard,
  Activity,
  Compass,
} from "lucide-react";
import {
  Trip,
  Pilgrim,
  Staff,
  BadgeTemplate,
  Language,
  DEFAULT_AVATAR_URL,
} from "../types";
import { generateQRCodeDataUrl, QRPayload } from "../lib/qrCode";
import { badgeTemplates } from "../mockData";
import {
  saveGeneratedBadges,
  getGeneratedBadgeCount,
} from "../services/generatedBadgesService";
import { QRCodeView } from "./QRCodeView";
import { QRPassModal } from "./QRPassModal";

interface BadgeArtworkProps {
  template: BadgeTemplate;
  pilgrim: Pilgrim | null;
  trip?: Trip;
  guide1Name?: string;
  guide1Phone?: string;
  guide2Name?: string;
  guide2Phone?: string;
  qrPayload?: string | QRPayload;
  compact?: boolean;
  className?: string;
}

const getTemplateVisuals = (variant: string, accentColor: string) => {
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

const buildBadgePageUrl = (uniqueCode: string): string => {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const appOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = `${appOrigin}${normalizedBase}/badge/${encodeURIComponent(uniqueCode)}`;
  return fullUrl.replace(/([^:]\/\/)+/g, "$1");
};

const BadgeArtwork: React.FC<BadgeArtworkProps> = ({
  template,
  pilgrim,
  trip,
  guide1Name,
  guide1Phone,
  guide2Name,
  guide2Phone,
  qrPayload,
  compact = false,
  className = "",
}) => {
  const visuals = getTemplateVisuals(template.variant, template.accentColor);
  const displayName = pilgrim?.nameArabic || pilgrim?.nameLatin || "معتمر";
  const displayTrip = trip?.name || pilgrim?.tripName || "رحلة مخصصة";
  const displayCode = pilgrim?.uniqueCode || "—";
  const avatarInitial = displayName.slice(0, 1).toUpperCase();

  return (
    <div
      className={`relative mx-auto overflow-hidden rounded-[24px] border text-center shadow-[0_18px_45px_rgba(15,23,42,0.14)] ${className}`}
      style={{
        borderColor: visuals.borderColor,
        background: visuals.bodyBg,
      }}
    >
      <div
        className="relative px-4 py-4 text-white"
        style={{ background: visuals.headerBg }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{ backgroundImage: visuals.pattern }}
        />
        <div className="relative flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/40 bg-white/15 text-base font-black shadow-sm">
              🕋
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/70">
                Umrah Compagnon
              </p>
              <p className="text-sm font-black">مسك طيبة للعمرة</p>
            </div>
          </div>
          <div className="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">
            {template.name}
          </div>
        </div>

        <div className="relative mt-4 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-white/20 text-2xl font-black shadow-sm">
            {pilgrim?.avatarUrl ? (
              <img
                src={pilgrim.avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;
                }}
              />
            ) : (
              <span>{avatarInitial}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/75">
              {compact ? "Badge" : "Pilgrim"}
            </p>
            <h3 className="text-base font-black leading-tight">
              {displayName}
            </h3>
            {!compact && (
              <p className="mt-0.5 text-[11px] text-white/80">{displayTrip}</p>
            )}
          </div>
        </div>
      </div>

      <div
        className="relative p-4 space-y-3"
        style={{ background: visuals.bodyBg }}
      >
        <div
          className="flex flex-col items-center justify-center rounded-2xl border px-3 py-2 text-center"
          style={{
            background: visuals.detailBg,
            borderColor: `${visuals.borderColor}33`,
          }}
        >
          <div>
            <p
              className="text-[9px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: visuals.highlightColor }}
            >
              Voyage
            </p>
            <p
              className="text-xs font-extrabold"
              style={{ color: visuals.textColor }}
            >
              {displayTrip}
            </p>
          </div>
          <div
            className="mt-2 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{ background: visuals.chipBg, color: visuals.chipTextColor }}
          >
            {compact ? "Prévu" : "Pass officiel"}
          </div>
        </div>

        {!compact && (
          <>
            <div className="flex justify-center rounded-[22px] border border-slate-200/70 bg-white p-3">
              <QRCodeView
                payload={
                  qrPayload || {
                    agency: "مسك طيبة للعمرة",
                    uniqueCode: displayCode,
                    nameArabic: displayName,
                    nameLatin: pilgrim?.nameLatin,
                    passportNumber: pilgrim?.passportNumber,
                    tripName: displayTrip,
                    emergencyGuide1: `${guide1Name || "—"} (${guide1Phone || "—"})`,
                    emergencyGuide2:
                      guide2Name && guide2Phone
                        ? `${guide2Name} (${guide2Phone})`
                        : undefined,
                  }
                }
                size={108}
              />
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-center text-[11px] text-slate-600">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Code</span>
                <span className="font-semibold text-slate-800">
                  {displayCode}
                </span>
              </div>
              <div className="mt-1 flex justify-between gap-3">
                <span className="text-slate-400">Urgence</span>
                <span className="font-semibold text-slate-800">
                  {guide1Name || "—"}
                </span>
              </div>
              {guide2Name && (
                <div className="mt-1 flex justify-between gap-3">
                  <span className="text-slate-400">Accompagnateur</span>
                  <span className="font-semibold text-slate-800">
                    {guide2Name}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface QrCenterViewProps {
  lang: Language;
  trips: Trip[];
  pilgrims: Pilgrim[];
  staff: Staff[];
  selectedTripId?: string;
}

export const QrCenterView: React.FC<QrCenterViewProps> = ({
  lang,
  trips,
  pilgrims,
  staff,
  selectedTripId: initialTripId,
}) => {
  const isAr = lang === "AR";
  const [searchParams] = useSearchParams();
  const tripIdFromUrl = searchParams.get("tripId");
  const [activeTripId, setActiveTripId] = useState(
    tripIdFromUrl || initialTripId || trips[0]?.id || "",
  );

  useEffect(() => {
    if (tripIdFromUrl) {
      setActiveTripId(tripIdFromUrl);
    }
  }, [tripIdFromUrl]);

  // Assigned staff & emergency contact state
  const [guide1Name, setGuide1Name] = useState("نادر قويعة");
  const [guide1Phone, setGuide1Phone] = useState("+216 25 800 884");
  const [guide2Name, setGuide2Name] = useState("كريمة شاكر");
  const [guide2Phone, setGuide2Phone] = useState("+216 21 805 829");

  const [selectedTemplate, setSelectedTemplate] = useState<BadgeTemplate>(
    badgeTemplates[0],
  );
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [badgesGenerated, setBadgesGenerated] = useState(true);
  const [selectedPilgrimForPreview, setSelectedPilgrimForPreview] =
    useState<Pilgrim | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [savedBadgeCount, setSavedBadgeCount] = useState(
    getGeneratedBadgeCount(),
  );

  // Batch print mode vs single badge mode.
  // Kept in state so the batch-grid rendering path below still works if you
  // wire up a control for it again later — the screenshot this was matched
  // against doesn't show a visible toggle, so the switcher UI was removed.
  const [printMode, setPrintMode] = useState<"single" | "batch">("single");

  // Inspection modal
  const [inspectingPilgrim, setInspectingPilgrim] = useState<Pilgrim | null>(
    null,
  );

  const selectedTrip = trips.find((t) => t.id === activeTripId);
  const tripPilgrims = pilgrims.filter((p) => p.tripId === activeTripId);
  const tripStaff = staff.filter((s) => s.tripId === activeTripId);
  const hasPilgrims = tripPilgrims.length > 0;

  // Auto populate emergency contacts from assigned trip staff
  useEffect(() => {
    if (tripStaff.length > 0) {
      if (tripStaff[0]) {
        setGuide1Name(tripStaff[0].nameArabic);
        setGuide1Phone(tripStaff[0].phone || tripStaff[0].whatsapp);
      }
      if (tripStaff[1]) {
        setGuide2Name(tripStaff[1].nameArabic);
        setGuide2Phone(tripStaff[1].phone || tripStaff[1].whatsapp);
      } else {
        setGuide2Name("");
        setGuide2Phone("");
      }
    }
  }, [activeTripId, staff]);

  const currentPilgrim =
    selectedPilgrimForPreview || tripPilgrims[0] || pilgrims[0] || null;

  useEffect(() => {
    if (tripPilgrims.length > 0) {
      const pilgrimStillAvailable = selectedPilgrimForPreview
        ? tripPilgrims.some(
            (pilgrim) => pilgrim.id === selectedPilgrimForPreview.id,
          )
        : false;

      if (!pilgrimStillAvailable) {
        setSelectedPilgrimForPreview(tripPilgrims[0] || null);
      }
      return;
    }

    setSelectedPilgrimForPreview(null);
  }, [activeTripId, selectedPilgrimForPreview, tripPilgrims]);

  const handleGenerateBadges = async () => {
    setBadgesGenerated(true);
    setSaveStatus(null);

    if (!tripPilgrims.length) {
      setSaveStatus("Aucun pèlerin disponible pour générer un badge.");
      return;
    }

    const records = await Promise.all(
      tripPilgrims.map(async (pilgrim) => {
        const badgeUrl = buildBadgePageUrl(pilgrim.uniqueCode);
        let qrCodeDataUrl = "";

        try {
          qrCodeDataUrl = await generateQRCodeDataUrl(badgeUrl, {
            width: 420,
            margin: 1,
            simple: true,
          });
        } catch (err) {
          console.warn(
            "Failed to generate QR code for pilgrim",
            pilgrim.uniqueCode,
            err,
          );
        }

        return {
          tripId: activeTripId,
          tripName: selectedTrip?.name || pilgrim.tripName,
          pilgrimId: pilgrim.id,
          pilgrimName: pilgrim.nameArabic,
          uniqueCode: pilgrim.uniqueCode,
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          templateVariant: selectedTemplate.variant,
          accentColor: selectedTemplate.accentColor,
          guide1Name,
          guide1Phone,
          guide2Name,
          guide2Phone,
          payload: {
            agency: "مسك طيبة للعمرة",
            uniqueCode: pilgrim.uniqueCode,
            nameArabic: pilgrim.nameArabic,
            nameLatin: pilgrim.nameLatin,
            passportNumber: pilgrim.passportNumber,
            tripName: selectedTrip?.name || pilgrim.tripName,
            templateId: selectedTemplate.id,
            templateVariant: selectedTemplate.variant,
            badgeUrl,
          },
          pageUrl: badgeUrl,
          qrCodeDataUrl,
        };
      }),
    );

    const persisted = await saveGeneratedBadges(records);
    if (persisted) {
      setSavedBadgeCount(getGeneratedBadgeCount());
      setSaveStatus(
        `Badges sauvegardés (${records.length}) dans la base de données et le stockage local.`,
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        {/* Left Panel (Controls) - Hidden on Print */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              {isAr
                ? "إعداد بطاقات الرحلة"
                : "Configuration des Badges de Voyage"}
            </h2>

            {/* Step 1: Select Trip */}
            <div className="space-y-1.5 text-start">
              <label className="text-xs font-bold text-slate-700">
                {isAr ? "1. اختر الرحلة" : "1. Sélectionner le Voyage"}
              </label>
              <div className="relative">
                <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={activeTripId}
                  onChange={(e) => {
                    setActiveTripId(e.target.value);
                    setSelectedPilgrimForPreview(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-black/5 text-start appearance-none"
                >
                  <option value="">
                    {isAr
                      ? "-- اختر رحلة نشطة --"
                      : "-- Sélectionner un voyage actif --"}
                  </option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.startDate})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Emergency Contacts Inputs */}
            <div className="space-y-3 bg-slate-50/70 border border-slate-100 rounded-xl p-4 text-start">
              <label className="text-xs font-bold text-slate-700 block">
                {isAr
                  ? "أرقام الطوارئ (المرافقون)"
                  : "Contacts Urgences (Accompagnateurs)"}
              </label>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <input
                    type="text"
                    value={guide1Name}
                    onChange={(e) => setGuide1Name(e.target.value)}
                    placeholder="اسم المرافق الأول"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-start"
                  />
                </div>
                <input
                  type="text"
                  value={guide1Phone}
                  onChange={(e) => setGuide1Phone(e.target.value)}
                  placeholder="+966 5..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <input
                    type="text"
                    value={guide2Name}
                    onChange={(e) => setGuide2Name(e.target.value)}
                    placeholder="اسم المرافق الثاني"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                  />
                </div>
                <input
                  type="text"
                  value={guide2Phone}
                  onChange={(e) => setGuide2Phone(e.target.value)}
                  placeholder="+966 5..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerateBadges}
              className="w-full bg-black hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <QrCode className="w-4 h-4" />
              <span>
                {isAr
                  ? "توليد ومعاينة البطاقات"
                  : "Générer & Prévisualiser Badges"}
              </span>
            </button>
          </div>

          {/* Data Summary Cards */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              Résumé des Données
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl relative overflow-hidden">
                <Users className="w-4 h-4 text-slate-300 absolute top-3 right-3" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  PÈLERINS
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  {tripPilgrims.length}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl relative overflow-hidden">
                <UserRound className="w-4 h-4 text-slate-300 absolute top-3 right-3" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  ACCOMPAGNATEURS
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  {tripStaff.length}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl relative overflow-hidden">
                <IdCard className="w-4 h-4 text-slate-300 absolute top-3 right-3" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  BADGES GÉNÉRÉS
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  {badgesGenerated ? tripPilgrims.length : 0}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl relative overflow-hidden">
                <Activity className="w-4 h-4 text-slate-300 absolute top-3 right-3" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  STATUT
                </p>
                <p className="text-xs font-bold mt-1.5 text-slate-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Prêt à générer
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel (Preview & Template Controls) */}
        <div className="lg:col-span-7 space-y-6 print:w-full print:p-0">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 print:hidden">
              <h2 className="font-bold text-slate-900 text-base leading-snug max-w-[220px]">
                {isAr
                  ? "معاينة بطاقات الهوية الرقمية"
                  : "Aperçu des Cartes d'Identité Numériques"}
              </h2>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Aperçu en Direct
                </span>
                <button
                  onClick={handlePrint}
                  disabled={!hasPilgrims}
                  className="px-3 py-1.5 bg-white border border-slate-200 disabled:text-slate-300 text-slate-500 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer les Cartes</span>
                </button>
                <button
                  onClick={handlePrint}
                  disabled={!hasPilgrims}
                  className="px-3 py-1.5 bg-white border border-slate-200 disabled:text-slate-300 text-slate-500 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter en PDF</span>
                </button>
                <button
                  onClick={handleGenerateBadges}
                  className="px-3 py-1.5 bg-black hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Mettre à jour les Badges</span>
                </button>
              </div>
            </div>

            {/* Template Selector */}
            <div className="space-y-3 print:hidden">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-slate-900 dir-rtl">
                      قالب بطاقة الهوية
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      Choisissez un style — l'aperçu se met à jour
                      instantanément
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded-full">
                    {badgeTemplates.length} modèles
                  </span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-full">
                    {savedBadgeCount} sauvegardés
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-12 h-14 rounded-lg shrink-0 flex items-center justify-center border border-slate-200 overflow-hidden"
                    style={{
                      backgroundColor: `${selectedTemplate.accentColor}1A`,
                    }}
                  >
                    <QrCode
                      className="w-4 h-4"
                      style={{ color: selectedTemplate.accentColor }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400">
                      Design actuel
                    </p>
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {selectedTemplate.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {selectedTemplate.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="bg-black hover:bg-slate-900 text-white text-xs font-bold pl-3 pr-2.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="text-left leading-tight">
                    <span className="block">Voir et changer</span>
                    <span className="block text-[10px] font-semibold text-white/60">
                      {badgeTemplates.length} modèles prêts
                    </span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Badge Preview Area */}
            {saveStatus && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 print:hidden">
                {saveStatus}
              </div>
            )}

            {hasPilgrims ? (
              <div className="space-y-4">
                {/* All Badges — vertical stack, click any badge to expand/collapse */}
                <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-1 print:max-h-none print:overflow-visible print:pr-0">
                  {tripPilgrims.map((p) => {
                    const isExpanded = selectedPilgrimForPreview?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        className="mx-auto w-full max-w-sm transition-all duration-300 ease-out print:break-inside-avoid print:max-w-none"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPilgrimForPreview(isExpanded ? null : p)
                          }
                          className="block w-full cursor-pointer text-left print:pointer-events-none"
                        >
                          <BadgeArtwork
                            template={selectedTemplate}
                            pilgrim={p}
                            trip={selectedTrip}
                            guide1Name={guide1Name}
                            guide1Phone={guide1Phone}
                            guide2Name={guide2Name}
                            guide2Phone={guide2Phone}
                            qrPayload={buildBadgePageUrl(p.uniqueCode)}
                            compact={!isExpanded}
                            className={`w-full transition-all duration-300 ${
                              isExpanded
                                ? "shadow-xl ring-2 ring-black/10"
                                : "hover:shadow-md hover:-translate-y-0.5"
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <button
                            type="button"
                            onClick={() => setInspectingPilgrim(p)}
                            className="mt-3 w-full bg-slate-900 hover:bg-black text-white text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer print:hidden"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>Inspecter le Pass Numérique</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-14 flex flex-col items-center justify-center text-center gap-4 bg-slate-50/60 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                  <QrCode className="w-7 h-7 text-slate-300" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h3 className="font-bold text-slate-900 text-sm">
                    En attente de Génération de Cartes
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sélectionnez un voyage et configurez les contacts d'urgence
                    pour afficher les badges imprimables.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Template Selector Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl rounded-[28px] border border-slate-100 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <h2 className="font-bold text-slate-900 text-base">
                  Modèles de Badges de Voyage ({badgeTemplates.length} modèles)
                </h2>
                <p className="text-sm text-slate-500">
                  Choisissez un style de badge plus riche qu’un simple jeu de
                  couleurs.
                </p>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
              {badgeTemplates.map((tpl) => {
                const isSelected = selectedTemplate.id === tpl.id;
                const previewPilgrim =
                  currentPilgrim || tripPilgrims[0] || pilgrims[0] || null;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      setSelectedTemplate(tpl);
                      setIsTemplateModalOpen(false);
                    }}
                    className={`cursor-pointer rounded-[24px] border p-3 transition-all ${
                      isSelected
                        ? "border-black bg-slate-50 ring-2 ring-black/10"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div className="mb-3 overflow-hidden rounded-[20px] border border-slate-200/70">
                      <BadgeArtwork
                        template={tpl}
                        pilgrim={previewPilgrim}
                        trip={selectedTrip}
                        guide1Name={guide1Name}
                        guide1Phone={guide1Phone}
                        guide2Name={guide2Name}
                        guide2Phone={guide2Phone}
                        qrPayload={
                          previewPilgrim
                            ? buildBadgePageUrl(previewPilgrim.uniqueCode)
                            : undefined
                        }
                        compact
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-xs text-slate-900">
                          {tpl.name}
                        </p>
                        <p className="text-[11px] font-bold text-slate-800 dir-rtl">
                          {tpl.nameArabic}
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">
                        {tpl.variant}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      {tpl.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="rounded-xl bg-black px-4 py-2 text-xs font-bold text-white hover:bg-slate-900"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Digital Pass Inspection Modal */}
      <QRPassModal
        isOpen={!!inspectingPilgrim}
        onClose={() => setInspectingPilgrim(null)}
        pilgrim={inspectingPilgrim}
        trip={selectedTrip}
        staffList={staff}
        emergencyGuide1={{ name: guide1Name, phone: guide1Phone }}
        emergencyGuide2={{ name: guide2Name, phone: guide2Phone }}
      />
    </div>
  );
};
