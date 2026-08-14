import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  MapPin,
  MessageCircle,
  ShieldCheck,
  UserCheck,
  Compass,
  AlertCircle,
  Hotel,
  Share2,
  Check,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { findGeneratedBadgeByCode } from "../services/generatedBadgesService";
import { getPilgrimByUniqueCode } from "../services/pilgrimsService";
import { getAgencySettings } from "../services/agencyService";
import { getStaff } from "../services/staffService";
import { DEFAULT_AVATAR_URL } from "../types";
import { useTranslation } from "react-i18next";

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

const resolvePilgrimAvatarFromAnySource = (
  code: string,
  passportNumber?: string,
  nameArabic?: string,
  initialAvatar?: string,
): string => {
  if (
    initialAvatar &&
    initialAvatar !== DEFAULT_AVATAR_URL &&
    !initialAvatar.includes("unsplash.com")
  ) {
    return initialAvatar;
  }
  if (typeof window === "undefined") return initialAvatar || DEFAULT_AVATAR_URL;

  try {
    const normCode = code.trim().toUpperCase();

    const rawPilgrims = window.localStorage.getItem("umrah_pilgrims_registry");
    if (rawPilgrims) {
      const list = JSON.parse(rawPilgrims);
      if (Array.isArray(list)) {
        const pMatch = list.find(
          (p: any) =>
            (p.uniqueCode && p.uniqueCode.trim().toUpperCase() === normCode) ||
            (p.id && String(p.id).trim().toUpperCase() === normCode) ||
            (passportNumber &&
              p.passportNumber &&
              p.passportNumber.trim().toUpperCase() ===
                passportNumber.trim().toUpperCase()),
        );
        if (
          pMatch?.avatarUrl &&
          pMatch.avatarUrl !== DEFAULT_AVATAR_URL &&
          !pMatch.avatarUrl.includes("unsplash.com")
        ) {
          return pMatch.avatarUrl;
        }
      }
    }

    const rawPassports = window.localStorage.getItem(
      "umrah_passports_registry",
    );
    if (rawPassports) {
      const passports = JSON.parse(rawPassports);
      if (Array.isArray(passports)) {
        const match = passports.find(
          (p: any) =>
            (passportNumber &&
              p.passportNumber &&
              p.passportNumber.trim().toUpperCase() ===
                passportNumber.trim().toUpperCase()) ||
            (nameArabic &&
              p.fullNameArabic &&
              p.fullNameArabic.trim() === nameArabic.trim()) ||
            (p.id && String(p.id).trim().toUpperCase() === normCode),
        );
        if (
          match?.avatarUrl &&
          match.avatarUrl !== DEFAULT_AVATAR_URL &&
          !match.avatarUrl.includes("unsplash.com")
        ) {
          return match.avatarUrl;
        }
      }
    }
  } catch (e) {
    console.warn("Error resolving avatar from storage:", e);
  }

  return initialAvatar || DEFAULT_AVATAR_URL;
};

export const BadgePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const params = useParams<{ code?: string; id?: string }>();
  const location = useLocation();

  const extractCodeFromAnySource = (): string | undefined => {
    if (params.code && params.code.trim()) return params.code.trim();
    if (params.id && params.id.trim()) return params.id.trim();

    if (location.search) {
      const searchParams = new URLSearchParams(location.search);
      const qCode = searchParams.get("code") || searchParams.get("id");
      if (qCode && qCode.trim()) return qCode.trim();
    }

    if (typeof window !== "undefined" && window.location.hash) {
      const hashSegments = window.location.hash.split("/").filter(Boolean);
      const lastSegment = hashSegments[hashSegments.length - 1];
      if (
        lastSegment &&
        !lastSegment.startsWith("#") &&
        lastSegment.toLowerCase() !== "badge"
      ) {
        return decodeURIComponent(lastSegment.split("?")[0].trim());
      }
    }

    if (typeof window !== "undefined" && window.location.pathname) {
      const pathSegments = window.location.pathname.split("/").filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (lastSegment && lastSegment.toLowerCase() !== "badge") {
        return decodeURIComponent(lastSegment.split("?")[0].trim());
      }
    }

    return undefined;
  };

  const code = extractCodeFromAnySource();
  const [data, setData] = useState<PilgrimLandingData | null>(null);
  const [loading, setLoading] = useState(true);

  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [locationErrorMessage, setLocationErrorMessage] = useState<string>("");
  const [isLocatingAndRedirecting, setIsLocatingAndRedirecting] =
    useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const resolvePilgrimData = async () => {
      setLoading(true);

      if (!code) {
        setLoading(false);
        return;
      }

      const searchCode = code.trim();

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

      let defaultAccompanistName = "نادر قويعة";
      let defaultAccompanistPhone = "25800884";
      let defaultAccompanistRole = "مرافق الرحلة / مرشد ديني";

      const storedRecord = findGeneratedBadgeByCode(searchCode);
      if (storedRecord) {
        const payload =
          typeof storedRecord.payload === "string"
            ? JSON.parse(storedRecord.payload)
            : storedRecord.payload || {};

        const avatar = resolvePilgrimAvatarFromAnySource(
          searchCode,
          payload.passportNumber || storedRecord.uniqueCode,
          storedRecord.pilgrimName || payload.nameArabic,
          payload.avatarUrl,
        );

        setData({
          agencyName:
            storedRecord.payload?.agency || payload.agency || defaultAgencyName,
          agencyPhone: defaultAgencyPhone,
          agencyLogo,
          uniqueCode: storedRecord.uniqueCode,
          nameArabic: storedRecord.pilgrimName || payload.nameArabic || "معتمر",
          nameLatin: payload.nameLatin || "",
          passportNumber: payload.passportNumber || "",
          birthDate: payload.birthDate || "",
          tripName:
            storedRecord.tripName || payload.tripName || "رحلة العمرة المباركة",
          makkahHotel: payload.makkahHotel || "فندق الماسة — مكة المكرمة",
          madinahHotel:
            payload.madinahHotel || "فندق الكيان العالمي — المدينة المنورة",
          accompanistName: storedRecord.guide1Name || defaultAccompanistName,
          accompanistPhone: storedRecord.guide1Phone || defaultAccompanistPhone,
          accompanistRole: defaultAccompanistRole,
          emergencyContact: defaultAgencyPhone,
          status: "مؤكد",
          avatarUrl: avatar,
        });
        setLoading(false);
        return;
      }

      try {
        const pilgrim = await getPilgrimByUniqueCode(searchCode);
        if (pilgrim) {
          try {
            const staffList = await getStaff();
            const tripGuide = staffList.find(
              (s) =>
                s.tripId === pilgrim.tripId || s.tripName === pilgrim.tripName,
            );
            if (tripGuide) {
              defaultAccompanistName = tripGuide.nameArabic;
              defaultAccompanistPhone = tripGuide.whatsapp || tripGuide.phone;
              defaultAccompanistRole = tripGuide.role;
            }
          } catch (e) {
            console.warn("Could not query staff list:", e);
          }

          const avatar = resolvePilgrimAvatarFromAnySource(
            searchCode,
            pilgrim.passportNumber,
            pilgrim.nameArabic,
            pilgrim.avatarUrl,
          );

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
            avatarUrl: avatar,
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
        console.error("Error resolving pilgrim for landing page:", err);
      }

      const fallbackAvatar = resolvePilgrimAvatarFromAnySource(
        searchCode,
        undefined,
        undefined,
        undefined,
      );
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
        avatarUrl: fallbackAvatar,
        status: "مؤكد",
      });
      setLoading(false);
    };

    resolvePilgrimData();
  }, [code, location.pathname, location.search]);

  const cleanPhoneForWhatsApp = (rawPhone?: string): string => {
    if (!rawPhone) return "21625800884";
    const cleaned = rawPhone.trim();
    let digits = cleaned.replace(/\D/g, "");
    if (!digits) return "21625800884";

    if (digits.startsWith("00")) {
      digits = digits.slice(2);
    }

    if (digits.length === 8) {
      return `216${digits}`;
    }
    if (digits.startsWith("05") && digits.length === 10) {
      return `966${digits.slice(1)}`;
    }
    if (
      (digits.startsWith("06") || digits.startsWith("07")) &&
      digits.length === 10
    ) {
      return `33${digits.slice(1)}`;
    }

    return digits;
  };

  const generateWhatsAppUrl = (
    currentCoords?: { latitude: number; longitude: number } | null,
  ): string => {
    const targetPhone = cleanPhoneForWhatsApp(data?.accompanistPhone);

    const pilgrimName = data?.nameArabic || "معتمر";
    const agencyName = data?.agencyName || "مسك طيبة للأسفار و العمرة";
    const accompanistName = data?.accompanistName || "المرافق المسؤول";
    const pilgrimCode = data?.uniqueCode || code || "—";
    const passportLine = data?.passportNumber
      ? `• *رقم الجواز:* ${data.passportNumber}\n`
      : "";
    const tripLine = data?.tripName ? `• *الرحلة:* ${data.tripName}\n` : "";

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
${passportLine}${tripLine}• *الوكالة التابع لها:* ${agencyName}
• *المرافق المسؤول:* ${accompanistName}

${
  locationLink
    ? `📍 *الموقع الجغرافي الحالي عبر خرائط Google:*
${locationLink}`
    : `📍 *تنبيه موقع:* يرجى التواصل لتحديد الموقع وتقديم المساعدة والمتابعة.`
}

الرجاء التواصل لتقديم المساعدة والتنسيق. شكراً جزيلاً.`;

    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(messageText)}`;
  };

  const handleLocateAndSendWhatsApp = () => {
    if (coords) {
      const url = generateWhatsAppUrl(coords);
      window.location.href = url;
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationErrorMessage("خدمة تحديد الموقع غير مدعومة على هذا المتصفح.");
      const url = generateWhatsAppUrl(null);
      window.location.href = url;
      return;
    }

    setIsLocatingAndRedirecting(true);
    setLocationStatus("loading");
    setLocationErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setCoords(newCoords);
        setLocationStatus("success");
        setIsLocatingAndRedirecting(false);
        const url = generateWhatsAppUrl(newCoords);
        window.location.href = url;
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setLocationStatus("error");
        setIsLocatingAndRedirecting(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationErrorMessage(
            "تم رفض إذن الوصول إلى الموقع. سيتم فتح الواتساب بدون الإحداثيات.",
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationErrorMessage(
            "تعذر الحصول على إشارة الموقع الجغرافي حالياً.",
          );
        } else if (error.code === error.TIMEOUT) {
          setLocationErrorMessage(
            "انتهت مهلة انتظار إشارة الـ GPS. سيتم فتح الواتساب الآن.",
          );
        } else {
          setLocationErrorMessage("حدث خطأ أثناء تحديد الموقع الجغرافي.");
        }
        const url = generateWhatsAppUrl(null);
        window.location.href = url;
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 0,
      },
    );
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div
        dir={isAr ? "rtl" : "ltr"}
        className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 font-sans"
      >
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">
          {t("badge.loading_data")}
        </p>
      </div>
    );
  }

  if (!code && !data) {
    return (
      <div
        dir={isAr ? "rtl" : "ltr"}
        className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 font-sans text-center"
      >
        <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-900">{t("badge.missing_code")}</h2>
        <p className="text-sm text-slate-600 mt-1">
          {t("badge.missing_code_desc")}
        </p>
      </div>
    );
  }

  const pilgrimName = data?.nameArabic || "معتمر";
  const agencyName = data?.agencyName || "مسك طيبة للأسفار و العمرة";
  const accompanistName = data?.accompanistName || "نادر قويعة";

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-start p-4 sm:p-6 font-sans selection:bg-emerald-600 selection:text-white"
    >
      <div className="w-full max-w-md space-y-4 my-2 sm:my-4">
        {/* Top Header Card */}
        <header className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
              <img
                src={
                  data?.agencyLogo || `${import.meta.env.BASE_URL}logob.jpeg`
                }
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t("badge.digital_card_title")}</span>
              </div>
              <h2 className="text-sm font-black text-slate-900 truncate">
                {agencyName}
              </h2>
            </div>
          </div>

          <button
            onClick={handleCopyShareLink}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shrink-0"
            title={t("badge.share_link")}
            aria-label={t("badge.share_link")}
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        </header>

        {/* Pilgrim Info Card */}
        <div className="bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/90 space-y-5">
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50/80 to-amber-50/70 border border-emerald-200/80 rounded-2xl p-4 text-center">
            <p className="text-sm leading-relaxed text-slate-800 font-medium">
              {isAr ? (
                <>
                  المعتمر{" "}
                  <span className="font-black text-slate-950 text-base underline decoration-emerald-500 decoration-2">
                    {pilgrimName}
                  </span>{" "}
                  مسجل رسمياً لدى وكالة{" "}
                  <span className="font-bold text-emerald-900">{agencyName}</span>،
                  بمرافقة{" "}
                  <span className="font-black text-emerald-800 text-base">
                    {accompanistName}
                  </span>
                  .
                </>
              ) : (
                <>
                  Le pèlerin{" "}
                  <span className="font-black text-slate-950 text-base underline decoration-emerald-500 decoration-2">
                    {pilgrimName}
                  </span>{" "}
                  est enregistré auprès de l'agence{" "}
                  <span className="font-bold text-emerald-900">{agencyName}</span>,
                  accompagné par{" "}
                  <span className="font-black text-emerald-800 text-base">
                    {accompanistName}
                  </span>
                  .
                </>
              )}
            </p>
          </div>

          {/* Pilgrim Profile Block */}
          <div className="flex items-center gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-white shrink-0 shadow-xs flex items-center justify-center">
              <img
                src={data?.avatarUrl || DEFAULT_AVATAR_URL}
                alt={pilgrimName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;
                }}
              />
            </div>

            <div className="flex-1 min-w-0 text-start">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
                  {data?.status || "معتمر مؤكد"}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-mono text-xs font-bold">
                  {data?.uniqueCode || code}
                </span>
              </div>
              <h1 className="text-lg font-black text-slate-900 truncate mt-1">
                {pilgrimName}
              </h1>
              {data?.nameLatin && (
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide truncate">
                  {data.nameLatin}
                </p>
              )}
              {data?.passportNumber && (
                <p className="text-xs text-slate-600 font-mono mt-0.5">
                  {t("passports.fields.passport_number")}:{" "}
                  <span className="font-bold text-slate-800">
                    {data.passportNumber}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Information Tiles */}
          <div className="grid grid-cols-1 gap-2.5">
            {/* Accompanist Tile */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="text-start">
                  <p className="text-[11px] font-bold text-slate-500">
                    {t("badge.accompanist")}
                  </p>
                  <p className="text-sm font-black text-slate-900">
                    {accompanistName}
                  </p>
                  {data?.accompanistRole && (
                    <p className="text-[11px] text-slate-500">
                      {data.accompanistRole}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>{t("badge.whatsapp_available")}</span>
              </div>
            </div>

            {/* Trip & Hotels Tile */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Hotel className="w-5 h-5" />
                </div>
                <div className="text-start">
                  <p className="text-[11px] font-bold text-slate-500">
                    {t("badge.trip_residence")}
                  </p>
                  <p className="text-xs font-bold text-slate-900">
                    {data?.tripName}
                  </p>
                  {(data?.makkahHotel || data?.madinahHotel) && (
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                      {data.makkahHotel
                        ? data.makkahHotel.split("—")[0].trim()
                        : t("badge.makkah")}{" "}
                      /{" "}
                      {data.madinahHotel
                        ? data.madinahHotel.split("—")[0].trim()
                        : t("badge.madinah")}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs shrink-0">
                {t("badge.makkah_madinah")}
              </span>
            </div>
          </div>
        </div>

        {/* Location & WhatsApp Action */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-start gap-3 text-start">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>{t("badge.help_location")}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 font-bold border border-emerald-200">
                  {t("badge.gps_live")}
                </span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t("badge.help_desc")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLocateAndSendWhatsApp}
            disabled={isLocatingAndRedirecting}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-80 text-white font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            {isLocatingAndRedirecting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
                <span>{t("badge.locating_whatsapp")}</span>
              </>
            ) : (
              <>
                <MessageCircle className="w-5 h-5 text-white shrink-0 fill-white" />
                <span className="truncate">
                  {t("badge.send_location_whatsapp")}
                </span>
              </>
            )}
          </button>

          {coords && locationStatus === "success" && (
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-mono text-[11px] font-bold">
                  {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                </span>
              </div>
              <a
                href={`https://maps.google.com/?q=${coords.latitude},${coords.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>{t("badge.view_map")}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {locationStatus === "error" && locationErrorMessage && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-tight">
                {locationErrorMessage}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-slate-500 text-xs py-4 space-y-1">
          <p className="font-bold text-slate-600">
            {agencyName} — {t("badge.service_guests")}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            {t("badge.unique_code_label")} {data?.uniqueCode || code}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default BadgePage;
