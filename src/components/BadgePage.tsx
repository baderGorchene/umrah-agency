import React, { useEffect, useState } from 'react';
import { useParams } from 'react';
import { Phone, MapPin, Building, ShieldCheck, QrCode as QrIcon, Copy, Check, Printer, User, ArrowLeft } from 'lucide-react';
import { QRCodeView } from './QRCodeView';
import { findGeneratedBadgeByCode } from '../services/generatedBadgesService';
import { getPilgrimByUniqueCode } from '../services/pilgrimsService';
import { Pilgrim, DEFAULT_AVATAR_URL } from '../types';
import { initialPilgrims } from '../mockData';
import { buildBadgePublicUrl } from '../lib/qrCode';

interface ExtendedBadgeData {
  agencyName: string;
  uniqueCode: string;
  nameArabic: string;
  nameLatin?: string;
  passportNumber?: string;
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
      const searchCode = (code || 'YELC9821').trim();

      // 1) Check localStorage saved generated badges
      const storedRecord = findGeneratedBadgeByCode(searchCode);
      if (storedRecord) {
        const payload = typeof storedRecord.payload === 'string'
          ? JSON.parse(storedRecord.payload)
          : storedRecord.payload;

        setBadgeData({
          agencyName: payload.agency || 'مسك طيبة للعمرة',
          uniqueCode: storedRecord.uniqueCode,
          nameArabic: storedRecord.pilgrimName || payload.nameArabic || 'معتمر',
          nameLatin: payload.nameLatin || '',
          passportNumber: payload.passportNumber || 'N2891048',
          tripName: storedRecord.tripName || payload.tripName || 'عمرة المولد',
          guide1Name: storedRecord.guide1Name || 'نادر قويعة',
          guide1Phone: storedRecord.guide1Phone || '25800884',
          guide2Name: storedRecord.guide2Name || 'منير بن صالح',
          guide2Phone: storedRecord.guide2Phone || '98765432',
          makkahHotel: 'الماسـة — مكة المكرمة',
          madinahHotel: 'الكيان العالمي — المدينة المنورة',
          status: 'مؤكد',
        });
        setLoading(false);
        return;
      }

      // 2) Query database / mock pilgrims
      try {
        const pilgrim = await getPilgrimByUniqueCode(searchCode);
        if (pilgrim) {
          setBadgeData({
            agencyName: 'مسك طيبة للعمرة',
            uniqueCode: pilgrim.uniqueCode,
            nameArabic: pilgrim.nameArabic,
            nameLatin: pilgrim.nameLatin || '',
            passportNumber: pilgrim.passportNumber || 'N2891048',
            tripName: pilgrim.tripName || 'عمرة المولد',
            avatarUrl: pilgrim.avatarUrl || DEFAULT_AVATAR_URL,
            emergencyContact: pilgrim.emergencyContact || '+216 73 481 100',
            guide1Name: 'نادر قويعة',
            guide1Phone: '25800884',
            guide2Name: 'منير بن صالح',
            guide2Phone: '98765432',
            makkahHotel: 'الماسـة — مكة المكرمة',
            madinahHotel: 'الكيان العالمي — المدينة المنورة',
            status: pilgrim.status || 'مؤكد',
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Error resolving pilgrim for badge page:', err);
      }

      // 3) Fallback to default initial pilgrim
      const defaultPilgrim = initialPilgrims[0];
      setBadgeData({
        agencyName: 'مسك طيبة للعمرة',
        uniqueCode: searchCode.toUpperCase(),
        nameArabic: defaultPilgrim.nameArabic,
        nameLatin: defaultPilgrim.nameLatin,
        passportNumber: defaultPilgrim.passportNumber,
        tripName: defaultPilgrim.tripName,
        avatarUrl: defaultPilgrim.avatarUrl || DEFAULT_AVATAR_URL,
        guide1Name: 'نادر قويعة (رئيس الحافلة)',
        guide1Phone: '25800884',
        guide2Name: 'منير بن صالح (المؤطر الديني)',
        guide2Phone: '98765432',
        makkahHotel: 'الماسـة — مكة المكرمة',
        madinahHotel: 'الكيان العالمي — المدينة المنورة',
        status: 'مؤكد',
      });
      setLoading(false);
    };

    resolveBadge();
  }, [code]);

  const publicUrl = buildBadgePublicUrl(badgeData?.uniqueCode || code || 'YELC9821');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-amber-400 selection:text-black">
      {/* Glow overlays */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-lg space-y-4 relative z-10">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-2 print:hidden">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>بطاقة معتمر رقمية رسمية</span>
          </div>
          <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 text-[10px] font-mono">
            {badgeData?.uniqueCode || code}
          </span>
        </div>

        {/* The Badge Artwork Document */}
        <div className="bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 print:border-none print:shadow-none">
          {/* Top Header Gradient */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 p-6 text-slate-950 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
            
            <div className="relative z-10 space-y-1">
              <div className="w-12 h-12 bg-slate-950 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg border border-amber-300/40 font-serif font-bold text-xs">
                <span className="leading-none text-center">مسك<br/>طيبة</span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-950 pt-1">
                {badgeData?.agencyName || 'مسك طيبة للعمرة'}
              </h1>
              <p className="text-[11px] font-semibold tracking-widest uppercase text-slate-900 opacity-90">
                Umrah Compagnon — Pass Officiel
              </p>
            </div>
          </div>

          {/* Body Section */}
          <div className="p-6 space-y-6 bg-slate-50">
            {/* Pilgrim Avatar & Primary Details */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="relative">
                <img
                  src={badgeData?.avatarUrl || DEFAULT_AVATAR_URL}
                  alt="Pilgrim Avatar"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-md bg-slate-100"
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  ✓ {badgeData?.status || 'مؤكد'}
                </span>
              </div>

              <div className="text-center sm:text-start space-y-1 flex-1">
                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                  {badgeData?.nameArabic || 'انوار زقاب'}
                </h2>
                {badgeData?.nameLatin && (
                  <p className="text-xs font-bold text-slate-600 font-serif">
                    {badgeData.nameLatin}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-[11px]">
                  <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-md border border-amber-200 font-mono">
                    الكود: {badgeData?.uniqueCode}
                  </span>
                  {badgeData?.passportNumber && (
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                      جواز: {badgeData.passportNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Trip & Hotels Info */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-500">{badgeData?.agencyName}</span>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {badgeData?.tripName || 'عمرة المولد'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 block">فندق مكة المكرمة</span>
                  <p className="font-bold text-slate-800 truncate">{badgeData?.makkahHotel || 'الماسـة'}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 block">فندق المدينة المنورة</span>
                  <p className="font-bold text-slate-800 truncate">{badgeData?.madinahHotel || 'الكيان العالمي'}</p>
                </div>
              </div>
            </div>

            {/* Emergency Hotline & Spiritual Guide Calls */}
            <div className="bg-emerald-950 text-emerald-100 p-4 rounded-2xl shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  <span>طوارئ ومرافقي الرحلة</span>
                </span>
                <span className="text-[10px] bg-emerald-900 px-2 py-0.5 rounded text-emerald-300">اتصال مباشر 24/7</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <a
                  href={`tel:${badgeData?.guide1Phone || '25800884'}`}
                  className="bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-700/60 p-2.5 rounded-xl flex items-center justify-between text-white transition-all group cursor-pointer"
                >
                  <div className="truncate">
                    <p className="font-bold text-amber-300 text-xs truncate">{badgeData?.guide1Name || 'نادر قويعة'}</p>
                    <p className="text-[10px] text-emerald-300 font-mono">{badgeData?.guide1Phone || '25800884'}</p>
                  </div>
                  <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2 py-1 rounded-lg group-hover:scale-105 transition-transform">
                    📞 اتصل
                  </span>
                </a>

                <a
                  href={`tel:${badgeData?.guide2Phone || '98765432'}`}
                  className="bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-700/60 p-2.5 rounded-xl flex items-center justify-between text-white transition-all group cursor-pointer"
                >
                  <div className="truncate">
                    <p className="font-bold text-amber-300 text-xs truncate">{badgeData?.guide2Name || 'منير بن صالح'}</p>
                    <p className="text-[10px] text-emerald-300 font-mono">{badgeData?.guide2Phone || '98765432'}</p>
                  </div>
                  <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2 py-1 rounded-lg group-hover:scale-105 transition-transform">
                    📞 اتصل
                  </span>
                </a>
              </div>
            </div>

            {/* QR Verification Center */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <QRCodeView payload={publicUrl} size={150} />
              </div>
              <p className="text-[11px] font-bold text-slate-700">
                رمز التحقق والتصديق الرقمي للمعتمر
              </p>
              <p className="text-[10px] text-slate-400 font-mono break-all max-w-xs">
                {publicUrl}
              </p>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="bg-slate-900 text-slate-400 p-3 text-center text-[10px] font-mono border-t border-slate-800">
            مسك طيبة للعمرة — Umrah Compagnon v2.4 • Verified Pass
          </div>
        </div>

        {/* Action Buttons for User on Mobile/Desktop */}
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
