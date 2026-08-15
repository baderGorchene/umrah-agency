import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  QrCode,
  Download,
  Image as ImageIcon,
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
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import JSZip from "jszip";
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
import { useTranslation } from "react-i18next";

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
  const appOrigin = typeof window !== "undefined" ? window.location.origin : "";
  return `${appOrigin}${baseUrl}#/badge/${encodeURIComponent(uniqueCode)}`;
};

const toSafeFileName = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_") || "badge";

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

const BadgeArtwork: React.FC<BadgeArtworkProps> = ({
  template,
  pilgrim,
  trip,
  guide1Name,
  guide1Phone,
  qrPayload,
  compact = false,
  className = "",
}) => {
  const { t } = useTranslation();
  const visuals = getTemplateVisuals(template.variant, template.accentColor);
  const displayName = pilgrim?.nameArabic || pilgrim?.nameLatin || "معتمر";
  const displayCode = pilgrim?.uniqueCode || "—";
  const avatarInitial = displayName.slice(0, 1).toUpperCase();
  const effectiveAvatar = resolvePilgrimAvatar(pilgrim);
  const hasCustomAvatar = Boolean(
    effectiveAvatar && effectiveAvatar !== DEFAULT_AVATAR_URL,
  );

  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 text-right">
      <span className="text-[14px] font-bold text-slate-800">
        {value || "—"}
      </span>
      <span className="text-[14px] font-semibold text-slate-950">{label}</span>
    </div>
  );

  return (
    <div
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

          <div className="min-w-0 flex-1 text-right">
            <p className="truncate text-sm font-black text-slate-900">
              {displayName}
            </p>
            <p
              className="mt-0.5 text-[14px] font-semibold"
              style={{ color: visuals.highlightColor }}
            >
              {template.name || "بطاقة تعريف المعتمر"}
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
          <div className="px-4 py-3 text-right">
            <InfoRow label={t("pilgrims.table_header_pilgrim")} value={displayName} />
            <InfoRow label={t("trips.form.makkah_hotel")} value={trip?.makkahHotel} />
            <InfoRow label={t("trips.form.madinah_hotel")} value={trip?.madinahHotel} />
            <InfoRow label={t("badge.accompanist")} value={guide1Name} />
            <InfoRow label={t("scanner.phone_tunisia")} value={guide1Phone} />

            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-right">
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
                  size={90}
                />
              </div>
              <div className="min-w-0 flex-1">
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

interface QrCenterViewProps {
  lang?: Language;
  trips: Trip[];
  pilgrims: Pilgrim[];
  staff: Staff[];
  selectedTripId?: string;
}

export const QrCenterView: React.FC<QrCenterViewProps> = ({
  trips,
  pilgrims,
  staff,
  selectedTripId: initialTripId,
}) => {
  const { t } = useTranslation();
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

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const badgeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [inspectingPilgrim, setInspectingPilgrim] = useState<Pilgrim | null>(
    null,
  );

  const selectedTrip = trips.find((t) => t.id === activeTripId);
  const tripPilgrims = pilgrims.filter((p) => p.tripId === activeTripId);
  const tripStaff = staff.filter((s) => s.tripId === activeTripId);
  const hasPilgrims = tripPilgrims.length > 0;

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

        const effectiveAvatar = resolvePilgrimAvatar(pilgrim);
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
            agency: "مسك طيبة للاسفار و السياحة",
            uniqueCode: pilgrim.uniqueCode,
            nameArabic: pilgrim.nameArabic,
            nameLatin: pilgrim.nameLatin,
            passportNumber: pilgrim.passportNumber,
            birthDate: pilgrim.birthDate,
            tripName: selectedTrip?.name || pilgrim.tripName,
            templateId: selectedTemplate.id,
            templateVariant: selectedTemplate.variant,
            avatarUrl: effectiveAvatar,
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

  const waitForImages = (node: HTMLElement): Promise<void> => {
    const imgs = Array.from(node.querySelectorAll("img"));
    return Promise.all(
      imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        });
      }),
    ).then(() => undefined);
  };

  const captureBadgeCanvas = async (
    pilgrim: Pilgrim,
  ): Promise<HTMLCanvasElement | null> => {
    const node = badgeRefs.current.get(pilgrim.id);
    if (!node) return null;
    await waitForImages(node);
    return html2canvas(node, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
  };

  const handleExportPDF = async () => {
    if (!hasPilgrims || isExportingPdf) return;
    setIsExportingPdf(true);
    setExportError(null);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const gap = 6;
      const columns = 2;
      const rows = 2;
      const perPage = columns * rows;
      const slotWidth =
        (pageWidth - margin * 2 - gap * (columns - 1)) / columns;
      const slotHeight = (pageHeight - margin * 2 - gap * (rows - 1)) / rows;

      for (let i = 0; i < tripPilgrims.length; i++) {
        const pilgrim = tripPilgrims[i];
        const canvas = await captureBadgeCanvas(pilgrim);
        if (!canvas) continue;

        const positionOnPage = i % perPage;
        if (i > 0 && positionOnPage === 0) {
          pdf.addPage();
        }

        const col = positionOnPage % columns;
        const row = Math.floor(positionOnPage / columns);
        const slotX = margin + col * (slotWidth + gap);
        const slotY = margin + row * (slotHeight + gap);

        const imgRatio = canvas.width / canvas.height;
        const slotRatio = slotWidth / slotHeight;
        let drawWidth = slotWidth;
        let drawHeight = slotHeight;
        if (imgRatio > slotRatio) {
          drawHeight = slotWidth / imgRatio;
        } else {
          drawWidth = slotHeight * imgRatio;
        }
        const drawX = slotX + (slotWidth - drawWidth) / 2;
        const drawY = slotY + (slotHeight - drawHeight) / 2;

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData, "JPEG", drawX, drawY, drawWidth, drawHeight);
      }

      const fileTripName = toSafeFileName(selectedTrip?.name || "voyage");
      pdf.save(`badges-${fileTripName}.pdf`);
    } catch (err) {
      console.error("Erreur export PDF", err);
      setExportError("Échec de l'export PDF. Veuillez réessayer.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportJPG = async () => {
    if (!hasPilgrims || isExportingJpg) return;
    setIsExportingJpg(true);
    setExportError(null);

    try {
      const zip = new JSZip();
      const fileTripName = toSafeFileName(selectedTrip?.name || "voyage");
      const folder = zip.folder(`badges-${fileTripName}`);
      const usedNames = new Set<string>();

      for (const pilgrim of tripPilgrims) {
        const canvas = await captureBadgeCanvas(pilgrim);
        if (!canvas) continue;

        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95),
        );
        if (!blob) continue;

        let baseName = toSafeFileName(
          pilgrim.nameLatin || pilgrim.nameArabic || pilgrim.uniqueCode,
        );
        let fileName = `${baseName}.jpg`;
        let suffix = 2;
        while (usedNames.has(fileName)) {
          fileName = `${baseName}_${suffix}.jpg`;
          suffix += 1;
        }
        usedNames.add(fileName);

        folder?.file(fileName, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `badges-${fileTripName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur export JPG", err);
      setExportError("Échec de l'export JPG. Veuillez réessayer.");
    } finally {
      setIsExportingJpg(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel (Controls) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
              <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                {t("qr_center.setup_trip_badges")}
              </h2>

              {/* Step 1: Select Trip */}
              <div className="space-y-1.5 text-start">
                <label className="text-xs font-bold text-slate-700">
                  {t("qr_center.select_trip_step")}
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
                      {t("qr_center.select_active_trip")}
                    </option>
                    {trips.map((tItem) => (
                      <option key={tItem.id} value={tItem.id}>
                        {tItem.name} ({tItem.startDate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Emergency Contacts Inputs */}
              <div className="space-y-3 bg-slate-50/70 border border-slate-100 rounded-xl p-4 text-start">
                <label className="text-xs font-bold text-slate-700 block">
                  {t("qr_center.emergency_contacts")}
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
                <span>{t("qr_center.generate_preview_badges")}</span>
              </button>
            </div>

            {/* Data Summary Cards */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                {t("qr_center.data_summary")}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl relative overflow-hidden">
                  <Users className="w-4 h-4 text-slate-300 absolute top-3 right-3" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {t("qr_center.total_pilgrims")}
                  </p>
                  <p className="text-xl font-extrabold text-slate-900">
                    {tripPilgrims.length}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl relative overflow-hidden">
                  <UserRound className="w-4 h-4 text-slate-300 absolute top-3 right-3" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {t("qr_center.total_accompanists")}
                  </p>
                  <p className="text-xl font-extrabold text-slate-900">
                    {tripStaff.length}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl relative overflow-hidden">
                  <IdCard className="w-4 h-4 text-slate-300 absolute top-3 right-3" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {t("qr_center.generated_badges")}
                  </p>
                  <p className="text-xl font-extrabold text-slate-900">
                    {badgesGenerated ? tripPilgrims.length : 0}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl relative overflow-hidden">
                  <Activity className="w-4 h-4 text-slate-300 absolute top-3 right-3" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {t("qr_center.status")}
                  </p>
                  <p className="text-xs font-bold mt-1.5 text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    {t("qr_center.ready_to_generate")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel (Preview & Template Controls) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
              {/* Top Toolbar */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <h2 className="font-bold text-slate-900 text-base leading-snug max-w-[220px]">
                  {t("qr_center.digital_pass_preview")}
                </h2>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    {t("qr_center.live_preview")}
                  </span>
                  <button
                    onClick={handleExportPDF}
                    disabled={!hasPilgrims || isExportingPdf}
                    className="px-3 py-1.5 bg-white border border-slate-200 disabled:text-slate-300 text-slate-500 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isExportingPdf ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{t("qr_center.export_pdf")}</span>
                  </button>
                  <button
                    onClick={handleExportJPG}
                    disabled={!hasPilgrims || isExportingJpg}
                    className="px-3 py-1.5 bg-white border border-slate-200 disabled:text-slate-300 text-slate-500 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isExportingJpg ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5" />
                    )}
                    <span>{t("qr_center.export_jpg")}</span>
                  </button>
                  <button
                    onClick={handleGenerateBadges}
                    className="px-3 py-1.5 bg-black hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t("qr_center.update_badges")}</span>
                  </button>
                </div>
              </div>

              {/* Template Selector */}
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs text-slate-900 dir-rtl">
                        {t("qr_center.id_badge_template")}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate">
                        {t("qr_center.template_subtitle")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded-full">
                      {badgeTemplates.length} {t("qr_center.models_available")}
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
                      <span className="block">{t("qr_center.see_and_change")}</span>
                      <span className="block text-[10px] font-semibold text-white/60">
                        {badgeTemplates.length} {t("qr_center.models_available")}
                      </span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Badge Preview Area */}
              {saveStatus && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {saveStatus}
                </div>
              )}

              {exportError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {exportError}
                </div>
              )}

              {hasPilgrims ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 max-h-[80vh] overflow-y-auto pr-1 content-start">
                    {tripPilgrims.map((p) => {
                      const isExpanded = selectedPilgrimForPreview?.id === p.id;

                      return (
                        <div
                          key={p.id}
                          className={`transition-all duration-300 ease-out ${
                            isExpanded ? "w-full" : "w-[calc(50%-0.5rem)]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPilgrimForPreview(
                                isExpanded ? null : p,
                              )
                            }
                            className="block w-full cursor-pointer text-left"
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
                              className={`w-full transition-all duration-300 ease-out ${
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
                              className="mt-3 w-full bg-slate-900 hover:bg-black text-white text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>{t("qr_center.inspect_digital_pass")}</span>
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
                      {t("qr_center.waiting_badge_gen")}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {t("qr_center.waiting_badge_gen_desc")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: "-99999px",
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        {tripPilgrims.map((p) => (
          <div
            key={`export-${p.id}`}
            ref={(el) => {
              if (el) {
                badgeRefs.current.set(p.id, el);
              } else {
                badgeRefs.current.delete(p.id);
              }
            }}
            style={{ width: "380px" }}
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
              compact={false}
            />
          </div>
        ))}
      </div>

      {/* Template Selector Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl rounded-[28px] border border-slate-100 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <h2 className="font-bold text-slate-900 text-base">
                  {t("qr_center.badge_templates_title")} ({badgeTemplates.length} modèles)
                </h2>
                <p className="text-sm text-slate-500">
                  {t("qr_center.template_subtitle")}
                </p>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                aria-label={t("buttons.close")}
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
                {t("buttons.close")}
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
    </>
  );
};
