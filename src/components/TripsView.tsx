import React, { useState } from "react";
import {
  Plus,
  QrCode,
  Edit,
  Trash2,
} from "lucide-react";
import { Language, Trip } from "../types";
import { useTranslation } from "react-i18next";

interface TripsViewProps {
  lang?: Language;
  trips: Trip[];
  onAddTrip: (newTrip: Omit<Trip, "id">) => void;
  onEditTrip: (updated: Trip) => void;
  onDeleteTrip: (id: string) => void;
  onNavigateToQrCenter: (tripId: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const TripsView: React.FC<TripsViewProps> = ({
  trips,
  onAddTrip,
  onEditTrip,
  onDeleteTrip,
  onNavigateToQrCenter,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const { t } = useTranslation();
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "عمرة المولد",
    startDate: "2026-08-22",
    endDate: "2026-09-04",
    makkahHotel: "الماسـة",
    madinahHotel: "الكيان العالمي",
    busCount: 1,
    flightDetails: "TU711 Tunis -> Jeddah",
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
      flightDetails: formData.flightDetails,
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
            {t("trips.title")}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("trips.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-black hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t("trips.add_button")}</span>
        </button>
      </div>

      {/* Trips Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-start">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-start">
                <th className="py-3.5 px-6 text-start">
                  {t("trips.trip_name")}
                </th>
                <th className="py-3.5 px-6 text-start">
                  {t("trips.dates")}
                </th>
                <th className="py-3.5 px-6 text-start">
                  {t("trips.hotels")}
                </th>
                <th className="py-3.5 px-6 text-start">
                  {t("trips.accompanist_count")}
                </th>
                <th className="py-3.5 px-6 text-start">
                  {t("trips.pilgrim_count")}
                </th>
                <th className="py-3.5 px-6 text-end">
                  {t("staff.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {t("trips.no_trips")}
                  </td>
                </tr>
              ) : (
                trips.map((tItem) => (
                  <tr
                    key={tItem.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-bold text-slate-900 text-sm text-start">
                      {tItem.name}
                    </td>

                    <td className="py-4 px-6 text-slate-700 font-medium whitespace-nowrap text-start">
                      {tItem.startDate} — {tItem.endDate}
                    </td>

                    <td className="py-4 px-6 text-start">
                      <span className="font-semibold text-slate-800">
                        {tItem.makkahHotel}
                      </span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-slate-600">{tItem.madinahHotel}</span>
                    </td>

                    <td className="py-4 px-6 text-slate-700 font-semibold text-start">
                      {tItem.guideCount} {t("dashboard.guides_count")}
                    </td>

                    <td className="py-4 px-6 text-slate-700 font-semibold text-start">
                      {tItem.pilgrimCount} {t("dashboard.pilgrims_count")}
                    </td>

                    <td className="py-4 px-6 text-end whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onNavigateToQrCenter(tItem.id)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-900 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{t("trips.view_badges")}</span>
                        </button>
                        <button
                          onClick={() => setEditingTrip(tItem)}
                          title={t("buttons.edit")}
                          className="p-1.5 text-slate-400 hover:text-black hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingTripId(tItem.id)}
                          title={t("buttons.delete")}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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
                {t("trips.create_title")}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                aria-label={t("buttons.close")}
                className="text-slate-400 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {t("trips.form.name")}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="عمرة المولد النبوي الشريف"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("trips.form.start_date")}
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                    required
                  />
                </div>
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("trips.form.end_date")}
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("trips.form.makkah_hotel")}
                  </label>
                  <input
                    type="text"
                    value={formData.makkahHotel}
                    onChange={(e) =>
                      setFormData({ ...formData, makkahHotel: e.target.value })
                    }
                    placeholder="فندق الماسة مكة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("trips.form.madinah_hotel")}
                  </label>
                  <input
                    type="text"
                    value={formData.madinahHotel}
                    onChange={(e) =>
                      setFormData({ ...formData, madinahHotel: e.target.value })
                    }
                    placeholder="فندق الكيان العالمي المدينة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {t("buttons.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900 cursor-pointer"
                >
                  {t("buttons.save")}
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
                {t("trips.edit_title")}
              </h2>
              <button
                onClick={() => setEditingTrip(null)}
                aria-label={t("buttons.close")}
                className="text-slate-400 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {t("trips.form.name")}
                </label>
                <input
                  type="text"
                  value={editingTrip.name}
                  onChange={(e) =>
                    setEditingTrip({ ...editingTrip, name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("trips.form.makkah_hotel")}
                  </label>
                  <input
                    type="text"
                    value={editingTrip.makkahHotel}
                    onChange={(e) =>
                      setEditingTrip({
                        ...editingTrip,
                        makkahHotel: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("trips.form.madinah_hotel")}
                  </label>
                  <input
                    type="text"
                    value={editingTrip.madinahHotel}
                    onChange={(e) =>
                      setEditingTrip({
                        ...editingTrip,
                        madinahHotel: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTrip(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {t("buttons.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900 cursor-pointer"
                >
                  {t("buttons.update")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTripId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              {t("trips.delete_title")}
            </h3>
            <p className="text-xs text-slate-600">
              {t("trips.delete_confirm")}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingTripId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {t("buttons.cancel")}
              </button>
              <button
                onClick={() => {
                  onDeleteTrip(deletingTripId);
                  setDeletingTripId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                {t("buttons.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
