import React, { useState, useRef, useEffect } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  X,
  ShieldCheck,
} from "lucide-react";
import { Pilgrim, Trip, DEFAULT_AVATAR_URL } from "../types";
import { uploadPassportToStorage } from "../services/documentsService";

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

interface PendingDocument {
  filePath: string;
  fileUrl?: string;
  mimeType?: string;
  fileName?: string;
}

interface PassportScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  onImportPilgrim: (
    newPilgrim: Omit<Pilgrim, "id">,
    pendingDocument?: PendingDocument,
  ) => void;
  onAutoFillForm?: (data: ExtractedPassportData) => void;
}

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

  const [currentStep, setCurrentStep] = useState<number>(1); // 1: upload/extract, 2: crop/upload, 3: assign/save
  const [pendingDocument, setPendingDocument] =
    useState<PendingDocument | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Revoke the previous blob URL whenever it changes, and on unmount.
  // Centralizing this here means callers never have to remember to do it
  // themselves (a source of leaked blob URLs in the old implementation).
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch (e) {
          /* ignore */
        }
      }
    };
  }, [previewUrl]);

  const resetScanState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setCurrentStep(1);
    setPendingDocument(null);
    setUploadFailed(false);
    setError(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const handleFileChange = (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      setError("Formats acceptés: JPG, PNG, WEBP, PDF.");
      return;
    }

    setSelectedFile(file);
    setError(null);
    setExtractedData(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    // PDFs have no inline <img> preview; the file itself is still sent to
    // the extraction API as base64.
    setPreviewUrl(isImage ? URL.createObjectURL(file) : null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Used in steps 2/3 to swap in a different photo without discarding the
  // already-extracted passport data. Replacing the photo invalidates any
  // previously uploaded document, so we clear that too.
  const handleReplaceImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Seules les images (JPG, PNG, WEBP) sont acceptées.");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCrop(undefined);
    setCompletedCrop(undefined);
    setPendingDocument(null);
    setUploadFailed(false);
  };

  // --- Cropping (react-image-crop) ---
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const onCropImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 80 }, 3 / 4, width, height),
      width,
      height,
    );
    setCrop(initialCrop);
  };

  const performCrop = async () => {
    const image = imgRef.current;
    if (
      !image ||
      !completedCrop ||
      !completedCrop.width ||
      !completedCrop.height
    ) {
      setIsCropOpen(false);
      return;
    }

    try {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(pixelCrop.width));
      canvas.height = Math.max(1, Math.round(pixelCrop.height));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context indisponible");

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      );

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95),
      );

      if (blob) {
        const croppedFile = new File(
          [blob],
          `cropped_${selectedFile?.name || "image.jpg"}`,
          { type: "image/jpeg" },
        );

        setSelectedFile(croppedFile);
        setPreviewUrl(URL.createObjectURL(croppedFile));
        // The crop invalidates any already-uploaded document.
        setPendingDocument(null);
        setUploadFailed(false);
      }
    } catch (err) {
      console.error("performCrop error", err);
      setError("Recadrage échoué");
    }

    setIsCropOpen(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
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
      onAutoFillForm?.(result.data as ExtractedPassportData);
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
      if (!resultStr) {
        setError("Impossible de lire le fichier sélectionné.");
        return;
      }
      processExtraction(resultStr, selectedFile.type || "image/jpeg");
    };
    reader.onerror = () => {
      setError("Impossible de lire le fichier sélectionné.");
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

  const uploadCurrentFile = async (): Promise<boolean> => {
    setIsAnalyzing(true);
    setError(null);
    setUploadFailed(false);
    try {
      if (selectedFile) {
        const uploadRes = await uploadPassportToStorage(
          selectedFile,
          selectedFile.name,
        );
        if (!uploadRes) throw new Error("Échec du téléversement");
        setPendingDocument({
          filePath: uploadRes.filePath,
          fileUrl: uploadRes.fileUrl,
          mimeType: selectedFile.type,
          fileName: selectedFile.name,
        });
      } else {
        setPendingDocument(null);
      }
      return true;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Échec du téléversement");
      setUploadFailed(true);
      return false;
    } finally {
      setIsAnalyzing(false);
    }
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
      status: "مؤكد" as Pilgrim["status"],
      emergencyContact: `Tél CIN: ${extractedData.cinNumber || "Non spécifié"}`,
      // Use the passport photo that was actually uploaded/cropped instead of
      // silently falling back to the placeholder every time.
      avatarUrl: pendingDocument?.fileUrl || DEFAULT_AVATAR_URL,
    };

    onImportPilgrim(newPilgrim, pendingDocument || undefined);

    onClose();
  };

  if (!isOpen) return null;

  const renderCropModal = () => {
    if (!isCropOpen || !previewUrl) return null;
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-6">
        <div className="bg-white rounded-xl p-4 max-w-3xl w-full">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-sm">Recadrage manuel</h4>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsCropOpen(false);
                  setCrop(undefined);
                  setCompletedCrop(undefined);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={performCrop}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Appliquer
              </button>
            </div>
          </div>
          <div className="relative w-full max-h-[70vh] border border-slate-200 overflow-auto bg-black flex items-center justify-center">
            <ReactCrop
              crop={crop}
              aspect={3 / 4}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
            >
              <img
                ref={imgRef}
                src={previewUrl}
                alt="À recadrer"
                onLoad={onCropImageLoad}
                className="max-h-[65vh] w-auto"
              />
            </ReactCrop>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Faites glisser les coins pour ajuster le cadrage, puis cliquez sur «
            Appliquer ».
          </p>
        </div>
      </div>
    );
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
          {/* Top Instructions */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-700 space-y-0.5">
              <p className="font-bold flex items-center gap-1.5 text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Lecture automatique sécurisée
              </p>
              <p className="text-[11px] text-slate-500">
                Importez une photo claire du passeport tunisien, bien cadrée sur
                les deux lignes MRZ en bas de la page. L'OCR en extrait
                automatiquement le numéro, le nom, la nationalité et les dates.
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
                  accept="image/jpeg,image/png,image/webp"
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
                      : "Glissez-déposez la photo du passeport"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Formats acceptés: JPG, PNG, WEBP (Max 10Mo)
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
                      <span>Analyse OCR en cours...</span>
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

          {/* Results View - Step 2: preview & crop / replace image */}
          {extractedData && currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
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
                      onClick={() => setIsCropOpen(true)}
                      disabled={!previewUrl}
                      className="px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-all"
                    >
                      Cropper manuellement
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-all"
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
                        handleReplaceImage(e.target.files[0])
                      }
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    Vous pouvez recadrer manuellement l'image du passeport ou
                    télécharger une image différente à utiliser comme photo.
                  </p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={resetScanState}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold"
                    >
                      Retour
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          await uploadCurrentFile();
                          // Always advance to assignment step; upload
                          // failures are surfaced via the warning banner
                          // and the fallback "continue without upload" option.
                          setCurrentStep(3);
                        }}
                        disabled={isAnalyzing}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-50"
                      >
                        {isAnalyzing
                          ? "Téléversement..."
                          : "Suivant: Affecter au voyage"}
                      </button>

                      {uploadFailed && (
                        <button
                          onClick={() => {
                            // proceed without upload (fallback)
                            setPendingDocument(null);
                            setUploadFailed(false);
                            setCurrentStep(3);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-700"
                        >
                          Continuer sans téléversement
                        </button>
                      )}
                    </div>
                  </div>

                  {error && currentStep === 2 && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 mt-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </div>

              {renderCropModal()}
            </div>
          )}

          {/* Step 3: review extracted data, assign to trip, save */}
          {extractedData && currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Données extraites avec succès (
                    {extractedData.confidenceScore ?? 70}% de confiance OCR)
                  </span>
                </div>

                <button
                  onClick={resetScanState}
                  className="text-xs text-slate-500 hover:text-black font-semibold underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scanner un autre passeport</span>
                </button>
              </div>

              {uploadFailed && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Le téléversement de l'image a échoué. Le pèlerin sera
                    enregistré avec la photo par défaut.
                  </span>
                </div>
              )}

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
                      onClick={() => setIsCropOpen(true)}
                      disabled={!previewUrl}
                      className="px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-all"
                    >
                      Cropper manuellement
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-all"
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
                        handleReplaceImage(e.target.files[0])
                      }
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    Vous pouvez recadrer manuellement l'image du passeport ou
                    télécharger une image différente à utiliser comme photo.
                    {pendingDocument
                      ? " Cette image sera enregistrée comme photo du pèlerin."
                      : ""}
                  </p>

                  {(previewUrl || selectedFile) &&
                    !pendingDocument &&
                    !uploadFailed && (
                      <button
                        type="button"
                        onClick={() => uploadCurrentFile()}
                        disabled={isAnalyzing}
                        className="self-start px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-50"
                      >
                        {isAnalyzing
                          ? "Téléversement..."
                          : "Téléverser cette image"}
                      </button>
                    )}
                </div>
              </div>

              {renderCropModal()}

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
