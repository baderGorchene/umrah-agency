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

  // Cropping states (react-easy-crop)
  const [isCropOpen, setIsCropOpen] = useState(false);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [currentStep, setCurrentStep] = useState<number>(1); // 1: extract/upload, 2: crop/upload, 3: assign/save
  const [pendingDocument, setPendingDocument] = useState<{ filePath: string; fileUrl?: string; mimeType?: string; fileName?: string } | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [lastCroppedFile, setLastCroppedFile] = useState<File | null>(null);
  const [lastCroppedArea, setLastCroppedArea] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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

  // legacy mouse handlers removed in favor of react-easy-crop
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

  
