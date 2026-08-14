import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  User,
  Building2,
  UserCheck,
  Navigation,
  Compass,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Hotel,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Info,
} from "lucide-react";
import { findGeneratedBadgeByCode } from "../services/generatedBadgesService";
import { getPilgrimByUniqueCode } from "../services/pilgrimsService";
import { getAgencySettings } from "../services/agencyService";
import { getStaff } from "../services/staffService";
import { DEFAULT_AVATAR_URL, AgencySettings, Staff } from "../types";

interface PilgrimLandingData {
  agencyName: string;
  agencyPhone: string;
  agencyLogo?: string;
  uniqueCode: string;
  nameArabic: string;
  nameLatin?: string;
  passportNumber?: string;
  birthDate?: string;
  tripName: string;
  makkahHotel?: string;
  madinahHotel?: string;
  avatarUrl?: string;
  accompanistName: string;
  accompanistPhone: string;
  accompanistRole?: string;
  emergencyContact?: string;
  status?: string;
}

export const BadgePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [data, setData] = useState<PilgrimLandingData | null>(null);
  const [loading, setLoading] = useState(true);

  // Geolocation states
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [locationErrorMessage, setLocationErrorMessage] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const resolvePilgrimData = async () => {
      setLoading(true);
      const searchCode = (code || "YELC9821").trim();

      // Default agency fallback
      let defaultAgencyName = "مسك طيبة للأسفار و العمرة";
      let defaultAgencyPhone = "+216 73 481 100";
      let agencyLogo = `${import.meta.env.BASE_URL}logob.jpeg`;

      try {
        const agency = await getAgencySettings();
        if (agency?.name) defaultAgencyName = agency.name;
        if (agency?.phone) defaultAgencyPhone = agency.phone;
        if (agency?.logoUrl) agencyLogo = agency.logoUrl;
      } catch (err) {
        console.warn("Could not fetch agency settings:", err);
      }

      // Default accompanist fallback
      let defaultAccompanistName = "نادر قويعة";
      let defaultAccompanistPhone = "25800884";
      let defaultAccompanistRole = "مرافق الرحلة / دليل المعتمرين";

      // 1. Check saved badge generation records
      const storedRecord = findGeneratedBadgeByCode(searchCode);
      if (storedRecord) {
        const payload =
          typeof storedRecord.payload === "string"
            ? JSON.parse(storedRecord.payload)
            : storedRecord.payload || {};

        setData({
          agencyName: storedRecord.payload?.agency || payload.agency || defaultAgencyName,
          agencyPhone: defaultAgencyPhone,
          agencyLogo,
          uniqueCode: storedRecord.uniqueCode,
          nameArabic: storedRecord.pilgrimName || payload.nameArabic || "معتمر",
          nameLatin: payload.nameLatin || "",
          passportNumber: payload.passportNumber || "N2891048",
          birthDate: payload.birthDate || "",
          tripName: storedRecord.tripName || payload.tripName || "رحلة العمرة المباركة",
          makkahHotel: payload.makkahHotel || "فندق الماسة — مكة المكرمة",
          madinahHotel: payload.madinahHotel || "فندق الكيان العالمي — المدينة المنورة",
          accompanistName: storedRecord.guide1Name || defaultAccompanistName,
          accompanistPhone: storedRecord.guide1Phone || defaultAccompanistPhone,
          accompanistRole: defaultAccompanistRole,
          emergencyContact: defaultAgencyPhone,
          status: "مؤكد",
          avatarUrl: payload.avatarUrl || DEFAULT_AVATAR_URL,
        });
        setLoading(false);
        return;
      }

      // 2. Query pilgrims database
      try {
        const pilgrim = await getPilgrimByUniqueCode(searchCode);
        if (pilgrim) {
          // Attempt to match accompanist / staff for the pilgrim's trip
          try {
            const staffList = await getStaff();
            const tripGuide = staffList.find(
              (s) => s.tripId === pilgrim.tripId || s.tripName === pilgrim.tripName
            );
            if (tripGuide) {
              defaultAccompanistName = tripGuide.nameArabic;
              defaultAccompanistPhone = tripGuide.whatsapp || tripGuide.phone;
              defaultAccompanistRole = tripGuide.role;
            }
          } catch (e) {
            console.warn("Could not query staff list:", e);
          }

          setData({
            agencyName: defaultAgencyName,
            agencyPhone: defaultAgencyPhone,
            agencyLogo,
            uniqueCode: pilgrim.uniqueCode,
            nameArabic: pilgrim.nameArabic,
            nameLatin: pilgrim.nameLatin || "",
            passportNumber: pilgrim.passportNumber || "",
            birthDate: pilgrim.birthDate || "",
            tripName: pilgrim.tripName || "رحلة العمرة المباركة",
            makkahHotel: "فندق الماسة — مكة المكرمة",
            madinahHotel: "فندق الكيان العالمي — المدينة المنورة",
            avatarUrl: pilgrim.avatarUrl || DEFAULT_AVATAR_URL,
            accompanistName: defaultAccompanistName,
            accompanistPhone: defaultAccompanistPhone,
            accompanistRole: defaultAccompanistRole,
            emergencyContact: pilgrim.emergencyContact || defaultAgencyPhone,
            status: pilgrim.status || "مؤكد",
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Error resolving pilgrim for landing page:", err);
      }

      // 3. Fallback state
      setData({
        agencyName: defaultAgencyName,
        agencyPhone: defaultAgencyPhone,
        agencyLogo,
        uniqueCode: searchCode.toUpperCase(),
        nameArabic: "معتمر",
        nameLatin: "",
        passportNumber: "",
        birthDate: "",
        tripName: "رحلة العمرة المباركة",
        accompanistName: defaultAccompanistName,
        accompanistPhone: defaultAccompanistPhone,
        accompanistRole: defaultAccompanistRole,
        makkahHotel: "مكة المكرمة",
        madinahHotel: "المدينة المنورة",
        avatarUrl: DEFAULT_AVATAR_URL,
        status: "مؤكد",
      });
      setLoading(false);
    };

    resolvePilgrimData();
  }, [code]);

  // Request user's current GPS location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationErrorMessage("خدمة تحديد الموقع غير مدعومة على هذا الجهاز.");
      return;
    }

    setLocationStatus("loading");
    setLocationErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationStatus("success");
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setLocationStatus("error");
        if (error.code === error.PERMISSION_DENIED) {
          setLocationErrorMessage(
            "تم رفض إذن الوصول إلى الموقع. يرجى تفعيل الـ GPS في إعدادات المتصفح."
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationErrorMessage("تعذر الحصول على إشارة الموقع الجغرافي حالياً.");
        } else if (error.code === error.TIMEOUT) {
          setLocationErrorMessage("انتهت مهلة انتظار إشارة الـ GPS. يرجى المحاولة ثانية.");
        } else {
          setLocationErrorMessage("حدث خطأ أثناء تحديد الموقع الجغرافي.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Clean and format phone number for WhatsApp
  const cleanPhoneForWhatsApp = (rawPhone?: string): string => {
    if (!rawPhone) return "21625800884";
    const digits = rawPhone.replace(/\D/g, "");
    if (!digits) return "21625800884";
    // If Tunisian 8-digit number (e.g. 25800884 or 98123456)
    if (digits.length === 8) {
      return `216${digits}`;
    }
    // If Saudi number starting with 05
    if (digits.startsWith("05") && digits.length === 10) {
      return `966${digits.slice(1)}`;
    }
    // If starts with 00, remove 00
    if (digits.startsWith("00")) {
      return digits.slice(2);
    }
    return digits;
  };

  // Build the pre-filled Arabic WhatsApp message with location link
  const generateWhatsAppUrl = (currentCoords?: { latitude: number; longitude: number } | null): string => {
    const targetPhone = cleanPhoneForWhatsApp(data?.accompanistPhone);

    const pilgrimName = data?.nameArabic || "معتمر";
    const agencyName = data?.agencyName || "مسك طيبة للأسفار و العمرة";
    const accompanistName = data?.accompanistName || "المرافق المسؤول";
    const pilgrimCode = data?.uniqueCode || code || "—";

    let locationLink = "";
    if (currentCoords) {
      locationLink = `https://maps.google.com/?q=${currentCoords.latitude.toFixed(6)},${currentCoords.longitude.toFixed(6)}`;
    } else if (coords) {
      locationLink = `https://maps.google.com/?q=${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`;
    }

    const messageText = `السلام عليكم ورحمة الله وبركاته،

📌 *بيانات المعتمر المسجل:*
• *اسم المعتمر:* ${pilgrimName}
• *الرمز التعريفي:* ${pilgrimCode}
• *الوكالة التابع لها:* ${agencyName}
• *المرافق المسؤول:* ${accompanistName}

${
  locationLink
    ? `📍 *الموقع الجغرافي الحالي عبر خرائط Google:*
${locationLink}`
    : `📍 *تنبيه موقع:* يرجى التواصل لتحديد الموقع وتقديم المساعدة.`
}

الرجاء التواصل لتقديم المساعدة والتنسيق. شكراً جزيلاً.`;

    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(messageText)}`;
  };

  // Handle click on WhatsApp button: trigger location if not done yet then redirect
  const handleWhatsAppAction = () => {
    if (coords) {
      const url = generateWhatsAppUrl(coords);
      window.open(url, "_blank");
      return;
    }

    // If geolocation is available and not fetched, try to get position before redirecting
    if (navigator.geolocation && locationStatus !== "error") {
      setLocationStatus("loading");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setCoords(newCoords);
          setLocationStatus("success");
          const url = generateWhatsAppUrl(newCoords);
          window.open(url, "_blank");
        },
        () => {
          // On error, open WhatsApp anyway with identification details
          const url = generateWhatsAppUrl(null);
          window.open(url, "_blank");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      const url = generateWhatsAppUrl(null);
      window.open(url, "_blank");
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans"
      >
        <div className="w-12 h-12 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-300">جاري تحميل بيانات المعتمر والرحلة...</p>
      </div>
    );
  }

  const pilgrimName = data?.nameArabic || "معتمر";
  const agencyName = data?.agencyName || "مسك طيبة للأسفار و العمرة";
  const accompanistName = data?.accompanistName || "نادر قويعة";
  const accompanistPhone = data?.accompanistPhone || "25800884";

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 font-sans selection:bg-amber-400 selection:text-black"
    >
      {/* Ambient background glow */}
      <div className="fixed -top-40 right-1/2 translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/2 translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md space-y-4 relative z-10 my-4">
        
        {/* Top Header Card */}
        <header className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-black border border-amber-500/30 overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={`${import.meta.env.BASE_URL}logob.jpeg`}
                alt="Logo"
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>بطاقة تعريف المعتمر الرقمية</span>
              </div>
              <h2 className="text-sm font-black text-white">{agencyName}</h2>
            </div>
          </div>

          <button
            onClick={handleCopyShareLink}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="مشاركة الصفحة"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </header>

        {/* ── 1. PILGRIM INFO CARD (MAIN STATEMENT) ── */}
        <div className="bg-white text-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200/80 space-y-5">
          
          {/* Main Statement Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-emerald-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
            <p className="text-sm leading-relaxed text-slate-800 font-medium">
              المعتمر <span className="font-black text-slate-950 text-base underline decoration-amber-500 decoration-2">{pilgrimName}</span> مسجل رسمياً لدى وكالة{" "}
              <span className="font-bold text-amber-900">{agencyName}</span>، بمرافقة{" "}
              <span className="font-black text-emerald-800 text-base">{accompanistName}</span>.
            </p>
          </div>

          {/* Pilgrim Profile Block */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-slate-200 shrink-0 shadow-xs">
              <img
                src={data?.avatarUrl || DEFAULT_AVATAR_URL}
                alt={pilgrimName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                  {data?.status || "معتمر مؤكد"}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-mono text-[10px]">
                  {data?.uniqueCode || code}
                </span>
              </div>
              <h1 className="text-base font-black text-slate-900 truncate mt-1">
                {pilgrimName}
              </h1>
              {data?.nameLatin && (
                <p className="text-xs text-slate-500 uppercase tracking-wide truncate">
                  {data.nameLatin}
                </p>
              )}
            </div>
          </div>

          {/* Accompanist & Agency Information Box */}
          <div className="grid grid-cols-1 gap-2.5">
            {/* Accompanist Tile */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500">المرافق المسؤول / المرشد</p>
                  <p className="text-xs font-bold text-slate-900">{accompanistName}</p>
                </div>
              </div>
              <a
                href={`tel:${accompanistPhone}`}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>اتصال</span>
              </a>
            </div>

            {/* Trip / Hotels Tile */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Hotel className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500">الرحلة ومقر الإقامة</p>
                  <p className="text-xs font-bold text-slate-900">{data?.tripName}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                مكة / المدينة
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. LOCATION CALLOUT CARD ── */}
        <div className="bg-slate-900/95 backdrop-blur-md rounded-3xl p-5 border border-amber-500/30 shadow-2xl space-y-4">
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-5 h-5 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>تحديد ومشاركة موقعك الحالي</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-normal">
                  GPS مباشر
                </span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                إذا كنت تائهاً أو تحتاج للمساعدة، يرجى الضغط أدناه لتحديد موقعك الجغرافي الحالي وإرساله مباشرة للمرافق عبر واتساب لسرعة الوصول إليك.
              </p>
            </div>
          </div>

          {/* Location Trigger & Feedback Box */}
          <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locationStatus === "loading"}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  locationStatus === "success"
                    ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40"
                    : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                }`}
              >
                {locationStatus === "loading" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>جاري تحديد موقعك عبر الأقمار الصناعية...</span>
                  </>
                ) : locationStatus === "success" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>تم تحديد موقعك بدقة (تحديث)</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 text-amber-400" />
                    <span>تحديد موقعي الجغرافي الآن</span>
                  </>
                )}
              </button>
            </div>

            {/* GPS Result details */}
            {coords && locationStatus === "success" && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between gap-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-mono text-[11px]">
                    {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                  </span>
                </div>
                <a
                  href={`https://maps.google.com/?q=${coords.latitude},${coords.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>عرض الخريطة</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Error Message */}
            {locationStatus === "error" && (
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-tight">{locationErrorMessage}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. WHATSAPP ACTION BUTTON ── */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleWhatsAppAction}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-black text-sm flex items-center justify-center gap-3 transition-all shadow-[0_12px_30px_rgba(16,185,129,0.35)] cursor-pointer"
          >
            <MessageCircle className="w-6 h-6 fill-slate-950 text-emerald-500" />
            <span>إرسال رسالة واتساب مع الموقع إلى المرافق</span>
          </button>

          {/* Quick Call Fallback */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`tel:${accompanistPhone}`}
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>اتصال بالمرافق</span>
            </a>

            <a
              href={`tel:${data?.emergencyContact || "+21673481100"}`}
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>طوارئ الوكالة</span>
            </a>
          </div>
        </div>

        {/* Footer info note */}
        <footer className="text-center text-slate-500 text-xs py-3 space-y-1">
          <p>{agencyName} — في خدمة ضيوف الرحمن</p>
          <p className="text-[10px] text-slate-600 font-mono">الرمز: {data?.uniqueCode || code}</p>
        </footer>

      </div>
    </div>
  );
};

export default BadgePage;
