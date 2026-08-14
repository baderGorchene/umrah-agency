import React from "react";
import { X, ShieldCheck, Check, Copy } from "lucide-react";
import { Pilgrim, Staff, Trip, DEFAULT_AVATAR_URL } from "../types";
import { QRCodeView } from "./QRCodeView";
import { buildBadgePublicUrl } from "../lib/qrCode";
import { useModalDismiss } from "../lib/useModalDismiss";
import { useTranslation } from "react-i18next";

interface QRPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  pilgrim: Pilgrim | null;
  trip?: Trip;
  staffList?: Staff[];
  emergencyGuide1?: { name: string; phone: string };
  emergencyGuide2?: { name: string; phone: string };
}

export const QRPassModal: React.FC<QRPassModalProps> = ({
  isOpen,
  onClose,
  pilgrim,
  trip,
  emergencyGuide1,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);
  const { handleBackdropClick } = useModalDismiss(isOpen, onClose);

  if (!isOpen || !pilgrim) return null;

  const publicUrl = buildBadgePublicUrl(pilgrim.uniqueCode);

  const guide1Name = emergencyGuide1?.name || "نادر قويعة";
  const guide1Phone = emergencyGuide1?.phone || "25800884";

  const displayName = pilgrim.nameArabic || pilgrim.nameLatin || "معتمر";
  const avatarInitial = displayName.slice(0, 1).toUpperCase();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 text-right">
      <span className="text-[16px] font-bold text-slate-800">
        {value || "—"}
      </span>
      <span className="text-[16px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
    </div>
  );

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md space-y-4 my-8 relative z-10 font-sans">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 px-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>{t("badge.official_digital_badge")}</span>
          </div>
          <button
            onClick={onClose}
            aria-label={t("buttons.close")}
            className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Badge Artwork Modal Container ── */}
        <div className="relative mx-auto flex flex-col overflow-hidden rounded-[24px] border border-amber-500/30 bg-white text-center shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
          {/* Header Banner */}
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

          {/* Photo Container */}
          <div className="relative flex w-full shrink-0 justify-center bg-slate-50 px-6 pt-5 pb-3">
            <div
              className="relative overflow-hidden rounded-2xl p-[3px] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              style={{
                width: "70%",
                minWidth: "72px",
                aspectRatio: "9 / 9",
                background: "linear-gradient(135deg, #d97706, #f59e0b)",
              }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-[13px] ring-1 ring-inset ring-white/60">
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
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 text-2xl font-black text-slate-400">
                    {avatarInitial}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="px-4 py-3 text-right">
            <InfoRow label={t("pilgrims.table_header_pilgrim")} value={displayName} />
            <InfoRow label={t("trips.form.makkah_hotel")} value={trip?.makkahHotel} />
            <InfoRow label={t("trips.form.madinah_hotel")} value={trip?.madinahHotel} />
            <InfoRow label={t("badge.accompanist")} value={guide1Name} />
            <InfoRow label={t("scanner.phone_tunisia")} value={guide1Phone} />

            {/* Scannable QR Code Box */}
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-right">
              <div className="flex shrink-0 justify-center rounded-xl border border-slate-200/70 bg-white p-2">
                <QRCodeView payload={publicUrl} size={144} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-bold text-slate-700">
                  {t("badge.scan_me_help")}
                </p>
                <p className="mt-0.5 text-[16px] text-slate-400">
                  {t("badge.accompany_faith")}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="border-t border-slate-100 py-2 text-[16px] font-semibold text-amber-600">
            {t("badge.agency_name")}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>{t("badge.copied_link")}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-950" />
                <span>{t("badge.share_link")}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-md"
          >
            <span>{t("badge.close_badge")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
