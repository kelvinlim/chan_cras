import { useState, useEffect, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout';
import WeeklyCalendar from './components/WeeklyCalendar';
import EventModal from './components/EventModal';
import { authService, eventService, studyService, subjectService, procedureService, settingsService, userService } from './services/api';

import EntityManager from './components/EntityManager';
import StudySubjectLinker from './components/StudySubjectLinker';
import SettingsManager from './components/SettingsManager';
import MFASettings from './components/MFASettings';

import LoginPage from './components/LoginPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentView, setCurrentView] = useState('Dashboard');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [lookups, setLookups] = useState<{ studies: any[], subjects: any[], procedures: any[] }>({
    studies: [],
    subjects: [],
    procedures: []
  });
  const [systemConfig, setSystemConfig] = useState<{ DEFAULT_TIMEZONE: string }>({ DEFAULT_TIMEZONE: 'Asia/Hong_Kong' });
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [eventsData, studiesData, subjectsData, proceduresData, configData, userData] = await Promise.all([
        eventService.list(),
        studyService.list(),
        subjectService.list(),
        procedureService.list(),
        settingsService.getConfig(),
        authService.getMe()
      ]);
      setEvents(eventsData);
      setLookups({
        studies: studiesData,
        subjects: subjectsData,
        procedures: proceduresData
      });
      setSystemConfig(configData);
      setCurrentUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await fetchData();
      } else {
        setIsAuthenticated(false);
      }
    };
    initAuth();
  }, [fetchData]);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'Studies':
        return (
          <EntityManager
            title="Studies"
            service={studyService}
            fields={[
              { key: 'ref_code', label: 'Ref Code', type: 'text', readOnly: true },
              { key: 'title', label: 'Study Name', type: 'text' },
              { key: 'principal_investigator', label: 'PI', type: 'text' },
              { key: 'description', label: 'Description', type: 'text' },
              { key: 'is_active', label: 'Active', type: 'checkbox' },
            ]}
            onRefresh={fetchData}
          />
        );
      case 'Subjects':
        return (
          <EntityManager
            title="Subjects"
            service={subjectService}
            fields={[
              { key: 'ref_code', label: 'Ref Code', type: 'text', readOnly: true },
              { key: 'firstname', label: 'First Name', type: 'text' },
              { key: 'lastname', label: 'Last Name', type: 'text' },
              {
                key: 'study_id', label: 'Assigned Study', type: 'select',
                options: lookups.studies.map(s => ({ label: `${s.ref_code}: ${s.name}`, value: s.id })),
                readOnlyOnEdit: true,
                required: true
              },
              { key: 'birthdate', label: 'DOB', type: 'date' },
              { key: 'sex', label: 'Sex', type: 'select', options: [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }] },
            ]}
            onRefresh={fetchData}
          />
        );
      case 'Linkage':
        return (
          <StudySubjectLinker
            studies={lookups.studies}
            subjects={lookups.subjects}
            onRefresh={fetchData}
          />
        );
      case 'Procedures':
        return (
          <EntityManager
            title="Procedures"
            service={procedureService}
            fields={[
              { key: 'ref_code', label: 'Ref Code', type: 'text', readOnly: true },
              {
                key: 'study_id', label: 'Study', type: 'select', persistent: true, options: lookups.studies.map(s => ({
                  label: `${s.ref_code}: ${s.title.substring(0, 20)}${s.title.length > 20 ? '...' : ''}`,
                  value: s.id
                }))
              },
              { key: 'name', label: 'Procedure Name', type: 'text' },
              { key: 'description', label: 'Description', type: 'text' },
              { key: 'form_data_schema', label: 'Form Schema (JSON)', type: 'json' },
            ]}
            onRefresh={fetchData}
          />
        );
      case 'Users':
        return (
          <EntityManager
            title="Users"
            service={userService}
            fields={[
              { key: 'ref_code', label: 'Ref Code', type: 'text', readOnly: true },
              { key: 'firstname', label: 'First Name', type: 'text' },
              { key: 'lastname', label: 'Last Name', type: 'text' },
              { key: 'email', label: 'Primary Email (Google Auth)', type: 'text' },
              { key: 'gmail', label: 'Secondary Email (Local Login)', type: 'text' },
              { key: 'password', label: 'Password', type: 'text' },
              { key: 'admin_level', label: 'Admin Level', type: 'number' }, // 0, 1, 2
              { key: 'is_superuser', label: 'Superuser', type: 'checkbox' },
              { key: 'mfa_enabled', label: 'MFA Enabled', type: 'checkbox' },
              { key: 'status', label: 'Status', type: 'select', options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }] },
            ]}
            onRefresh={fetchData}
          />
        );
      case 'Security':
        return (
          <MFASettings
            user={currentUser}
            onRefresh={fetchData}
          />
        );
      case 'Settings':
        return <SettingsManager />;
      default:
        return (
          <>
            {/* Main Calendar View */}
            <div className="flex-1 min-h-0">
              <WeeklyCalendar
                events={events}
                lookups={lookups}
                timezone={systemConfig.DEFAULT_TIMEZONE}
                onEventClick={(event) => {
                  setSelectedEvent(event);
                  setIsEventModalOpen(true);
                }}
                onAddEvent={() => {
                  setSelectedEvent(null);
                  setIsEventModalOpen(true);
                }}
              />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Active Studies</p>
                <p className="text-3xl font-serif font-bold text-hku-green mt-2 text-3xl">{lookups.studies.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total Subjects</p>
                <p className="text-3xl font-serif font-bold text-hku-green mt-2 text-3xl">{lookups.subjects.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Events Today</p>
                <p className="text-3xl font-serif font-bold text-hku-warning mt-2 text-3xl">{events.length}</p>
              </div>
            </div>
          </>
        );
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-hku-green rounded-xl flex items-center justify-center shadow-lg animate-bounce">
            <span className="text-white font-bold italic">HKU</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-hku-green rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-hku-green rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-hku-green rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </GoogleOAuthProvider>
    );
  }

  return (
    <Layout
      currentView={currentView}
      onNavigate={setCurrentView}
      onNewEvent={() => {
        setSelectedEvent(null);
        setIsEventModalOpen(true);
      }}
      user={currentUser}
      onLogout={handleLogout}
    >
      <div className="space-y-6 h-full flex flex-col">
        {renderContent()}

        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onEventCreated={fetchData}
          onEventUpdated={fetchData}
          onEventDeleted={fetchData}
          timezone={systemConfig.DEFAULT_TIMEZONE}
          event={selectedEvent}
        />
      </div>
    </Layout>
  );
}

export default App;
