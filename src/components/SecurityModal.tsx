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

interface SecurityModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ lang, isOpen, onClose }) => {
  const isAr = lang === 'AR';
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
                {isAr ? 'ميثاق الأمان وحماية البيانات' : 'Charte de confiance et protection des données'}
              </h2>
              <p className="text-xs text-amber-400 font-medium text-start mt-0.5">
                {isAr
                  ? 'نلتزم بحماية خصوصية بيانات وكالتكم وتوفير بيئة عمل آمنة ومستقلة بالكامل.'
                  : 'Nous nous engageons à protéger la confidentialité de vos données et à fournir un environnement sécurisé.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <div className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-[11px] text-slate-300 font-mono">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'الإصدار 1.0 - 01 / 07 / 2026' : 'Version 1.0 - 01 / 07 / 2026'}</span>
            </div>
            <button
              onClick={onClose}
              aria-label={isAr ? "إغلاق" : "Fermer"}
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
                  1. مقدمة
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  نؤمن في منصة "رفيق العمرة" أن الثقة هي أساس كل شراكة ناجحة. لذلك، نلتزم بأعلى معايير السرية والأمان وحماية البيانات الخاصة بوكالتكم الموقرة وبيانات معتمريكم. يهدف هذا الميثاق إلى توضيح التزاماتنا المتبادلة لضمان بيئة عمل آمنة، احترافية، ومستقلة تماماً.
                </p>
              </div>

              {/* Card 2: التزامات منصة رفيق العمرة */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
                  2. التزامات منصة رفيق العمرة
                </h3>
                <ul className="space-y-2 text-xs text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>حماية البيانات:</strong> نلتزم بتشفير كافة البيانات الحساسة وحفظها في خوادم سحابية آمنة ومحمية ضد أي اختراقات.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>العزل الكامل بين الوكالات:</strong> نضمن عزلاً برمجياً وتقنياً كاملاً لقواعد البيانات الخاصة بكل وكالة. لا يمكن لأي وكالة أخرى، تحت أي ظرف، الاطلاع على بياناتكم أو الوصول إليها.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>عدم مشاركة البيانات:</strong> نتعهد بعدم بيع، مشاركة، أو استخدام بيانات وكالتكم أو معتمريكم لأي أغراض تجارية أو إعلانية خارج نطاق تشغيل المنصة.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>الأمان:</strong> نطبق معايير أمان عالمية تشمل بروتوكولات HTTPS والتشفير المتقدم لحماية هويات المعتمرين الرقمية (QR).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>التطوير المستمر:</strong> نعمل باستمرار على تحديث الأنظمة، تحسين الأداء، وإضافة ميزات جديدة تخدم نمو أعمالكم.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>الدعم الفني:</strong> نوفر فريق دعم فني متكامل للرد على استفساراتكم وحل المشكلات التشغيلية بكفاءة وسرعة.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>السرية المهنية:</strong> يلتزم جميع موظفي منصتنا بالمحافظة على السرية التامة للمعلومات التجارية والتشغيلية الخاصة بالوكالات.</span>
                  </li>
                </ul>
              </div>

              {/* Card 3: التزامات الوكالة */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
                  3. التزامات الوكالة
                </h3>
                <ul className="space-y-2 text-xs text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>إدخال بيانات صحيحة:</strong> تلتزم الوكالة بإدخال بيانات دقيقة وصحيحة للمعتمرين والرحلات لضمان دقة العمليات وإصدار البطاقات.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>المحافظة على الحساب:</strong> تلتزم الوكالة بالحفاظ على سرية بيانات تسجيل الدخول وتتحمل المسؤولية الكاملة عن أي أنشطة تتم عبر حسابها.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>الاستخدام المشروع:</strong> يتعهد مستخدمو الوكالة باستخدام المنصة في الأغراض المخصصة لها قانوناً وتنظيمياً لإدارة شؤون العمرة.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>حماية بيانات المعتمرين:</strong> تلتزم الوكالة بعدم إساءة استخدام بيانات المعتمرين الشخصية أو مشاركتها مع جهات غير مخولة.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>الإبلاغ عن المشكلات:</strong> تلتزم الوكالة بإخبار الدعم الفني فوراً عند ملاحظة أي سلوك غير معتاد أو اشتباه في ثغرة أمنية.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>احترام الملكية الفكرية:</strong> تتعهد الوكالة بعدم نسخ، تعديل، أو هندسة عكسية لأي من البرمجيات أو التصاميم الخاصة بالمنصة.</span>
                  </li>
                </ul>
              </div>

              {/* Card 4: الخصوصية */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
                  4. الخصوصية
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  خصوصيتكم هي أولويتنا القصوى. تعمل منصة رفيق العمرة بنظام مساحات العمل المعزولة برمجياً (Multi-Tenant Architecture)، حيث يتم فصل بيانات كل وكالة تشغيلياً وقاعدياً بشكل تام. هذا يضمن حظر أي تداخل أو تسريب للبيانات بين شركائنا من وكالات الأسفار، مما يوفر لكم أماناً يماثل الأنظمة السحابية العالمية الكبرى.
                </p>
              </div>

              {/* Card 5: الملكية الفكرية */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
                  5. الملكية الفكرية
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  تظل جميع حقوق الملكية الفكرية الخاصة بالمنصة، بما في ذلك البرمجيات، التصاميم، والشعارات، ملكاً حصرياً لمنصة رفيق العمرة. وبالمثل، تظل كافة البيانات التشغيلية والشعارات المرفوعة من قبل الوكالة ملكاً خاصاً لها.
                </p>
              </div>

              {/* Card 6: سياسة الدعم الفني */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
                  6. سياسة الدعم الفني
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  نسعى للرد على المشكلات التقنية خلال أقرب وقت ممكن، مع إعطاء الأولوية للمشكلات التي تؤثر على تشغيل الرحلات.
                </p>
              </div>

              {/* Card 7: إنهاء الخدمة */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
                  7. إنهاء الخدمة
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  يحق للوكالة التوقف عن استخدام المنصة وتصدير بياناتها في أي وقت. وفي حال مخالفة بنود هذا الميثاق أو الاستخدام غير المشروع للمنصة، يحق لإدارة رفيق العمرة تعليق الحساب مؤقتاً أو إنهاء الخدمة بعد إخبار الوكالة.
                </p>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-5 text-start">
              
              {/* Principles Card */}
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-100/40 border border-amber-200 rounded-2xl p-5 space-y-3">
                <h3 className="font-extrabold text-sm text-amber-900 flex items-center gap-2">
                  <Gem className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>مبادئ رفيق العمرة</span>
                </h3>
                <ul className="space-y-2 text-xs text-amber-950 font-bold">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                    <span>الثقة قبل أي شيء.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                    <span>خصوصية الوكالات خط أحمر.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                    <span>نجاح الوكالة هو نجاحنا.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                    <span>نؤمن بالتطوير المستمر والاستماع إلى شركائنا.</span>
                  </li>
                </ul>
              </div>

              {/* Protection Checklist Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>بيانات الحماية</span>
                </h3>
                <div className="space-y-2 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>جميع بيانات الوكالة معزولة</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>لا يمكن لأي وكالة رؤية بيانات وكالة أخرى</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>جميع العمليات تتم داخل مساحة خاصة بالوكالة</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>يتم تسجيل الموافقة إلكترونياً</span>
                  </div>
                </div>
              </div>

              {/* Approval Action Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs print:hidden">
                <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
                  حالة الموافقة
                </h3>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-black focus:ring-black border-slate-300 cursor-pointer"
                  />
                  <span>لقد قرأت هذا الميثاق وأوافق على جميع البنود.</span>
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
                    <span>أوافق على الميثاق</span>
                  </button>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>تمت الموافقة على ميثاق الثقة وحماية البيانات.</span>
                    </div>
                    {acceptedDate && (
                      <p className="text-[11px] text-emerald-700 font-mono">
                        تاريخ الموافقة: <strong>{acceptedDate}</strong>
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
                  <span>تحميل نسخة PDF</span>
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
