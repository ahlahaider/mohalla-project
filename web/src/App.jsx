// Top bar + the list of pages. Each <Route> maps a web address to a page.
import { NavLink, Link, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { useLang } from './i18n.jsx';
import Search from './pages/Search.jsx';
import WorkerPage from './pages/WorkerPage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PostJob from './pages/PostJob.jsx';
import MyJobs from './pages/MyJobs.jsx';
import JobDetail from './pages/JobDetail.jsx';
import Admin from './pages/Admin.jsx';

// Sends logged-out visitors to the login page (and non-admins away from /admin).
function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  const { t, toggle, lang } = useLang();

  return (
    <>
      <header className="topbar">
        <Link to="/" className="logo">mohalla</Link>
        <nav>
          <NavLink to="/" end>{t('findHelp')}</NavLink>
          {user?.role === 'customer' && <NavLink to="/post">{t('postJob')}</NavLink>}
          {user && user.role !== 'admin' && <NavLink to="/jobs">{t('myJobs')}</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">{t('admin')}</NavLink>}
        </nav>
        <button onClick={toggle}>{lang === 'en' ? 'Roman Urdu' : 'English'}</button>
        {user
          ? <button onClick={logout}>{t('logout')}</button>
          : <Link className="btn primary" to="/login">{t('login')}</Link>}
      </header>

      <main className="shell">
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/workers/:id" element={<WorkerPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/post" element={<Protected role="customer"><PostJob /></Protected>} />
          <Route path="/jobs" element={<Protected><MyJobs /></Protected>} />
          <Route path="/jobs/:id" element={<Protected><JobDetail /></Protected>} />
          <Route path="/admin" element={<Protected role="admin"><Admin /></Protected>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
