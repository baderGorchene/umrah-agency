import React, { useState } from "react";
import {
  FileText,
  Printer,
  Download,
  Plus,
  Tag,
  CreditCard,
  Lock,
  FileSpreadsheet,
  Sparkles,
  Scan,
} from "lucide-react";
import { Language, Trip, Pilgrim, AgencySettings } from "../types";
import { PassportScannerModal } from "./PassportScannerModal";

// Logo lives in /public/logo.jpeg — served from the app root, so it's
// referenced by path rather than a JS module import.
const LOGO_SRC = `${import.meta.env.BASE_URL}logo.jpeg`;

interface DocumentsViewProps {
  lang: Language;
  trips: Trip[];
  pilgrims: Pilgrim[];
  agencySettings: AgencySettings;
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

// Small reusable header used at the top of every printable document.
const DocumentLogoHeader: React.FC<{ subtitle?: string }> = ({ subtitle }) => (
  <div className="flex flex-col items-center gap-1 mb-2">
    <img src={LOGO_SRC} alt="Logo" className="h-28 w-auto object-contain" />
    {subtitle && (
      <p className="text-[10px] font-semibold text-slate-500 dir-rtl">
        {subtitle}
      </p>
    )}
  </div>
);

type ModalType =
  | "attendance"
  | "receipt"
  | "passport"
  | "idcard"
  | "card"
  | "luggage"
  | null;

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  lang,
  trips,
  pilgrims,
  agencySettings,
  onAddPilgrim,
}) => {
  const isAr = lang === "AR";
  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id || "");
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isPassportScannerOpen, setIsPassportScannerOpen] = useState(false);

  // Receipt form state
  const [receiptForm, setReceiptForm] = useState({
    pilgrimName: "انوار زقاب",
    amount: "3800",
    currency: "TND",
    date: "2026-08-07",
    notes: "تسديد القسط الأول لعمرة المولد النبوي",
  });

  // Passport-request form state
  const [passportRequestForm, setPassportRequestForm] = useState({
    pilgrimName: "",
    cin: "",
    birthDate: "",
    birthPlace: "",
    fatherName: "",
    motherName: "",
    address: "",
    requestType: "تجديد", // تجديد | استخراج لأول مرة | ضياع
  });

  // ID-card-request form state
  const [idCardRequestForm, setIdCardRequestForm] = useState({
    pilgrimName: "",
    birthDate: "",
    birthPlace: "",
    fatherName: "",
    motherName: "",
    address: "",
    requestType: "تجديد",
  });

  const selectedTrip = trips.find((t) => t.id === selectedTripId);
  const tripPilgrims = pilgrims.filter(
    (p) => p.tripId === selectedTripId || selectedTripId === "",
  );

  const handleExportCSV = () => {
    const headers = [
      "Nom (Arabe)",
      "Nom (Latin)",
      "Téléphone",
      "Code unique",
      "Statut",
      "Passeport",
    ];
    const rows = tripPilgrims.map((p) => [
      p.nameArabic,
      p.nameLatin || "",
      p.phone,
      p.uniqueCode,
      p.status,
      p.passportNumber || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Pèlerins_${selectedTrip?.name || "MiskTiba"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Opens the passport-request modal and prefills the name from the first
  // pilgrim of the selected trip (if any) so the form isn't empty.
  const openPassportRequest = () => {
    setPassportRequestForm((prev) => ({
      ...prev,
      pilgrimName: prev.pilgrimName || tripPilgrims[0]?.nameArabic || "",
    }));
    setActiveModal("passport");
  };

  const openIdCardRequest = () => {
    setIdCardRequestForm((prev) => ({
      ...prev,
      pilgrimName: prev.pilgrimName || tripPilgrims[0]?.nameArabic || "",
    }));
    setActiveModal("idcard");
  };

  return (
    <div className="space-y-6">
      {/*
        Print isolation: when the browser print dialog fires, hide
        everything on the page except the currently open modal's
        #print-area so printed output only contains the relevant
        document, never the whole app shell.

        The modal overlay/box are forced out of `position: fixed` /
        `overflow: auto` during print — those are what caused the
        content to be rendered twice (fixed-position elements get
        repeated on every printed page by the browser).
      */}
      <style>{`
        @media print {
          @page {
            margin: 12mm;
          }
          /* Hide everything by default; only the active modal's
             #print-area is revealed. visibility (not display) is used
             here so we can selectively re-show a nested element. */
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          /* Neutralize the modal's fixed positioning — browsers repeat
             position:fixed elements on every printed page, which is
             what caused documents to print duplicated. */
          .print-modal-overlay {
            position: static !important;
            inset: auto !important;
            background: none !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            display: block !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print-modal-box {
            position: static !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          /* Anchor the printable content to the top of the page,
             regardless of how much (invisible) content precedes it in
             the DOM — this is what stops a blank first page / content
             being pushed halfway down the sheet. */
          #print-area {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Everything below is the dashboard UI — fully removed (not just
          hidden) from print output so it can never push the printable
          document down the page or leave a blank leading page. */}
      <div className="print:hidden space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-start">
            {isAr ? "مستندات الرحلة" : "Documents de Voyage"}
          </h1>
          <p className="text-xs text-slate-500 font-medium text-start">
            {isAr
              ? "جميع المستندات الإدارية والتنظيمية الخاصة بالرحلة في مكان واحد."
              : "Tous les documents administratifs et organisationnels de votre voyage en un seul endroit."}
          </p>
        </div>

        {/* Step 1 Header: Select Trip */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm text-start">
                {isAr
                  ? "خطوة 1: اختر الرحلة النشطة"
                  : "Étape 1: Sélectionner le voyage actif"}
              </h2>
              <p className="text-xs text-slate-500 text-start">
                {isAr
                  ? "يجب تحديد الرحلة أولاً لتفعيل وتوليد كافة المستندات والتقارير المرتبطة بها."
                  : "Sélectionnez un voyage pour activer et générer ses documents et rapports."}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-72">
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-black/5 text-start"
            >
              <option value="">
                {isAr
                  ? "-- اختر رحلة نشطة --"
                  : "-- Sélectionner un voyage actif --"}
              </option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.startDate})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grouped Document Cards */}
        <div className="space-y-6">
          {/* AI Passport Scanner Highlight Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">
                    Scanner de Passeports Tounsi
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Numérisez les passeports tunisiens (PDF ou Image) pour
                  extraire instantanément le nom en arabe/latin, la CIN, le N°
                  de passeport et la date d'expiration.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsPassportScannerOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
            >
              <Scan className="w-4 h-4" />
              <span>Numériser un Passeport</span>
            </button>
          </div>

          {/* Section 1: Administrative Documents */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Documents Administratifs</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Registre d'Appel */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Printer className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Registre d'Appel
                  </h4>
                  <p className="text-xs text-slate-500">
                    Liste de présence prête à imprimer pour les départs et
                    hébergements.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal("attendance")}
                  className="w-full bg-slate-100 hover:bg-black hover:text-white text-slate-800 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? "طباعة" : "Imprimer"}</span>
                </button>
              </div>

              {/* Card 2: وصل الاستخلاص */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm dir-rtl">
                    وصل الاستخلاص
                  </h4>
                  <p className="text-xs text-slate-500 dir-rtl">
                    إصدار وصل دفع رسمي للمعتمر مع خيار الطباعة والمصادقة.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal("receipt")}
                  className="w-full bg-slate-100 hover:bg-black hover:text-white text-slate-800 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? "إنشاء" : "Créer"}</span>
                </button>
              </div>

              {/* Card 3: طلب استخراج جواز سفر */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm dir-rtl">
                    طلب استخراج جواز سفر
                  </h4>
                  <p className="text-xs text-slate-500 dir-rtl">
                    استمارة رسمية لاستخراج أو تجديد جواز السفر الخاص بالمعتمر.
                  </p>
                </div>
                <button
                  onClick={openPassportRequest}
                  className="w-full bg-slate-100 hover:bg-black hover:text-white text-slate-800 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? "إنشاء" : "Créer"}</span>
                </button>
              </div>

              {/* Card 4: طلب استخراج بطاقة هوية */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm dir-rtl">
                    طلب استخراج بطاقة هوية
                  </h4>
                  <p className="text-xs text-slate-500 dir-rtl">
                    استمارة رسمية لتسهيل إجراءات استخراج بطاقة التعريف الوطنية.
                  </p>
                </div>
                <button
                  onClick={openIdCardRequest}
                  className="w-full bg-slate-100 hover:bg-black hover:text-white text-slate-800 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? "إنشاء" : "Créer"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Identité & QR */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-500" />
              <span>Identité & QR</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Carte Passeport */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      Carte Passeport & Documents
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Carte intelligente à insérer dans le passeport ou dossier
                    pour éviter les pertes.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal("card")}
                  className="bg-slate-100 hover:bg-black hover:text-white text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer</span>
                </button>
              </div>

              {/* Card 2: ملصق الحقيبة */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm dir-rtl">
                      ملصق الحقيبة
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm dir-rtl">
                    ملصق أمتعة ذكي يحتوي على كود المعتمر لتفادي ضياع الحقائب في
                    المطار.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal("luggage")}
                  className="bg-slate-100 hover:bg-black hover:text-white text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Data Export */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              <span>Exportation de Données</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Exporter Excel */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Exporter Excel / CSV
                  </h4>
                  <p className="text-xs text-slate-500">
                    Liste complète des pèlerins avec leurs numéros et codes
                    uniques.
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="bg-black hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger CSV</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
      {/* end of print:hidden dashboard wrapper */}

      {/* Attendance List Print Modal */}
      {activeModal === "attendance" && (
        <div className="print-modal-overlay fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="print-modal-box bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <h2 className="font-bold text-slate-900 text-base">
                Liste de Présence - {selectedTrip?.name || "مسك طيبة"}
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Printable Document Content */}
            <div id="print-area" className="space-y-4 font-sans text-slate-900">
              <DocumentLogoHeader />
              <div className="text-center space-y-1 border-b border-slate-200 pb-4">
                <h1 className="text-xl font-extrabold text-slate-900 dir-rtl">
                  {agencySettings.name}
                </h1>
                <p className="text-xs font-bold text-slate-600">
                  قائمة الحضور الرسمية — {selectedTrip?.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  الفترة: {selectedTrip?.startDate} إلى {selectedTrip?.endDate}
                </p>
              </div>

              <table className="w-full text-left border-collapse text-xs border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold">
                    <th className="p-2 border-r border-slate-200">#</th>
                    <th className="p-2 border-r border-slate-200">
                      الاسم واللقب
                    </th>
                    <th className="p-2 border-r border-slate-200">Téléphone</th>
                    <th className="p-2 border-r border-slate-200">Passeport</th>
                    <th className="p-2 border-r border-slate-200 text-center">
                      Code Unique
                    </th>
                    <th className="p-2 text-center">
                      {isAr ? "التوقيع" : "Emargement"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tripPilgrims.map((p, idx) => (
                    <tr key={p.id}>
                      <td className="p-2 border-r border-slate-200 font-bold">
                        {idx + 1}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-bold dir-rtl">
                        {p.nameArabic}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono">
                        {p.phone}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono">
                        {p.passportNumber || "N2891048"}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono text-center font-bold">
                        {p.uniqueCode}
                      </td>
                      <td className="p-2 text-center text-slate-300">
                        ____________
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 print:hidden">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Fermer
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer la Liste</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {activeModal === "receipt" && (
        <div className="print-modal-overlay fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="print-modal-box bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <h2 className="font-bold text-slate-900 text-base dir-rtl">
                إصدار وصل استخلاص
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 print:hidden">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  المعتمر
                </label>
                <input
                  type="text"
                  value={receiptForm.pilgrimName}
                  onChange={(e) =>
                    setReceiptForm({
                      ...receiptForm,
                      pilgrimName: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    المبلغ
                  </label>
                  <input
                    type="text"
                    value={receiptForm.amount}
                    onChange={(e) =>
                      setReceiptForm({ ...receiptForm, amount: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    العملة
                  </label>
                  <input
                    type="text"
                    value={receiptForm.currency}
                    onChange={(e) =>
                      setReceiptForm({
                        ...receiptForm,
                        currency: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  {isAr ? "التاريخ" : "Date"}
                </label>
                <input
                  type="date"
                  value={receiptForm.date}
                  onChange={(e) =>
                    setReceiptForm({ ...receiptForm, date: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  {isAr ? "ملاحظات" : "Notes"}
                </label>
                <textarea
                  value={receiptForm.notes}
                  onChange={(e) =>
                    setReceiptForm({ ...receiptForm, notes: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl h-20"
                />
              </div>
            </div>

            {/* Printable receipt — only this block is included in the print output */}
            <div
              id="print-area"
              className="hidden print:block space-y-4 font-sans text-slate-900"
            >
              <DocumentLogoHeader />
              <div className="text-center space-y-1 border-b border-slate-200 pb-4">
                <h1 className="text-xl font-extrabold text-slate-900 dir-rtl">
                  {agencySettings.name}
                </h1>
                <p className="text-xs font-bold text-slate-600 dir-rtl">
                  وصل استخلاص رسمي
                </p>
              </div>
              <table className="w-full text-xs border border-slate-200 border-collapse dir-rtl">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-semibold bg-slate-50 w-1/3">
                      المعتمر
                    </td>
                    <td className="p-2">{receiptForm.pilgrimName}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-semibold bg-slate-50">المبلغ</td>
                    <td className="p-2 font-bold">
                      {receiptForm.amount} {receiptForm.currency}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-semibold bg-slate-50">التاريخ</td>
                    <td className="p-2">{receiptForm.date}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold bg-slate-50">ملاحظات</td>
                    <td className="p-2">{receiptForm.notes}</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex justify-between pt-8 text-[11px] text-slate-500 dir-rtl">
                <span>إمضاء الوكالة: ____________</span>
                <span>إمضاء المعتمر: ____________</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 print:hidden">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الوصل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passport Request Modal */}
      {activeModal === "passport" && (
        <div className="print-modal-overlay fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="print-modal-box bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <h2 className="font-bold text-slate-900 text-base dir-rtl">
                طلب استخراج جواز سفر
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 print:hidden">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  اختر معتمر (اختياري)
                </label>
                <select
                  onChange={(e) => {
                    const p = tripPilgrims.find(
                      (pp) => pp.id === e.target.value,
                    );
                    if (p) {
                      setPassportRequestForm({
                        ...passportRequestForm,
                        pilgrimName: p.nameArabic,
                      });
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                >
                  <option value="">-- اختر --</option>
                  {tripPilgrims.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameArabic}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  الاسم واللقب
                </label>
                <input
                  type="text"
                  value={passportRequestForm.pilgrimName}
                  onChange={(e) =>
                    setPassportRequestForm({
                      ...passportRequestForm,
                      pilgrimName: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    تاريخ الازدياد
                  </label>
                  <input
                    type="date"
                    value={passportRequestForm.birthDate}
                    onChange={(e) =>
                      setPassportRequestForm({
                        ...passportRequestForm,
                        birthDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    مكان الازدياد
                  </label>
                  <input
                    type="text"
                    value={passportRequestForm.birthPlace}
                    onChange={(e) =>
                      setPassportRequestForm({
                        ...passportRequestForm,
                        birthPlace: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  رقم بطاقة التعريف الوطنية (CIN)
                </label>
                <input
                  type="text"
                  value={passportRequestForm.cin}
                  onChange={(e) =>
                    setPassportRequestForm({
                      ...passportRequestForm,
                      cin: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    اسم الأب
                  </label>
                  <input
                    type="text"
                    value={passportRequestForm.fatherName}
                    onChange={(e) =>
                      setPassportRequestForm({
                        ...passportRequestForm,
                        fatherName: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    اسم الأم
                  </label>
                  <input
                    type="text"
                    value={passportRequestForm.motherName}
                    onChange={(e) =>
                      setPassportRequestForm({
                        ...passportRequestForm,
                        motherName: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  العنوان
                </label>
                <input
                  type="text"
                  value={passportRequestForm.address}
                  onChange={(e) =>
                    setPassportRequestForm({
                      ...passportRequestForm,
                      address: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  نوع الطلب
                </label>
                <select
                  value={passportRequestForm.requestType}
                  onChange={(e) =>
                    setPassportRequestForm({
                      ...passportRequestForm,
                      requestType: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                >
                  <option value="استخراج لأول مرة">استخراج لأول مرة</option>
                  <option value="تجديد">تجديد</option>
                  <option value="ضياع">ضياع</option>
                </select>
              </div>
            </div>

            {/* Printable request document */}
            <div
              id="print-area"
              className="hidden print:block space-y-4 font-sans text-slate-900 dir-rtl"
            >
              <DocumentLogoHeader />
              <div className="text-center space-y-1 border-b border-slate-200 pb-4">
                <h1 className="text-xl font-extrabold text-slate-900">
                  {agencySettings.name}
                </h1>
                <p className="text-xs font-bold text-slate-600">
                  طلب استخراج / تجديد جواز سفر
                </p>
              </div>
              <table className="w-full text-xs border border-slate-200 border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-semibold bg-slate-50 w-1/3">
                      الاسم واللقب
                    </td>
                    <td className="p-2">{passportRequestForm.pilgrimName}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-semibold bg-slate-50">
                      تاريخ ومكان الازدياد
                    </td>
                    <td className="p-2">
                      {passportRequestForm.birthDate} —{" "}
                      {passportRequestForm.birthPlace}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-semibold bg-slate-50">
                      رقم بطاقة التعريف
                    </td>
                    <td className="p-2 font-mono">{passportRequestForm.cin}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-semibold bg-slate-50">
                      اسم الأب / الأم
                    </td>
                    <td className="p-2">
                      {passportRequestForm.fatherName} /{" "}
                      {passportRequestForm.motherName}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-semibold bg-slate-50">العنوان</td>
                    <td className="p-2">{passportRequestForm.address}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold bg-slate-50">نوع الطلب</td>
                    <td className="p-2 font-bold">
                      {passportRequestForm.requestType}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="flex justify-between pt-8 text-[11px] text-slate-500">
                <span>إمضاء الوكالة: ____________</span>
                <span>إمضاء المعني بالأمر: ____________</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 print:hidden">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الطلب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Request Modal */}
      {activeModal === "idcard" && (
        <div className="print-modal-overlay fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="print-modal-box bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <h2 className="font-bold text-slate-900 text-base dir-rtl">
                طلب استخراج بطاقة هوية
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 print:hidden">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  اختر معتمر (اختياري)
                </label>
                <select
                  onChange={(e) => {
                    const p = tripPilgrims.find(
                      (pp) => pp.id === e.target.value,
                    );
                    if (p) {
                      setIdCardRequestForm({
                        ...idCardRequestForm,
                        pilgrimName: p.nameArabic,
                      });
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                >
                  <option value="">-- اختر --</option>
                  {tripPilgrims.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameArabic}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  الاسم واللقب
                </label>
                <input
                  type="text"
                  value={idCardRequestForm.pilgrimName}
                  onChange={(e) =>
                    setIdCardRequestForm({
                      ...idCardRequestForm,
                      pilgrimName: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    تاريخ الازدياد
                  </label>
                  <input
                    type="date"
                    value={idCardRequestForm.birthDate}
                    onChange={(e) =>
                      setIdCardRequestForm({
                        ...idCardRequestForm,
                        birthDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    مكان الازدياد
                  </label>
                  <input
                    type="text"
                    value={idCardRequestForm.birthPlace}
                    onChange={(e) =>
                      setIdCardRequestForm({
                        ...idCardRequestForm,
                        birthPlace: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    اسم الأب
                  </label>
                  <input
                    type="text"
                    value={idCardRequestForm.fatherName}
                    onChange={(e) =>
                      setIdCardRequestForm({
                        ...idCardRequestForm,
                        fatherName: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    اسم الأم
                  </label>
                  <input
                    type="text"
                    value={idCardRequestForm.motherName}
                    onChange={(e) =>
                      setIdCardRequestForm({
                        ...idCardRequestForm,
                        motherName: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  العنوان
                </label>
                <input
                  type="text"
                  value={idCardRequestForm.address}
                  onChange={(e) =>
                    setIdCardRequestForm({
                      ...idCardRequestForm,
                      address: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  نوع الطلب
                </label>
                <select
                  value={idCardRequestForm.requestType}
                  onChange={(e) =>
                    setIdCardRequestForm({
                      ...idCardRequestForm,
                      requestType: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs dir-rtl"
                >
                  <option value="استخراج لأول مرة">استخراج لأول مرة</option>
                  <option value="تجديد">تجديد</option>
                  <option value="ضياع">ضياع</option>
                </select>
              </div>
            </div>

            {/* Printable request document */}
            <div
              id="print-area"
              className="hidden print:block space-y-4 font-sans text-slate-900 dir-rtl"
            >
              <DocumentLogoHeader />
              <div className="text-center space-y-1 border-b border-slate-200 pb-4">
                <h1 className="text-xl font-extrabold text-slate-900">
                  {agencySettings.name}
                </h1>
                <p className="text-xs font-bold text-slate-600">
                  طلب استخراج / تجديد بطاقة تعريف وطنية
                </p>
              </div>
              <table className="w-full text-xs border border-slate-200 border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-semibold bg-slate-50 w-1/3">
                      الاسم واللقب
                    </td>
                    <td className="p-2">{idCardRequestForm.pilgrimName}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-semibold bg-slate-50">
                      تاريخ ومكان الازدياد
                    </td>
                    <td className="p-2">
                      {idCardRequestForm.birthDate} —{" "}
                      {idCardRequestForm.birthPlace}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-semibold bg-slate-50">
                      اسم الأب / الأم
                    </td>
                    <td className="p-2">
                      {idCardRequestForm.fatherName} /{" "}
                      {idCardRequestForm.motherName}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-semibold bg-slate-50">العنوان</td>
                    <td className="p-2">{idCardRequestForm.address}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold bg-slate-50">نوع الطلب</td>
                    <td className="p-2 font-bold">
                      {idCardRequestForm.requestType}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="flex justify-between pt-8 text-[11px] text-slate-500">
                <span>إمضاء الوكالة: ____________</span>
                <span>إمضاء المعني بالأمر: ____________</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 print:hidden">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الطلب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carte Passeport Print Preview Modal — one card per pilgrim of the trip */}
      {activeModal === "card" && (
        <div className="print-modal-overlay fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="print-modal-box bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <h2 className="font-bold text-slate-900 text-base">
                Cartes Passeport - {selectedTrip?.name || "مسك طيبة"}
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>

            <div
              id="print-area"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {tripPilgrims.length === 0 && (
                <p className="text-xs text-slate-400 col-span-2 text-center py-6">
                  {isAr
                    ? "لا يوجد معتمرون في هذه الرحلة."
                    : "Aucun pèlerin dans ce voyage."}
                </p>
              )}
              {tripPilgrims.map((p) => (
                <div
                  key={p.id}
                  className="border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-1 break-inside-avoid"
                >
                  <img
                    src={LOGO_SRC}
                    alt="Logo"
                    className="h-24 w-auto object-contain"
                  />
                  <p className="text-[10px] font-bold text-slate-500 dir-rtl">
                    {agencySettings.name}
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 dir-rtl">
                    {p.nameArabic}
                  </p>
                  {p.nameLatin && (
                    <p className="text-xs text-slate-500">{p.nameLatin}</p>
                  )}
                  <p className="text-[11px] text-slate-500 dir-rtl">
                    {selectedTrip?.name}
                  </p>
                  <div className="mt-1 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-mono font-bold tracking-widest">
                    {p.uniqueCode}
                  </div>
                  {p.passportNumber && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      {p.passportNumber}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 print:hidden">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Fermer
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer les Cartes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Luggage Tag Print Preview Modal — one tag per pilgrim of the trip */}
      {activeModal === "luggage" && (
        <div className="print-modal-overlay fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="print-modal-box bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <h2 className="font-bold text-slate-900 text-base dir-rtl">
                ملصقات الحقائب - {selectedTrip?.name || "مسك طيبة"}
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>

            <div
              id="print-area"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {tripPilgrims.length === 0 && (
                <p className="text-xs text-slate-400 col-span-2 text-center py-6 dir-rtl">
                  لا يوجد معتمرون في هذه الرحلة.
                </p>
              )}
              {tripPilgrims.map((p) => (
                <div
                  key={p.id}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center gap-1.5 break-inside-avoid"
                >
                  <img
                    src={LOGO_SRC}
                    alt="Logo"
                    className="h-24 w-auto object-contain"
                  />
                  <p className="text-base font-extrabold text-slate-900 dir-rtl">
                    {p.nameArabic}
                  </p>
                  <p className="text-xs font-mono text-slate-600">{p.phone}</p>
                  <p className="text-[11px] text-slate-500 dir-rtl">
                    {selectedTrip?.name}
                  </p>
                  <div className="mt-1 px-4 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-mono font-extrabold tracking-widest">
                    {p.uniqueCode}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 print:hidden">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-slate-900 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الملصقات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passport Scanner Modal */}
      <div className="print:hidden">
        <PassportScannerModal
          isOpen={isPassportScannerOpen}
          onClose={() => setIsPassportScannerOpen(false)}
          trips={trips}
          onImportPilgrim={(newPilgrim, pendingDocument) => {
            if (onAddPilgrim) {
              onAddPilgrim(newPilgrim, pendingDocument);
            }
          }}
        />
      </div>
    </div>
  );
};
