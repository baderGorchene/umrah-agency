import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Shield, Key } from 'lucide-react';
import { Language, Pilgrim, Staff, Trip, UserProfile } from '../types';
import { useTranslation } from 'react-i18next';

interface TopBarProps {
  lang: Language;
  onLanguageToggle: () => void;
  onOpenSecurityModal: () => void;
  onOpenNotifications: () => void;
  unreadNotifsCount: number;
  pilgrims: Pilgrim[];
  staff: Staff[];
  trips: Trip[];
  onSelectSearchResult?: (type: 'pilgrim' | 'staff' | 'trip', id: string) => void;
  currentUser?: UserProfile | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  lang,
  onLanguageToggle,
  onOpenSecurityModal,
  onOpenNotifications,
  unreadNotifsCount,
  pilgrims,
  staff,
  trips,
  onSelectSearchResult,
  currentUser
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Filter search results
  const filteredPilgrims = searchQuery.trim()
    ? pilgrims.filter(p => 
        p.nameArabic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.nameLatin && p.nameLatin.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.phone.includes(searchQuery) ||
        p.uniqueCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredStaff = searchQuery.trim()
    ? staff.filter(s =>
        s.nameArabic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nameLatin && s.nameLatin.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.phone.includes(searchQuery)
      )
    : [];

  const filteredTrips = searchQuery.trim()
    ? trips.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const hasSearchResults = filteredPilgrims.length > 0 || filteredStaff.length > 0 || filteredTrips.length > 0;

  const { t } = useTranslation();

  const roleLabel = {
    admin: t('roles.admin'),
    agent: t('roles.agent'),
    pilgrim: t('roles.pilgrim'),
  }[currentUser?.role || 'admin'];

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-20 print:hidden">
      {/* Global Search Bar */}
      <div className="relative w-96">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            placeholder={t('search.placeholder')}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-slate-400 transition-all text-start"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 rtl:right-auto rtl:left-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchFocused && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-11 bg-white border border-slate-100 rounded-xl shadow-xl p-2 z-50 max-h-80 overflow-y-auto">
            {!hasSearchResults ? (
              <p className="text-xs text-slate-400 text-center py-4">
              {t('search.no_result')}
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                {filteredPilgrims.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">{t('search.pilgrims')}</div>
                    {filteredPilgrims.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => {
                          if (onSelectSearchResult) onSelectSearchResult('pilgrim', p.id);
                          navigate('/pilgrims');
                          setSearchQuery('');
                        }}
                        className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{p.nameArabic}</span>
                          {p.nameLatin && <span className="text-slate-400 ml-1">({p.nameLatin})</span>}
                        </div>
                        <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-mono">
                          {p.uniqueCode}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {filteredStaff.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">{t('search.personnel')}</div>
                    {filteredStaff.map(s => (
                      <div 
                        key={s.id}
                        onClick={() => {
                          if (onSelectSearchResult) onSelectSearchResult('staff', s.id);
                          navigate('/staff');
                          setSearchQuery('');
                        }}
                        className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer flex justify-between items-center"
                      >
                        <span className="font-semibold text-slate-800">{s.nameArabic}</span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded">
                          {s.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {filteredTrips.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">{t('search.trips')}</div>
                    {filteredTrips.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => {
                          if (onSelectSearchResult) onSelectSearchResult('trip', t.id);
                          navigate('/trips');
                          setSearchQuery('');
                        }}
                        className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer flex justify-between items-center"
                      >
                        <span className="font-semibold text-slate-800">{t.name}</span>
                        <span className="text-slate-400 text-[10px]">{t.startDate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* JWT Session Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-amber-900 text-xs font-semibold shadow-2xs">
          <Key className="w-3.5 h-3.5 text-amber-600" />
          <span>{roleLabel}</span>
        </div>

        {/* Security Shield Icon with Alert Dot */}
        <button
          onClick={onOpenSecurityModal}
          title={lang === 'FR' ? "Charte de sécurité & protection des données" : "ميثاق الأمان وحماية البيانات"}
          className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors group"
        >
          <Shield className="w-5 h-5 text-slate-700 group-hover:text-black" />
          {localStorage.getItem('charterAccepted') !== 'true' && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          title={lang === 'FR' ? "Notifications" : "الإشعارات"}
          className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors group"
        >
          <Bell className="w-5 h-5 text-slate-700 group-hover:text-black" />
          {unreadNotifsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
              {unreadNotifsCount}
            </span>
          )}
        </button>

        {/* Language Switcher Toggle (FR / ع) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200/60">
          <button
            onClick={onLanguageToggle}
            className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
              lang === 'AR' ? 'bg-black text-white shadow-2xs' : 'text-slate-600 hover:text-black'
            }`}
          >
            ع
          </button>
          <button
            onClick={onLanguageToggle}
            className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
              lang === 'FR' ? 'bg-black text-white shadow-2xs' : 'text-slate-600 hover:text-black'
            }`}
          >
            FR
          </button>
        </div>
      </div>
    </header>
  );
};
