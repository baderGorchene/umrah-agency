import React, { useState, useRef } from "react";
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  CheckCircle2,
  User,
  Sparkles,
  FileText,
  Camera,
  Upload,
  RefreshCw,
  QrCode,
} from "lucide-react";
import { Language, Pilgrim, Trip, DEFAULT_AVATAR_URL } from "../types";
import { PassportScannerModal } from "./PassportScannerModal";
import { QRPassModal } from "./QRPassModal";
import { uploadAvatarToStorage } from "../services/documentsService";

interface PilgrimsViewProps {
  lang: Language;
  pilgrims: Pilgrim[];
  trips: Trip[];
  onAddPilgrim: (newPilgrim: Omit<Pilgrim, "id">) => void;
  onEditPilgrim: (updated: Pilgrim) => void;
  onDeletePilgrim: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const PilgrimsView: React.FC<PilgrimsViewProps> = ({
  lang,
  pilgrims,
  trips,
  onAddPilgrim,
  onEditPilgrim,
  onDeletePilgrim,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const isAr = lang === 'AR';
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTripFilter, setSelectedTripFilter] = useState("ALL");
  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>(
    {},
  );
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Edit / Delete states
  const [editingPilgrim, setEditingPilgrim] = useState<Pilgrim | null>(null);
  const [deletingPilgrimId, setDeletingPilgrimId] = useState<string | null>(
    null,
  );
  const [inspectingPilgrim, setInspectingPilgrim] = useState<Pilgrim | null>(null);
  const [isPassportScannerOpen, setIsPassportScannerOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const createAvatarInputRef = useRef<HTMLInputElement>(null);
  const editAvatarInputRef = useRef<HTMLInputElement>(null);

  // New Pilgrim Form State
  const [formData, setFormData] = useState({
    nameArabic: "",
    nameLatin: "",
    phone: "",
    passportNumber: "",
    tripId: trips[0]?.id || "",
    emergencyContact: "",
    gender: "F" as "M" | "F",
    avatarUrl: DEFAULT_AVATAR_URL,
  });

  const handleAvatarUpload = async (
    file: File,
    isEdit: boolean = false
  ) => {
    setIsUploadingAvatar(true);
    try {
      const entityId = isEdit && editingPilgrim ? editingPilgrim.id : `new_${Date.now()}`;
      const url = await uploadAvatarToStorage(file, entityId, "pilgrim");
      if (url) {
        if (isEdit && editingPilgrim) {
          const updatedPilgrim = { ...editingPilgrim, avatarUrl: url };
          setEditingPilgrim(updatedPilgrim);
          onEditPilgrim(updatedPilgrim);
        } else {
          setFormData((prev) => ({ ...prev, avatarUrl: url }));
        }
      }
    } catch (err) {
      console.error("Error uploading avatar image:", err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const toggleRevealCode = (id: string) => {
    setRevealedCodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
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
    if (!formData.nameArabic.trim() || !formData.phone.trim()) return;

    const selectedTrip = trips.find((t) => t.id === formData.tripId);
    onAddPilgrim({
      nameArabic: formData.nameArabic,
      nameLatin: formData.nameLatin,
      phone: formData.phone,
      passportNumber: formData.passportNumber,
      tripId: formData.tripId,
      tripName: selectedTrip ? selectedTrip.name : "—",
      uniqueCode: generateUniqueCode(),
      status: "مؤكد",
      emergencyContact: formData.emergencyContact,
      avatarUrl: formData.avatarUrl || DEFAULT_AVATAR_URL,
    });

    setIsAddModalOpen(false);
    setFormData({
      nameArabic: "",
      nameLatin: "",
      phone: "",
      passportNumber: "",
      tripId: trips[0]?.id || "",
      emergencyContact: "",
      gender: "F",
      avatarUrl: DEFAULT_AVATAR_URL,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPilgrim) return;
    const selectedTrip = trips.find((t) => t.id === editingPilgrim.tripId);
    onEditPilgrim({
      ...editingPilgrim,
      tripName: selectedTrip ? selectedTrip.name : editingPilgrim.tripName,
    });
    setEditingPilgrim(null);
  };

  // Filtered List
  const filteredPilgrims = pilgrims.filter((p) => {
    const matchesSearch =
      p.nameArabic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameLatin &&
        p.nameLatin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.phone.includes(searchQuery) ||
      p.uniqueCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTrip =
      selectedTripFilter === "ALL" || p.tripId === selectedTripFilter;

    return matchesSearch && matchesTrip;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isAr ? 'إدارة المعتمرين' : 'Gestion des pèlerins'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {isAr ? 'قائمة كاملة بالمعتمرين المسجلين وحالاتهم.' : 'Liste complète des pèlerins enregistrés et leurs statuts.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPassportScannerOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>{isAr ? 'مسح الجواز' : 'Scanner Passeport'}</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-black hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة معتمر' : 'Ajouter un pèlerin'}</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? "بحث بالاسم، الهاتف، الكود..." : "Rechercher par nom, tél, code..."}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black/5 text-start"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedTripFilter}
            onChange={(e) => setSelectedTripFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-black/5 text-start"
          >
            <option value="ALL">{isAr ? 'جميع الرحلات' : 'Tous les voyages'}</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-start">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-start">
                <th className="py-3.5 px-6 text-start">{isAr ? 'المعتمر' : 'Pèlerin'}</th>
                <th className="py-3.5 px-6 text-start">{isAr ? 'الرحلة المعينة' : 'Voyage Assigné'}</th>
                <th className="py-3.5 px-6 text-center">{isAr ? 'الكود الفريد' : 'Code Unique'}</th>
                <th className="py-3.5 px-6 text-center">{isAr ? 'الحالة' : 'Statut'}</th>
                <th className="py-3.5 px-6 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPilgrims.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    {isAr ? 'لم يتم العثور على أي معتمر.' : 'Aucun pèlerin trouvé.'}
                  </td>
                </tr>
              ) : (
                filteredPilgrims.map((p) => {
                  const isRevealed = revealedCodes[p.id];
                  const codeDisplay = isRevealed
                    ? p.uniqueCode
                    : p.uniqueCode.slice(0, 4) + "••••";

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Pilgrim Avatar + Names */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                            <img
                              src={p.avatarUrl || DEFAULT_AVATAR_URL}
                              alt={p.nameArabic}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm dir-rtl">
                              {p.nameArabic}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {p.phone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Voyage Assigné */}
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-800">
                          {p.tripName}
                        </span>
                      </td>

                      {/* Code Unique */}
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md font-mono text-xs font-bold text-slate-800">
                          <span>{codeDisplay}</span>
                          <button
                            onClick={() => toggleRevealCode(p.id)}
                            title={isRevealed ? "Masquer" : "Révéler"}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                          >
                            {isRevealed ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyCode(p.id, p.uniqueCode)}
                            title="Copier le code"
                            className="text-slate-400 hover:text-black transition-colors p-0.5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {copiedCodeId === p.id && (
                            <span className="text-[10px] text-emerald-600 font-sans font-bold">
                              Copié!
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100/80 text-emerald-800">
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setInspectingPilgrim(p)}
                            title={isAr ? "عرض بطاقة QR" : "Voir le Pass QR"}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingPilgrim(p)}
                            title={isAr ? "تعديل" : "Modifier"}
                            className="p-1.5 text-slate-400 hover:text-black hover:bg-slate-100 rounded-lg transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingPilgrimId(p.id)}
                            title={isAr ? "حذف" : "Supprimer"}
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

      {/* Modal Add Pilgrim */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base">
                {isAr ? 'إضافة معتمر جديد' : 'Ajouter un nouveau pèlerin'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Photo de profil (Avatar Upload) */}
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
                    <span>{isAr ? 'تغيير' : 'Changer'}</span>
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
                      ? (isAr ? 'جاري التحميل...' : 'Téléversement...')
                      : (isAr ? 'تغيير الصورة الشخصية (اختياري)' : 'Changer la photo de profil (Optionnel)')}
                  </span>
                </button>
              </div>

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {isAr ? 'الاسم واللقب (بالعربية) *' : 'Nom et Prénom (en Arabe) *'}
                </label>
                <input
                  type="text"
                  value={formData.nameArabic}
                  onChange={(e) =>
                    setFormData({ ...formData, nameArabic: e.target.value })
                  }
                  placeholder="مثال: محمد بن علي"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  required
                />
              </div>

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {isAr ? 'الاسم واللقب (باللاتينية)' : 'Nom et Prénom (en Latin)'}
                </label>
                <input
                  type="text"
                  value={formData.nameLatin}
                  onChange={(e) =>
                    setFormData({ ...formData, nameLatin: e.target.value })
                  }
                  placeholder="Ex: Mohamed Ben Ali"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {isAr ? 'رقم الهاتف (تونس) *' : 'Numéro Téléphone (Tunisie) *'}
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="99048168"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                    required
                  />
                </div>

                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {isAr ? 'رقم جواز السفر' : 'Numéro Passeport'}
                  </label>
                  <input
                    type="text"
                    value={formData.passportNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        passportNumber: e.target.value,
                      })
                    }
                    placeholder="N2891048"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {isAr ? 'الرحلة المعينة' : 'Voyage Assigné'}
                </label>
                <select
                  value={formData.tripId}
                  onChange={(e) =>
                    setFormData({ ...formData, tripId: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
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
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900 shadow-xs"
                >
                  {isAr ? 'حفظ' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Pilgrim */}
      {editingPilgrim && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base">
                {isAr ? 'تعديل بيانات المعتمر' : 'Modifier le pèlerin'}
              </h2>
              <button
                onClick={() => setEditingPilgrim(null)}
                className="text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Photo de profil Avatar Edit */}
              <div className="flex flex-col items-center justify-center space-y-2 py-1 bg-slate-50/70 border border-slate-100 rounded-xl p-3">
                <div className="relative w-16 h-16 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 group">
                  <img
                    src={editingPilgrim.avatarUrl || DEFAULT_AVATAR_URL}
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
                    <span>{isAr ? 'تغيير' : 'Changer'}</span>
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
                      ? (isAr ? 'جاري التحميل...' : 'Téléversement...')
                      : (isAr ? 'تعديل الصورة الشخصية' : 'Modifier la photo de profil')}
                  </span>
                </button>
              </div>

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {isAr ? 'الاسم واللقب (بالعربية)' : 'Nom et Prénom (en Arabe)'}
                </label>
                <input
                  type="text"
                  value={editingPilgrim.nameArabic}
                  onChange={(e) =>
                    setEditingPilgrim({
                      ...editingPilgrim,
                      nameArabic: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {isAr ? 'رقم الهاتف' : 'Téléphone'}
                </label>
                <input
                  type="text"
                  value={editingPilgrim.phone}
                  onChange={(e) =>
                    setEditingPilgrim({
                      ...editingPilgrim,
                      phone: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {isAr ? 'الرحلة المعينة' : 'Voyage Assigné'}
                </label>
                <select
                  value={editingPilgrim.tripId}
                  onChange={(e) =>
                    setEditingPilgrim({
                      ...editingPilgrim,
                      tripId: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPilgrim(null)}
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

      {/* Modal Delete Confirmation */}
      {deletingPilgrimId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 text-start">
            <h3 className="font-bold text-slate-900 text-sm">
              {isAr ? 'تأكيد الحذف' : 'Confirmer la suppression'}
            </h3>
            <p className="text-xs text-slate-600">
              {isAr
                ? 'هل أنت تأكد من رغبتك في حذف هذا المعتمر؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Êtes-vous sûr de vouloir supprimer ce pèlerin ? Cette action est irréversible.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingPilgrimId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                onClick={() => {
                  onDeletePilgrim(deletingPilgrimId);
                  setDeletingPilgrimId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                {isAr ? 'حذف' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passport Scanner Modal */}
      <PassportScannerModal
        isOpen={isPassportScannerOpen}
        onClose={() => setIsPassportScannerOpen(false)}
        trips={trips}
        onImportPilgrim={onAddPilgrim}
      />

      {/* QR Pass Modal */}
      <QRPassModal
        isOpen={!!inspectingPilgrim}
        onClose={() => setInspectingPilgrim(null)}
        pilgrim={inspectingPilgrim}
        trip={trips.find(t => t.id === inspectingPilgrim?.tripId)}
      />
    </div>
  );
};
