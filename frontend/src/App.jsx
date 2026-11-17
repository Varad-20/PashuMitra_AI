import { Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from './components/Layout.jsx';
import { Loader, ErrorState, EmptyState } from './components/ui.jsx';
import { useApp } from './context/AppContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Animals from './pages/Animals.jsx';
import AnimalDetails from './pages/AnimalDetails.jsx';
import HealthMonitoring from './pages/HealthMonitoring.jsx';
import AIAssistant from './pages/AIAssistant.jsx';
import Vaccinations from './pages/Vaccinations.jsx';
import Reports from './pages/Reports.jsx';
import QrScanner from './pages/QrScanner.jsx';
import MilkProduction from './pages/MilkProduction.jsx';
import VetHelp from './pages/VetHelp.jsx';
import Settings from './pages/Settings.jsx';
import DigitalTwin from './pages/DigitalTwin.jsx';
import EarlyWarning from './pages/EarlyWarning.jsx';

export default function App() {
  const { t } = useTranslation();
  const { loading, error, reload } = useApp();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader text={t('app.loading')} /></div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/animals" element={<Animals />} />
        <Route path="/animals/:id" element={<AnimalDetails />} />
        <Route path="/digital-twin" element={<DigitalTwin />} />
        <Route path="/early-warning" element={<EarlyWarning />} />
        <Route path="/scan" element={<QrScanner />} />
        <Route path="/health" element={<HealthMonitoring />} />
        <Route path="/assistant" element={<AIAssistant />} />
        <Route path="/milk" element={<MilkProduction />} />
        <Route path="/vaccinations" element={<Vaccinations />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/vet-help" element={<VetHelp />} />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="*"
          element={
            <EmptyState
              title={t('app.pageNotFound')}
              text={t('app.pageNotFoundText')}
              action={<Link to="/" className="btn-primary">{t('app.goToDashboard')}</Link>}
            />
          }
        />
      </Route>
    </Routes>
  );
}
