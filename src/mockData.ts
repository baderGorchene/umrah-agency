import { Pilgrim, Staff, Trip, Post, AgencySettings, AppNotification, BadgeTemplate, DEFAULT_AVATAR_URL } from './types';

export const initialAgencySettings: AgencySettings = {
  name: "مسك طيبة للاسفار و السياحة",
  subtitle: "Umrah Compagnon",
  description: "وكالة مسك طيبة للأسفار والعمرة - خدمات متميزة ومرافقة شاملة للمعتمرين من تونس إلى البقاع المقدسة.",
  bannerUrl: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1400&q=80", // Madinah Green Dome / Mosque style
  logoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
  address: "شارع الحبيب بورقيبة، جمّال 5020",
  city: "المنستير / جمّال",
  country: "تونس",
  phone: "+216 73 481 100",
  email: "misktibajammel@gmail.com",
  licenseNumber: "AG-TUN-2026-88"
};

export const initialTrips: Trip[] = [
  {
    id: "trip-1",
    name: "عمرة المولد",
    startDate: "2026-08-22",
    endDate: "2026-09-04",
    makkahHotel: "الماسـة",
    madinahHotel: "الكيان العالمي",
    pilgrimCount: 1,
    guideCount: 1,
    active: true,
    busCount: 1,
    flightDetails: "TU711 Tunis -> Jeddah / TU712 Medina -> Tunis"
  }
];

export const initialPilgrims: Pilgrim[] = [
  {
    id: "pilgrim-1",
    nameArabic: "انوار زقاب",
    nameLatin: "Anouar Zghab",
    phone: "99048168",
    tripId: "trip-1",
    tripName: "عمرة المولد",
    uniqueCode: "YELC9821",
    status: "مؤكد",
    passportNumber: "N2891048",
    avatarUrl: DEFAULT_AVATAR_URL,
    emergencyContact: "+216 99 048 168",
    gender: "F",
    birthDate: "1982-05-14"
  }
];

export const initialStaff: Staff[] = [
  {
    id: "staff-1",
    nameArabic: "نادر قويعة",
    nameLatin: "Nader Kouiaa",
    phone: "25800884",
    whatsapp: "+21625800884",
    role: "Chef de Bus",
    uniqueCode: "KCF32091",
    tripId: "trip-1",
    tripName: "عمرة المولد",
    avatarUrl: DEFAULT_AVATAR_URL
  },
  {
    id: "staff-2",
    nameArabic: "نادر قويعة",
    nameLatin: "Nader Kouiaa (Admin)",
    phone: "25800884",
    whatsapp: "25800884",
    role: "Coordonnateur Administratif",
    uniqueCode: "Q44U8812",
    tripId: "",
    tripName: "—",
    avatarUrl: DEFAULT_AVATAR_URL
  },
  {
    id: "staff-3",
    nameArabic: "كريمة شاكر",
    nameLatin: "Karima Chaker",
    phone: "21805829",
    whatsapp: "21805829",
    role: "Chef de Bus",
    uniqueCode: "FH659912",
    tripId: "",
    tripName: "—",
    avatarUrl: DEFAULT_AVATAR_URL
  },
  {
    id: "staff-4",
    nameArabic: "حنان عطية",
    nameLatin: "Hanan Attia",
    phone: "99048768",
    whatsapp: "99048768",
    role: "Chef de Bus",
    uniqueCode: "3TUA4492",
    tripId: "",
    tripName: "—",
    avatarUrl: DEFAULT_AVATAR_URL
  }
];


export const initialPosts: Post[] = [
  {
    id: "post-1",
    title: "تذكير بموعد الرحلة والمستندات المطلوبة",
    content: "يرجى من جميع معتمري رحلة عمرة المولد تجهيز جوازات السفر والحضور لمقر الوكالة بجمال قبل الموعد بـ 4 ساعات.",
    createdAt: "2026-08-01 10:30",
    tripId: "trip-1",
    tripName: "عمرة المولد",
    notifyPush: true,
    imageUrl: "https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=800&q=80"
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: "notif-1",
    title: "تم تحديث بطاقات QR",
    message: "جاهزية شارات المعتمرين لرحلة عمرة المولد للطباعة والتصدير.",
    time: "منذ 10 دقائق",
    read: false,
    type: "info"
  },
  {
    id: "notif-2",
    title: "تأكيد تسجيل معتمر جديد",
    message: "تم إضافة المعتمر انوار زقاب بنجاح وتعيين الكود YELC9821.",
    time: "منذ ساعة",
    read: false,
    type: "trip"
  }
];

export const badgeTemplates: BadgeTemplate[] = [
  {
    id: "classic",
    name: "Obsidian Classic",
    nameArabic: "الكلاسيكي الأسود",
    description: "Une structure sobre et officielle, parfaite pour les équipes de direction.",
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
    description: "Une ambiance de ville sainte avec des tons vert émeraude apaisants.",
    accentColor: "#0F5132",
    variant: "islamic",
  },
  {
    id: "minimal",
    name: "Pearl Mist",
    nameArabic: "اللؤلؤي الضبابي",
    description: "Un rendu calme et lumineux, idéal pour les impressions professionnelles.",
    accentColor: "#334155",
    variant: "modern",
  },
  {
    id: "royal",
    name: "Midnight Violet",
    nameArabic: "بنفسجي منتصف الليل",
    description: "Une identité élégante et profonde, pensée pour les groupes de prestige.",
    accentColor: "#6D28D9",
    variant: "royal",
  },
  {
    id: "islamic",
    name: "Olive Heritage",
    nameArabic: "الزيتوني التراثي",
    description: "Des motifs raffinés inspirés des trésors culturels de la région.",
    accentColor: "#166534",
    variant: "islamic",
  },
  {
    id: "modern",
    name: "Cobalt Horizon",
    nameArabic: "الأزرق الكوبالت",
    description: "Une composition moderne avec des lignes nettes et un espace respirable.",
    accentColor: "#2563EB",
    variant: "modern",
  },
  {
    id: "elegant",
    name: "Champagne Velvet",
    nameArabic: "الشمبانيا المخملي",
    description: "Un style doux et luxueux avec une touche de sophistication raffinée.",
    accentColor: "#A16207",
    variant: "elegant",
  },
  {
    id: "noir",
    name: "Onyx Prestige",
    nameArabic: "الأسود الأونيكس",
    description: "Un rendu sombre et premium, idéal pour les badges de direction.",
    accentColor: "#0F172A",
    variant: "noir",
  },
  {
    id: "boarding",
    name: "Teal Boarding",
    nameArabic: "التيل الأخضر",
    description: "Structure très lisible, inspirée des cartes d’embarquement premium.",
    accentColor: "#0F766E",
    variant: "boarding",
  },
  {
    id: "atlas",
    name: "Ocean Atlas",
    nameArabic: "الأزرق البحري",
    description: "Des détails cartographiques et une profondeur maritime très soignée.",
    accentColor: "#0F766E",
    variant: "atlas",
  },
  {
    id: "horizon",
    name: "Amber Sunset",
    nameArabic: "الشمري الغروب",
    description: "Des gradients chauds pour donner un aspect dynamique et chaleureux.",
    accentColor: "#EA580C",
    variant: "horizon",
  },
  {
    id: "diplomat",
    name: "Navy Diplomat",
    nameArabic: "الأزرق الداكن الدبلوماسي",
    description: "Un style institutionnel avec une mise en page impeccable et solennelle.",
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
    description: "Une structure élégante avec des lignes architecturales raffinées.",
    accentColor: "#92400E",
    variant: "folio",
  },
  {
    id: "wave",
    name: "Aqua Wave",
    nameArabic: "الأكوا الموجي",
    description: "Des courbes fluides et des reflets très modernes pour un rendu vivant.",
    accentColor: "#0EA5A4",
    variant: "wave",
  },
];
