import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Check, Printer, ShieldCheck } from 'lucide-react';
import { findGeneratedBadgeByCode } from '../services/generatedBadgesService';
import { getPilgrimByUniqueCode } from '../services/pilgrimsService';
import { Pilgrim, DEFAULT_AVATAR_URL, BadgeTemplate, Trip } from '../types';
import { initialPilgrims, badgeTemplates } from '../mockData';
import { buildBadgePublicUrl } from '../lib/qrCode';
import { BadgeArtwork } from './QrCenterView';

interface ExtendedBadgeData {
  agencyName: string;
  uniqueCode: string;
  nameArabic: string;
  nameLatin?: string;
  passportNumber?: string;
  tripName: string;
  avatarUrl?: string;
  guide1Name?: string;
  guide1Phone?: string;
  guide2Name?: string;
  guide2Phone?: string;
  emergencyContact?: string;
  status: Pilgrim['status'];
  template?: BadgeTemplate;
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
      const defaultTemplate = badgeTemplates[0];

      const storedRecord = findGeneratedBadgeByCode(searchCode);
      if (storedRecord) {
        const payload = typeof storedRecord.payload === 'string'
          ? JSON.parse(storedRecord.payload)
          : storedRecord.payload;

        const matchingTemplate = badgeTemplates.find((template) =>
          template.id === storedRecord.templateId ||
          template.name === storedRecord.templateName ||
          template.variant === storedRecord.templateVariant
        ) || defaultTemplate;

        setBadgeData({
          agencyName: payload.agency || 'مسك طيبة للاسفار و السياحة',
          uniqueCode: storedRecord.uniqueCode,
          nameArabic: storedRecord.pilgrimName || payload.nameArabic || 'معتمر',
          nameLatin: payload.nameLatin || '',
          passportNumber: payload.passportNumber || 'N2891048',
          tripName: storedRecord.tripName || payload.tripName || 'عمرة المولد',
          avatarUrl: payload.avatarUrl || DEFAULT_AVATAR_URL,
          guide1Name: storedRecord.guide1Name || 'نادر قويعة',
          guide1Phone: storedRecord.guide1Phone || '25800884',
          guide2Name: storedRecord.guide2Name || 'منير بن صالح',
          guide2Phone: storedRecord.guide2Phone || '98765432',
          status: 'مؤكد',
          template: matchingTemplate,
        });
        setLoading(false);
        return;
      }

      try {
        const pilgrim = await getPilgrimByUniqueCode(searchCode);
        if (pilgrim) {
          const tripTemplate = badgeTemplates.find((template) => template.variant === 'elegant') || defaultTemplate;

          setBadgeData({
            agencyName: 'مسك طيبة للاسفار و السياحة',
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
            status: pilgrim.status || 'مؤكد',
            template: tripTemplate,
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Error resolving pilgrim for badge page:', err);
      }

      const defaultPilgrim = initialPilgrims[0];
      setBadgeData({
        agencyName: 'مسك طيبة للاسفار و السياحة',
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
        status: 'مؤكد',
        template: defaultTemplate,
      });
      setLoading(false);
    };

    resolveBadge();
  }, [code]);

  const publicUrl = useMemo(
    () => buildBadgePublicUrl(badgeData?.uniqueCode || code || 'YELC9821'),
    [badgeData?.uniqueCode, code],
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading || !badgeData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-sm text-slate-300">Chargement du badge…</div>
      </div>
    );
  }

  const selectedTemplate = badgeData.template || badgeTemplates[0];
  const trip: Trip = {
    id: 'public-badge',
    name: badgeData.tripName,
    startDate: '',
    endDate: '',
    makkahHotel: 'الماسـة — مكة المكرمة',
    madinahHotel: 'الكيان العالمي — المدينة المنورة',
    pilgrimCount: 1,
    guideCount: 2,
    active: true,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-amber-400 selection:text-black">
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[440px] space-y-4 relative z-10">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-2 print:hidden">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>بطاقة معتمر رقمية رسمية</span>
          </div>
          <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 text-[10px] font-mono">
            {badgeData.uniqueCode}
          </span>
        </div>

        <div className="rounded-[28px] border border-amber-500/30 bg-white p-2 shadow-2xl print:border-none print:shadow-none">
          <BadgeArtwork
            template={selectedTemplate}
            pilgrim={{
              id: badgeData.uniqueCode,
              nameArabic: badgeData.nameArabic,
              nameLatin: badgeData.nameLatin,
              phone: '00000000',
              tripId: 'public-badge',
              tripName: badgeData.tripName,
              uniqueCode: badgeData.uniqueCode,
              status: badgeData.status,
              passportNumber: badgeData.passportNumber,
              avatarUrl: badgeData.avatarUrl,
              emergencyContact: badgeData.emergencyContact,
            }}
            trip={trip}
            guide1Name={badgeData.guide1Name || 'نادر قويعة'}
            guide1Phone={badgeData.guide1Phone || '25800884'}
            guide2Name={badgeData.guide2Name || 'منير بن صالح'}
            guide2Phone={badgeData.guide2Phone || '98765432'}
            qrPayload={{
              agency: badgeData.agencyName,
              uniqueCode: badgeData.uniqueCode,
              nameArabic: badgeData.nameArabic,
              nameLatin: badgeData.nameLatin,
              passportNumber: badgeData.passportNumber,
              tripName: badgeData.tripName,
              emergencyGuide1: `${badgeData.guide1Name || 'نادر قويعة'} (${badgeData.guide1Phone || '25800884'})`,
              emergencyGuide2: badgeData.guide2Name && badgeData.guide2Phone
                ? `${badgeData.guide2Name} (${badgeData.guide2Phone})`
                : undefined,
            }}
            className="w-full"
          />
        </div>

        <div className="flex gap-2 print:hidden">
          <button
            onClick={handleCopyLink}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-800"
          >
            {copied ? <span className="inline-flex items-center gap-2"><Check className="w-4 h-4" />تم النسخ</span> : <span className="inline-flex items-center gap-2"><Copy className="w-4 h-4" />نسخ الرابط</span>}
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-xl border border-amber-500/70 bg-amber-500 px-3 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
          >
            <span className="inline-flex items-center justify-center gap-2"><Printer className="w-4 h-4" />طباعة</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadgePage;
