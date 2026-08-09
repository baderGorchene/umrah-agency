import React, { useState } from "react";
import {
  Upload,
  Trash2,
  Check,
  Save,
  MapPin,
  Phone,
  Mail,
  Building,
  Palette,
  Globe,
} from "lucide-react";
import { Language, AgencySettings } from "../types";

// NOTE: the HTML reference page ("Umrah Compagnon — Portail Agence") stores a few
// extra fields on the agency profile that don't exist on AgencySettings yet
// (governorate, city, country, theme color, custom brand color, default language).
// They're tracked here as local state and merged into the object handed to
// onUpdateSettings — extend the AgencySettings type with these fields to persist
// them properly.
interface ExtendedSettingsFields {
  governorate?: string;
  city?: string;
  country?: string;
  themeColor?: string;
  customColor?: string;
  defaultLang?: "ar" | "fr";
}

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
    labelAr: "أخضر زمردي",
    labelFr: "Vert Émeraude",
  },
  {
    key: "amber",
    hex: "#C5A85D",
    labelAr: "كهرماني إمبراطوري",
    labelFr: "Ambre Impérial",
  },
  {
    key: "royal-blue",
    hex: "#1e3a8a",
    labelAr: "أزرق ملكي",
    labelFr: "Bleu Royal",
  },
  {
    key: "obsidian",
    hex: "#334155",
    labelAr: "أوبسيديان داكن",
    labelFr: "Obsidienne Sombre",
  },
];

interface SettingsViewProps {
  lang: Language;
  settings: AgencySettings;
  onUpdateSettings: (updated: AgencySettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  lang,
  settings,
  onUpdateSettings,
}) => {
  const isAr = lang === "AR";
  const [formData, setFormData] = useState<AgencySettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Extra fields not (yet) on AgencySettings — see note above.
  const extended = settings as AgencySettings & ExtendedSettingsFields;
  const [governorate, setGovernorate] = useState(extended.governorate || "");
  const [city, setCity] = useState(extended.city || "");
  const [themeColor, setThemeColor] = useState(
    extended.themeColor || "emerald",
  );
  const [customColor, setCustomColor] = useState(
    extended.customColor || "#000000",
  );
  const [defaultLang, setDefaultLang] = useState<"ar" | "fr">(
    extended.defaultLang || "fr",
  );

  const handleSelectTheme = (key: string, hex: string) => {
    setThemeColor(key);
    setCustomColor(hex);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...formData,
      governorate,
      city,
      country: "Tunisie",
      themeColor,
      customColor,
      defaultLang,
    } as AgencySettings & ExtendedSettingsFields);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isAr ? "إعدادات وهيئة الوكالة" : "Configuration & Identité"}
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {isAr
            ? "إدارة معلومات الوكالة وشعارها ولون التمييز الرئيسي."
            : "Gérez les informations de l'agence, votre logo et configurez la couleur d'accentuation."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vertically Stacked Container */}
        <div className="grid grid-cols-1 gap-6">
          {/* Section 1: General Profile */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              {isAr ? "الملف العام للوكالة" : "Profil Général de l'Agence"}
            </h2>

            {/* Banner Upload / Preview Area */}
            <div className="space-y-2 text-start">
              <label className="text-xs font-bold text-slate-700 block">
                {isAr ? "غلاف الوكالة" : "Bannière de l'Agence"}
              </label>
              <div className="relative rounded-2xl overflow-hidden h-40 border border-slate-200 bg-slate-100 shadow-inner">
                <img
                  src={formData.bannerUrl}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    className="bg-white/90 hover:bg-white text-slate-900 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {isAr ? "تحميل صورة الغلاف" : "Télécharger Bannière"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        bannerUrl:
                          "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
                      })
                    }
                    className="bg-red-600/90 hover:bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isAr ? "حذف الغلاف" : "Supprimer"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Logo Upload Area */}
            <div className="space-y-2 text-start">
              <label className="text-xs font-bold text-slate-700 block">
                {isAr ? "شعار الوكالة (Logo)" : "Logo de l'Agence"}
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-black border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold text-sm shadow-md shrink-0">
                  <span className="font-serif leading-none text-center">
                    مسك
                    <br />
                    طيبة
                  </span>
                </div>
                <div>
                  <button
                    type="button"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {isAr ? "تغيير الشعار" : "Télécharger Nouveau Logo"}
                    </span>
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isAr
                      ? "يُنصح بخلفية شفافة (150×150 بكسل)"
                      : "Arrière-plan transparent recommandé (150*150px)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Text Fields */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {isAr ? "اسم الوكالة *" : "Nom de l'Agence *"}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={
                    isAr
                      ? "مثال: وكالة النور للحج والعمرة"
                      : "Ex: Agence En-Nour de Hajj & Umrah"
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  required
                />
              </div>

              <div className="space-y-1 text-start relative">
                <label className="text-xs font-semibold text-slate-700">
                  {isAr ? "وصف الوكالة" : "Description de l'Agence"}
                </label>
                <div className="relative">
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value.slice(0, 300),
                      })
                    }
                    rows={3}
                    placeholder={
                      isAr
                        ? "...وصف قصير للوكالة يظهر للمعتمرين على شاشاتهم"
                        : "Description courte de l'agence..."
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 text-start focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-slate-400 bg-slate-50 px-1 rounded">
                    {formData.description.length} / 300
                  </span>
                </div>
              </div>

              {/* Location Section */}
              <div className="border-t border-slate-100 pt-4 mt-2 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {isAr ? "مقر وموقع الوكالة" : "Localisation de l'Agence"}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-start">
                    <label className="text-xs font-semibold text-slate-700 block">
                      {isAr ? "الدولة" : "Pays"}
                    </label>
                    <input
                      type="text"
                      value={isAr ? "تونس (Tunisia)" : "Tunisie"}
                      disabled
                      readOnly
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 text-start cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1 text-start">
                    <label className="text-xs font-semibold text-slate-700 block">
                      {isAr ? "الولاية (المنطقة)" : "Gouvernorat"}
                    </label>
                    <select
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                    >
                      <option value="">
                        {isAr
                          ? "-- اختر الولاية --"
                          : "-- Sélectionner le gouvernorat --"}
                      </option>
                      {TUNISIA_GOVERNORATES.map((g) => (
                        <option key={g.value} value={g.value}>
                          {isAr ? g.labelAr : g.labelFr} (
                          {isAr ? g.labelFr : g.labelAr})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {isAr ? "المدينة (اختياري)" : "Ville (optionnel)"}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={isAr ? "مثال: الحمامات" : "Ex: Hammamet"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {isAr ? "رقم هاتف الوكالة" : "N° Téléphone International"}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+966 12 345 6789"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {isAr
                    ? "البريد الإلكتروني الرسمي"
                    : "E-mail Support Opérationnel"}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="ops@agency.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Visual Identity & Theme */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-slate-500" />
              {isAr ? "الهوية البصرية والسمة" : "Identité Visuelle & Thème"}
            </h2>
            <p className="text-xs text-slate-500 -mt-2">
              {isAr
                ? "اختر اللون المهيمن للنظام الذي يتم تطبيقه فورا على لوحة التحكم:"
                : "Choisissez la couleur dominante du système appliquée immédiatement sur le tableau de bord :"}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEME_SWATCHES.map((swatch) => {
                const isSelected = themeColor === swatch.key;
                return (
                  <button
                    key={swatch.key}
                    type="button"
                    onClick={() => handleSelectTheme(swatch.key, swatch.hex)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-black ring-2 ring-black/10 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">
                      {isAr ? swatch.labelAr : swatch.labelFr}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 text-start pt-2">
              <label className="text-xs font-semibold text-slate-700 block">
                {isAr
                  ? "لون مخصص للوكالة"
                  : "Couleur personnalisée de l'agence"}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-11 h-10 rounded-lg border border-slate-200 cursor-pointer shrink-0 bg-white p-1"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  maxLength={7}
                  placeholder="#0A5C36"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-1.5 text-start">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                {isAr ? "اللغة الافتراضية" : "Langue par défaut"}
              </h3>
              <select
                value={defaultLang}
                onChange={(e) => setDefaultLang(e.target.value as "ar" | "fr")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 text-start focus:outline-none focus:ring-2 focus:ring-black/5"
              >
                <option value="ar">Arabe (RTL)</option>
                <option value="fr">Français (LTR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Footer - Centered */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>
                {isAr
                  ? "تم حفظ التعديلات بنجاح!"
                  : "Modifications enregistrées avec succès !"}
              </span>
            </span>
          )}
          <button
            type="submit"
            className="w-full sm:w-auto min-w-[220px] bg-black hover:bg-slate-900 text-white font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Save className="w-4 h-4" />
            <span>{isAr ? "حفظ التغييرات" : "Enregistrer Configurations"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
