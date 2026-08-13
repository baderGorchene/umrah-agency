import React, { useState, useRef } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  ArrowRight,
  X,
  ShieldCheck,
} from "lucide-react";
import { Pilgrim, Trip, DEFAULT_AVATAR_URL } from "../types";
import {
  uploadPassportToStorage,
  saveDocumentRecord,
} from "../services/documentsService";

export interface ExtractedPassportData {
  passportNumber: string;
  surnameLatin: string;
  givenNamesLatin: string;
  fullNameArabic: string;
  cinNumber?: string;
  nationality?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  sex?: "M" | "F" | string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  mrz1?: string;
  mrz2?: string;
  confidenceScore?: number;
}

interface PassportScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  onImportPilgrim: (newPilgrim: Omit<Pilgrim, "id">) => void;
  onAutoFillForm?: (data: ExtractedPassportData) => void;
}

// Sample Tunisian Passports for instant demo/testing
const DEMO_PASSPORTS = [
  {
    name: "Passeport 1 - Mohamed Ali Trabelsi",
    data: {
      passportNumber: "N3920184",
      surnameLatin: "TRABELSI",
      givenNamesLatin: "MOHAMED ALI",
      fullNameArabic: "محمد علي الطرابلسي",
      cinNumber: "09481920",
      nationality: "TUNISIENNE",
      dateOfBirth: "12/04/1978",
      placeOfBirth: "SFAX - تونس",
      sex: "M",
      issueDate: "15/02/2021",
      expiryDate: "14/02/2026",
      issuingAuthority: "TUNIS",
      mrz1: "P<TUNTRABELSI<<MOHAMED<ALI<<<<<<<<<<<<<<<<<<",
      mrz2: "N3920184<3TUN7804128M260214209481920<<<<<<32",
      confidenceScore: 98,
    },
  },
  {
    name: "Passeport 2 - Fatma Bent Hassen",
    data: {
      passportNumber: "N1094827",
      surnameLatin: "BEN HASSEN",
      givenNamesLatin: "FATMA",
      fullNameArabic: "فاطمة بنت بن حسن",
      cinNumber: "08830192",
      nationality: "TUNISIENNE",
      dateOfBirth: "25/11/1982",
      placeOfBirth: "SOUSSE - سوسة",
      sex: "F",
      issueDate: "03/09/2022",
      expiryDate: "02/09/2027",
      issuingAuthority: "SOUSSE",
      mrz1: "P<TUNBEN<HASSEN<<FATMA<<<<<<<<<<<<<<<<<<<<<",
      mrz2: "N1094827<8TUN8211254F270902608830192<<<<<<40",
      confidenceScore: 96,
    },
  },
];

export const PassportScannerModal: React.FC<PassportScannerModalProps> = ({
  isOpen,
  onClose,
  trips,
  onImportPilgrim,
  onAutoFillForm,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] =
    useState<ExtractedPassportData | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string>(
    trips[0]?.id || "",
  );
  const [phoneInput, setPhoneInput] = useState<string>("98123456");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setExtractedData(null);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else if (file.type === "application/pdf") {
      setPreviewUrl(null); // PDF preview flag
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const processExtraction = async (base64Data: string, mimeType: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/extract-passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: mimeType,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Échec de l'extraction OCR.");
      }

      setExtractedData(result.data);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
          "Impossible de lire le passeport. Assurez-vous que l'image est claire.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUploadAndAnalyze = () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const resultStr = e.target?.result as string;
      processExtraction(resultStr, selectedFile.type || "image/jpeg");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUseDemoPassport = (demoData: ExtractedPassportData) => {
    setIsAnalyzing(true);
    setError(null);
    setTimeout(() => {
      setExtractedData(demoData);
      setIsAnalyzing(false);
    }, 800);
  };

  const handleSavePilgrim = async () => {
    if (!extractedData) return;

    const selectedTrip = trips.find((t) => t.id === selectedTripId);
    const fullNameLatin =
      `${extractedData.givenNamesLatin || ""} ${extractedData.surnameLatin || ""}`.trim();

    let uploadedFileUrl: string | undefined = undefined;
    let uploadedFilePath: string | undefined = undefined;

    if (selectedFile) {
      const uploadRes = await uploadPassportToStorage(
        selectedFile,
        selectedFile.name,
      );
      if (uploadRes) {
        uploadedFileUrl = uploadRes.fileUrl;
        uploadedFilePath = uploadRes.filePath;
      }
    }

    // Ensure tripId is either a valid UUID or null to avoid sending mock/demo ids like 'trip-1' to the backend
    const isValidUUID = (s: any) => typeof s === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);
    const safeTripId = isValidUUID(selectedTripId) ? selectedTripId : null;

    onImportPilgrim({
      nameArabic: extractedData.fullNameArabic || fullNameLatin || "معتمر جديد",
      nameLatin: fullNameLatin || undefined,
      phone: phoneInput || "98000000",
      passportNumber: extractedData.passportNumber,
      tripId: safeTripId,
      tripName: selectedTrip ? selectedTrip.name : "—",
      uniqueCode: `TUN-${Math.floor(100000 + Math.random() * 900000)}`,
      status: "مؤكد",
      emergencyContact: `Tél CIN: ${extractedData.cinNumber || "Non spécifié"}`,
      avatarUrl: DEFAULT_AVATAR_URL,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Extraction de Passeport Tunisien
                </h2>
              </div>
              <p className="text-[11px] text-slate-400">
                Numérisation automatique par l'intelligence artificielle Gemini
                (Passeports & PDFs)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Instructions & Demo Quick Action */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-700 space-y-0.5">
              <p className="font-bold flex items-center gap-1.5 text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Lecture automatique sécurisée
              </p>
              <p className="text-[11px] text-slate-500">
                Importez une photo claire ou un fichier PDF du passeport
                tunisien. L'IA extrait automatiquement le numéro, le nom en
                arabe/latin, la CIN et les dates.
              </p>
            </div>

            {/* Demo buttons */}
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Démo :
              </span>
              <button
                type="button"
                onClick={() => handleUseDemoPassport(DEMO_PASSPORTS[0].data)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-black text-[11px] font-bold text-slate-800 shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>🇹🇳 Exemple 1</span>
              </button>
              <button
                type="button"
                onClick={() => handleUseDemoPassport(DEMO_PASSPORTS[1].data)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-black text-[11px] font-bold text-slate-800 shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>🇹🇳 Exemple 2</span>
              </button>
            </div>
          </div>

          {!extractedData && (
            /* Upload Zone */
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  selectedFile
                    ? "border-black bg-slate-50/80"
                    : "border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileChange(e.target.files[0])
                  }
                />

                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <Upload className="w-6 h-6 text-slate-600" />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedFile
                      ? selectedFile.name
                      : "Glissez-déposez la photo ou le PDF du passeport"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Formats acceptés: JPG, PNG, WEBP, PDF (Max 10Mo)
                  </p>
                </div>

                {previewUrl && (
                  <div className="mt-2 relative max-h-48 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                    <img
                      src={previewUrl}
                      alt="Aperçu passeport"
                      className="max-h-44 object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Error Box */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Analyze Trigger */}
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!selectedFile || isAnalyzing}
                  onClick={handleUploadAndAnalyze}
                  className="bg-black hover:bg-slate-900 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 text-xs cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyse IA en cours (Gemini)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Lancer la numérisation OCR</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Results View */}
          {extractedData && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Données extraites avec succès (
                    {extractedData.confidenceScore || 95}% de précision)
                  </span>
                </div>

                <button
                  onClick={() => setExtractedData(null)}
                  className="text-xs text-slate-500 hover:text-black font-semibold underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scanner un autre passeport</span>
                </button>
              </div>

              {/* Form Grid for Editing Extracted Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Passport Number */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    N° de Passeport Tunisien *
                  </label>
                  <input
                    type="text"
                    value={extractedData.passportNumber || ""}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        passportNumber: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>

                {/* CIN Number */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Numéro de CIN (بطاقة تعريف)
                  </label>
                  <input
                    type="text"
                    value={extractedData.cinNumber || ""}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        cinNumber: e.target.value,
                      })
                    }
                    placeholder="Ex: 08812345"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>

                {/* Name Arabic */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-semibold text-slate-700">
                    الاسم واللقب باللغة العربية (Nom & Prénom en Arabe) *
                  </label>
                  <input
                    type="text"
                    value={extractedData.fullNameArabic || ""}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        fullNameArabic: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 text-sm text-start focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>

                {/* Surname Latin */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Nom (Français / Latin)
                  </label>
                  <input
                    type="text"
                    value={extractedData.surnameLatin || ""}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        surnameLatin: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 uppercase font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>

                {/* Given Names Latin */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Prénom(s) (Français / Latin)
                  </label>
                  <input
                    type="text"
                    value={extractedData.givenNamesLatin || ""}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        givenNamesLatin: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 uppercase font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>

                {/* Date of Birth & Sex */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Date de Naissance
                  </label>
                  <input
                    type="text"
                    value={extractedData.dateOfBirth || ""}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        dateOfBirth: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Sexe</label>
                  <select
                    value={extractedData.sex || "M"}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        sex: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                  >
                    <option value="M">Masculin (Homme / ذكر)</option>
                    <option value="F">Féminin (Femme / أنثى)</option>
                  </select>
                </div>

                {/* Expiry Date & Place of Birth */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Date d'Expiration Passeport
                  </label>
                  <input
                    type="text"
                    value={extractedData.expiryDate || ""}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        expiryDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Lieu de Naissance
                  </label>
                  <input
                    type="text"
                    value={extractedData.placeOfBirth || ""}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        placeOfBirth: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>

                {/* MRZ Band Display */}
                {extractedData.mrz1 && (
                  <div className="md:col-span-2 space-y-1 bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[10px] overflow-x-auto">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1">
                      Zone Optique MRZ (Bande Inférieure)
                    </p>
                    <p>{extractedData.mrz1}</p>
                    <p>{extractedData.mrz2}</p>
                  </div>
                )}

                {/* Assign to Trip & Phone */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/50 border border-amber-200/80 p-4 rounded-xl mt-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">
                      Voyage d'Umrah à assigner
                    </label>
                    <select
                      value={selectedTripId}
                      onChange={(e) => setSelectedTripId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                    >
                      {trips.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">
                      Numéro de Téléphone (Tunisie)
                    </label>
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="98123456"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSavePilgrim}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900 shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Enregistrer le MOUTAMIR (Pèlerin)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
