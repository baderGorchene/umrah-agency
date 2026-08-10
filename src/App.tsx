import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { PilgrimsView } from './components/PilgrimsView';
import { StaffView } from './components/StaffView';
import { TripsView } from './components/TripsView';
import { QrCenterView } from './components/QrCenterView';
import { BadgePage } from './components/BadgePage';
import { DocumentsView } from './components/DocumentsView';
import { NewsView } from './components/NewsView';
import { SettingsView } from './components/SettingsView';
import { SecurityModal } from './components/SecurityModal';
import { NotificationDrawer } from './components/NotificationDrawer';

import { 
  initialAgencySettings, 
  initialPilgrims, 
  initialStaff, 
  initialTrips, 
  initialPosts, 
  initialNotifications 
} from './mockData';

import { getAgencySettings, updateAgencySettings } from './services/agencyService';
import { getTrips, createTrip, updateTrip } from './services/tripsService';
import { getPilgrims, createPilgrim, updatePilgrim, deletePilgrim } from './services/pilgrimsService';
import { getStaff, createStaff, updateStaff, deleteStaff } from './services/staffService';
import { getPosts, createPost, deletePost } from './services/postsService';
import { getNotifications, createNotification, markAllNotificationsAsRead, clearAllNotifications } from './services/notificationsService';

import { Language, Pilgrim, Staff, Trip, Post, AgencySettings, AppNotification } from './types';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [lang, setLang] = useState<Language>('FR');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Core Dynamic Data States
  const [agencySettings, setAgencySettings] = useState<AgencySettings>(initialAgencySettings);
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>(initialPilgrims);
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);

  // Modals & Drawers
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isAddPilgrimModalOpen, setIsAddPilgrimModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);
  const [selectedTripForQr, setSelectedTripForQr] = useState<string | undefined>(undefined);

  // Async load data from Supabase on mount
  useEffect(() => {
    async function loadAllData() {
      setIsLoadingData(true);
      try {
        const fetchedSettings = await getAgencySettings();
        setAgencySettings(fetchedSettings);

        const fetchedTrips = await getTrips();
        setTrips(fetchedTrips);

        const [fetchedPilgrims, fetchedStaff, fetchedPosts, fetchedNotifs] = await Promise.all([
          getPilgrims(fetchedTrips),
          getStaff(fetchedTrips),
          getPosts(fetchedTrips),
          getNotifications(),
        ]);

        setPilgrims(fetchedPilgrims);
        setStaff(fetchedStaff);
        setPosts(fetchedPosts);
        setNotifications(fetchedNotifs);
      } catch (err) {
        console.error('Error loading Supabase data into App state:', err);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadAllData();
  }, []);

  // Sync document direction (RTL/LTR) with selected language
  useEffect(() => {
    document.documentElement.setAttribute('dir', lang === 'AR' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang.toLowerCase());
  }, [lang]);

  const isRtl = lang === 'AR';

  // Unread notifications count
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  // Handlers for Agency Settings
  const handleUpdateSettings = async (newSettings: AgencySettings) => {
    setAgencySettings(newSettings);
    await updateAgencySettings(newSettings);
  };

  // Handlers for Pilgrims
  const handleAddPilgrim = async (newPilgrimData: Omit<Pilgrim, 'id'>) => {
    const created = await createPilgrim(newPilgrimData, trips);
    if (created) {
      setPilgrims(prev => [created, ...prev]);

      // Update trip pilgrim count locally
      setTrips(prev => prev.map(t => t.id === created.tripId ? { ...t, pilgrimCount: t.pilgrimCount + 1 } : t));

      // Add Notification
      const notifData = {
        title: lang === 'FR' ? 'Nouveau Pèlerin' : 'معتمر جديد',
        message: lang === 'FR'
          ? `Le pèlerin ${created.nameArabic} a été ajouté (${created.uniqueCode})`
          : `تمت إضافة المعتمر ${created.nameArabic} وتوليد الكود ${created.uniqueCode}`,
        read: false,
        type: 'trip' as const,
      };
      const createdNotif = await createNotification(notifData);
      if (createdNotif) {
        setNotifications(prev => [createdNotif, ...prev]);
      }
    }
  };

  const handleEditPilgrim = async (updated: Pilgrim) => {
    setPilgrims(prev => prev.map(p => p.id === updated.id ? updated : p));
    await updatePilgrim(updated);
  };

  const handleDeletePilgrim = async (id: string) => {
    setPilgrims(prev => prev.filter(p => p.id !== id));
    await deletePilgrim(id);
  };

  // Handlers for Staff
  const handleAddStaff = async (newStaffData: Omit<Staff, 'id'>) => {
    const created = await createStaff(newStaffData, trips);
    if (created) {
      setStaff(prev => [created, ...prev]);
    }
  };

  const handleEditStaff = async (updated: Staff) => {
    setStaff(prev => prev.map(s => s.id === updated.id ? updated : s));
    await updateStaff(updated);
  };

  const handleDeleteStaff = async (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    await deleteStaff(id);
  };

  // Handlers for Trips
  const handleAddTrip = async (newTripData: Omit<Trip, 'id'>) => {
    const created = await createTrip(newTripData);
    if (created) {
      setTrips(prev => [created, ...prev]);
    }
  };

  const handleEditTrip = async (updated: Trip) => {
    setTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
    await updateTrip(updated);
  };

  // Handlers for Posts
  const handleAddPost = async (newPostData: Omit<Post, 'id' | 'createdAt'>) => {
    const created = await createPost(newPostData, trips);
    if (created) {
      setPosts(prev => [created, ...prev]);

      if (created.notifyPush) {
        const notif = await createNotification({
          title: lang === 'FR' ? 'Nouvelle publication de l\'agence' : 'منشور جديد من الوكالة',
          message: created.title,
          read: false,
          type: 'info',
        });
        if (notif) {
          setNotifications(prev => [notif, ...prev]);
        }
      }
    }
  };

  const handleDeletePost = async (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    await deletePost(id);
  };


  // Search result jump
  const handleSelectSearchResult = (type: 'pilgrim' | 'staff' | 'trip', id: string) => {
    if (type === 'pilgrim') navigate('/pilgrims');
    else if (type === 'staff') navigate('/staff');
    else if (type === 'trip') navigate('/trips');
  };

  const isBadgeRoute = location.pathname.startsWith('/badge');

  if (!isLoggedIn && isBadgeRoute) {
    return <BadgePage />;
  }

  if (!isLoggedIn) {
    return <LoginView onLoginSuccess={() => setIsLoggedIn(true)} lang={lang} onLanguageToggle={() => setLang(prev => prev === 'FR' ? 'AR' : 'FR')} />;
  }

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased selection:bg-black selection:text-white"
    >
      {/* App Shell Sidebar */}
      <Sidebar
        onLogout={() => setIsLoggedIn(false)}
        lang={lang}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          lang={lang}
          onLanguageToggle={() => setLang(prev => prev === 'FR' ? 'AR' : 'FR')}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          unreadNotifsCount={unreadNotifsCount}
          pilgrims={pilgrims}
          staff={staff}
          trips={trips}
          onSelectSearchResult={handleSelectSearchResult}
        />

        {/* Dynamic Router Page Views */}
        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardView
                  lang={lang}
                  pilgrims={pilgrims}
                  staff={staff}
                  trips={trips}
                  onOpenAddPilgrimModal={() => {
                    navigate('/pilgrims');
                    setIsAddPilgrimModalOpen(true);
                  }}
                  onOpenAddStaffModal={() => {
                    navigate('/staff');
                    setIsAddStaffModalOpen(true);
                  }}
                  onOpenAddTripModal={() => {
                    navigate('/trips');
                    setIsAddTripModalOpen(true);
                  }}
                />
              }
            />

            <Route
              path="/pilgrims"
              element={
                <PilgrimsView
                  lang={lang}
                  pilgrims={pilgrims}
                  trips={trips}
                  onAddPilgrim={handleAddPilgrim}
                  onEditPilgrim={handleEditPilgrim}
                  onDeletePilgrim={handleDeletePilgrim}
                  isAddModalOpen={isAddPilgrimModalOpen}
                  setIsAddModalOpen={setIsAddPilgrimModalOpen}
                />
              }
            />

            <Route
              path="/staff"
              element={
                <StaffView
                  lang={lang}
                  staffList={staff}
                  trips={trips}
                  onAddStaff={handleAddStaff}
                  onEditStaff={handleEditStaff}
                  onDeleteStaff={handleDeleteStaff}
                  isAddModalOpen={isAddStaffModalOpen}
                  setIsAddModalOpen={setIsAddStaffModalOpen}
                />
              }
            />

            <Route
              path="/trips"
              element={
                <TripsView
                  lang={lang}
                  trips={trips}
                  onAddTrip={handleAddTrip}
                  onEditTrip={handleEditTrip}
                  onNavigateToQrCenter={(tripId) => {
                    setSelectedTripForQr(tripId);
                    navigate(`/qr-center?tripId=${tripId}`);
                  }}
                  isAddModalOpen={isAddTripModalOpen}
                  setIsAddModalOpen={setIsAddTripModalOpen}
                />
              }
            />

            <Route
              path="/qr-center"
              element={
                <QrCenterView
                  lang={lang}
                  trips={trips}
                  pilgrims={pilgrims}
                  staff={staff}
                  selectedTripId={selectedTripForQr}
                />
              }
            />

            <Route
              path="/badge/:code"
              element={<BadgePage />}
            />

            <Route
              path="/documents"
              element={
                <DocumentsView
                  lang={lang}
                  trips={trips}
                  pilgrims={pilgrims}
                  staff={staff}
                  agencySettings={agencySettings}
                  onAddPilgrim={handleAddPilgrim}
                />
              }
            />

            <Route
              path="/news"
              element={
                <NewsView
                  lang={lang}
                  posts={posts}
                  trips={trips}
                  onAddPost={handleAddPost}
                  onDeletePost={handleDeletePost}
                />
              }
            />

            <Route
              path="/settings"
              element={
                <SettingsView
                  lang={lang}
                  settings={agencySettings}
                  onUpdateSettings={handleUpdateSettings}
                />
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <SecurityModal
        lang={lang}
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      <NotificationDrawer
        lang={lang}
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={async () => {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          await markAllNotificationsAsRead();
        }}
        onClearAll={async () => {
          setNotifications([]);
          await clearAllNotifications();
        }}
      />
    </div>
  );
}

