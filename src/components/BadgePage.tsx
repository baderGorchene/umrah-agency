import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeView } from './QRCodeView';
import { findGeneratedBadgeByCode } from '../services/generatedBadgesService';
import { getPilgrimByUniqueCode } from '../services/pilgrimsService';
import { GeneratedBadgeRecord } from '../types';

const buildBadgePageUrl = (uniqueCode: string): string => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const fullUrl = `${appOrigin}${normalizedBase}/badge/${encodeURIComponent(uniqueCode)}`;
  return fullUrl.replace(/([^:]\/\/)+/g, '$1');
};

interface BadgePayload {
  agency?: string;
  uniqueCode?: string;
  nameArabic?: string;
  nameLatin?: string;
  passportNumber?: string;
  tripName?: string;
  badgeUrl?: string;
  templateId?: string;
  templateVariant?: string;
}

const parseBadgePayload = (payload: unknown): BadgePayload => {
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload) as BadgePayload;
    } catch {
      return { badgeUrl: payload };
    }
  }

  if (!payload || typeof payload !== 'object') {
    return {};
  }

  return payload as BadgePayload;
};

export const BadgePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [badgeDetails, setBadgeDetails] = useState<BadgePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBadge = async () => {
      if (!code) {
        setError('Badge introuvable.');
        setLoading(false);
        return;
      }

      // 1) check localStorage first
      const storedBadge = findGeneratedBadgeByCode(code);
      if (storedBadge) {
        setBadgeDetails(parseBadgePayload(storedBadge.payload));
        setLoading(false);
        return;
      }

      // 2) Try Supabase badge_generations table for a persisted generated badge
      try {
        const persisted = await import('../services/generatedBadgesService').then(m => m.getGeneratedBadgeByCode(code));
        if (persisted) {
          setBadgeDetails(parseBadgePayload(persisted.payload));
          setLoading(false);
          return;
        }
      } catch (supErr) {
        // swallow and continue to pilgrim fallback
        console.warn('Error checking persisted generated badges:', supErr);
      }

      // 3) Fallback: try to resolve the pilgrim record itself by unique code
      try {
        const pilgrim = await getPilgrimByUniqueCode(code);
        if (pilgrim) {
          setBadgeDetails({
            agency: 'مسك طيبة للعمرة',
            uniqueCode: pilgrim.uniqueCode,
            nameArabic: pilgrim.nameArabic,
            nameLatin: pilgrim.nameLatin,
            passportNumber: pilgrim.passportNumber,
            tripName: pilgrim.tripName,
            badgeUrl: buildBadgePageUrl(pilgrim.uniqueCode),
          });
          setLoading(false);
          return;
        }
      } catch (pErr) {
        console.warn('Error fetching pilgrim by code:', pErr);
      }

      setError('Aucun badge trouvé pour ce code.');
      setLoading(false);
    };

    loadBadge();
  }, [code]);

  const closeLabel = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'Accueil';
    }
    return window.history.length > 1 ? 'Retour' : 'Accueil';
  }, []);

  const qrPayload = badgeDetails?.badgeUrl || (code ? buildBadgePageUrl(code) : '');
  const displayName = badgeDetails?.nameArabic || badgeDetails?.nameLatin || 'معتمر';
  const displayTrip = badgeDetails?.tripName || 'رحلة غير محددة';
  const displayCode = badgeDetails?.uniqueCode || code || '—';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Badge public</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Badge d'identité numérique</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center rounded-2xl bg-black px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            {closeLabel}
          </button>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="animate-pulse text-slate-400">Chargement du badge…</div>
            </div>
          ) : error ? (
            <div className="min-h-[320px] flex flex-col items-center justify-center gap-3 text-center text-slate-600">
              <p className="text-xl font-semibold text-slate-900">Badge introuvable</p>
              <p>{error}</p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Infos du pèlerin</h2>
                  <div className="mt-6 space-y-4 text-slate-700">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">Nom</span>
                      <span>{displayName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">Voyage</span>
                      <span>{displayTrip}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">Code</span>
                      <span>{displayCode}</span>
                    </div>
                    {badgeDetails?.passportNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">Passeport</span>
                        <span>{badgeDetails.passportNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Lien direct</h2>
                  <p className="mt-3 break-all text-xs text-slate-600">{qrPayload}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
                <div className="mx-auto mb-4 inline-flex rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <QRCodeView payload={qrPayload} size={220} className="max-w-full" />
                </div>
                <p className="text-sm font-semibold text-slate-900">Scannez pour ouvrir ce badge</p>
                <p className="mt-2 text-xs text-slate-500">Page publique sans connexion requise</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BadgePage;
