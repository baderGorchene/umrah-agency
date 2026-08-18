import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  Sparkles,
  Camera,
  Upload,
  QrCode,
  AlertCircle,
} from "lucide-react";
import { Language, Pilgrim, Trip, DEFAULT_AVATAR_URL } from "../types";
import { PassportScannerModal } from "./PassportScannerModal";
import { StatusBadge } from "./StatusBadge";
import { QRPassModal } from "./QRPassModal";
import { uploadAvatarToStorage } from "../services/documentsService";
import { checkPilgrimPassportExists } from "../services/pilgrimsService";
import { useTranslation } from "react-i18next";

interface PilgrimsViewProps {
  lang?: Language;
  pilgrims: Pilgrim[];
  trips: Trip[];
  onAddPilgrim: (
    newPilgrim: Omit<Pilgrim, "id">,
    pendingDocument?: {
      filePath: string;
      fileUrl?: string;
      mimeType?: string;
      fileName?: string;
    },
  ) => void;
  onEditPilgrim: (updated: Pilgrim) => void;
  onDeletePilgrim: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const PilgrimsView: React.FC<PilgrimsViewProps> = ({
  pilgrims,
  trips,
  onAddPilgrim,
  onEditPilgrim,
  onDeletePilgrim,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const { t } = useTranslation();
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
  const [inspectingPilgrim, setInspectingPilgrim] = useState<Pilgrim | null>(
    null,
  );
  const [isPassportScannerOpen, setIsPassportScannerOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const createAvatarInputRef = useRef<HTMLInputElement>(null);
  const editAvatarInputRef = useRef<HTMLInputElement>(null);

  // Validation / Error states
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isCheckingPassport, setIsCheckingPassport] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "warning" | "error" | "success";
  } | null>(null);

  const showToast = (
    text: string,
    type: "warning" | "error" | "success" = "warning",
  ) => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const [formData, setFormData] = useState({
    nameArabic: "",
    nameLatin: "",
    passportNumber: "",
    birthDate: "",
    paidAmount: "",
    unpaidAmount: "",
    tripId: trips[0]?.id || "",
    emergencyContact: "",
    gender: "F" as "M" | "F",
    avatarUrl: DEFAULT_AVATAR_URL,
  });

  // Keep the default trip in sync if the trips list loads/updates after mount
  useEffect(() => {
    if (!formData.tripId && trips.length > 0) {
      setFormData((prev) => ({ ...prev, tripId: trips[0].id }));
    }
  }, [trips]);

  const handleAvatarUpload = async (file: File, isEdit: boolean = false) => {
    setIsUploadingAvatar(true);
    try {
      const entityId =
        isEdit && editingPilgrim ? editingPilgrim.id : `new_${Date.now()}`;
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!formData.nameArabic.trim()) return;

    const trimmedPassport = formData.passportNumber.trim().toUpperCase();

    // 1. Guard against duplicate passport_number in state
    if (trimmedPassport) {
      const existingInState = pilgrims.find(
        (p) =>
          p.passportNumber &&
          p.passportNumber.trim().toUpperCase() === trimmedPassport,
      );
      if (existingInState) {
        setCreateError(
          t("pilgrims.passport_already_exists", {
            passport: trimmedPassport,
            defaultValue: `Le numéro de passeport (${trimmedPassport}) existe déjà pour le pèlerin "${existingInState.nameArabic}" !`,
          }),
        );
        return;
      }

      // 2. Guard against duplicate passport_number in Database / Registry
      setIsCheckingPassport(true);
      try {
        const check = await checkPilgrimPassportExists(trimmedPassport);
        if (check.exists) {
          const name = check.existingPilgrim?.nameArabic
            ? ` "${check.existingPilgrim.nameArabic}"`
            : "";
          setCreateError(
            t("pilgrims.passport_already_exists", {
              passport: trimmedPassport,
              defaultValue: `Le numéro de passeport (${trimmedPassport}) existe déjà pour le pèlerin${name} !`,
            }),
          );
          setIsCheckingPassport(false);
          return;
        }
      } catch (err) {
        console.warn("Passport check error:", err);
      } finally {
        setIsCheckingPassport(false);
      }
    }

    const selectedTrip = trips.find((t) => t.id === formData.tripId);
    onAddPilgrim({
      nameArabic: formData.nameArabic,
      nameLatin: formData.nameLatin,
      passportNumber: trimmedPassport || formData.passportNumber,
      birthDate: formData.birthDate || undefined,
      paidAmount: formData.paidAmount !== "" ? Number(formData.paidAmount) : 0,
      unpaidAmount:
        formData.unpaidAmount !== "" ? Number(formData.unpaidAmount) : 0,
      tripId: formData.tripId,
      tripName: selectedTrip ? selectedTrip.name : "—",
      uniqueCode: generateUniqueCode(),
      status: "مؤكد",
      emergencyContact: formData.emergencyContact,
      avatarUrl: formData.avatarUrl || DEFAULT_AVATAR_URL,
    });

    setIsAddModalOpen(false);
    setCreateError(null);
    setFormData({
      nameArabic: "",
      nameLatin: "",
      passportNumber: "",
      birthDate: "",
      paidAmount: "",
      unpaidAmount: "",
      tripId: trips[0]?.id || "",
      emergencyContact: "",
      gender: "F",
      avatarUrl: DEFAULT_AVATAR_URL,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPilgrim) return;
    setEditError(null);

    const trimmedPassport = editingPilgrim.passportNumber?.trim().toUpperCase();

    if (trimmedPassport) {
      // Check in state
      const existingInState = pilgrims.find(
        (p) =>
          p.id !== editingPilgrim.id &&
          p.passportNumber &&
          p.passportNumber.trim().toUpperCase() === trimmedPassport,
      );
      if (existingInState) {
        setEditError(
          t("pilgrims.passport_already_exists", {
            passport: trimmedPassport,
            defaultValue: `Le numéro de passeport (${trimmedPassport}) existe déjà pour le pèlerin "${existingInState.nameArabic}" !`,
          }),
        );
        return;
      }

      // Check in DB
      setIsCheckingPassport(true);
      try {
        const check = await checkPilgrimPassportExists(
          trimmedPassport,
          editingPilgrim.id,
        );
        if (check.exists) {
          const name = check.existingPilgrim?.nameArabic
            ? ` "${check.existingPilgrim.nameArabic}"`
            : "";
          setEditError(
            t("pilgrims.passport_already_exists", {
              passport: trimmedPassport,
              defaultValue: `Le numéro de passeport (${trimmedPassport}) existe déjà pour le pèlerin${name} !`,
            }),
          );
          setIsCheckingPassport(false);
          return;
        }
      } catch (err) {
        console.warn("Passport check error on edit:", err);
      } finally {
        setIsCheckingPassport(false);
      }
    }

    const selectedTrip = trips.find((t) => t.id === editingPilgrim.tripId);
    onEditPilgrim({
      ...editingPilgrim,
      passportNumber: trimmedPassport || editingPilgrim.passportNumber,
      tripName: selectedTrip ? selectedTrip.name : editingPilgrim.tripName,
      paidAmount:
        editingPilgrim.paidAmount != null
          ? Number(editingPilgrim.paidAmount)
          : 0,
      unpaidAmount:
        editingPilgrim.unpaidAmount != null
          ? Number(editingPilgrim.unpaidAmount)
          : 0,
    });
    setEditingPilgrim(null);
    setEditError(null);
  };

  const handleImportFromScanner = async (
    newPilgrim: Omit<Pilgrim, "id">,
    pendingDocument?: {
      filePath: string;
      fileUrl?: string;
      mimeType?: string;
      fileName?: string;
    },
  ) => {
    const trimmedPassport = newPilgrim.passportNumber?.trim().toUpperCase();
    if (trimmedPassport) {
      const existingInState = pilgrims.find(
        (p) =>
          p.passportNumber &&
          p.passportNumber.trim().toUpperCase() === trimmedPassport,
      );
      if (existingInState) {
        showToast(
          t("pilgrims.passport_already_exists", {
            passport: trimmedPassport,
            defaultValue: `Le numéro de passeport (${trimmedPassport}) existe déjà pour le pèlerin "${existingInState.nameArabic}" !`,
          }),
          "warning",
        );
        return;
      }

      const check = await checkPilgrimPassportExists(trimmedPassport);
      if (check.exists) {
        const name = check.existingPilgrim?.nameArabic
          ? ` "${check.existingPilgrim.nameArabic}"`
          : "";
        showToast(
          t("pilgrims.passport_already_exists", {
            passport: trimmedPassport,
            defaultValue: `Le numéro de passeport (${trimmedPassport}) existe déjà pour le pèlerin${name} !`,
          }),
          "warning",
        );
        return;
      }
    }

    onAddPilgrim(newPilgrim, pendingDocument);
  };

  // Filtered List
  const filteredPilgrims = pilgrims.filter((p) => {
    const matchesSearch =
      p.nameArabic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameLatin &&
        p.nameLatin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.uniqueCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.passportNumber &&
        p.passportNumber.toLowerCase().includes(searchQuery.toLowerCase()));

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
            {t("pilgrims.title")}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("pilgrims.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPassportScannerOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>{t("misc.scanner")}</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-black hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t("dashboard.add_pilgrim")}</span>
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
            placeholder={t("pilgrims.search_placeholder")}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black/5 text-start"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedTripFilter}
            onChange={(e) => setSelectedTripFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-black/5 text-start"
          >
            <option value="ALL">{t("pilgrims.all_trips")}</option>
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
                <th className="py-3.5 px-6 text-start">
                  {t("pilgrims.table_header_pilgrim")}
                </th>
                <th className="py-3.5 px-6 text-start">
                  {t("pilgrims.table_header_trip")}
                </th>
                <th className="py-3.5 px-6 text-center">
                  {t("pilgrims.table_header_paid_amount")}
                </th>
                <th className="py-3.5 px-6 text-center">
                  {t("pilgrims.table_header_unpaid_amount")}
                </th>
                <th className="py-3.5 px-6 text-center">
                  {t("pilgrims.table_header_code")}
                </th>
                <th className="py-3.5 px-6 text-center">
                  {t("pilgrims.table_header_status")}
                </th>
                <th className="py-3.5 px-6 text-end">
                  {t("pilgrims.table_header_actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPilgrims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {t("pilgrims.no_pilgrims")}
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
                              alt={p.nameArabic || "Avatar"}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                const target = e.currentTarget;
                                // Prevent infinite loop if DEFAULT_AVATAR_URL also fails
                                if (target.src !== DEFAULT_AVATAR_URL) {
                                  target.src = DEFAULT_AVATAR_URL;
                                }
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm dir-rtl">
                              {p.nameArabic}
                            </p>
                            {p.nameLatin && (
                              <p className="text-[11px] text-slate-500 font-sans">
                                {p.nameLatin}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Voyage Assigné */}
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-800">
                          {p.tripName}
                        </span>
                      </td>

                      {/* Montant Payé */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md text-xs font-mono">
                          {Number(p.paidAmount || 0).toLocaleString()}{" "}
                          <span className="text-[10px] font-sans font-bold text-emerald-800">
                            د.ت
                          </span>
                        </span>
                      </td>

                      {/* Montant non Payé */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-xs font-mono px-2.5 py-1 rounded-md ${
                            (p.unpaidAmount || 0) > 0
                              ? "text-amber-800 bg-amber-50 border border-amber-200/80"
                              : "text-slate-600 bg-slate-50 border border-slate-200/80"
                          }`}
                        >
                          {Number(p.unpaidAmount || 0).toLocaleString()}{" "}
                          <span className="text-[10px] font-sans font-bold text-slate-500">
                            د.ت
                          </span>
                        </span>
                      </td>

                      {/* Code Unique */}
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md font-mono text-xs font-bold text-slate-800">
                          <span>{codeDisplay}</span>
                          <button
                            onClick={() => toggleRevealCode(p.id)}
                            title={
                              isRevealed
                                ? t("staff.reveal.hide")
                                : t("staff.reveal.show")
                            }
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
                            title={t("buttons.copy")}
                            className="text-slate-400 hover:text-black transition-colors p-0.5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {copiedCodeId === p.id && (
                            <span className="text-[10px] text-emerald-600 font-sans font-bold">
                              {t("pilgrims.copied")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="py-4 px-6 text-center">
                        <StatusBadge
                          status={p.status}
                          variant={
                            p.status === "مؤكد"
                              ? "emerald"
                              : p.status === "في الانتظار"
                                ? "amber"
                                : "rose"
                          }
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setInspectingPilgrim(p)}
                            title={t("pilgrims.view_qr")}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setEditingPilgrim({
                                ...p,
                                tripId: p.tripId || trips[0]?.id || "",
                              })
                            }
                            title={t("buttons.edit")}
                            className="p-1.5 text-slate-400 hover:text-black hover:bg-slate-100 rounded-lg transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingPilgrimId(p.id)}
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

      {/* Modal Add Pilgrim */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base">
                {t("pilgrims.add_title")}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setCreateError(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Error Message for Duplicate Passport */}
            {createError && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span className="font-semibold">{createError}</span>
              </div>
            )}

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
                    <span>{t("pilgrims.form_avatar_change")}</span>
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
                      ? t("pilgrims.form_avatar_uploading")
                      : t("pilgrims.form_avatar_upload_optional")}
                  </span>
                </button>
              </div>

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {t("pilgrims.form_name_ar")}
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
                  {t("pilgrims.form_name_latin")}
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
                    {t("pilgrims.form_birthdate")}
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        birthDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>

                <div className="space-y-1 text-start">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      {t("pilgrims.form_passport")}
                    </label>
                    {formData.passportNumber.trim() &&
                      pilgrims.some(
                        (p) =>
                          p.passportNumber &&
                          p.passportNumber.trim().toUpperCase() ===
                            formData.passportNumber.trim().toUpperCase(),
                      ) && (
                        <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {t("pilgrims.passport_exists_short", {
                            defaultValue: "Existe déjà",
                          })}
                        </span>
                      )}
                  </div>
                  <input
                    type="text"
                    value={formData.passportNumber}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        passportNumber: e.target.value,
                      });
                      if (createError) setCreateError(null);
                    }}
                    placeholder="N2891048"
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 ${
                      createError ||
                      (formData.passportNumber.trim() &&
                        pilgrims.some(
                          (p) =>
                            p.passportNumber &&
                            p.passportNumber.trim().toUpperCase() ===
                              formData.passportNumber.trim().toUpperCase(),
                        ))
                        ? "border-red-400 focus:ring-red-200 bg-red-50/20"
                        : "border-slate-200 focus:ring-black/5"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("pilgrims.form_paid_amount")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.paidAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, paidAmount: e.target.value })
                    }
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>

                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("pilgrims.form_unpaid_amount")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.unpaidAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unpaidAmount: e.target.value,
                      })
                    }
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {t("pilgrims.form_trip")}
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
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setCreateError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {t("buttons.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isCheckingPassport}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingPassport
                    ? t("passports.processing", {
                        defaultValue: "Vérification...",
                      })
                    : t("buttons.save")}
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
                {t("pilgrims.edit_title")}
              </h2>
              <button
                onClick={() => {
                  setEditingPilgrim(null);
                  setEditError(null);
                }}
                className="text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Error Message for Duplicate Passport on Edit */}
            {editError && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span className="font-semibold">{editError}</span>
              </div>
            )}

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
                    <span>{t("pilgrims.form_avatar_change")}</span>
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
                      ? t("pilgrims.form_avatar_uploading")
                      : t("pilgrims.form_avatar_upload_optional")}
                  </span>
                </button>
              </div>

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {t("pilgrims.form_name_ar")}
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
                  {t("pilgrims.form_name_latin")}
                </label>
                <input
                  type="text"
                  value={editingPilgrim.nameLatin || ""}
                  onChange={(e) =>
                    setEditingPilgrim({
                      ...editingPilgrim,
                      nameLatin: e.target.value,
                    })
                  }
                  placeholder="Ex: Mohamed Ben Ali"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("pilgrims.form_birthdate")}
                  </label>
                  <input
                    type="date"
                    value={editingPilgrim.birthDate || ""}
                    onChange={(e) =>
                      setEditingPilgrim({
                        ...editingPilgrim,
                        birthDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>

                <div className="space-y-1 text-start">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      {t("pilgrims.form_passport")}
                    </label>
                    {editingPilgrim.passportNumber?.trim() &&
                      pilgrims.some(
                        (p) =>
                          p.id !== editingPilgrim.id &&
                          p.passportNumber &&
                          p.passportNumber.trim().toUpperCase() ===
                            editingPilgrim.passportNumber?.trim().toUpperCase(),
                      ) && (
                        <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {t("pilgrims.passport_exists_short", {
                            defaultValue: "Existe déjà",
                          })}
                        </span>
                      )}
                  </div>
                  <input
                    type="text"
                    value={editingPilgrim.passportNumber || ""}
                    onChange={(e) => {
                      setEditingPilgrim({
                        ...editingPilgrim,
                        passportNumber: e.target.value,
                      });
                      if (editError) setEditError(null);
                    }}
                    placeholder="N2891048"
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 ${
                      editError ||
                      (editingPilgrim.passportNumber?.trim() &&
                        pilgrims.some(
                          (p) =>
                            p.id !== editingPilgrim.id &&
                            p.passportNumber &&
                            p.passportNumber.trim().toUpperCase() ===
                              editingPilgrim.passportNumber
                                ?.trim()
                                .toUpperCase(),
                        ))
                        ? "border-red-400 focus:ring-red-200 bg-red-50/20"
                        : "border-slate-200 focus:ring-black/5"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("pilgrims.form_paid_amount")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingPilgrim.paidAmount ?? ""}
                    onChange={(e) =>
                      setEditingPilgrim({
                        ...editingPilgrim,
                        paidAmount:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>

                <div className="space-y-1 text-start">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("pilgrims.form_unpaid_amount")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingPilgrim.unpaidAmount ?? ""}
                    onChange={(e) =>
                      setEditingPilgrim({
                        ...editingPilgrim,
                        unpaidAmount:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div className="space-y-1 text-start">
                <label className="text-xs font-semibold text-slate-700">
                  {t("pilgrims.form_trip")}
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
                  onClick={() => {
                    setEditingPilgrim(null);
                    setEditError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {t("buttons.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isCheckingPassport}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingPassport
                    ? t("passports.processing", {
                        defaultValue: "Vérification...",
                      })
                    : t("buttons.update")}
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
              {t("pilgrims.delete_title")}
            </h3>
            <p className="text-xs text-slate-600">
              {t("pilgrims.delete_confirm")}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingPilgrimId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {t("buttons.cancel")}
              </button>
              <button
                onClick={() => {
                  onDeletePilgrim(deletingPilgrimId);
                  setDeletingPilgrimId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                {t("buttons.delete")}
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
        onImportPilgrim={handleImportFromScanner}
      />

      {/* QR Pass Modal */}
      <QRPassModal
        isOpen={!!inspectingPilgrim}
        onClose={() => setInspectingPilgrim(null)}
        pilgrim={inspectingPilgrim}
        trip={trips.find((t) => t.id === inspectingPilgrim?.tripId)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : toastMessage.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:opacity-75 cursor-pointer font-bold ml-2 rtl:ml-0 rtl:mr-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
