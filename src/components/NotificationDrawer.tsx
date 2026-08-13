import React, { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Language, AppNotification } from '../types';

interface NotificationDrawerProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  lang,
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll
}) => {
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

  if (!isOpen) return null;
  const isAr = lang === 'AR';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-black/30 backdrop-blur-2xs z-50 flex justify-end rtl:justify-start"
    >
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right rtl:slide-in-from-left duration-200">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-800" />
            <h2 className="font-bold text-slate-900 text-sm">
              {isAr ? 'مركز الإشعارات' : 'Centre de notifications'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearAll}
              className="text-[11px] font-semibold text-slate-400 hover:text-red-600 px-2 py-1 rounded"
            >
              {isAr ? 'مسح الكل' : 'Tout effacer'}
            </button>
            <button
              onClick={onClose}
              aria-label={isAr ? "إغلاق" : "Fermer"}
              className="text-slate-400 font-bold p-1 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              {isAr ? 'لا توجد أي إشعارات.' : 'Aucune notification.'}
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border text-xs space-y-1 transition-all text-start ${
                  n.read ? 'bg-slate-50/50 border-slate-100 text-slate-600' : 'bg-amber-50/40 border-amber-200/80 text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{n.title}</span>
                  <span className="text-[10px] text-slate-400">{n.time}</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onMarkAllAsRead}
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-3 rounded-lg text-xs transition-all"
          >
            {isAr ? 'تعليم الكل كمعلوم' : 'Tout marquer comme lu'}
          </button>
        </div>
      </div>
    </div>
  );
};
