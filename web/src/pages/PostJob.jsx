// Post a job without choosing a worker; workers in the area send quotes.
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useLang } from '../i18n.jsx';
import { JobForm, useMeta } from '../components/bits.jsx';

export default function PostJob() {
  const { user } = useAuth();
  const { t } = useLang();
  const { categories } = useMeta();
  const navigate = useNavigate();

  return (
    <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1>{t('postJob')}</h1>
      <JobForm categories={categories} defaultArea={user.area} submitLabel={t('postForQuotes')}
        onDone={(job) => navigate(`/jobs/${job.id}`)} />
    </div>
  );
}
