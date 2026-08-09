import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plane, 
  UserCheck, 
  AlertTriangle, 
  Plus, 
  QrCode, 
  Printer, 
  Compass, 
  Calendar, 
  ChevronRight 
} from 'lucide-react';
import { Language, Pilgrim, Staff, Trip } from '../types';

interface DashboardViewProps {
  lang: Language;
  pilgrims: Pilgrim[];
  staff: Staff[];
  trips: Trip[];
  onOpenAddPilgrimModal: () => void;
  onOpenAddStaffModal: () => void;
  onOpenAddTripModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  lang,
  pilgrims,
  staff,
  trips,
  onOpenAddPilgrimModal,
  onOpenAddStaffModal,
  onOpenAddTripModal
}) => {
  const navigate = useNavigate();
  const activeTrip = trips.find(t => t.active) || trips[0];
  const isAr = lang === 'AR';

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isAr ? 'مرحباً بك مجدداً' : 'Ravi de vous revoir'}
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {isAr ? 'إليك نشاط وكالتك اليوم.' : "Voici l'activité de votre agence aujourd'hui."}
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div 
          onClick={() => navigate('/pilgrims')}
          className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">
              {isAr ? 'إجمالي المعتمرين' : 'Total Pèlerins'}
            </p>
            <p className="text-2xl font-extrabold text-slate-900">{pilgrims.length}</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div 
          onClick={() => navigate('/trips')}
          className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">
              {isAr ? 'إجمالي الرحلات' : 'Total des Voyages'}
            </p>
            <p className="text-2xl font-extrabold text-slate-900">{trips.length}</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div 
          onClick={() => navigate('/staff')}
          className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">
              {isAr ? 'المرافقون' : 'Accompagnateurs'}
            </p>
            <p className="text-2xl font-extrabold text-slate-900">{staff.length}</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-red-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">
              {isAr ? 'تنبيهات الطوارئ' : 'Alertes SOS Ouvertes'}
            </p>
            <p className="text-2xl font-extrabold text-slate-900">0</p>
          </div>
        </div>
      </div>

      {/* Main Content Area (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column ("Voyages actuels") */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-slate-700" />
              <h2 className="font-bold text-slate-900 text-sm">
                {isAr ? 'الرحلات الحالية' : 'Voyages actuels'}
              </h2>
            </div>
            <button 
              onClick={() => navigate('/trips')}
              className="text-xs font-semibold text-slate-500 hover:text-black flex items-center gap-1"
            >
              <span>{isAr ? 'عرض الكل' : 'Voir tout'}</span>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          {activeTrip ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-4 relative overflow-hidden max-w-md">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">{activeTrip.name}</h3>
                <span className="p-1.5 bg-black text-white rounded-full">
                  <Compass className="w-4 h-4" />
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isAr ? 'المغادرة' : 'Départ'} <b>{activeTrip.startDate}</b></span>
                </div>
                <span className="rtl:rotate-180">→</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isAr ? 'العودة' : 'Retour'} <b>{activeTrip.endDate}</b></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-2.5 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-emerald-900 text-sm">{activeTrip.pilgrimCount}</span>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      {isAr ? 'معتمر' : 'Pèlerin(s)'}
                    </p>
                  </div>
                </div>

                <div className="bg-sky-50/60 border border-sky-100 rounded-lg p-2.5 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-sky-600" />
                  <div>
                    <span className="font-bold text-sky-900 text-sm">{activeTrip.guideCount}</span>
                    <p className="text-[10px] text-sky-700 font-medium">
                      {isAr ? 'مرافق' : 'Accompagnateur(s)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              {isAr ? 'لا توجد رحلة نشطة حالياً.' : 'Aucun voyage actif actuellement.'}
            </p>
          )}
        </div>

        {/* Right Column ("Actions rapides") */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <span className="text-amber-500 font-bold">⚡</span>
            <h2 className="font-bold text-slate-900 text-sm">
              {isAr ? 'إجراءات سريعة' : 'Actions rapides'}
            </h2>
          </div>

          <div className="space-y-2.5">
            {/* Quick Action 1 */}
            <button
              onClick={onOpenAddPilgrimModal}
              className="w-full text-start p-3 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-black">
                  {isAr ? 'إضافة معتمر' : 'Ajouter un pèlerin'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {isAr ? 'تسجيل معتمر جديد' : 'Enregistrer un nouveau pèlerin'}
                </p>
              </div>
            </button>

            {/* Quick Action 2 */}
            <button
              onClick={onOpenAddStaffModal}
              className="w-full text-start p-3 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-black">
                  {isAr ? 'إضافة مرافق' : 'Ajouter un accompagnateur'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {isAr ? 'إضافة مرشد أو مرافق' : 'Ajouter un guide ou accompagnateur'}
                </p>
              </div>
            </button>

            {/* Quick Action 3 */}
            <button
              onClick={onOpenAddTripModal}
              className="w-full text-start p-3 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-black">
                  {isAr ? 'إنشاء رحلة' : 'Créer un voyage'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {isAr ? 'تخطيط وربط المعتمرين' : 'Planifier et lier les pèlerins'}
                </p>
              </div>
            </button>

            {/* Quick Action 4 */}
            <button
              onClick={() => navigate('/qr-center')}
              className="w-full text-start p-3 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-black">
                  {isAr ? 'إنشاء بطاقات QR' : 'Créer des cartes QR'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {isAr ? 'توليد بطاقات الهوية' : "Générer les badges d'identité"}
                </p>
              </div>
            </button>

            {/* Quick Action 5 */}
            <button
              onClick={() => navigate('/documents')}
              className="w-full text-start p-3 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-black">
                  {isAr ? 'قائمة الحضور' : 'Créer liste de présence'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {isAr ? 'طباعة قائمة الحضور' : 'Imprimer la liste de présence'}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
