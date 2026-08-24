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
import { checkPilgrimPassportExists } from "../services/pilgrimsService";
import { GoogleGenAI, Type } from "@google/genai";
import { useTranslation } from "react-i18next";
import {
  cleanArabicFullName,
  cleanLatinSurname,
  formatLatinFullName,
} from "../lib/passportUtils";

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
    pendingDocument?: {
      filePath: string;
      fileUrl?: string;
      mimeType?: string;
      fileName?: string;
    },
    extractedData?: ExtractedPassportData,
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
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] =
    useState<ExtractedPassportData | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string>(
    trips[0]?.id || "",
  );

  const [currentStep, setCurrentStep] = useState<number>(1); // 1: upload/extract, 2: crop/upload, 3: assign/save
  const [pendingDocument, setPendingDocument] =
    useState<PendingDocument | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

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
      setError(t("scanner.accepted_formats"));
      return;
    }

    setSelectedFile(file);
    setError(null);
    setExtractedData(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setPreviewUrl(isImage ? URL.createObjectURL(file) : null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleReplaceImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("scanner.accepted_formats"));
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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Clé API Gemini introuvable dans VITE_GEMINI_API_KEY.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");

      const prompt = `
Vous êtes un expert OCR spécialisé dans la lecture et l'extraction de données à partir de passeports tunisiens (Passeport de la République Tunisienne / الجمهورية التونسية - جواز سفر).
Analyse minutieusement l'image ou le document PDF du passeport tunisien fourni et extrait toutes les informations clés dans le format JSON strict requis.

Règles impératives d'extraction des noms:
1. Nom de famille et prénom(s) en français / latin (surnameLatin, givenNamesLatin):
   - Pour les hommes et femmes célibataires: extrayez le nom de famille (Surname) dans surnameLatin (ex: "GOLLI") et le(s) prénom(s) (Given names) dans givenNamesLatin (ex: "BECHIR").
   - Pour les femmes mariées: sur le passeport, le champ Surname affiche souvent le nom de jeune fille suivi de "EP" et du nom du mari (ex: "ZGUEB EP SAIBI"). Vous devez extraire UNIQUEMENT son nom de famille d'origine / de jeune fille dans surnameLatin (ex: "ZGUEB") et son prénom dans givenNamesLatin (ex: "ANWAR"). Ignorez totalement la mention "EP [Nom du mari]".
2. Nom complet en arabe (fullNameArabic):
   - Pour les hommes: sur le passeport tunisien, le nom est écrit sous la forme "[الاسم] بن [اسم الأب] [اللقب]" (ex: "البشير بن بوراوي القلي" ou "بدر بن البشير قرشان"). Extrayez UNIQUEMENT le prénom et le nom de famille en arabe (ex: "البشير القلي", "بدر قرشان"), sans inclure la filiation ("بن [اسم الأب]").
   - Pour les femmes mariées: sur le passeport tunisien, le nom est écrit sous la forme "[الاسم] بنت [اسم الأب] [اللقب الأصلي] حرم [لقب الزوج]" (ex: "أنوار بنت محمد زقاب حرم سائبي"). Extrayez UNIQUEMENT son prénom et son nom de famille d'origine de jeune fille (ex: "أنوار زقاب"), en ignorant la filiation ("بنت [اسم الأب]") ET en ignorant le nom du mari ("حرم [لقب الزوج]").
3. Autres champs:
   - Numéro de passeport (passportNumber) (ex: U957040 ou U770586).
   - CIN (cinNumber): Numéro de carte d'identité nationale (ex: 06426334 ou 02812955).
   - Sexe (sex): "M" pour ذكر / Homme, "F" pour أنثى / Femme.
   - Dates: dateOfBirth, issueDate, expiryDate au format JJ-MM-AAAA ou JJ/MM/AAAA.
   - Lieu de naissance (placeOfBirth) et Autorité d'émission (issuingAuthority).
   - Bandes MRZ (mrz1, mrz2) si présentes.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: prompt },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              passportNumber: { type: Type.STRING },
              surnameLatin: { type: Type.STRING },
              givenNamesLatin: { type: Type.STRING },
              fullNameArabic: { type: Type.STRING },
              cinNumber: { type: Type.STRING },
              nationality: { type: Type.STRING },
              dateOfBirth: { type: Type.STRING },
              placeOfBirth: { type: Type.STRING },
              sex: { type: Type.STRING },
              issueDate: { type: Type.STRING },
              expiryDate: { type: Type.STRING },
              issuingAuthority: { type: Type.STRING },
              mrz1: { type: Type.STRING },
              mrz2: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER },
            },
            required: [
              "passportNumber",
              "surnameLatin",
              "givenNamesLatin",
              "fullNameArabic",
              "dateOfBirth",
              "expiryDate",
            ],
          },
        },
      });

      const data = JSON.parse(response.text || "{}");

      if (data.surnameLatin) {
        data.surnameLatin = cleanLatinSurname(data.surnameLatin);
      }
      if (data.givenNamesLatin) {
        data.givenNamesLatin = data.givenNamesLatin.trim();
      }
      if (data.fullNameArabic) {
        data.fullNameArabic = cleanArabicFullName(data.fullNameArabic);
      }

      setExtractedData(data);
      onAutoFillForm?.(data);
      setCurrentStep(2);
    } catch (err: any) {
      console.error("Erreur OCR:", err);
      setError(err.message || "Échec de l'analyse du passeport.");
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

    const normalizedPassport = extractedData.passportNumber
      ?.trim()
      .toUpperCase();
    if (normalizedPassport) {
      const check = await checkPilgrimPassportExists(normalizedPassport);
      if (check.exists) {
        setError(
          `Ce numéro de passeport (${normalizedPassport}) existe déjà dans la base de données !`,
        );
        return;
      }
    }

    const selectedTrip = trips.find((t) => t.id === selectedTripId);
    const fullNameLatin = formatLatinFullName(
      extractedData.surnameLatin,
      extractedData.givenNamesLatin,
    );

    const isValidUUID = (s: any) =>
      typeof s === "string" &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        s,
      );
    const safeTripId = isValidUUID(selectedTripId) ? selectedTripId : "";

    const newPilgrim = {
      nameArabic:
        cleanArabicFullName(extractedData.fullNameArabic) ||
        fullNameLatin ||
        "معتمر جديد",
      nameLatin: fullNameLatin || undefined,
      passportNumber: normalizedPassport || extractedData.passportNumber,
      birthDate: normalizeBirthDate(extractedData.dateOfBirth),
      tripId: safeTripId,
      tripName: selectedTrip ? selectedTrip.name : "—",
      uniqueCode: `TUN-${Math.floor(100000 + Math.random() * 900000)}`,
      status: "مؤكد" as Pilgrim["status"],
      emergencyContact: `Tél CIN: ${extractedData.cinNumber || "Non spécifié"}`,
      avatarUrl: pendingDocument?.fileUrl || DEFAULT_AVATAR_URL,
    };

    onImportPilgrim(newPilgrim, pendingDocument || undefined, extractedData);
    onClose();
  };

  if (!isOpen) return null;

  const renderCropModal = () => {
    if (!isCropOpen || !previewUrl) return null;
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-6">
        <div className="bg-white rounded-xl p-4 max-w-3xl w-full">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-sm">{t("scanner.crop_manually")}</h4>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsCropOpen(false);
                  setCrop(undefined);
                  setCompletedCrop(undefined);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold"
              >
                {t("buttons.cancel")}
              </button>
              <button
                onClick={performCrop}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                {t("buttons.apply")}
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
                  {t("scanner.modal_title")}
                </h2>
              </div>
              <p className="text-[11px] text-slate-400">
                {t("scanner.modal_subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("buttons.close")}
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
                {t("scanner.secure_read")}
              </p>
              <p className="text-[11px] text-slate-500">
                {t("scanner.secure_desc")}
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
                    {selectedFile ? selectedFile.name : t("scanner.drop_text")}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t("scanner.accepted_formats")}
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
                      <span>{t("scanner.analyzing")}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{t("scanner.start_ocr")}</span>
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
                    {t("scanner.data_extracted")} — {t("scanner.step_image")}
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
                      {t("scanner.crop_manually")}
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-all"
                    >
                      {t("scanner.upload_other_image")}
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

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={resetScanState}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold"
                    >
                      {t("buttons.cancel")}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          await uploadCurrentFile();
                          setCurrentStep(3);
                        }}
                        disabled={isAnalyzing}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-50"
                      >
                        {isAnalyzing
                          ? "Téléversement..."
                          : t("scanner.next_assign_trip")}
                      </button>

                      {uploadFailed && (
                        <button
                          onClick={() => {
                            setPendingDocument(null);
                            setUploadFailed(false);
                            setCurrentStep(3);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-700"
                        >
                          {t("scanner.continue_without_upload")}
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
                    {t("scanner.data_extracted")} (
                    {extractedData.confidenceScore ?? 95}%)
                  </span>
                </div>

                <button
                  onClick={resetScanState}
                  className="text-xs text-slate-500 hover:text-black font-semibold underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t("scanner.scan_another")}</span>
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

              {/* Form Grid for Editing Extracted Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Passport Number */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    {t("scanner.passport_number")}
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
                    {t("scanner.cin")}
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
                    {t("scanner.fullname_ar")}
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
                    {t("scanner.surname_latin")}
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
                    {t("scanner.given_names_latin")}
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
                    {t("scanner.birth_date")}
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
                  <label className="font-semibold text-slate-700">
                    {t("scanner.gender")}
                  </label>
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
                    <option value="M">{t("scanner.male")}</option>
                    <option value="F">{t("scanner.female")}</option>
                  </select>
                </div>

                {/* Expiry Date & Place of Birth */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    {t("scanner.expiry_date")}
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
                    {t("scanner.place_of_birth")}
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

                {/* Assign to Trip */}
                <div className="md:col-span-2 bg-amber-50/50 border border-amber-200/80 p-4 rounded-xl mt-2 space-y-1">
                  <label className="font-bold text-slate-800">
                    {t("scanner.trip_to_assign")}
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
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {t("buttons.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSavePilgrim}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900 shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{t("scanner.save_pilgrim")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
