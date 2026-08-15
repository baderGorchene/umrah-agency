import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Trash2,
  Check,
  Save,
  MapPin,
  Phone,
  Mail,
  Palette,
  Globe,
  Loader2,
  FileBadge,
  Building2,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Language, AgencySettings } from "../types";
import { useTranslation } from "react-i18next";
import { uploadAgencyImage } from "../services/agencyService";

const TUNISIA_GOVERNORATES: {
  value: string;
  labelAr: string;
  labelFr: string;
}[] = [
  { value: "Tunis", labelAr: "تونس", labelFr: "Tunis" },
  { value: "Ariana", labelAr: "أريانة", labelFr: "Ariana" },
  { value: "Ben Arous", labelAr: "بن عروس", labelFr: "Ben Arous" },
  { value: "Manouba", labelAr: "منوبة", labelFr: "Manouba" },
  { value: "Nabeul", labelAr: "نابل", labelFr: "Nabeul" },
  { value: "Zaghouan", labelAr: "زغوان", labelFr: "Zaghouan" },
  { value: "Bizerte", labelAr: "بنزرت", labelFr: "Bizerte" },
  { value: "Béja", labelAr: "باجة", labelFr: "Béja" },
  { value: "Jendouba", labelAr: "جندوبة", labelFr: "Jendouba" },
  { value: "Le Kef", labelAr: "الكاف", labelFr: "Le Kef" },
  { value: "Siliana", labelAr: "سليانة", labelFr: "Siliana" },
  { value: "Sousse", labelAr: "سوسة", labelFr: "Sousse" },
  { value: "Monastir", labelAr: "المنستير", labelFr: "Monastir" },
  { value: "Mahdia", labelAr: "المهدية", labelFr: "Mahdia" },
  { value: "Sfax", labelAr: "صفاقس", labelFr: "Sfax" },
  { value: "Kairouan", labelAr: "القيروان", labelFr: "Kairouan" },
  { value: "Kasserine", labelAr: "القصرين", labelFr: "Kasserine" },
  { value: "Sidi Bouzid", labelAr: "سيدي بوزيد", labelFr: "Sidi Bouzid" },
  { value: "Gabès", labelAr: "قابس", labelFr: "Gabès" },
  { value: "Medenine", labelAr: "مدنين", labelFr: "Medenine" },
  { value: "Tataouine", labelAr: "تطاوين", labelFr: "Tataouine" },
  { value: "Gafsa", labelAr: "قفصة", labelFr: "Gafsa" },
  { value: "Tozeur", labelAr: "توزر", labelFr: "Tozeur" },
  { value: "Kebili", labelAr: "قبلي", labelFr: "Kebili" },
];

const THEME_SWATCHES: {
  key: string;
  hex: string;
  labelAr: string;
  labelFr: string;
}[] = [
  {
    key: "emerald",
    hex: "#0A5C36",
    labelAr: "أخضر زمردي (طيبة)",
    labelFr: "Vert Émeraude (Taiba)",
  },
  {
    key: "amber",
    hex: "#C5A85D",
    labelAr: "كهرماني إمبراطوري",
    labelFr: "Ambre Impérial",
  },
  {
    key: "royal-blue",
    hex: "#1E3A8A",
    labelAr: "أزرق ملكي",
    labelFr: "Bleu Royal",
  },
  {
    key: "obsidian",
    hex: "#334155",
    labelAr: "أوبسيديان وقار",
    labelFr: "Obsidienne Sombre",
  },
];

const DEFAULT_LOGO_FALLBACK = `${import.meta.env.BASE_URL}logo.jpeg`;

const sanitizeUrl = (url?: string | null): string => {
  if (!url || typeof url !== "string") return "";
  if (url.includes("unsplash.com")) return "";
  return url;
};

interface SettingsViewProps {
  lang?: Language;
  settings: AgencySettings;
  onUpdateSettings: (updated: AgencySettings) => void | Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [formData, setFormData] = useState<AgencySettings>(() => ({
    ...settings,
    bannerUrl: sanitizeUrl(settings.bannerUrl),
    logoUrl: sanitizeUrl(settings.logoUrl),
  }));
  const [governorate, setGovernorate] = useState(settings.governorate || "");
  const [city, setCity] = useState(settings.city || "");
  const [address, setAddress] = useState(settings.address || "");
  const [themeColor, setThemeColor] = useState(
    settings.themeColor || "emerald"
  );
  const [customColor, setCustomColor] = useState(
    settings.customColor || "#0A5C36"
  );
  const [defaultLang, setDefaultLang] = useState<"ar" | "fr">(
    settings.defaultLang || "fr"
  );

  // Status states
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Upload states & refs
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Sync state if initial or refreshed settings change from parent
  useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        bannerUrl: sanitizeUrl(settings.bannerUrl),
        logoUrl: sanitizeUrl(settings.logoUrl),
      });
      setGovernorate(settings.governorate || "");
      setCity(settings.city || "");
      setAddress(settings.address || "");
      setThemeColor(settings.themeColor || "emerald");
      setCustomColor(settings.customColor || "#0A5C36");
      setDefaultLang(settings.defaultLang || "fr");
    }
  }, [settings]);

  const handleSelectTheme = (key: string, hex: string) => {
    setThemeColor(key);
    setCustomColor(hex);
  };

  // Upload Logo handler
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting same file triggers change
    e.target.value = "";

    try {
      setIsUploadingLogo(true);
      setErrorMessage(null);
      const uploadedUrl = await uploadAgencyImage(file, "logo");
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, logoUrl: uploadedUrl }));
      } else {
        setErrorMessage(t("settings.upload_failed"));
      }
    } catch (err) {
      console.error("Error uploading agency logo:", err);
      setErrorMessage(t("settings.upload_failed"));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Upload Banner handler
  const handleBannerFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    try {
      setIsUploadingBanner(true);
      setErrorMessage(null);
      const uploadedUrl = await uploadAgencyImage(file, "banner");
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, bannerUrl: uploadedUrl }));
      } else {
        setErrorMessage(t("settings.upload_failed"));
      }
    } catch (err) {
      console.error("Error uploading agency banner:", err);
      setErrorMessage(t("settings.upload_failed"));
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleRemoveBanner = () => {
    setFormData((prev) => ({ ...prev, bannerUrl: "" }));
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const updatedPayload: AgencySettings = {
      ...formData,
      address,
      governorate,
      city,
      country: "Tunisie",
      themeColor,
      customColor,
      defaultLang,
    };

    try {
      await onUpdateSettings(updatedPayload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error("Failed to save agency settings:", err);
      setErrorMessage(t("settings.save_error"));
    } finally {
      setIsSaving(false);
    }
  };

  const currentLogo = formData.logoUrl || DEFAULT_LOGO_FALLBACK;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Hidden file inputs for uploading */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleLogoFileChange}
        className="hidden"
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleBannerFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
          <Building2 className="w-3.5 h-3.5 text-slate-600" />
          <span>{formData.name || t("settings.agency_profile_title")}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t("settings.agency_profile_title")}
        </h1>
        <p className="text-xs text-slate-500 font-medium max-w-lg mx-auto">
          {t("settings.agency_profile_subtitle")}
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-3 text-red-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Section 1: General Profile & Media */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                {t("settings.agency_profile")}
              </span>
              {formData.licenseNumber && (
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {formData.licenseNumber}
                </span>
              )}
            </h2>

            {/* Banner Upload / Preview Area */}
            <div className="space-y-2 text-start">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  {t("settings.agency_banner")}
                </label>
                <span className="text-[10px] text-slate-400">
                  {t("settings.banner_recommendation")}
                </span>
              </div>

              {formData.bannerUrl ? (
                <div className="relative rounded-2xl overflow-hidden h-44 sm:h-52 border border-slate-200 bg-slate-900 group shadow-inner">
                  <img
                    src={formData.bannerUrl}
                    alt="Agency Banner"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/30 flex flex-col justify-end p-4 opacity-90 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        disabled={isUploadingBanner}
                        onClick={() => bannerInputRef.current?.click()}
                        className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingBanner ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-slate-700" />
                        )}
                        <span>
                          {isUploadingBanner
                            ? t("settings.uploading")
                            : t("settings.change_banner")}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={isUploadingBanner}
                        onClick={handleRemoveBanner}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t("settings.remove_banner")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className="relative rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/70 hover:bg-slate-100/80 transition-all p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px] group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-400 group-hover:text-slate-700 group-hover:scale-105 transition-all mb-3">
                    {isUploadingBanner ? (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 mb-1">
                    {isUploadingBanner
                      ? t("settings.uploading")
                      : t("settings.upload_banner")}
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm">
                    {t("settings.click_to_upload_banner")}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-2 font-mono">
                    {t("settings.banner_recommendation")}
                  </span>
                </div>
              )}
            </div>

            {/* Logo Upload Area */}
            <div className="space-y-2 text-start pt-2">
              <label className="text-xs font-bold text-slate-700 block">
                {t("settings.agency_logo")}
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-white border border-slate-200 p-2 shrink-0 flex items-center justify-center shadow-xs">
                  {isUploadingLogo ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
                      <span className="text-[10px]">{t("settings.uploading")}</span>
                    </div>
                  ) : (
                    <img
                      src={currentLogo}
                      alt="Agency Logo"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_LOGO_FALLBACK;
                      }}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={isUploadingLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="bg-black hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isUploadingLogo
                          ? t("settings.uploading")
                          : t("settings.change_logo")}
                      </span>
                    </button>

                    {formData.logoUrl && (
                      <button
                        type="button"
                        disabled={isUploadingLogo}
                        onClick={handleRemoveLogo}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t("settings.remove_logo")}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {t("settings.logo_recommendation")}
                  </p>
                </div>
              </div>
            </div>

            {/* Official Agency Fields */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-start">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t("settings.agency_name")}</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="مثال: مسك طيبة للعمرة والزيارة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold text-start focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-start">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t("settings.agency_subtitle")}</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    placeholder="مثال: وكالة أسفار وخدمات العمرة والحج"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 text-start focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 text-start sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileBadge className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t("settings.license_number")}</span>
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        licenseNumber: e.target.value,
                      })
                    }
                    placeholder="Licence ONTT / MF"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 text-start focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5 text-start sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t("settings.phone")}</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+216 71 000 000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 text-start focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5 text-start sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t("settings.email")}</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="contact@agency.tn"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 text-start focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-start relative">
                <label className="text-xs font-bold text-slate-700">
                  {t("settings.agency_description")}
                </label>
                <div className="relative">
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value.slice(0, 500),
                      })
                    }
                    rows={3}
                    placeholder="اكتب نبذة مختصرة عن الوكالة ورؤيتها في خدمة ضيوف الرحمن..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 text-start focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white resize-none transition-all"
                  />
                  <span className="absolute bottom-2.5 right-3 text-[10px] font-mono text-slate-400 bg-slate-50/80 px-1.5 py-0.5 rounded border border-slate-200/50">
                    {formData.description.length} / 500
                  </span>
                </div>
              </div>

              {/* Location Section */}
              <div className="border-t border-slate-100 pt-5 mt-3 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {t("settings.location")}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 text-start">
                    <label className="text-xs font-semibold text-slate-700 block">
                      {t("settings.country")}
                    </label>
                    <input
                      type="text"
                      value={isAr ? "تونس (Tunisie)" : "Tunisie"}
                      disabled
                      readOnly
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-600 text-start cursor-not-allowed font-medium"
                    />
                  </div>

                  <div className="space-y-1.5 text-start">
                    <label className="text-xs font-semibold text-slate-700 block">
                      {t("settings.governorate")}
                    </label>
                    <select
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 text-start focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all font-medium"
                    >
                      <option value="">
                        {t("settings.select_governorate")}
                      </option>
                      {TUNISIA_GOVERNORATES.map((g) => (
                        <option key={g.value} value={g.value}>
                          {isAr ? g.labelAr : g.labelFr} (
                          {isAr ? g.labelFr : g.labelAr})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 text-start">
                    <label className="text-xs font-semibold text-slate-700 block">
                      {t("settings.city")}
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="مثال: المنار، لافايات، صفاقس المدينة..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-start">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t("settings.street_address")}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="شارع الحبيب بورقيبة، عمارة البركة، الطابق 3..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Visual Identity & Theme */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-slate-500" />
              {t("settings.visual_identity")}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEME_SWATCHES.map((swatch) => {
                const isSelected = themeColor === swatch.key;
                return (
                  <button
                    key={swatch.key}
                    type="button"
                    onClick={() => handleSelectTheme(swatch.key, swatch.hex)}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-black ring-2 ring-black/15 bg-slate-50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-full border border-black/10 shadow-xs shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {isSelected && (
                        <Check className="w-4 h-4 text-white drop-shadow-xs" />
                      )}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-800 text-center leading-tight">
                      {isAr ? swatch.labelAr : swatch.labelFr}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 text-start pt-2">
              <label className="text-xs font-semibold text-slate-700 block">
                {t("settings.custom_color")}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setThemeColor("custom");
                  }}
                  className="w-12 h-10 rounded-xl border border-slate-200 cursor-pointer shrink-0 bg-white p-1"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setThemeColor("custom");
                  }}
                  maxLength={7}
                  className="w-full max-w-[200px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-start focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white uppercase font-bold"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-1.5 text-start">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                {t("settings.default_language")}
              </h3>
              <select
                value={defaultLang}
                onChange={(e) => setDefaultLang(e.target.value as "ar" | "fr")}
                className="w-full sm:max-w-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 text-start focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white font-medium"
              >
                <option value="ar">{t("settings.lang_ar")}</option>
                <option value="fr">{t("settings.lang_fr")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {savedSuccess && (
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{t("settings.saved_success")}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || isUploadingLogo || isUploadingBanner}
            className="w-full sm:w-auto min-w-[240px] bg-black hover:bg-slate-900 active:scale-[0.99] text-white font-bold py-3 px-8 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {isSaving ? t("settings.saving") : t("settings.save_changes")}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
