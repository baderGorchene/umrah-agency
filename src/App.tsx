import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { LoginView } from "./components/LoginView";
import { Suspense, lazy } from "react";
import i18n from "./i18n";

const DashboardView = lazy(() =>
  import("./components/DashboardView").then((module) => ({
    default: module.DashboardView,
  })),
);
const PilgrimsView = lazy(() =>
  import("./components/PilgrimsView").then((module) => ({
    default: module.PilgrimsView,
  })),
);
const PassportsView = lazy(() =>
  import("./components/PassportsView").then((module) => ({
    default: module.PassportsView,
  })),
);
const StaffView = lazy(() =>
  import("./components/StaffView").then((module) => ({
    default: module.StaffView,
  })),
);
const TripsView = lazy(() =>
  import("./components/TripsView").then((module) => ({
    default: module.TripsView,
  })),
);
const QrCenterView = lazy(() =>
  import("./components/QrCenterView").then((module) => ({
    default: module.QrCenterView,
  })),
);
const BadgePage = lazy(() =>
  import("./components/BadgePage").then((module) => ({
    default: module.BadgePage,
  })),
);
const DocumentsView = lazy(() =>
  import("./components/DocumentsView").then((module) => ({
    default: module.DocumentsView,
  })),
);
const SettingsView = lazy(() =>
  import("./components/SettingsView").then((module) => ({
    default: module.SettingsView,
  })),
);
import { SecurityModal } from "./components/SecurityModal";
import { NotificationDrawer } from "./components/NotificationDrawer";

import {
  initialAgencySettings,
  initialPilgrims,
  initialStaff,
  initialTrips,
  initialPosts,
  initialNotifications,
} from "./mockData";

import {
  getAgencySettings,
  updateAgencySettings,
} from "./services/agencyService";
import {
  getTrips,
  createTrip,
  updateTrip,
  deleteTrip,
} from "./services/tripsService";
import {
  getPilgrims,
  createPilgrim,
  updatePilgrim,
  deletePilgrim,
} from "./services/pilgrimsService";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from "./services/staffService";
import { getPosts, createPost, deletePost } from "./services/postsService";
import {
  getNotifications,
  createNotification,
  markAllNotificationsAsRead,
  clearAllNotifications,
} from "./services/notificationsService";
import { logoutUser, fetchUserProfile } from "./services/authService";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { saveDocumentRecord } from "./services/documentsService";

import {
  Language,
  Pilgrim,
  Staff,
  Trip,
  Post,
  AgencySettings,
  AppNotification,
  UserProfile,
  UserRole,
  PassportEntry,
} from "./types";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [, setJwtToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [lang, setLang] = useState<Language>("FR");

  // Core Dynamic Data States
  const [agencySettings, setAgencySettings] = useState<AgencySettings>(
    initialAgencySettings,
  );
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>(() => {
    try {
      const saved = localStorage.getItem("umrah_pilgrims_registry");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load saved pilgrims registry:", e);
    }
    return initialPilgrims;
  });
  const [passports, setPassports] = useState<PassportEntry[]>(() => {
    try {
      const saved = localStorage.getItem("umrah_passports_registry");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((p: any) => !p.id?.startsWith("pass-"));
        }
      }
    } catch (e) {
      console.warn("Failed to load saved passports registry:", e);
    }
    return [];
  });
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [notifications, setNotifications] =
    useState<AppNotification[]>(initialNotifications);

  // Sync passports & pilgrims to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "umrah_passports_registry",
        JSON.stringify(passports),
      );
    } catch (e) {
      console.warn("Failed to persist passports registry:", e);
    }
  }, [passports]);

  useEffect(() => {
    try {
      if (pilgrims.length > 0) {
        localStorage.setItem(
          "umrah_pilgrims_registry",
          JSON.stringify(pilgrims),
        );
      }
    } catch (e) {
      console.warn("Failed to persist pilgrims registry:", e);
    }
  }, [pilgrims]);

  // Modals & Drawers
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] =
    useState(false);
  const [isAddPilgrimModalOpen, setIsAddPilgrimModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);
  const [selectedTripForQr, setSelectedTripForQr] = useState<
    string | undefined
  >(undefined);

  // Supabase Auth State Listener
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Check existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setJwtToken(session.access_token);
        setIsLoggedIn(true);
        fetchUserProfile(session.user.id, session.user.email || "").then(
          (profile) => {
            if (profile) setCurrentUser(profile);
          },
        );
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setJwtToken(session.access_token);
        setIsLoggedIn(true);
        const profile = await fetchUserProfile(
          session.user.id,
          session.user.email || "",
        );
        if (profile) setCurrentUser(profile);
      } else if (_event === "SIGNED_OUT") {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setJwtToken(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // On-demand route-based network fetching to optimize data transfer and prevent loading unused tables.
  useEffect(() => {
    if (!isLoggedIn) return;

    const path = location.pathname;

    async function loadRouteData() {
      try {
        // 1. Settings (Only fetch when settings or documents page is loaded)
        if (path === "/settings" || path === "/documents") {
          const fetchedSettings = await getAgencySettings();
          setAgencySettings(fetchedSettings);
        }

        // 2. Trips (Core data needed across almost all main views. Load once if not yet populated)
        let currentTrips = trips;
        if (trips.length === 0) {
          currentTrips = await getTrips();
          setTrips(currentTrips);
        }

        // 3. Pilgrims (Load on demand for dashboard, pilgrims list, qr-center, or documents)
        if (
          path === "/" ||
          path === "/pilgrims" ||
          path === "/qr-center" ||
          path === "/documents"
        ) {
          if (pilgrims.length === 0) {
            const fetchedPilgrims = await getPilgrims(currentTrips);
            setPilgrims(fetchedPilgrims);
          }
        }

        // 4. Staff (Load on demand for dashboard, staff list, qr-center, or documents)
        if (
          path === "/" ||
          path === "/staff" ||
          path === "/qr-center" ||
          path === "/documents"
        ) {
          if (staff.length === 0) {
            const fetchedStaff = await getStaff(currentTrips);
            setStaff(fetchedStaff);
          }
        }

        // 5. Posts (Only load on news view)
        if (path === "/news") {
          if (posts.length === 0) {
            const fetchedPosts = await getPosts(currentTrips);
            setPosts(fetchedPosts);
          }
        }
      } catch (err) {
        console.error("Error loading route-specific data:", err);
      }
    }

    loadRouteData();
  }, [location.pathname, isLoggedIn]);

  // Fetch notifications only when the notification drawer is actively opened
  useEffect(() => {
    if (isNotificationDrawerOpen && isLoggedIn) {
      getNotifications().then((fetchedNotifs) => {
        setNotifications(fetchedNotifs);
      });
    }
  }, [isNotificationDrawerOpen, isLoggedIn]);

  // Sync document direction (RTL/LTR) with selected language and update i18next language
  useEffect(() => {
    document.documentElement.setAttribute("dir", lang === "AR" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang.toLowerCase());

    // sync i18next
    try {
      i18n.changeLanguage(lang === "FR" ? "fr" : "ar");
    } catch (err) {
      // ignore if i18n not available
      // console.warn('i18n not initialized yet', err);
    }
  }, [lang]);

  const isRtl = lang === "AR";
  const userRole: UserRole = currentUser?.role || "admin";

  // Unread notifications count
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  // Restore session from localStorage if within 1 week (604,800,000 ms)
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem("umrah_user_session");
      if (savedSession) {
        const { user, token, timestamp } = JSON.parse(savedSession);
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp < ONE_WEEK_MS) {
          setCurrentUser(user);
          setJwtToken(token);
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem("umrah_user_session");
        }
      }
    } catch (e) {
      console.warn("Failed to load saved session:", e);
    }
  }, []);

  // Handlers for Auth
  const handleLoginSuccess = (user: UserProfile, token: string | null) => {
    setCurrentUser(user);
    setJwtToken(token);
    setIsLoggedIn(true);
    try {
      localStorage.setItem(
        "umrah_user_session",
        JSON.stringify({ user, token, timestamp: Date.now() }),
      );
    } catch (e) {
      console.warn("Failed to persist user session:", e);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setJwtToken(null);
    try {
      localStorage.removeItem("umrah_user_session");
    } catch (e) {
      console.warn("Failed to clear saved session:", e);
    }
  };

  // Handlers for Agency Settings
  const handleUpdateSettings = async (newSettings: AgencySettings) => {
    setAgencySettings(newSettings);
    await updateAgencySettings(newSettings);
  };

  // Handlers for Pilgrims
  const handleAddPilgrim = async (
    newPilgrimData: Omit<Pilgrim, "id">,
    pendingDocument?: {
      filePath: string;
      fileUrl?: string;
      mimeType?: string;
      fileName?: string;
    },
  ) => {
    const created = await createPilgrim(newPilgrimData, trips);
    if (created) {
      setPilgrims((prev) => [created, ...prev]);

      // If a document was provided (passport scan), save it linked to the created pilgrim
      if (pendingDocument) {
        try {
          await saveDocumentRecord({
            pilgrimId: created.id,
            fileName:
              pendingDocument.fileName ||
              pendingDocument.filePath.split("/").pop() ||
              "passport",
            filePath: pendingDocument.filePath,
            fileUrl: pendingDocument.fileUrl,
            mimeType: pendingDocument.mimeType,
          });
        } catch (err) {
          console.warn("Failed to save pending document for pilgrim", err);
        }
      }

      // Update trip pilgrim count locally
      setTrips((prev) =>
        prev.map((t) =>
          t.id === created.tripId
            ? { ...t, pilgrimCount: (t.pilgrimCount || 0) + 1 }
            : t,
        ),
      );

      // Add Notification
      const notifData = {
        title: lang === "FR" ? "Nouveau Pèlerin" : "معتمر جديد",
        message:
          lang === "FR"
            ? `Le pèlerin ${created.nameArabic} a été ajouté (${created.uniqueCode})`
            : `تمت إضافة المعتمر ${created.nameArabic} وتوليد الكود ${created.uniqueCode}`,
        read: false,
        type: "trip" as const,
      };
      const createdNotif = await createNotification(notifData);
      if (createdNotif) {
        setNotifications((prev) => [createdNotif, ...prev]);
      }
    }
  };

  const handleEditPilgrim = async (updated: Pilgrim) => {
    setPilgrims((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    await updatePilgrim(updated);
  };

  const handleDeletePilgrim = async (id: string) => {
    setPilgrims((prev) => prev.filter((p) => p.id !== id));
    await deletePilgrim(id);
  };

  // Handlers for Passports
  const handleAddPassport = (
    entryData: Omit<PassportEntry, "id" | "scannedAt">,
  ): { success: boolean; duplicate?: boolean; existing?: PassportEntry } => {
    const normalizedIncoming = entryData.passportNumber.trim().toUpperCase();
    const existing = passports.find(
      (p) => p.passportNumber.trim().toUpperCase() === normalizedIncoming,
    );

    if (existing) {
      return { success: false, duplicate: true, existing };
    }

    const newEntry: PassportEntry = {
      ...entryData,
      id: `pass_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      passportNumber: normalizedIncoming,
      scannedAt: new Date().toISOString(),
    };

    setPassports((prev) => [newEntry, ...prev]);
    return { success: true };
  };

  const handleEditPassport = (updated: PassportEntry) => {
    setPassports((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    );
  };

  const handleDeletePassport = (id: string) => {
    setPassports((prev) => prev.filter((p) => p.id !== id));
  };

  // Handlers for Staff
  const handleAddStaff = async (newStaffData: Omit<Staff, "id">) => {
    const created = await createStaff(newStaffData, trips);
    if (created) {
      setStaff((prev) => [created, ...prev]);
    }
  };

  const handleEditStaff = async (updated: Staff) => {
    setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    await updateStaff(updated);
  };

  const handleDeleteStaff = async (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    await deleteStaff(id);
  };

  // Handlers for Trips
  const handleAddTrip = async (newTripData: Omit<Trip, "id">) => {
    const created = await createTrip(newTripData);
    if (created) {
      setTrips((prev) => [created, ...prev]);
    }
  };

  const handleEditTrip = async (updated: Trip) => {
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    await updateTrip(updated);
  };

  const handleDeleteTrip = async (id: string) => {
    // Optimistic UI update: remove immediately from state
    setTrips((prev) => prev.filter((t) => t.id !== id));

    // Call backend API / Firebase / database service
    try {
      await deleteTrip(id); // Ensure deleteTrip is imported/defined in your services
    } catch (error) {
      console.error("Failed to delete trip:", error);
      // Optional: re-fetch or restore previous state on error
    }
  };
  // Handlers for Posts
  const handleAddPost = async (newPostData: Omit<Post, "id" | "createdAt">) => {
    const created = await createPost(newPostData, trips);
    if (created) {
      setPosts((prev) => [created, ...prev]);

      if (created.notifyPush) {
        const notif = await createNotification({
          title:
            lang === "FR"
              ? "Nouvelle publication de l'agence"
              : "منشور جديد من الوكالة",
          message: created.title,
          read: false,
          type: "info",
        });
        if (notif) {
          setNotifications((prev) => [notif, ...prev]);
        }
      }
    }
  };

  const handleDeletePost = async (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    await deletePost(id);
  };

  // Search result jump
  const handleSelectSearchResult = (type: "pilgrim" | "staff" | "trip") => {
    if (type === "pilgrim") navigate("/pilgrims");
    else if (type === "staff") navigate("/staff");
    else if (type === "trip") navigate("/trips");
  };

  const isBadgeRoute = location.pathname.startsWith("/badge");

  // Render the badge page as a standalone responsive page without the app shell
  if (isBadgeRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center font-bold">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-600">
              جاري تحميل بطاقة المعتمر...
            </p>
          </div>
        }
      >
        <BadgePage />
      </Suspense>
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        lang={lang}
        onLanguageToggle={() =>
          setLang((prev) => (prev === "FR" ? "AR" : "FR"))
        }
      />
    );
  }

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased selection:bg-black selection:text-white"
    >
      {/* App Shell Sidebar */}
      <Sidebar onLogout={handleLogout} lang={lang} currentUser={currentUser} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          lang={lang}
          onLanguageToggle={() =>
            setLang((prev) => (prev === "FR" ? "AR" : "FR"))
          }
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          unreadNotifsCount={unreadNotifsCount}
          pilgrims={pilgrims}
          staff={staff}
          trips={trips}
          onSelectSearchResult={handleSelectSearchResult}
          currentUser={currentUser}
        />

        {/* Dynamic Router Page Views */}
        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-1">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-4 border-slate-300 border-t-black rounded-full animate-spin"></div>
              </div>
            }
          >
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
                      navigate("/pilgrims");
                      setIsAddPilgrimModalOpen(true);
                    }}
                    onOpenAddStaffModal={() => {
                      navigate("/staff");
                      setIsAddStaffModalOpen(true);
                    }}
                    onOpenAddTripModal={() => {
                      navigate("/trips");
                      setIsAddTripModalOpen(true);
                    }}
                  />
                }
              />

              {/* Pilgrims View: Admin & Agent */}
              <Route
                path="/pilgrims"
                element={
                  ["admin", "agent"].includes(userRole) ? (
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
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              {/* Passports Extraction & Registry View: Admin & Agent */}
              <Route
                path="/passports"
                element={
                  ["admin", "agent"].includes(userRole) ? (
                    <PassportsView
                      lang={lang}
                      passports={passports}
                      onAddPassport={handleAddPassport}
                      onEditPassport={handleEditPassport}
                      onDeletePassport={handleDeletePassport}
                      trips={trips}
                      onAddPilgrim={handleAddPilgrim}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              {/* Staff View: Admin & Agent */}
              <Route
                path="/staff"
                element={
                  ["admin", "agent"].includes(userRole) ? (
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
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              {/* Trips View: Admin & Agent */}
              <Route
                path="/trips"
                element={
                  ["admin", "agent"].includes(userRole) ? (
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
                      onDeleteTrip={handleDeleteTrip}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              {/* QR Center: All Roles */}
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

              <Route path="/badge/:code" element={<BadgePage />} />

              {/* Documents View: Admin & Agent */}
              <Route
                path="/documents"
                element={
                  ["admin", "agent"].includes(userRole) ? (
                    <DocumentsView
                      lang={lang}
                      trips={trips}
                      pilgrims={pilgrims}
                      agencySettings={agencySettings}
                      onAddPilgrim={handleAddPilgrim}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              {/* Settings View: Admin only */}
              <Route
                path="/settings"
                element={
                  userRole === "admin" ? (
                    <SettingsView
                      lang={lang}
                      settings={agencySettings}
                      onUpdateSettings={handleUpdateSettings}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
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
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
