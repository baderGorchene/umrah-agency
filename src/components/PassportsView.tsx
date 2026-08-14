import React, { useState, useRef, useMemo } from "react";
import {
  Scan,
  Sparkles,
  Plus,
  Search,
  Printer,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Edit3,
  UserPlus,
  FileSpreadsheet,
  ShieldCheck,
  Eye,
  X,
  RefreshCw,
  Upload,
  ArrowUpDown,
  User,
  Users,
  Clock,
  Info,
} from "lucide-react";
import {
  Language,
  PassportEntry,
  Trip,
  Pilgrim,
  DEFAULT_AVATAR_URL,
} from "../types";
import { GoogleGenAI, Type } from "@google/genai";
import { uploadPassportToStorage } from "../services/documentsService";
import * as XLSX from "xlsx";

interface PassportsViewProps {
  lang: Language;
  passports: PassportEntry[];
  onAddPassport: (entry: Omit<PassportEntry, "id" | "scannedAt">) => {
    success: boolean;
    duplicate?: boolean;
    existing?: PassportEntry;
  };
  onEditPassport: (entry: PassportEntry) => void;
  onDeletePassport: (id: string) => void;
  trips: Trip[];
  onAddPilgrim?: (
    newPilgrim: Omit<Pilgrim, "id">,
    pendingDocument?: {
      filePath: string;
      fileUrl?: string;
      mimeType?: string;
      fileName?: string;
    },
  ) => void;
}

export const PassportsView: React.FC<PassportsViewProps> = ({
  lang,
  passports,
  onAddPassport,
  onEditPassport,
  onDeletePassport,
  trips,
  onAddPilgrim,
}) => {
  const isAr = lang === "AR";

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("ALL");
  const [expiryFilter, setExpiryFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<keyof PassportEntry>("scannedAt");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Scanner & Modal States
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PassportEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inspectingEntry, setInspectingEntry] = useState<PassportEntry | null>(
    null,
  );
  const [transferringEntry, setTransferringEntry] =
    useState<PassportEntry | null>(null);
  const [selectedTripForTransfer, setSelectedTripForTransfer] =
    useState<string>(trips[0]?.id || "");

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [copiedTable, setCopiedTable] = useState(false);

  // Scanner upload & OCR state for the integrated quick-scanner & modal
  const [isScanning, setIsScanning] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    fullNameArabic: "",
    fullNameLatin: "",
    gender: "M" as "M" | "F",
    passportNumber: "",
    birthDate: "",
    deliberationDate: "",
    expiryDate: "",
    cinNumber: "",
    placeOfBirth: "",
    notes: "",
  });

  const showToast = (
    text: string,
    type: "success" | "error" | "warning" = "success",
  ) => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to normalize date string to DD/MM/YYYY
  const formatDisplayDate = (val?: string): string => {
    if (!val) return "—";
    const trimmed = val.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
    const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) {
      return `${iso[3].padStart(2, "0")}/${iso[2].padStart(2, "0")}/${iso[1]}`;
    }
    const dash = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dash) {
      return `${dash[1].padStart(2, "0")}/${dash[2].padStart(2, "0")}/${dash[3]}`;
    }
    return trimmed;
  };

  // Check validity / expiry status of passport
  const checkExpiryStatus = (
    expiryDateStr?: string,
  ): {
    status: "valid" | "warning" | "expired";
    labelFr: string;
    labelAr: string;
  } => {
    if (!expiryDateStr)
      return { status: "valid", labelFr: "Inconnu", labelAr: "غير محدد" };

    // Parse DD/MM/YYYY or YYYY-MM-DD
    let expDate: Date | null = null;
    const slash = expiryDateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slash) {
      expDate = new Date(
        parseInt(slash[3], 10),
        parseInt(slash[2], 10) - 1,
        parseInt(slash[1], 10),
      );
    } else {
      const parsed = Date.parse(expiryDateStr);
      if (!isNaN(parsed)) expDate = new Date(parsed);
    }

    if (!expDate || isNaN(expDate.getTime())) {
      return { status: "valid", labelFr: "Non spécifié", labelAr: "غير محدد" };
    }

    const now = new Date();
    const diffMonths =
      (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);

    if (diffMonths <= 0) {
      return {
        status: "expired",
        labelFr: "Expiré",
        labelAr: "منتهي الصلاحية",
      };
    }
    if (diffMonths < 6) {
      return {
        status: "warning",
        labelFr: "Expire dans < 6 mois",
        labelAr: "ينتهي قريباً (< 6 أشهر)",
      };
    }
    return { status: "valid", labelFr: "Valide", labelAr: "صالح" };
  };

  // Execute Gemini AI OCR Extraction
  const processPassportOCR = async (file: File) => {
    setIsScanning(true);
    setScanError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(
          isAr
            ? "مفتاح Gemini API غير متوفر في متغيرات البيئة."
            : "Clé API Gemini introuvable dans les variables d'environnement.",
        );
      }

      // Convert file to base64
      const base64Data: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
      const mimeType = file.type || "image/jpeg";

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
Vous êtes un expert OCR spécialisé dans la lecture et l'extraction de données à partir de passeports tunisiens (Passeport de la République Tunisienne / الجمهورية التونسية - جواز سفر).
Analyse minutieusement l'image ou le document PDF du passeport tunisien fourni et extrait toutes les informations clés dans le format JSON strict requis.

Attention particulière pour les passeports tunisiens:
- Nom complet en Arabe (fullNameArabic): Le nom et prénom en lettres arabes tels qu'inscrits sur le passeport (ex: محمد بن علي).
- Nom complet en Latin (fullNameLatin): Nom et prénom en alphabet latin (ex: BEN ALI MOHAMED).
- Sexe / Genre (sex): 'M' pour Masculin / ذكر ou 'F' pour Féminin / أنثى.
- Numéro de passeport (passportNumber): Le numéro officiel tunisien commençant souvent par une lettre (ex: N2891048 ou 0881234).
- Date de naissance (dateOfBirth): format JJ/MM/AAAA.
- Date de délivrance / délibération (issueDate): format JJ/MM/AAAA (Date de délivrance / تاريخ الإصدار).
- Date d'expiration (expiryDate): format JJ/MM/AAAA (Date d'expiration / تاريخ انتهاء الصلاحية).
- Numéro de CIN (cinNumber): Carte d'identité nationale tunisienne à 8 chiffres si présente.
- Lieu de naissance (placeOfBirth): Ville de naissance.
- Autorité d'émission (issuingAuthority): Ville / autorité.
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
              fullNameLatin: { type: Type.STRING },
              fullNameArabic: { type: Type.STRING },
              cinNumber: { type: Type.STRING },
              nationality: { type: Type.STRING },
              dateOfBirth: { type: Type.STRING },
              placeOfBirth: { type: Type.STRING },
              sex: { type: Type.STRING },
              issueDate: { type: Type.STRING },
              expiryDate: { type: Type.STRING },
              issuingAuthority: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER },
            },
            required: [
              "passportNumber",
              "fullNameArabic",
              "dateOfBirth",
              "expiryDate",
            ],
          },
        },
      });

      const extracted = JSON.parse(response.text || "{}");

      if (!extracted.passportNumber) {
        throw new Error(
          isAr
            ? "لم يتم العثور على رقم جواز سفر صالح في المستند."
            : "Numéro de passeport introuvable dans le document analysé.",
        );
      }

      // Format Latin Name
      let resolvedLatinName = extracted.fullNameLatin || "";
      if (!resolvedLatinName) {
        resolvedLatinName =
          `${extracted.surnameLatin || ""} ${extracted.givenNamesLatin || ""}`.trim();
      }
      if (!resolvedLatinName) {
        resolvedLatinName = "—";
      }

      // Format Gender
      let resolvedGender: "M" | "F" = "M";
      const rawSex = String(extracted.sex || "").toUpperCase();
      if (
        rawSex.includes("F") ||
        rawSex.includes("FEM") ||
        rawSex.includes("أنثى")
      ) {
        resolvedGender = "F";
      } else if (
        rawSex.includes("M") ||
        rawSex.includes("HOM") ||
        rawSex.includes("ذكر")
      ) {
        resolvedGender = "M";
      }

      // Try uploading scan to storage for preview if needed
      let uploadedFileUrl = undefined;
      try {
        const uploadRes = await uploadPassportToStorage(file, file.name);
        if (uploadRes?.fileUrl) {
          uploadedFileUrl = uploadRes.fileUrl;
        }
      } catch (e) {
        console.warn("Storage upload optional failure:", e);
      }

      const newEntryPayload: Omit<PassportEntry, "id" | "scannedAt"> = {
        fullNameArabic: extracted.fullNameArabic || "معتمر جديد",
        fullNameLatin: resolvedLatinName,
        gender: resolvedGender,
        passportNumber: String(extracted.passportNumber).trim().toUpperCase(),
        birthDate: formatDisplayDate(extracted.dateOfBirth),
        deliberationDate: formatDisplayDate(extracted.issueDate),
        expiryDate: formatDisplayDate(extracted.expiryDate),
        cinNumber: extracted.cinNumber || undefined,
        nationality: extracted.nationality || "TUNISIENNE",
        placeOfBirth: extracted.placeOfBirth || undefined,
        issuingAuthority: extracted.issuingAuthority || undefined,
        avatarUrl:
          uploadedFileUrl ||
          (file.type.startsWith("image/") ? base64Data : undefined),
      };

      // Add to list with duplicate prevention
      const result = onAddPassport(newEntryPayload);

      if (result.duplicate) {
        // Highlight existing row and notify user
        if (result.existing) {
          setHighlightedRowId(result.existing.id);
          setTimeout(() => setHighlightedRowId(null), 5000);
        }
        showToast(
          isAr
            ? `تنبيه: جواز السفر (${newEntryPayload.passportNumber}) مسجل مسبقاً في القائمة!`
            : `Ce passeport (${newEntryPayload.passportNumber}) existe déjà dans la liste !`,
          "warning",
        );
      } else {
        showToast(
          isAr
            ? `تم استخراج وإضافة جواز السفر (${newEntryPayload.passportNumber}) بنجاح!`
            : `Passeport ${newEntryPayload.passportNumber} extrait et ajouté avec succès !`,
          "success",
        );
      }

      // Reset modal/scanner inputs
      setScanFile(null);
      setScanPreviewUrl(null);
      setIsScannerModalOpen(false);
    } catch (err: any) {
      console.error("Passport OCR Error:", err);
      setScanError(
        err.message ||
          (isAr ? "فشل تحليل الجواز" : "Échec de l'analyse du passeport."),
      );
      showToast(
        err.message || (isAr ? "فشل التحليل" : "Échec de l'analyse"),
        "error",
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      setScanError(
        isAr
          ? "الرجاء اختيار ملف صورة (JPG, PNG) أو ملف PDF."
          : "Veuillez sélectionner une image (JPG, PNG, WEBP) ou un fichier PDF.",
      );
      return;
    }
    setScanFile(file);
    setScanError(null);
    setScanPreviewUrl(isImage ? URL.createObjectURL(file) : null);
    processPassportOCR(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Filtered & Sorted Passports
  const filteredPassports = useMemo(() => {
    return passports
      .filter((entry) => {
        // Query match
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          entry.fullNameArabic.toLowerCase().includes(q) ||
          entry.fullNameLatin.toLowerCase().includes(q) ||
          entry.passportNumber.toLowerCase().includes(q) ||
          (entry.cinNumber && entry.cinNumber.toLowerCase().includes(q)) ||
          entry.birthDate.toLowerCase().includes(q) ||
          entry.deliberationDate.toLowerCase().includes(q) ||
          entry.expiryDate.toLowerCase().includes(q);

        // Gender match
        const matchesGender =
          genderFilter === "ALL" ||
          entry.gender.toUpperCase() === genderFilter.toUpperCase();

        // Expiry match
        let matchesExpiry = true;
        if (expiryFilter !== "ALL") {
          const expStatus = checkExpiryStatus(entry.expiryDate).status;
          matchesExpiry = expStatus === expiryFilter;
        }

        return matchesQuery && matchesGender && matchesExpiry;
      })
      .sort((a, b) => {
        let valA = a[sortField] || "";
        let valB = b[sortField] || "";
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [passports, searchQuery, genderFilter, expiryFilter, sortField, sortAsc]);

  // Statistics
  const stats = useMemo(() => {
    const total = passports.length;
    const maleCount = passports.filter(
      (p) => p.gender.toUpperCase() === "M",
    ).length;
    const femaleCount = passports.filter(
      (p) => p.gender.toUpperCase() === "F",
    ).length;
    const warningOrExpiredCount = passports.filter((p) => {
      const st = checkExpiryStatus(p.expiryDate).status;
      return st === "warning" || st === "expired";
    }).length;

    return { total, maleCount, femaleCount, warningOrExpiredCount };
  }, [passports]);

  // Export to Excel (.xlsx) matching the exact requested columns with N° as the first column
  const handleExportXLSX = () => {
    if (filteredPassports.length === 0) {
      showToast(
        isAr ? "لا توجد بيانات لتصديرها" : "Aucune donnée à exporter",
        "warning",
      );
      return;
    }

    const rows = filteredPassports.map((p, index) => ({
      "N°": index + 1,
      "Nom complet Ar": p.fullNameArabic,
      "Nom complet": p.fullNameLatin || "",
      GENRE: p.gender || "M",
      "N passeport": p.passportNumber || "",
      "Date Naiss": p.birthDate || "",
      "DATE D DÉLIBÉRATION": p.deliberationDate || "",
      "DATE D EXPIRATION": p.expiryDate || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Configure column widths for readability in Excel
    worksheet["!cols"] = [
      { wch: 8 }, // N°
      { wch: 25 }, // Nom complet Ar
      { wch: 25 }, // Nom complet
      { wch: 10 }, // GENRE
      { wch: 16 }, // N passeport
      { wch: 16 }, // Date Naiss
      { wch: 24 }, // DATE D DÉLIBÉRATION
      { wch: 22 }, // DATE D EXPIRATION
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Passeports");

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Passeports_MiskTiba_${dateStr}.xlsx`);
    showToast(
      isAr
        ? "تم تصدير ملف Excel (.xlsx) بنجاح"
        : "Fichier Excel (.xlsx) exporté avec succès",
      "success",
    );
  };

  // Copy table to clipboard
  const handleCopyTable = () => {
    const headers = [
      "N°",
      "Nom complet Ar",
      "Nom complet",
      "GENRE",
      "N passeport",
      "Date Naiss",
      "DATE D DÉLIBÉRATION",
      "DATE D EXPIRATION",
    ];
    const rows = filteredPassports.map((p, index) =>
      [
        index + 1,
        p.fullNameArabic,
        p.fullNameLatin,
        p.gender,
        p.passportNumber,
        p.birthDate,
        p.deliberationDate,
        p.expiryDate,
      ].join("\t"),
    );

    const tsv = [headers.join("\t"), ...rows].join("\n");
    navigator.clipboard.writeText(tsv);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2000);
    showToast(
      isAr
        ? "تم نسخ الجدول إلى الحافظة"
        : "Tableau copié dans le presse-papier",
      "success",
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !manualForm.fullNameArabic.trim() ||
      !manualForm.passportNumber.trim()
    ) {
      showToast(
        isAr
          ? "يرجى ملء الحقول المطلوبة"
          : "Veuillez remplir les champs obligatoires",
        "error",
      );
      return;
    }

    if (editingEntry) {
      onEditPassport({
        ...editingEntry,
        fullNameArabic: manualForm.fullNameArabic.trim(),
        fullNameLatin: manualForm.fullNameLatin.trim() || "—",
        gender: manualForm.gender,
        passportNumber: manualForm.passportNumber.trim().toUpperCase(),
        birthDate: formatDisplayDate(manualForm.birthDate),
        deliberationDate: formatDisplayDate(manualForm.deliberationDate),
        expiryDate: formatDisplayDate(manualForm.expiryDate),
        cinNumber: manualForm.cinNumber.trim() || undefined,
        placeOfBirth: manualForm.placeOfBirth.trim() || undefined,
        notes: manualForm.notes.trim() || undefined,
      });
      showToast(
        isAr ? "تم تعديل بيانات الجواز بنجاح" : "Passeport modifié avec succès",
        "success",
      );
      setEditingEntry(null);
    } else {
      const res = onAddPassport({
        fullNameArabic: manualForm.fullNameArabic.trim(),
        fullNameLatin: manualForm.fullNameLatin.trim() || "—",
        gender: manualForm.gender,
        passportNumber: manualForm.passportNumber.trim().toUpperCase(),
        birthDate: formatDisplayDate(manualForm.birthDate),
        deliberationDate: formatDisplayDate(manualForm.deliberationDate),
        expiryDate: formatDisplayDate(manualForm.expiryDate),
        cinNumber: manualForm.cinNumber.trim() || undefined,
        placeOfBirth: manualForm.placeOfBirth.trim() || undefined,
        notes: manualForm.notes.trim() || undefined,
      });

      if (res.duplicate) {
        showToast(
          isAr
            ? `تنبيه: جواز السفر (${manualForm.passportNumber}) موجود مسبقاً في السجل!`
            : `Ce passeport (${manualForm.passportNumber}) existe déjà dans le registre !`,
          "warning",
        );
        if (res.existing) {
          setHighlightedRowId(res.existing.id);
          setTimeout(() => setHighlightedRowId(null), 5000);
        }
      } else {
        showToast(
          isAr
            ? "تمت إضافة الجواز إلى السجل بنجاح"
            : "Passeport ajouté avec succès",
          "success",
        );
      }
    }

    setIsManualModalOpen(false);
  };

  const handleOpenEdit = (entry: PassportEntry) => {
    setEditingEntry(entry);
    setManualForm({
      fullNameArabic: entry.fullNameArabic,
      fullNameLatin: entry.fullNameLatin,
      gender: (entry.gender === "F" ? "F" : "M") as "M" | "F",
      passportNumber: entry.passportNumber,
      birthDate: entry.birthDate,
      deliberationDate: entry.deliberationDate,
      expiryDate: entry.expiryDate,
      cinNumber: entry.cinNumber || "",
      placeOfBirth: entry.placeOfBirth || "",
      notes: entry.notes || "",
    });
    setIsManualModalOpen(true);
  };

  // Quick transfer to Pilgrims list
  const handleTransferSubmit = () => {
    if (!transferringEntry || !onAddPilgrim) return;

    const chosenTrip = trips.find((t) => t.id === selectedTripForTransfer);
    const code = `TUN-${Math.floor(100000 + Math.random() * 900000)}`;

    onAddPilgrim({
      nameArabic: transferringEntry.fullNameArabic,
      nameLatin:
        transferringEntry.fullNameLatin !== "—"
          ? transferringEntry.fullNameLatin
          : undefined,
      phone: "98000000",
      passportNumber: transferringEntry.passportNumber,
      birthDate: transferringEntry.birthDate,
      gender: transferringEntry.gender as "M" | "F",
      tripId: chosenTrip ? chosenTrip.id : "",
      tripName: chosenTrip ? chosenTrip.name : "—",
      uniqueCode: code,
      status: "مؤكد",
      emergencyContact: transferringEntry.cinNumber
        ? `CIN: ${transferringEntry.cinNumber}`
        : undefined,
      avatarUrl: transferringEntry.avatarUrl || DEFAULT_AVATAR_URL,
    });

    showToast(
      isAr
        ? `تم تحويل (${transferringEntry.fullNameArabic}) إلى قائمة المعتمرين بنجاح!`
        : `${transferringEntry.fullNameArabic} ajouté à la liste des pèlerins !`,
      "success",
    );
    setTransferringEntry(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 ${
            isAr ? "left-6" : "right-6"
          } z-50 px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 text-sm font-medium ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-emerald-400 border-slate-800"
              : toastMessage.type === "warning"
                ? "bg-amber-950 text-amber-300 border-amber-800"
                : "bg-red-950 text-red-300 border-red-800"
          }`}
        >
          {toastMessage.type === "success" && (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          {toastMessage.type === "warning" && (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          {toastMessage.type === "error" && (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {isAr
                  ? "سجل استخراج الجوازات"
                  : "Registre & Extraction Passeports"}
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  OCR Gemini AI
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                {isAr
                  ? "استخراج فوري لبيانات جوازات السفر التونسية بدقة عالية ومطابقة تلقائية لمنع التكرار"
                  : "Extraction instantanée et vérification des passeports tunisiens avec détection anti-doublon"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleExportXLSX}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title={isAr ? "تصدير Excel (.xlsx)" : "Exporter Excel (.xlsx)"}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>
              {isAr ? "تصدير Excel (.xlsx)" : "Exporter Excel (.xlsx)"}
            </span>
          </button>

          <button
            onClick={handleCopyTable}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title={isAr ? "نسخ الجدول" : "Copier le tableau"}
          >
            {copiedTable ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 text-slate-500" />
            )}
            <span>
              {copiedTable
                ? isAr
                  ? "تم النسخ!"
                  : "Copié !"
                : isAr
                  ? "نسخ"
                  : "Copier"}
            </span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title={isAr ? "طباعة" : "Imprimer"}
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{isAr ? "طباعة" : "Imprimer"}</span>
          </button>

          <button
            onClick={() => {
              setEditingEntry(null);
              setManualForm({
                fullNameArabic: "",
                fullNameLatin: "",
                gender: "M",
                passportNumber: "",
                birthDate: "",
                deliberationDate: "",
                expiryDate: "",
                cinNumber: "",
                placeOfBirth: "",
                notes: "",
              });
              setIsManualModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>{isAr ? "إدخال يدوي" : "Ajout manuel"}</span>
          </button>
        </div>
      </div>

      {/* Quick OCR Drop Area Banner (Fast Direct Scanning) */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => quickFileInputRef.current?.click()}
        className="group relative border-2 border-dashed border-slate-300 hover:border-black rounded-2xl p-5 bg-linear-to-b from-slate-50/80 to-white flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer transition-all duration-200 hover:shadow-xs print:hidden"
      >
        <input
          ref={quickFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) =>
            e.target.files?.[0] && handleFileSelect(e.target.files[0])
          }
        />

        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            {isScanning ? (
              <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-black flex items-center gap-2">
              {isScanning
                ? isAr
                  ? "جاري تحليل الجواز بالذكاء الاصطناعي..."
                  : "Analyse OCR en cours via Gemini AI..."
                : isAr
                  ? "اسحب وأفلت صورة أو PDF لجواز السفر هنا للمسح السريع"
                  : "Glissez-déposez ici un passeport (Image ou PDF) pour extraction rapide"}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isAr
                ? "يتم استخراج (الاسم بالعربية واللاتينية، الجنس، رقم الجواز، تاريخ الولادة، تاريخ الإصدار، تاريخ الانتهاء) وإضافتها تلقائياً"
                : "Extrait automatiquement : Nom complet Ar, Nom complet, GENRE, N° passeport, Date Naiss, Délivrance, Expiration"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold group-hover:bg-slate-800 transition-colors flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {isScanning
              ? isAr
                ? "جاري المعالجة..."
                : "Traitement..."
              : isAr
                ? "اختر ملفاً"
                : "Parcourir"}
          </span>
        </div>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              {isAr ? "إجمالي الجوازات" : "Total Passeports"}
            </p>
            <p className="text-lg font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              {isAr ? "الرجال (M)" : "Hommes (M)"}
            </p>
            <p className="text-lg font-bold text-slate-900">
              {stats.maleCount}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/60 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              {isAr ? "النساء (F)" : "Femmes (F)"}
            </p>
            <p className="text-lg font-bold text-slate-900">
              {stats.femaleCount}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              {isAr ? "تنتهي قريباً / منتهية" : "Expire bientôt / Expiré"}
            </p>
            <p className="text-lg font-bold text-amber-700">
              {stats.warningOrExpiredCount}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/40">
          <div className="relative w-full md:w-80">
            <Search
              className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${
                isAr ? "right-3" : "left-3"
              }`}
            />
            <input
              type="text"
              placeholder={
                isAr
                  ? "بحث بالاسم، رقم الجواز، التاريخ..."
                  : "Rechercher par nom, n° passeport, date..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-xs rounded-xl border border-slate-200 bg-white ${
                isAr ? "pr-9 pl-3" : "pl-9 pr-3"
              } py-2 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`absolute top-1/2 -translate-y-1/2 ${
                  isAr ? "left-2.5" : "right-2.5"
                } text-slate-400 hover:text-slate-600 text-xs`}
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-hidden focus:border-black cursor-pointer shadow-2xs"
            >
              <option value="ALL">
                {isAr ? "كل الأجناس" : "Tous les genres"}
              </option>
              <option value="M">{isAr ? "رجال (M)" : "Hommes (M)"}</option>
              <option value="F">{isAr ? "نساء (F)" : "Femmes (F)"}</option>
            </select>

            {/* Expiry Filter */}
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-hidden focus:border-black cursor-pointer shadow-2xs"
            >
              <option value="ALL">
                {isAr ? "كل حالات الصلاحية" : "Toutes validités"}
              </option>
              <option value="valid">
                {isAr ? "صالح (> 6 أشهر)" : "Valide (> 6 mois)"}
              </option>
              <option value="warning">
                {isAr ? "ينتهي قريباً (< 6 أشهر)" : "Expire bientôt (< 6 mois)"}
              </option>
              <option value="expired">
                {isAr ? "منتهي الصلاحية" : "Expiré"}
              </option>
            </select>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
              title={isAr ? "عكس الترتيب" : "Inverser l'ordre"}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px] select-none">
                <th className="py-3.5 px-3 text-center w-12 text-slate-500">
                  <span>N°</span>
                </th>

                <th
                  onClick={() => {
                    setSortField("fullNameArabic");
                    setSortAsc(
                      sortField === "fullNameArabic" ? !sortAsc : true,
                    );
                  }}
                  className={`py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors ${
                    isAr ? "text-right" : "text-left"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>Nom complet Ar</span>
                    {sortField === "fullNameArabic" && (
                      <span className="text-slate-400 text-[10px]">
                        {sortAsc ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>

                <th
                  onClick={() => {
                    setSortField("fullNameLatin");
                    setSortAsc(sortField === "fullNameLatin" ? !sortAsc : true);
                  }}
                  className={`py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors ${
                    isAr ? "text-right" : "text-left"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>Nom complet</span>
                    {sortField === "fullNameLatin" && (
                      <span className="text-slate-400 text-[10px]">
                        {sortAsc ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>

                <th
                  onClick={() => {
                    setSortField("gender");
                    setSortAsc(sortField === "gender" ? !sortAsc : true);
                  }}
                  className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>GENRE</span>
                    {sortField === "gender" && (
                      <span className="text-slate-400 text-[10px]">
                        {sortAsc ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>

                <th
                  onClick={() => {
                    setSortField("passportNumber");
                    setSortAsc(
                      sortField === "passportNumber" ? !sortAsc : true,
                    );
                  }}
                  className={`py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors ${
                    isAr ? "text-right" : "text-left"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>N passeport</span>
                    {sortField === "passportNumber" && (
                      <span className="text-slate-400 text-[10px]">
                        {sortAsc ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>

                <th
                  onClick={() => {
                    setSortField("birthDate");
                    setSortAsc(sortField === "birthDate" ? !sortAsc : true);
                  }}
                  className={`py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors ${
                    isAr ? "text-right" : "text-left"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>Date Naiss</span>
                    {sortField === "birthDate" && (
                      <span className="text-slate-400 text-[10px]">
                        {sortAsc ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>

                <th
                  onClick={() => {
                    setSortField("deliberationDate");
                    setSortAsc(
                      sortField === "deliberationDate" ? !sortAsc : true,
                    );
                  }}
                  className={`py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors ${
                    isAr ? "text-right" : "text-left"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>DATE D DÉLIBÉRATION</span>
                    {sortField === "deliberationDate" && (
                      <span className="text-slate-400 text-[10px]">
                        {sortAsc ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>

                <th
                  onClick={() => {
                    setSortField("expiryDate");
                    setSortAsc(sortField === "expiryDate" ? !sortAsc : true);
                  }}
                  className={`py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors ${
                    isAr ? "text-right" : "text-left"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>DATE D EXPIRATION</span>
                    {sortField === "expiryDate" && (
                      <span className="text-slate-400 text-[10px]">
                        {sortAsc ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>

                <th className="py-3.5 px-4 text-center print:hidden">
                  <span>{isAr ? "إجراءات" : "Actions"}</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredPassports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Scan className="w-8 h-8 text-slate-300 stroke-1" />
                      <p className="text-xs font-semibold text-slate-600">
                        {isAr
                          ? "لا توجد جوازات مسجلة حالياً"
                          : "Aucun passeport trouvé"}
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        {isAr
                          ? "استخدم زر 'مسح ضوئي' أو اسحب صورة الجواز لاستخراج البيانات وإضافتها تلقائياً."
                          : "Cliquez sur 'Scanner un passeport' ou glissez un fichier pour extraire et ajouter automatiquement les données."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPassports.map((entry, index) => {
                  const expStatus = checkExpiryStatus(entry.expiryDate);
                  const isHighlighted = highlightedRowId === entry.id;

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isHighlighted
                          ? "bg-amber-100/80 ring-2 ring-amber-400 animate-pulse"
                          : ""
                      }`}
                    >
                      {/* N° */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400 text-xs">
                        {index + 1}
                      </td>

                      {/* Nom complet Ar */}
                      <td
                        className={`py-3 px-4 font-bold text-slate-900 ${isAr ? "text-right" : "text-left"}`}
                      >
                        <div className="flex items-center gap-2">
                          {entry.avatarUrl && (
                            <img
                              src={entry.avatarUrl}
                              alt=""
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          )}
                          <span className="font-arabic text-sm">
                            {entry.fullNameArabic}
                          </span>
                        </div>
                      </td>

                      {/* Nom complet */}
                      <td
                        className={`py-3 px-4 font-semibold text-slate-800 uppercase ${isAr ? "text-right" : "text-left"}`}
                      >
                        {entry.fullNameLatin || "—"}
                      </td>

                      {/* GENRE */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            entry.gender.toUpperCase() === "F"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {entry.gender.toUpperCase() === "F" ? "F" : "M"}
                        </span>
                      </td>

                      {/* N passeport */}
                      <td
                        className={`py-3 px-4 font-mono font-bold text-slate-900 tracking-wider ${isAr ? "text-right" : "text-left"}`}
                      >
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-900 border border-slate-200/80">
                          {entry.passportNumber}
                        </span>
                      </td>

                      {/* Date Naiss */}
                      <td
                        className={`py-3 px-4 text-slate-600 font-mono ${isAr ? "text-right" : "text-left"}`}
                      >
                        {entry.birthDate || "—"}
                      </td>

                      {/* DATE D DÉLIBÉRATION */}
                      <td
                        className={`py-3 px-4 text-slate-600 font-mono ${isAr ? "text-right" : "text-left"}`}
                      >
                        {entry.deliberationDate || "—"}
                      </td>

                      {/* DATE D EXPIRATION */}
                      <td
                        className={`py-3 px-4 ${isAr ? "text-right" : "text-left"}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold ${
                              expStatus.status === "expired"
                                ? "text-red-600"
                                : expStatus.status === "warning"
                                  ? "text-amber-600"
                                  : "text-emerald-700"
                            }`}
                          >
                            {entry.expiryDate || "—"}
                          </span>
                          {expStatus.status === "warning" && (
                            <span
                              title={
                                isAr ? expStatus.labelAr : expStatus.labelFr
                              }
                              className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                            />
                          )}
                          {expStatus.status === "expired" && (
                            <span
                              title={
                                isAr ? expStatus.labelAr : expStatus.labelFr
                              }
                              className="w-2 h-2 rounded-full bg-red-500 shrink-0"
                            />
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          {onAddPilgrim && (
                            <button
                              onClick={() => {
                                setTransferringEntry(entry);
                                setSelectedTripForTransfer(trips[0]?.id || "");
                              }}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                              title={
                                isAr
                                  ? "إضافة إلى قائمة المعتمرين"
                                  : "Transférer vers pèlerins"
                              }
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setInspectingEntry(entry)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title={isAr ? "عرض التفاصيل" : "Voir détails"}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(entry)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title={isAr ? "تعديل" : "Modifier"}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingId(entry.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                            title={isAr ? "حذف" : "Supprimer"}
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

        {/* Footer Summary */}
        <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            {isAr
              ? `عرض ${filteredPassports.length} من إجمالي ${passports.length} جواز`
              : `Affichage de ${filteredPassports.length} sur ${passports.length} passeport(s)`}
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {isAr
              ? "تحقق تلقائي ضد التكرار"
              : "Vérification anti-doublon active"}
          </span>
        </div>
      </div>

      {/* SCANNER MODAL */}
      {isScannerModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {isAr
                      ? "مسح واستخراج جواز سفر تونسي"
                      : "Numériser un Passeport Tunisien"}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? "استخراج فوري عبر Gemini 3.5 Flash"
                      : "Extraction automatique par intelligence artificielle"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsScannerModalOpen(false);
                  setScanFile(null);
                  setScanPreviewUrl(null);
                  setScanError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  scanFile
                    ? "border-black bg-slate-50"
                    : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileSelect(e.target.files[0])
                  }
                />

                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  {isScanning ? (
                    <RefreshCw className="w-6 h-6 text-slate-700 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {scanFile
                      ? scanFile.name
                      : isAr
                        ? "اضغط لاختيار صورة أو PDF أو اسحب الملف هنا"
                        : "Glissez-déposez la photo ou le PDF du passeport"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {isAr
                      ? "الصيغ المدعومة: JPG, PNG, WEBP, PDF (حتى 10 ميغابايت)"
                      : "Formats acceptés : JPG, PNG, WEBP, PDF (Max 10Mo)"}
                  </p>
                </div>

                {scanPreviewUrl && (
                  <div className="mt-2 relative max-h-44 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                    <img
                      src={scanPreviewUrl}
                      alt="Aperçu"
                      className="max-h-40 object-contain"
                    />
                  </div>
                )}
              </div>

              {scanError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-[11px]">
                  {isAr
                    ? "عند اكتمال المسح، سيتم التحقق تلقائياً من رقم الجواز. إذا لم يكن مسجلاً، فسيُضاف مباشرة إلى السجل."
                    : "Dès la numérisation terminée, le passeport sera automatiquement ajouté au tableau s'il n'y figure pas déjà."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ENTRY / EDIT MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingEntry
                  ? isAr
                    ? "تعديل بيانات الجواز"
                    : "Modifier les données du passeport"
                  : isAr
                    ? "إضافة جواز سفر يدوياً"
                    : "Ajouter un passeport manuellement"}
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleManualSubmit}
              className="p-6 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nom complet Ar (الاسم الكامل بالعربية) *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.fullNameArabic}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        fullNameArabic: e.target.value,
                      })
                    }
                    placeholder="محمد بن علي"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-arabic text-sm focus:outline-hidden focus:border-black"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nom complet (Latin)
                  </label>
                  <input
                    type="text"
                    value={manualForm.fullNameLatin}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        fullNameLatin: e.target.value,
                      })
                    }
                    placeholder="BEN ALI MOHAMED"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 uppercase focus:outline-hidden focus:border-black"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    GENRE (الجنس) *
                  </label>
                  <select
                    value={manualForm.gender}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        gender: e.target.value as "M" | "F",
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-black cursor-pointer"
                  >
                    <option value="M">M - Homme (ذكر)</option>
                    <option value="F">F - Femme (أنثى)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    N passeport (رقم الجواز) *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.passportNumber}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        passportNumber: e.target.value,
                      })
                    }
                    placeholder="N2891048"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 uppercase font-mono font-bold focus:outline-hidden focus:border-black"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Date Naiss (تاريخ الولادة)
                  </label>
                  <input
                    type="text"
                    value={manualForm.birthDate}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        birthDate: e.target.value,
                      })
                    }
                    placeholder="15/04/1985"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-hidden focus:border-black"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    DATE D DÉLIBÉRATION (تاريخ الإصدار)
                  </label>
                  <input
                    type="text"
                    value={manualForm.deliberationDate}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        deliberationDate: e.target.value,
                      })
                    }
                    placeholder="10/01/2022"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-hidden focus:border-black"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    DATE D EXPIRATION (تاريخ الانتهاء) *
                  </label>
                  <input
                    type="text"
                    value={manualForm.expiryDate}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        expiryDate: e.target.value,
                      })
                    }
                    placeholder="09/01/2027"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  {isAr ? "إلغاء" : "Annuler"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black text-white font-bold hover:bg-slate-900 cursor-pointer shadow-xs"
                >
                  {editingEntry
                    ? isAr
                      ? "حفظ التعديلات"
                      : "Enregistrer"
                    : isAr
                      ? "إضافة للسجل"
                      : "Ajouter au registre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT DETAILS MODAL */}
      {inspectingEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Scan className="w-4 h-4 text-amber-400" />
                {isAr ? "تفاصيل جواز السفر" : "Détails du Passeport"}
              </h3>
              <button
                onClick={() => setInspectingEntry(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {inspectingEntry.avatarUrl && (
                <div className="w-full max-h-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                  <img
                    src={inspectingEntry.avatarUrl}
                    alt=""
                    className="max-h-44 object-contain"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    Nom complet Ar
                  </p>
                  <p className="text-sm font-bold font-arabic text-slate-900">
                    {inspectingEntry.fullNameArabic}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    Nom complet
                  </p>
                  <p className="text-xs font-bold text-slate-900 uppercase">
                    {inspectingEntry.fullNameLatin || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    GENRE
                  </p>
                  <p className="text-xs font-bold text-slate-900">
                    {inspectingEntry.gender === "F"
                      ? "Féminin (أنثى)"
                      : "Masculin (ذكر)"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    N passeport
                  </p>
                  <p className="text-xs font-bold font-mono text-slate-900">
                    {inspectingEntry.passportNumber}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    Date Naiss
                  </p>
                  <p className="text-xs font-mono text-slate-800">
                    {inspectingEntry.birthDate || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    DATE D DÉLIBÉRATION
                  </p>
                  <p className="text-xs font-mono text-slate-800">
                    {inspectingEntry.deliberationDate || "—"}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    DATE D EXPIRATION
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-900">
                    {inspectingEntry.expiryDate || "—"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setInspectingEntry(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
                >
                  {isAr ? "إغلاق" : "Fermer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER TO PILGRIM MODAL */}
      {transferringEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                {isAr
                  ? "إضافة إلى قائمة المعتمرين"
                  : "Transférer vers les Pèlerins"}
              </h3>
              <button
                onClick={() => setTransferringEntry(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                {isAr
                  ? `هل ترغب في إضافة المعتمر (${transferringEntry.fullNameArabic}) مع رقم الجواز (${transferringEntry.passportNumber}) إلى رحلة عمرة؟`
                  : `Ajouter ${transferringEntry.fullNameArabic} (${transferringEntry.passportNumber}) à un voyage ?`}
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? "اختر الرحلة" : "Sélectionner le voyage"}
                </label>
                <select
                  value={selectedTripForTransfer}
                  onChange={(e) => setSelectedTripForTransfer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-black cursor-pointer"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.startDate} - {t.endDate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferringEntry(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  {isAr ? "إلغاء" : "Annuler"}
                </button>
                <button
                  type="button"
                  onClick={handleTransferSubmit}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
                >
                  {isAr ? "تأكيد الإضافة" : "Confirmer l'ajout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                {isAr ? "تأكيد حذف الجواز" : "Supprimer ce passeport ?"}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {isAr
                  ? "هل أنت متأكد من حذف هذا الجواز من السجل؟ لا يمكن التراجع عن هذا الإجراء."
                  : "Cette action supprimera l'entrée du registre des passeports."}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                {isAr ? "إلغاء" : "Annuler"}
              </button>
              <button
                onClick={() => {
                  onDeletePassport(deletingId);
                  setDeletingId(null);
                  showToast(
                    isAr
                      ? "تم حذف الجواز من السجل"
                      : "Passeport supprimé du registre",
                    "success",
                  );
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 cursor-pointer"
              >
                {isAr ? "حذف" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
