import {
  Pilgrim,
  Staff,
  Trip,
  Post,
  AgencySettings,
  AppNotification,
  BadgeTemplate,
  PassportEntry,
} from "./types";

export const initialAgencySettings: AgencySettings = {
  name: "",
  subtitle: "",
  description: "",
  bannerUrl: "",
  logoUrl: "",
  address: "",
  city: "",
  country: "",
  phone: "",
  email: "",
  licenseNumber: "",
};

export const initialTrips: Trip[] = [];

export const initialPilgrims: Pilgrim[] = [];

export const initialStaff: Staff[] = [];

export const initialPosts: Post[] = [];

export const initialNotifications: AppNotification[] = [];

export const badgeTemplates: BadgeTemplate[] = [
  {
    id: "classic",
    name: "Obsidian Classic",
    nameArabic: "الكلاسيكي الأسود",
    description:
      "Une structure sobre et officielle, parfaite pour les équipes de direction.",
    accentColor: "#111827",
    variant: "classic",
    isPopular: true,
  },
  {
    id: "gold",
    name: "Saffron Royal",
    nameArabic: "الذهبي الملكي",
    description: "Des reflets dorés et un cadrage VIP pour les badges premium.",
    accentColor: "#D4AF37",
    variant: "royal",
  },
  {
    id: "emerald",
    name: "Emerald Taiba",
    nameArabic: "الزمردي الطيباني",
    description:
      "Une ambiance de ville sainte avec des tons vert émeraude apaisants.",
    accentColor: "#0F5132",
    variant: "islamic",
  },
  {
    id: "minimal",
    name: "Pearl Mist",
    nameArabic: "اللؤلؤي الضبابي",
    description:
      "Un rendu calme et lumineux, idéal pour les impressions professionnelles.",
    accentColor: "#334155",
    variant: "modern",
  },
  {
    id: "royal",
    name: "Midnight Violet",
    nameArabic: "بنفسجي منتصف الليل",
    description:
      "Une identity élégante et profonde, pensée pour les groupes de prestige.",
    accentColor: "#6D28D9",
    variant: "royal",
  },
  {
    id: "islamic",
    name: "Olive Heritage",
    nameArabic: "الزيتوني التراثي",
    description:
      "Des motifs raffinés inspirés des trésors culturels de la région.",
    accentColor: "#166534",
    variant: "islamic",
  },
  {
    id: "modern",
    name: "Cobalt Horizon",
    nameArabic: "الأزرق الكوبالت",
    description:
      "Une composition moderne avec des lignes nettes et un espace respirable.",
    accentColor: "#2563EB",
    variant: "modern",
  },
  {
    id: "elegant",
    name: "Champagne Velvet",
    nameArabic: "الشمبانيا المخملي",
    description:
      "Un style doux et luxueux avec une touche de sophistication raffinée.",
    accentColor: "#A16207",
    variant: "elegant",
  },
  {
    id: "noir",
    name: "Onyx Prestige",
    nameArabic: "الأسود الأونيكس",
    description:
      "Un rendu sombre et premium, idéal pour les badges de direction.",
    accentColor: "#0F172A",
    variant: "noir",
  },
  {
    id: "boarding",
    name: "Teal Boarding",
    nameArabic: "التيل الأخضر",
    description:
      "Structure très lisible, inspirée des cartes d’embarquement premium.",
    accentColor: "#0F766E",
    variant: "boarding",
  },
  {
    id: "atlas",
    name: "Ocean Atlas",
    nameArabic: "الأزرق البحري",
    description:
      "Des détails cartographiques et une profondeur maritime très soignée.",
    accentColor: "#0F766E",
    variant: "atlas",
  },
  {
    id: "horizon",
    name: "Amber Sunset",
    nameArabic: "الشمري الغروب",
    description:
      "Des gradients chauds pour donner un aspect dynamique et chaleureux.",
    accentColor: "#EA580C",
    variant: "horizon",
  },
  {
    id: "diplomat",
    name: "Navy Diplomat",
    nameArabic: "الأزرق الداكن الدبلوماسي",
    description:
      "Un style institutionnel avec une mise en page impeccable et solennelle.",
    accentColor: "#1E3A8A",
    variant: "diplomat",
  },
  {
    id: "prism",
    name: "Lilac Prism",
    nameArabic: "الأرجواني البلوري",
    description: "Des accents lumineux et irisés pour une touche très premium.",
    accentColor: "#7C3AED",
    variant: "prism",
  },
  {
    id: "folio",
    name: "Copper Folio",
    nameArabic: "النحاسي المجلد",
    description:
      "Une structure élégante with des lignes architecturales raffinées.",
    accentColor: "#92400E",
    variant: "folio",
  },
  {
    id: "wave",
    name: "Aqua Wave",
    nameArabic: "الأكوا الموجي",
    description:
      "Des courbes fluides et des reflets très modernes pour un rendu vivant.",
    accentColor: "#0EA5A4",
    variant: "wave",
  },
];
