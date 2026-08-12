import React from 'react';
import { X, ShieldCheck, Phone, MapPin, Building2, Calendar, UserCheck, Plane, CheckCircle2 } from 'lucide-react';
import { Pilgrim, Staff, Trip, DEFAULT_AVATAR_URL } from '../types';
import { QRCodeView } from './QRCodeView';

interface QRPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  pilgrim: Pilgrim | null;
  trip?: Trip;
  staffList?: Staff[];
  emergencyGuide1?: { name: string; phone: string };
  emergencyGuide2?: { name: string; phone: string };
}

export const QRPassModal: React.FC<QRPassModalProps> = ({
  isOpen,
  onClose,
  pilgrim,
  trip,
  staffList = [],
  emergencyGuide1,
  emergencyGuide2,
}) => {
  if (!isOpen || !pilgrim) return null;

  const assignedGuides = staffList.filter((s) => s.tripId === pilgrim.tripId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl w-full max-w-md my-8 overflow-hidden text-slate-900 font-sans relative">
        {/* Header Banner */}
        <div className="bg-slate-900 text-white p-6 text-center space-y-2 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto font-bold text-sm">
            مسك
          </div>
          <h2 className="font-extrabold text-lg dir-rtl">مسك طيبة للاسفار و السياحة</h2>
          <p className="text-[11px] text-amber-400 uppercase tracking-widest font-semibold">
            Pass Officiel MOUTAMIR (المعتمر)
          </p>

          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Pass Valide & Vérifié</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-5">
          {/* Avatar & Pilgrim Info */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-24 h-24 rounded-full border-4 border-amber-400 shadow-md overflow-hidden bg-slate-100">
              <img
                src={pilgrim.avatarUrl || DEFAULT_AVATAR_URL}
                alt={pilgrim.nameArabic}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;
                }}
              />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dir-rtl">{pilgrim.nameArabic}</h3>
              {pilgrim.nameLatin && <p className="text-xs font-semibold text-slate-500">{pilgrim.nameLatin}</p>}
            </div>

            {/* Code & Passport Pills */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="font-mono text-xs font-bold bg-slate-900 text-amber-400 px-3 py-1 rounded-lg">
                Code: {pilgrim.uniqueCode}
              </span>
              {pilgrim.passportNumber && (
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded-lg">
                  Passeport: {pilgrim.passportNumber}
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Scannable QR Code */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 shadow-2xs">
            <QRCodeView
              payload={{
                agency: 'مسك طيبة للاسفار و السياحة',
                uniqueCode: pilgrim.uniqueCode,
                nameArabic: pilgrim.nameArabic,
                nameLatin: pilgrim.nameLatin,
                passportNumber: pilgrim.passportNumber,
                tripName: pilgrim.tripName,
                emergencyGuide1: emergencyGuide1 ? `${emergencyGuide1.name} (${emergencyGuide1.phone})` : undefined,
                emergencyGuide2: emergencyGuide2 ? `${emergencyGuide2.name} (${emergencyGuide2.phone})` : undefined,
              }}
              size={140}
            />
            <p className="text-[10px] text-slate-400 font-medium">Scannable avec tout smartphone</p>
          </div>

          {/* Trip Details Grid */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-slate-600" />
                Voyage:
              </span>
              <span className="font-bold text-slate-900 dir-rtl">{trip?.name || pilgrim.tripName}</span>
            </div>

            {trip && (
              <>
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    Hôtel Makkah:
                  </span>
                  <span className="font-bold text-slate-900 dir-rtl">{trip.makkahHotel}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Hôtel Madinah:
                  </span>
                  <span className="font-bold text-slate-900 dir-rtl">{trip.madinahHotel}</span>
                </div>

                {trip.flightDetails && (
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-slate-400 font-medium">Vol:</span>
                    <span className="font-mono font-semibold text-[11px] text-slate-800">{trip.flightDetails}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Emergency Contacts */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2 text-xs">
            <p className="font-bold text-amber-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              Contacts Urgence الوكالة
            </p>

            {emergencyGuide1 && emergencyGuide1.name && (
              <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-amber-200/60">
                <span className="font-bold text-slate-800 dir-rtl">{emergencyGuide1.name}</span>
                <a
                  href={`tel:${emergencyGuide1.phone}`}
                  className="font-mono text-xs font-bold text-amber-700 hover:underline"
                >
                  {emergencyGuide1.phone}
                </a>
              </div>
            )}

            {emergencyGuide2 && emergencyGuide2.name && (
              <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-amber-200/60">
                <span className="font-bold text-slate-800 dir-rtl">{emergencyGuide2.name}</span>
                <a
                  href={`tel:${emergencyGuide2.phone}`}
                  className="font-mono text-xs font-bold text-amber-700 hover:underline"
                >
                  {emergencyGuide2.phone}
                </a>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md cursor-pointer"
          >
            Fermer le Pass Numérique
          </button>
        </div>
      </div>
    </div>
  );
};
