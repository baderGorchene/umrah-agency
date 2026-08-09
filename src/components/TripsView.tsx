import React, { useState } from 'react';
import { Plus, Plane, QrCode, Edit, Calendar, Building2, Users, UserCheck } from 'lucide-react';
import { Language, Trip, NavTab } from '../types';

interface TripsViewProps {
  lang: Language;
  trips: Trip[];
  onAddTrip: (newTrip: Omit<Trip, 'id'>) => void;
  onEditTrip: (updated: Trip) => void;
  onNavigateToQrCenter: (tripId: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const TripsView: React.FC<TripsViewProps> = ({
  lang,
  trips,
  onAddTrip,
  onEditTrip,
  onNavigateToQrCenter,
  isAddModalOpen,
  setIsAddModalOpen
}) => {
  const isAr = lang === 'AR';
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const [formData, setFormData] = useState({
    name: 'عمرة المولد',
    startDate: '2026-08-22',
    endDate: '2026-09-04',
    makkahHotel: 'الماسـة',
    madinahHotel: 'الكيان العالمي',
    busCount: 1,
    flightDetails: 'TU711 Tunis -> Jeddah'
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onAddTrip({
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      makkahHotel: formData.makkahHotel,
      madinahHotel: formData.madinahHotel,
      pilgrimCount: 0,
      guideCount: 0,
      active: true,
      busCount: formData.busCount,
      flightDetails: formData.flightDetails
    });

    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;
    onEditTrip(editingTrip);
    setEditingTrip(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isAr ? 'إدارة الرحلات' : 'Gestion des Voyages'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {isAr ? 'تخطيط المجموعات والحافلات والإقامات الفندقية.' : 'Planification des groupes, des bus et des hébergements.'}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-black hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'رحلة جديدة' : 'Nouveau Voyage (Assistant)'}</span>
        </button>
      </div>

      {/* Trips Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-start">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-start">
                <th className="py-3.5 px-6 text-start">{isAr ? 'اسم الرحلة' : 'Nom du Voyage'}</th>
                <th className="py-3.5 px-6 text-start">{isAr ? 'التواريخ (ذهاب - إياد)' : 'Dates (Départ - Retour)'}</th>
                <th className="py-3.5 px-6 text-start">{isAr ? 'الفنادق (مكة / المدينة)' : 'Hôtels (Mecque / Médine)'}</th>
                <th className="py-3.5 px-6 text-start">{isAr ? 'المرافقون' : 'Accompagnateurs'}</th>
                <th className="py-3.5 px-6 text-start">{isAr ? 'المعتمرون' : 'Pèlerins'}</th>
                <th className="py-3.5 px-6 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {isAr ? 'لا توجد أي رحلة مسجلة.' : 'Aucun voyage configuré.'}
                  </td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Nom du Voyage */}
                    <td className="py-4 px-6 font-bold text-slate-900 text-sm text-start">
                      {t.name}
                    </td>

                    {/* Dates */}
                    <td className="py-4 px-6 text-slate-700 font-medium whitespace-nowrap text-start">
                      {t.startDate} — {t.endDate}
                    </td>

                    {/* Hôtels */}
                    <td className="py-4 px-6 text-start">
                      <span className="font-semibold text-slate-800">{t.makkahHotel}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-slate-600">{t.madinahHotel}</span>
                    </td>

                    {/* Accompagnateurs */}
                    <td className="py-4 px-6 text-slate-700 font-semibold text-start">
                      {t.guideCount} {isAr ? 'مرافق' : 'Accompagnateur(s)'}
                    </td>

                    {/* Pèlerins */}
                    <td className="py-4 px-6 text-slate-700 font-semibold text-start">
                      {t.pilgrimCount} {isAr ? 'معتمر' : 'Pèlerin(s)'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-end whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onNavigateToQrCenter(t.id)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-900 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{isAr ? 'عرض البطاقات' : 'Voir les Badges'}</span>
                        </button>
                        <button
                          onClick={() => setEditingTrip(t)}
                          className="p-1.5 text-slate-400 hover:text-black hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Assistant Nouveau Voyage */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base">
                {isAr ? 'مساعد إنشاء رحلة جديدة' : 'Assistant Nouveau Voyage'}
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {isAr ? 'اسم الرحلة *' : 'Nom du Voyage *'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: عمرة المولد النبوي الشريف"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {isAr ? 'تاريخ الذهاب *' : 'Date de Départ *'}
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                    required
                  />
                </div>
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {isAr ? 'تاريخ العودة *' : 'Date de Retour *'}
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {isAr ? 'فندق مكة' : 'Hôtel Mecque'}
                  </label>
                  <input
                    type="text"
                    value={formData.makkahHotel}
                    onChange={(e) => setFormData({ ...formData, makkahHotel: e.target.value })}
                    placeholder="فندق الماسة مكة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {isAr ? 'فندق المدينة' : 'Hôtel Médine'}
                  </label>
                  <input
                    type="text"
                    value={formData.madinahHotel}
                    onChange={(e) => setFormData({ ...formData, madinahHotel: e.target.value })}
                    placeholder="فندق الكيان العالمي المدينة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900"
                >
                  {isAr ? 'إنشاء الرحلة' : 'Créer le Voyage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Trip */}
      {editingTrip && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base">
                {isAr ? 'تعديل بيانات الرحلة' : 'Modifier le Voyage'}
              </h2>
              <button onClick={() => setEditingTrip(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {isAr ? 'اسم الرحلة' : 'Nom du Voyage'}
                </label>
                <input
                  type="text"
                  value={editingTrip.name}
                  onChange={(e) => setEditingTrip({ ...editingTrip, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {isAr ? 'فندق مكة' : 'Hôtel Mecque'}
                  </label>
                  <input
                    type="text"
                    value={editingTrip.makkahHotel}
                    onChange={(e) => setEditingTrip({ ...editingTrip, makkahHotel: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {isAr ? 'فندق المدينة' : 'Hôtel Médine'}
                  </label>
                  <input
                    type="text"
                    value={editingTrip.madinahHotel}
                    onChange={(e) => setEditingTrip({ ...editingTrip, madinahHotel: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTrip(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900"
                >
                  {isAr ? 'تحديث' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
