import React, { useState, useRef, useEffect } from "react";
import Cropper from 'react-easy-crop';
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
  onImportPilgrim: (
    newPilgrim: Omit<Pilgrim, "id">,
    pendingDocument?: {
      filePath: string;
      fileUrl?: string;
      mimeType?: string;
      fileName?: string;
    },
  ) => void;
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

  const [currentStep, setCurrentStep] = useState<number>(1); // 1: extract/upload, 2: crop/upload, 3: assign/save
  const [pendingDocument, setPendingDocument] = useState<{ filePath: string; fileUrl?: string; mimeType?: string; fileName?: string } | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    // revoke previous preview URL if any
    if (previewUrl && previewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (e) {
        /* ignore */
      }
    }

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

  // Cropping helpers
  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileSelected = (file?: File) => {
    if (!file) return;
    // revoke old preview
    if (previewUrl && previewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (e) {}
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const [isCropOpen, setIsCropOpen] = useState(false);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [lastCroppedFile, setLastCroppedFile] = useState<File | null>(null);
  const [lastCroppedArea, setLastCroppedArea] = useState<any>(null);

  // react-easy-crop helpers
  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (e) => reject(e));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, pixelCrop.width);
    canvas.height = Math.max(1, pixelCrop.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const performEasyCrop = async () => {
    if (!previewUrl || !croppedAreaPixels) {
      setIsCropOpen(false);
      return;
    }

    try {
      const blob = await getCroppedImg(previewUrl, croppedAreaPixels);
      if (blob) {
        const croppedFile = new File([blob], `cropped_${selectedFile?.name || 'image.jpg'}`, { type: 'image/jpeg' });

        // Revoke previous URL
        if (previewUrl && previewUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(previewUrl); } catch (e) {}
        }

        const newPreviewUrl = URL.createObjectURL(croppedFile);
        setSelectedFile(croppedFile);
        setLastCroppedFile(croppedFile);
        setPreviewUrl(newPreviewUrl);
        setLastCroppedArea(croppedAreaPixels);
      }
    } catch (err) {
      console.error('performEasyCrop error', err);
      setError('Recadrage échoué');
    }

    setIsCropOpen(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
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

      const text = await response.text();
      let result: {
        success?: boolean;
        error?: string;
        data?: ExtractedPassportData;
      } | null = null;

      try {
        result = text ? JSON.parse(text) : null;
      } catch {
        result = null;
      }

      if (!response.ok || !result || !result.success) {
        const message =
          result?.error ||
          "Le scan OCR n'est pas disponible sur cette plateforme statique. Utilisez l'application serveur ou chargez un passeport de démonstration.";
        throw new Error(message);
      }

      setExtractedData(result.data || null);
      setCurrentStep(2);
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

  const normalizeBirthDate = (value?: string): string | undefined => {
    if (!value) return undefined;

    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
    if (isoMatch) return trimmed;

    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dashMatch) {
      const [, day, month, year] = dashMatch;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    return trimmed;
  };

  const handleSavePilgrim = async () => {
    if (!extractedData) return;

    const selectedTrip = trips.find((t) => t.id === selectedTripId);
    const fullNameLatin =
      `${extractedData.givenNamesLatin || ""} ${extractedData.surnameLatin || ""}`.trim();

    // Ensure tripId is either a valid UUID or empty string to avoid sending mock/demo ids like 'trip-1' to the backend
    const isValidUUID = (s: any) =>
      typeof s === "string" &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        s,
      );
    const safeTripId = isValidUUID(selectedTripId) ? selectedTripId : "";

    const newPilgrim = {
      nameArabic: extractedData.fullNameArabic || fullNameLatin || "معتمر جديد",
      nameLatin: fullNameLatin || undefined,
      phone: phoneInput || "98000000",
      passportNumber: extractedData.passportNumber,
      birthDate: normalizeBirthDate(extractedData.dateOfBirth),
      tripId: safeTripId,
      tripName: selectedTrip ? selectedTrip.name : "—",
      uniqueCode: `TUN-${Math.floor(100000 + Math.random() * 900000)}`,
      status: "مؤكد",
      emergencyContact: `Tél CIN: ${extractedData.cinNumber || "Non spécifié"}`,
      avatarUrl: DEFAULT_AVATAR_URL,
    };

    onImportPilgrim(newPilgrim, pendingDocument || undefined);

    onClose();
  };

  if (!isOpen) return null;

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
          {extractedData && currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* STEP 2: Preview & manual crop / upload */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Données extraites — Étape 2: Image (recadrer / remplacer)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-36 h-36 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-slate-400">Aucun aperçu</div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-center gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { if (lastCroppedArea) { setCrop({ x: lastCroppedArea.x || 0, y: lastCroppedArea.y || 0 }); setZoom(1); } setIsCropOpen(true); }}
                      disabled={!previewUrl}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-black text-[11px] font-bold text-slate-800 shadow-2xs transition-all"
                    >
                      Cropper manuellement
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-black text-[11px] font-bold text-slate-800 shadow-2xs transition-all"
                    >
                      Téléverser une autre image
                    </button>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleFileSelected(e.target.files[0])
                      }
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    Vous pouvez recadrer manuellement l'image du passeport ou
                    télécharger une image différente à utiliser comme photo.
                  </p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setExtractedData(null);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setCurrentStep(1);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100"
                    >
                      Retour
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          // upload and proceed to step 3
                          setIsAnalyzing(true);
                          setError(null);
                          setUploadFailed(false);
                          try {
                            let uploadedFileUrl: string | undefined;
                            let uploadedFilePath: string | undefined;
                            const fileToUpload = lastCroppedFile ?? selectedFile;
                            if (fileToUpload) {
                              const uploadRes = await uploadPassportToStorage(fileToUpload, fileToUpload.name);
                              if (!uploadRes) throw new Error('Échec du téléversement');
                              uploadedFileUrl = uploadRes.fileUrl;
                              uploadedFilePath = uploadRes.filePath;
                            }
                            setPendingDocument(uploadedFilePath ? { filePath: uploadedFilePath, fileUrl: uploadedFileUrl, mimeType: (lastCroppedFile?.type ?? selectedFile?.type), fileName: (lastCroppedFile?.name ?? selectedFile?.name) } : null);
                            setCurrentStep(3);
                          } catch (err: any) {
                            console.error(err);
                            setError(err.message || 'Upload failed');
                            setUploadFailed(true);
                          } finally {
                            setIsAnalyzing(false);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-black hover:bg-slate-900 text-white font-bold"
                      >Suivant: Affecter au voyage</button>

                      {uploadFailed && (
                        <button
                          onClick={() => {
                            // proceed without upload (fallback)
                            setPendingDocument(null);
                            setUploadFailed(false);
                            setCurrentStep(3);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold"
                        >Continuer sans téléversement</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cropping Overlay */}
              {isCropOpen && previewUrl && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-6">
                  <div className="bg-white rounded-xl p-4 max-w-3xl w-full">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm">Recadrage manuel</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsCropOpen(false);
                            setCrop({ x: 0, y: 0 });
                            setZoom(1); setCroppedAreaPixels(null);
                          }}
                          className="px-3 py-1.5 rounded bg-slate-100"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={performEasyCrop}
                          className="px-3 py-1.5 rounded bg-black hover:bg-slate-900 text-white font-bold"
                        >
                          Appliquer
                        </button>
                      </div>
                    </div>
                    <div className="relative w-full h-96 border border-slate-200 overflow-hidden">
                      <div className="relative w-full h-full bg-black">
                        <Cropper
                          image={previewUrl as string}
                          crop={crop}
                          zoom={zoom}
                          aspect={3 / 4}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={(_croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                        />
                      </div>
                      <div className="mt-3">
                        <input
                          type="range"
                          min={1}
                          max={3}
                          step={0.1}
                          value={zoom}
                          onChange={(e) => setZoom(Number((e.target as HTMLInputElement).value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {extractedData && currentStep === 3 && (
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

              {/* Image Preview & Manual Crop / Upload Actions */}
              <div className="flex items-start gap-4">
                <div className="w-36 h-36 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-slate-400">Aucun aperçu</div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-center gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { if (lastCroppedArea) { setCrop({ x: lastCroppedArea.x || 0, y: lastCroppedArea.y || 0 }); setZoom(1); } setIsCropOpen(true); }}
                      disabled={!previewUrl}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-black text-[11px] font-bold text-slate-800 shadow-2xs transition-all"
                    >
                      Cropper manuellement
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-black text-[11px] font-bold text-slate-800 shadow-2xs transition-all"
                    >
                      Téléverser une autre image
                    </button>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleFileSelected(e.target.files[0])
                      }
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    Vous pouvez recadrer manuellement l'image du passeport ou
                    télécharger une image différente à utiliser comme photo.
                  </p>
                </div>
              </div>

              {/* Cropping Overlay */}
              {isCropOpen && previewUrl && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-6">
                  <div className="bg-white rounded-xl p-4 max-w-3xl w-full">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm">Recadrage manuel</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsCropOpen(false);
                            setCrop({ x: 0, y: 0 });
                            setZoom(1); setCroppedAreaPixels(null);
                          }}
                          className="px-3 py-1.5 rounded bg-slate-100"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={performEasyCrop}
                          className="px-3 py-1.5 rounded bg-black hover:bg-slate-900 text-white font-bold"
                        >
                          Appliquer
                        </button>
                      </div>
                    </div>
                    <div className="relative w-full h-96 border border-slate-200 overflow-hidden">
                      <div className="relative w-full h-full bg-black">
                        <Cropper
                          image={previewUrl as string}
                          crop={crop}
                          zoom={zoom}
                          aspect={3 / 4}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={(_croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                        />
                      </div>
                      <div className="mt-3">
                        <input
                          type="range"
                          min={1}
                          max={3}
                          step={0.1}
                          value={zoom}
                          onChange={(e) => setZoom(Number((e.target as HTMLInputElement).value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
