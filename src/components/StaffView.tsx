import React, { useState, useRef } from "react";
import { Plus, Eye, EyeOff, Edit, Trash2, Camera, Upload } from "lucide-react";
import { Language, Staff, Trip, DEFAULT_AVATAR_URL } from "../types";
import { uploadAvatarToStorage } from "../services/documentsService";
import { useTranslation } from "react-i18next";

interface StaffViewProps {
  lang?: Language;
  staffList: Staff[];
  trips: Trip[];
  onAddStaff: (newStaff: Omit<Staff, "id">) => void;
  onEditStaff: (updated: Staff) => void;
  onDeleteStaff: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staffList,
  trips,
  onAddStaff,
  onEditStaff,
  onDeleteStaff,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const { t } = useTranslation();
  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>(
    {},
  );
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const createAvatarInputRef = useRef<HTMLInputElement>(null);
  const editAvatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nameArabic: "",
    nameLatin: "",
    phone: "",
    whatsapp: "",
    role: "Chef de Bus" as Staff["role"],
    tripId: "",
    avatarUrl: DEFAULT_AVATAR_URL,
  });

  const handleAvatarUpload = async (file: File, isEdit: boolean = false) => {
    setIsUploadingAvatar(true);
    try {
      const entityId =
        isEdit && editingStaff ? editingStaff.id : `staff_${Date.now()}`;
      const url = await uploadAvatarToStorage(file, entityId, "staff");
      if (url) {
        if (isEdit && editingStaff) {
          const updated = { ...editingStaff, avatarUrl: url };
          setEditingStaff(updated);
          onEditStaff(updated);
        } else {
          setFormData((prev) => ({ ...prev, avatarUrl: url }));
        }
      }
    } catch (err) {
      console.error("Error uploading staff avatar:", err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const toggleRevealCode = (id: string) => {
    setRevealedCodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const generateUniqueCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let res = "";
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameArabic.trim()) return;

    const selectedTrip = trips.find((t) => t.id === formData.tripId);

    onAddStaff({
      nameArabic: formData.nameArabic,
      nameLatin: formData.nameLatin,
      phone: formData.phone || formData.whatsapp,
      whatsapp: formData.whatsapp.startsWith("+")
        ? formData.whatsapp
        : `+216${formData.whatsapp}`,
      role: formData.role,
      uniqueCode: generateUniqueCode(),
      tripId: formData.tripId,
      tripName: selectedTrip ? selectedTrip.name : "—",
      avatarUrl: formData.avatarUrl || DEFAULT_AVATAR_URL,
    });

    setIsAddModalOpen(false);
    setFormData({
      nameArabic: "",
      nameLatin: "",
      phone: "",
      whatsapp: "",
      role: "Chef de Bus",
      tripId: "",
      avatarUrl: DEFAULT_AVATAR_URL,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    const selectedTrip = trips.find((t) => t.id === editingStaff.tripId);
    onEditStaff({
      ...editingStaff,
      tripName: selectedTrip
        ? selectedTrip.name
        : editingStaff.tripId
          ? editingStaff.tripName
          : "—",
    });
    setEditingStaff(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t("staff.title")}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("staff.description")}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-black hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t("staff.add_button")}</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-start">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-start">
                <th className="py-3.5 px-6 text-start">
                  {t("users.fullname")}
                </th>
                <th className="py-3.5 px-6 text-start">
                  {t("staff.table.whatsapp")}
                </th>
                <th className="py-3.5 px-6 text-start">
                  {t("staff.table.role")}
                </th>
                <th className="py-3.5 px-6 text-center">
                  {t("staff.table.unique_code")}
                </th>
                <th className="py-3.5 px-6 text-start">
                  {t("staff.table.assigned_trip")}
                </th>
                <th className="py-3.5 px-6 text-end">
                  {t("staff.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {t("staff.table.no_members")}
                  </td>
                </tr>
              ) : (
                staffList.map((s) => {
                  const isRevealed = revealedCodes[s.id];
                  const codeDisplay = isRevealed
                    ? s.uniqueCode
                    : s.uniqueCode.slice(0, 4) + "••••";

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                            <img
                              src={s.avatarUrl || DEFAULT_AVATAR_URL}
                              alt={s.nameArabic}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  DEFAULT_AVATAR_URL;
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm text-start">
                              {s.nameArabic}
                            </p>
                            {s.nameLatin && (
                              <p className="text-[11px] text-slate-400 text-start">
                                {s.nameLatin}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-mono font-medium text-slate-700 text-start">
                        {s.whatsapp}
                      </td>

                      <td className="py-4 px-6 text-start">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 border border-amber-200/80 text-amber-900">
                          {s.role}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md font-mono text-xs font-bold text-slate-800">
                          <span>{codeDisplay}</span>
                          <button
                            onClick={() => toggleRevealCode(s.id)}
                            title={isRevealed ? t("staff.reveal.hide") : t("staff.reveal.show")}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                          >
                            {isRevealed ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-semibold text-slate-800 text-start">
                        {s.tripName || "—"}
                      </td>

                      <td className="py-4 px-6 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingStaff(s)}
                            title={t("buttons.edit")}
                            className="p-1.5 text-slate-400 hover:text-black hover:bg-slate-100 rounded-lg transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingStaffId(s.id)}
                            title={t("buttons.delete")}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Staff */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base">
                {t("staff.create_title")}
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
              <div className="flex flex-col items-center justify-center space-y-2 py-1 bg-slate-50/70 border border-slate-100 rounded-xl p-3">
                <div className="relative w-16 h-16 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 group">
                  <img
                    src={formData.avatarUrl || DEFAULT_AVATAR_URL}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => createAvatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold flex-col gap-0.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t("staff.avatar.change")}</span>
                  </button>
                </div>
                <input
                  ref={createAvatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleAvatarUpload(e.target.files[0], false);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => createAvatarInputRef.current?.click()}
                  className="text-xs text-slate-600 font-semibold hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {isUploadingAvatar
                      ? t("staff.avatar.uploading")
                      : t("staff.avatar.change_photo_optional")}
                  </span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {t("staff.form.name_ar")}
                </label>
                <input
                  type="text"
                  value={formData.nameArabic}
                  onChange={(e) =>
                    setFormData({ ...formData, nameArabic: e.target.value })
                  }
                  placeholder="نادر قويعة"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {t("staff.form.whatsapp")}
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp: e.target.value })
                  }
                  placeholder="+21625800884"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {t("staff.form.role")}
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as Staff["role"],
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                >
                  <option value="Chef de Bus">
                    {t("staff.roles.chef_de_bus")}
                  </option>
                  <option value="Coordonnateur Administratif">
                    {t("staff.roles.coordonnateur")}
                  </option>
                  <option value="Guide Spirituel">
                    {t("staff.roles.guide")}
                  </option>
                  <option value="Responsable Médical">
                    {t("staff.roles.medical")}
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {t("staff.form.assigned_trip")}
                </label>
                <select
                  value={formData.tripId}
                  onChange={(e) =>
                    setFormData({ ...formData, tripId: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                >
                  <option value="">{t("misc.none")}</option>
                  {trips.map((tItem) => (
                    <option key={tItem.id} value={tItem.id}>
                      {tItem.name}
                    </option>
                  ))}
                </select>
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

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base">
                {t("staff.edit_title")}
              </h2>
              <button
                onClick={() => setEditingStaff(null)}
                aria-label={t("buttons.close")}
                className="text-slate-400 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-2 py-1 bg-slate-50/70 border border-slate-100 rounded-xl p-3">
                <div className="relative w-16 h-16 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 group">
                  <img
                    src={editingStaff.avatarUrl || DEFAULT_AVATAR_URL}
                    alt="Avatar edit"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => editAvatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold flex-col gap-0.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t("staff.avatar.change")}</span>
                  </button>
                </div>
                <input
                  ref={editAvatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleAvatarUpload(e.target.files[0], true);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => editAvatarInputRef.current?.click()}
                  className="text-xs text-slate-600 font-semibold hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {isUploadingAvatar
                      ? t("staff.avatar.uploading")
                      : t("staff.avatar.change_photo_optional")}
                  </span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {t("staff.form.name_ar")}
                </label>
                <input
                  type="text"
                  value={editingStaff.nameArabic}
                  onChange={(e) =>
                    setEditingStaff({
                      ...editingStaff,
                      nameArabic: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {t("staff.form.role")}
                </label>
                <select
                  value={editingStaff.role}
                  onChange={(e) =>
                    setEditingStaff({
                      ...editingStaff,
                      role: e.target.value as Staff["role"],
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                >
                  <option value="Chef de Bus">
                    {t("staff.roles.chef_de_bus")}
                  </option>
                  <option value="Coordonnateur Administratif">
                    {t("staff.roles.coordonnateur")}
                  </option>
                  <option value="Guide Spirituel">
                    {t("staff.roles.guide")}
                  </option>
                  <option value="Responsable Médical">
                    {t("staff.roles.medical")}
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {t("staff.form.assigned_trip")}
                </label>
                <select
                  value={editingStaff.tripId || ""}
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, tripId: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                >
                  <option value="">{t("misc.none")}</option>
                  {trips.map((tItem) => (
                    <option key={tItem.id} value={tItem.id}>
                      {tItem.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
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

      {/* Delete Confirmation */}
      {deletingStaffId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              {t("staff.delete_title")}
            </h3>
            <p className="text-xs text-slate-600">
              {t("staff.delete_confirm")}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingStaffId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {t("buttons.cancel")}
              </button>
              <button
                onClick={() => {
                  onDeleteStaff(deletingStaffId);
                  setDeletingStaffId(null);
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
