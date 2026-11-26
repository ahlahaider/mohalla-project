// The list of pages. Each <Route> maps a web address to a screen.
//
// Screens 1–3 (home, results, worker profile) and Help work WITHOUT an account.
// Everything else is wrapped in <NeedLogin>, which sends the person to /login
// with ?returnTo=<this page>, so they come straight back after logging in.
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { useLang } from './i18n.jsx';
import { Loading } from './ui/kit.jsx';
import Home from './pages/Home.jsx';
import Results from './pages/Results.jsx';
import WorkerProfile from './pages/WorkerProfile.jsx';
import Login from './pages/Login.jsx';
import RequestForm from './pages/RequestForm.jsx';
import MyJobs from './pages/MyJobs.jsx';
import JobPage from './pages/JobPage.jsx';
import Finish from './pages/Finish.jsx';
import Problem from './pages/Problem.jsx';
import Help from './pages/Help.jsx';
import { AdminPage, AdminLogin } from './admin/AdminShell.jsx';

function NeedLogin({ children }) {
  const { user, loading } = useAuth();
  const { t } = useLang();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role !== 'customer') {
    return <main className="page"><p className="error-box">{t('customersOnly', { role: user.role })}</p></main>;
  }
  return children;
}

const customer = (page) => <NeedLogin>{page}</NeedLogin>;

export default function App() {
  return (
    <Routes>
      {/* admin keeps its own desktop layout and password login */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* the customer app: one phone-sized column */}
      <Route path="*" element={(
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/find/:category" element={<Results />} />
            <Route path="/workers/:id" element={<WorkerProfile />} />
            <Route path="/help" element={<Help />} />
            <Route path="/login" element={<Login />} />
            <Route path="/workers/:id/request" element={customer(<RequestForm />)} />
            <Route path="/jobs" element={customer(<MyJobs />)} />
            <Route path="/jobs/:id" element={customer(<JobPage />)} />
            <Route path="/jobs/:id/finish" element={customer(<Finish />)} />
            <Route path="/jobs/:id/problem" element={customer(<Problem />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      )} />
    </Routes>
  );
}
