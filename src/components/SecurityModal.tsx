import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { 
  Shield, 
  CheckCircle2, 
  Check, 
  Info, 
  Gem, 
  FileText, 
  CheckSquare, 
  X,
  Printer
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SecurityModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ lang, isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [isChecked, setIsChecked] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [acceptedDate, setAcceptedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const savedAccepted = localStorage.getItem('charterAccepted') === 'true';
    const savedDate = localStorage.getItem('charterAcceptedDate');
    if (savedAccepted) {
      setIsAccepted(true);
      setIsChecked(true);
      if (savedDate) setAcceptedDate(savedDate);
    }
  }, [isOpen]);

  const handleAccept = () => {
    if (!isChecked) return;
    const nowStr = new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    localStorage.setItem('charterAccepted', 'true');
    localStorage.setItem('charterAcceptedDate', nowStr);
    setIsAccepted(true);
    setAcceptedDate(nowStr);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl w-full max-w-5xl my-6 overflow-hidden text-slate-900 font-sans relative flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:my-0">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 print:bg-white print:text-black print:border-b print:border-slate-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg tracking-tight text-start">
                {t('security.title')}
              </h2>
              <p className="text-xs text-amber-400 font-medium text-start mt-0.5">
                {t('security.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <div className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-[11px] text-slate-300 font-mono">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('misc.version')}</span>
            </div>
            <button
              onClick={onClose}
              aria-label={t('buttons.close')}
              className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Content Grid */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50 print:bg-white print:overflow-visible">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
            
            {/* Main Content Column */}
            <div className="lg:col-span-8 space-y-4 text-start">
              
              {/* Card 1: مقدمة */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
                  {t('security.intro_title')}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {t('security.intro_text')}
                </p>
              </div>

              {/* Card 2: التزامات منصة رفيق العمرة */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
                  {t('security.commit_title')}
                </h3>
                <ul className="space-y-2 text-xs text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t('security.commit_list_1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t('security.commit_list_2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t('security.commit_list_3')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t('security.commit_list_4')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t('security.commit_list_5')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t('security.commit_list_6')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t('security.commit_list_7')}</span>
                  </li>
                </ul>
              </div>

              {/* Card 3: التزامات الوكالة */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
                  {t('security.agency_commit_title')}
                </h3>
                <ul className="space-y-2 text-xs text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{t('security.agency_commit_list_1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{t('security.agency_commit_list_2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{t('security.agency_commit_list_3')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{t('security.agency_commit_list_4')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{t('security.agency_commit_list_5')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{t('security.agency_commit_list_6')}</span>
                  </li>
                </ul>
              </div>

              {/* Card 4: الخصوصية */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
                  {t('security.privacy_title')}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {t('security.privacy_text')}
                </p>
              </div>

              {/* Card 5: الملكية الفكرية */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
                  {t('security.intellectual_title')}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {t('security.intellectual_text')}
                </p>
              </div>

              {/* Card 6: سياسة الدعم الفني */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
                  {t('security.support_title')}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {t('security.support_text')}
                </p>
              </div>

              {/* Card 7: إنهاء الخدمة */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
                  {t('security.termination_title')}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {t('security.termination_text')}
                </p>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-5 text-start">
              
              {/* Principles Card */}
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-100/40 border border-amber-200 rounded-2xl p-5 space-y-3">
                <h3 className="font-extrabold text-sm text-amber-900 flex items-center gap-2">
                  <Gem className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t('security.principles_title')}</span>
                </h3>
                <ul className="space-y-2 text-xs text-amber-950 font-bold">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                    <span>{t('security.principles_list_1')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                    <span>{t('security.principles_list_2')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                    <span>{t('security.principles_list_3')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                    <span>{t('security.principles_list_4')}</span>
                  </li>
                </ul>
              </div>

              {/* Protection Checklist Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('security.protection_title')}</span>
                </h3>
                <div className="space-y-2 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t('security.protection_list_1')}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t('security.protection_list_2')}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t('security.protection_list_3')}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t('security.protection_list_4')}</span>
                  </div>
                </div>
              </div>

              {/* Approval Action Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs print:hidden">
                <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
                  {t('security.approval_title')}
                </h3>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-black focus:ring-black border-slate-300 cursor-pointer"
                  />
                  <span>{t('security.approval_checkbox')}</span>
                </label>

                {!isAccepted ? (
                  <button
                    onClick={handleAccept}
                    disabled={!isChecked}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                      isChecked
                        ? 'bg-black hover:bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>{t('security.approval_button')}</span>
                  </button>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{t('security.approval_accepted')}</span>
                    </div>
                    {acceptedDate && (
                      <p className="text-[11px] text-emerald-700 font-mono">
                        {t('security.approval_date', { date: acceptedDate })}
                      </p>
                    )}
                  </div>
                )}

                {/* PDF Export Button */}
                <button
                  onClick={handlePrintPdf}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200/80"
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>{t('security.download_pdf')}</span>
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Document Officiel — Umrah Compagnon Security Charter</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white transition-all shadow-xs cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
