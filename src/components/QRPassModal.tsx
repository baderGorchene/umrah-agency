import React from "react";
import { X, ShieldCheck, Check, Copy } from "lucide-react";
import { Pilgrim, Staff, Trip } from "../types";
import { BadgeArtwork } from "./BadgeArtwork";
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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

        {/* ── Reusable Badge Artwork Component ── */}
        <BadgeArtwork
          pilgrim={pilgrim}
          trip={trip}
          guide1Name={guide1Name}
          guide1Phone={guide1Phone}
          qrPayload={publicUrl}
          qrSize={144}
          className="border-amber-500/30"
        />

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
