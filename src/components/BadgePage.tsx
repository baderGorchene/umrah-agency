import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, Copy, Check, Printer } from "lucide-react";
import { QRCodeView } from "./QRCodeView";
import { findGeneratedBadgeByCode } from "../services/generatedBadgesService";
import { getPilgrimByUniqueCode } from "../services/pilgrimsService";
import { Pilgrim, DEFAULT_AVATAR_URL } from "../types";
import { initialPilgrims } from "../mockData";
import { buildBadgePublicUrl } from "../lib/qrCode";

interface ExtendedBadgeData {
  agencyName: string;
  uniqueCode: string;
  nameArabic: string;
  nameLatin?: string;
  passportNumber?: string;
  birthDate?: string;
  tripName: string;
  makkahHotel?: string;
  madinahHotel?: string;
  avatarUrl?: string;
  guide1Name?: string;
  guide1Phone?: string;
  guide2Name?: string;
  guide2Phone?: string;
  emergencyContact?: string;
  status?: string;
}

export const BadgePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [badgeData, setBadgeData] = useState<ExtendedBadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const resolveBadge = async () => {
      setLoading(true);
      const searchCode = (code || "YELC9821").trim();

      // 1) Check localStorage saved generated badges
      const storedRecord = findGeneratedBadgeByCode(searchCode);
      if (storedRecord) {
        const payload =
          typeof storedRecord.payload === "string"
            ? JSON.parse(storedRecord.payload)
            : storedRecord.payload;

        setBadgeData({
          agencyName: payload.agency || "مسك طيبة للأسفار و السياحة",
          uniqueCode: storedRecord.uniqueCode,
          nameArabic: storedRecord.pilgrimName || payload.nameArabic || "معتمر",
          nameLatin: payload.nameLatin || "",
          passportNumber: payload.passportNumber || "N2891048",
          birthDate: payload.birthDate || "",
          tripName: storedRecord.tripName || payload.tripName || "عمرة المولد",
          guide1Name: storedRecord.guide1Name || "نادر قويعة",
          guide1Phone: storedRecord.guide1Phone || "25800884",
          guide2Name: storedRecord.guide2Name || "منير بن صالح",
          guide2Phone: storedRecord.guide2Phone || "98765432",
          makkahHotel: "الماسـة — مكة المكرمة",
          madinahHotel: "الكيان العالمي — المدينة المنورة",
          status: "مؤكد",
        });
        setLoading(false);
        return;
      }

      // 2) Query database / mock pilgrims
      try {
        const pilgrim = await getPilgrimByUniqueCode(searchCode);
        if (pilgrim) {
          setBadgeData({
            agencyName: "مسك طيبة للأسفار و السياحة",
            uniqueCode: pilgrim.uniqueCode,
            nameArabic: pilgrim.nameArabic,
            nameLatin: pilgrim.nameLatin || "",
            passportNumber: pilgrim.passportNumber || "N2891048",
            birthDate: pilgrim.birthDate || "",
            tripName: pilgrim.tripName || "عمرة المولد",
            avatarUrl: pilgrim.avatarUrl || DEFAULT_AVATAR_URL,
            emergencyContact: pilgrim.emergencyContact || "+216 73 481 100",
            guide1Name: "نادر قويعة",
            guide1Phone: "25800884",
            guide2Name: "منير بن صالح",
            guide2Phone: "98765432",
            makkahHotel: "الماسـة — مكة المكرمة",
            madinahHotel: "الكيان العالمي — المدينة المنورة",
            status: pilgrim.status || "مؤكد",
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Error resolving pilgrim for badge page:", err);
      }

      // 3) Fallback to default initial pilgrim
      const defaultPilgrim = initialPilgrims[0];
      setBadgeData({
        agencyName: "مسك طيبة للأسفار و السياحة",
        uniqueCode: searchCode.toUpperCase(),
        nameArabic: defaultPilgrim.nameArabic,
        nameLatin: defaultPilgrim.nameLatin,
        passportNumber: defaultPilgrim.passportNumber,
        birthDate: defaultPilgrim.birthDate || "",
        tripName: defaultPilgrim.tripName,
        avatarUrl: defaultPilgrim.avatarUrl || DEFAULT_AVATAR_URL,
        guide1Name: "نادر قويعة",
        guide1Phone: "25800884",
        guide2Name: "منير بن صالح",
        guide2Phone: "98765432",
        makkahHotel: "الماسـة — مكة المكرمة",
        madinahHotel: "الكيان العالمي — المدينة المنورة",
        status: "مؤكد",
      });
      setLoading(false);
    };

    resolveBadge();
  }, [code]);

  const publicUrl = buildBadgePublicUrl(
    badgeData?.uniqueCode || code || "YELC9821",
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const displayName = badgeData?.nameArabic || badgeData?.nameLatin || "معتمر";
  const avatarInitial = displayName.slice(0, 1).toUpperCase();

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-amber-400 selection:text-black">
      {/* Background glow effects */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Wrapper */}
      <div className="w-full max-w-md space-y-4 relative z-10">
        {/* Top Bar Info */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-2 print:hidden">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>بطاقة معتمر رقمية رسمية</span>
          </div>
          <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 text-[10px] font-mono">
            {badgeData?.uniqueCode || code}
          </span>
        </div>

        {/* ── Badge Artwork ── */}
        <div className="relative mx-auto flex flex-col overflow-hidden rounded-[24px] border border-amber-500/30 bg-white text-center shadow-[0_18px_45px_rgba(15,23,42,0.14)] print:border-none print:shadow-none">
          {/* Header Banner */}
          <div className="relative h-24 w-full flex items-center justify-between bg-black px-6">
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

          {/* Avatar Container */}
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
                {badgeData?.avatarUrl ? (
                  <img
                    src={badgeData.avatarUrl}
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

          {/* Pilgrim Information Section */}
          <div className="px-4 py-3 text-right">
            <InfoRow label="الاسم" value={displayName} />
            <InfoRow label="فندق مكة المكرمة" value={badgeData?.makkahHotel} />
            <InfoRow
              label="فندق المدينة المنورة"
              value={badgeData?.madinahHotel}
            />
            <InfoRow label="رئيس المجموعة" value={badgeData?.guide1Name} />
            <InfoRow label="رقم الهاتف" value={badgeData?.guide1Phone} />

            {/* Scannable QR Code Block */}
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-right">
              <div className="flex shrink-0 justify-center rounded-xl border border-slate-200/70 bg-white p-2">
                <QRCodeView payload={publicUrl} size={144} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-bold text-slate-700">
                  امسح الرمز للمساعدة والدعم
                </p>
                <p className="mt-0.5 text-[16px] text-slate-400">
                  نرافقكم في رحلة الإيمان
                </p>
              </div>
            </div>
          </div>

          {/* Badge Footer */}
          <div className="border-t border-slate-100 py-2 text-[16px] font-semibold text-amber-600">
            {badgeData?.agencyName || "مسك طيبة للأسفار و السياحة"}
          </div>
        </div>

        {/* User Actions */}
        <div className="grid grid-cols-2 gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>طباعة البطاقة</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>تم نسخ الرابط!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-950" />
                <span>مشاركة الرابط</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadgePage;
