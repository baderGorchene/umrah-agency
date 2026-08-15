export type Language = 'FR' | 'AR';
export type UserRole = 'admin' | 'agent' | 'pilgrim';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  tripId?: string;
  createdAt?: string;
}

export interface AuthState {
  user: UserProfile | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  role: UserRole;
  loading: boolean;
}

export const DEFAULT_AVATAR_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><rect width="128" height="128" rx="64" fill="%23E2E8F0"/><circle cx="64" cy="46" r="22" fill="%2364748B"/><path d="M28 106c0-19.882 16.118-36 36-36s36 16.118 36 36Z" fill="%2364748B"/></svg>`;

export type NavTab = 
  | 'dashboard'
  | 'pilgrims'
  | 'passports'
  | 'staff'
  | 'trips'
  | 'qr-center'
  | 'documents'
  | 'news'
  | 'settings';

export interface PassportEntry {
  id: string;
  fullNameArabic: string; // Nom complet Ar
  fullNameLatin: string; // Nom complet
  gender: 'M' | 'F' | string; // GENRE
  passportNumber: string; // N passeport
  birthDate: string; // Date Naiss
  deliberationDate: string; // DATE D DÉLIBÉRATION (Issue Date)
  expiryDate: string; // DATE D EXPIRATION
  cinNumber?: string;
  nationality?: string;
  placeOfBirth?: string;
  issuingAuthority?: string;
  avatarUrl?: string;
  scannedAt?: string;
  notes?: string;
}

export interface Pilgrim {
  id: string;
  nameArabic: string;
  nameLatin?: string;
  phone: string;
  tripId: string;
  tripName: string;
  uniqueCode: string;
  status: 'مؤكد' | 'في الانتظار' | 'ملغى';
  passportNumber?: string;
  avatarUrl?: string;
  emergencyContact?: string;
  gender?: 'M' | 'F';
  birthDate?: string;
  paidAmount?: number;
  unpaidAmount?: number;
}

export type StaffRole = 'رئيس مجموعة' | 'شيخ' | 'مرافق(ة)';

export interface Staff {
  id: string;
  nameArabic: string;
  nameLatin?: string;
  phone: string;
  whatsapp: string;
  role: StaffRole;
  uniqueCode: string;
  tripId?: string;
  tripName?: string;
  avatarUrl?: string;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  makkahHotel: string;
  madinahHotel: string;
  pilgrimCount: number;
  guideCount: number;
  active: boolean;
  busCount?: number;
  flightDetails?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  tripId: string;
  tripName: string;
  createdAt: string;
  notifyPush: boolean;
}

export interface AgencySettings {
  name: string;
  subtitle: string;
  description: string;
  bannerUrl: string;
  logoUrl: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  licenseNumber: string;
  governorate?: string;
  themeColor?: string;
  customColor?: string;
  defaultLang?: 'ar' | 'fr';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'sos' | 'info' | 'document' | 'trip';
}

export interface BadgeTemplate {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  accentColor: string;
  variant: string;
  isPopular?: boolean;
}

export interface GeneratedBadgeRecord {
  id?: string;
  tripId: string;
  tripName: string;
  pilgrimId: string;
  pilgrimName: string;
  uniqueCode: string;
  templateId: string;
  templateName: string;
  templateVariant: string;
  accentColor: string;
  guide1Name: string;
  guide1Phone: string;
  guide2Name: string;
  guide2Phone: string;
  pageUrl?: string;
  qrCodeDataUrl?: string;
  payload: Record<string, unknown>;
  createdAt?: string;
}
