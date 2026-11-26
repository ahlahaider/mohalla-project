// Home page: pick a service by icon, narrow down by area/price/availability,
// see matching workers. Filters update the results immediately.
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useLang } from '../i18n.jsx';
import { useMeta, WorkerCard } from '../components/bits.jsx';

export default function Search() {
  const { t, cat, icon, areaName } = useLang();
  const { categories, areas } = useMeta();
  const [filters, setFilters] = useState({ category: '', area: '', maxPrice: '', available: false, female: false });
  const [workers, setWorkers] = useState(null);
  const [error, setError] = useState('');

  // Re-run the search whenever a filter changes.
  useEffect(() => {
    const q = new URLSearchParams();
    if (filters.category) q.set('category', filters.category);
    if (filters.area) q.set('area', filters.area);
    if (filters.maxPrice) q.set('maxPrice', filters.maxPrice);
    if (filters.available) q.set('available', 'true');
    if (filters.female) q.set('female', 'true');
    api(`/workers?${q}`).then((d) => setWorkers(d.workers)).catch((e) => setError(e.message));
  }, [filters]);

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <>
      <h1>{t('tagline')}</h1>

      <div className="cats">
        <button className={`cat ${!filters.category ? 'on' : ''}`} onClick={() => set('category', '')}>
          <span className="emoji">🏠</span>{t('allCategories')}
        </button>
        {categories.map((c) => (
          <button key={c} className={`cat ${filters.category === c ? 'on' : ''}`} onClick={() => set('category', c)}>
            <span className="emoji">{icon(c)}</span>{cat(c)}
          </button>
        ))}
      </div>

      <div className="card grid2">
        <label>{t('area')}
          <select value={filters.area} onChange={(e) => set('area', e.target.value)}>
            <option value="">{t('anyArea')}</option>
            {areas.map((a) => <option key={a} value={a}>{areaName(a)}</option>)}
          </select>
        </label>
        <label>{t('maxPrice')}
          <input type="number" min="0" step="500" value={filters.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} />
        </label>
        <label className="check"><input type="checkbox" checked={filters.available} onChange={(e) => set('available', e.target.checked)} />{t('availableToday')}</label>
        <label className="check"><input type="checkbox" checked={filters.female} onChange={(e) => set('female', e.target.checked)} />{t('femaleWorker')}</label>
      </div>

      {error && <p className="error">{error}</p>}
      {workers?.length === 0 && <p className="muted">{t('noWorkers')}</p>}
      {workers?.map((w) => <WorkerCard key={w.id} worker={w} />)}
    </>
  );
}
