// Small building blocks every screen reuses. Keeping them here means a
// button or a label looks and behaves the same everywhere.
import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  CaretLeft, HouseLine, ClipboardText, Lifebuoy, CircleNotch, WarningCircle,
  Backspace, Star, MapPin,
} from '@phosphor-icons/react';
import { useLang, AREA_KEYS } from '../i18n.jsx';

// English (or Roman Urdu) on top, Urdu script underneath.
export function Say({ k, vars, className = '' }) {
  const { t, u } = useLang();
  const ur = u(k, vars);
  return (
    <span className={`say ${className}`}>
      <span className="say-main">{t(k, vars)}</span>
      {ur && <span className="ur" lang="ur" dir="rtl">{ur}</span>}
    </span>
  );
}

// Same, for text that isn't in the strings file (services, areas, problems).
export function Pair({ main, ur, className = '' }) {
  return (
    <span className={`say ${className}`}>
      <span className="say-main">{main}</span>
      {ur && <span className="ur" lang="ur" dir="rtl">{ur}</span>}
    </span>
  );
}

// A two-tone icon on a soft coloured square. `tone` picks the colours (see app.css),
// `motion` picks the little movement it makes when pressed.
export function Ico({ icon: Icon, tone = 'ink', size = 26, box, motion, weight = 'duotone', className = '' }) {
  const s = box ?? Math.round(size * 1.65);
  return (
    <span className={`ico tone-${tone} ${motion ? `mo-${motion}` : ''} ${className}`} style={{ '--s': `${s}px` }} aria-hidden="true">
      <Icon weight={weight} size={size} />
    </span>
  );
}

// Top of every inner page: a big round back button and the page title.
export function TopBar({ title, sub, back, right }) {
  const navigate = useNavigate();
  const { t } = useLang();
  const goBack = () => {
    if (back) navigate(back);
    else if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/');
  };
  return (
    <header className="topbar">
      <button type="button" className="back-btn" onClick={goBack} aria-label={t('back')}>
        <CaretLeft size={26} weight="bold" />
      </button>
      <div className="titles">
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {right}
    </header>
  );
}

export function BottomNav({ waiting = 0 }) {
  const items = [
    { to: '/', k: 'navHome', icon: HouseLine, end: true },
    { to: '/jobs', k: 'navJobs', icon: ClipboardText },
    { to: '/help', k: 'navHelp', icon: Lifebuoy },
  ];
  return (
    <nav className="bottom-nav">
      {items.map(({ to, k, icon, end }) => (
        <NavLink key={to} to={to} end={end}>
          <Ico icon={icon} size={26} box={34} />
          {to === '/jobs' && waiting > 0 && <span className="badge-count">{waiting}</span>}
          <Say k={k} />
        </NavLink>
      ))}
    </nav>
  );
}

export function Loading() {
  const { t, u } = useLang();
  return (
    <div className="loading" role="status">
      <CircleNotch size={40} weight="bold" />
      <span className="say center"><span>{t('loading')}</span><span className="ur" dir="rtl">{u('loading')}</span></span>
    </div>
  );
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <div className="error-box" role="alert">
      <Ico icon={WarningCircle} tone="chilli" size={24} />
      <span>{children}</span>
    </div>
  );
}

// A pop-up that slides up from the bottom (used for "are you sure?" and pickers).
export function Sheet({ open, onClose, children, label }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// The four boxes a PIN or code is typed into. `masked` shows dots instead of numbers.
export function PinBoxes({ value, length = 4, masked = false, shake = false }) {
  return (
    <div className={`pin-boxes ${shake ? 'shake' : ''}`} aria-hidden="true">
      {Array.from({ length }, (_, i) => (
        <div key={i} className={`pin-box ${i < value.length ? 'filled' : ''} ${i === value.length ? 'current' : ''}`}>
          {i < value.length && (masked ? <span className="bullet" /> : value[i])}
        </div>
      ))}
    </div>
  );
}

// A big number pad, like an ATM or a mobile wallet. Easier than the phone's
// keyboard (which can cover the screen) and it only allows numbers.
export function Keypad({ value, onChange, length = 4, disabled = false }) {
  const { t } = useLang();
  const press = (d) => !disabled && value.length < length && onChange(value + d);
  const del = () => !disabled && onChange(value.slice(0, -1));

  // Typing on a real keyboard works too (desktop, or phones with keyboards).
  useEffect(() => {
    const onKey = (e) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') del();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <div className="keypad">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
        <button key={d} type="button" className="key" onClick={() => press(d)}>{d}</button>
      ))}
      <span className="key blank" />
      <button type="button" className="key" onClick={() => press('0')}>0</button>
      <button type="button" className="key" onClick={del} aria-label={t('deleteKey')}>
        <Backspace size={30} weight="duotone" />
      </button>
    </div>
  );
}

const AV_COLOURS = ['#fdebc8', '#f8e0d5', '#ddf0e2', '#dcedf6', '#efe0f2', '#f1e1cc'];
export const initials = (name = '') => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export function Avatar({ name, size }) {
  const colour = AV_COLOURS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AV_COLOURS.length];
  return <span className="avatar" style={{ '--av-bg': colour, ...(size && { '--av': `${size}px` }) }} aria-hidden="true">{initials(name)}</span>;
}

export function StarsShow({ value, size = 18 }) {
  return (
    <span className="stars-row" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} weight={n <= value ? 'fill' : 'regular'} />)}
    </span>
  );
}

// Area picker in a sheet: one big button per area.
export function AreaSheet({ open, current, onPick, onClose }) {
  const { t, areaName, areaU } = useLang();
  return (
    <Sheet open={open} onClose={onClose} label="area">
      <h2><Say k="areaQ" /></h2>
      <p className="muted">{t('areaNote')}</p>
      <div className="area-list">
        {AREA_KEYS.map((a) => (
          <button key={a} type="button" className="area-option" aria-pressed={a === current} onClick={() => onPick(a)}>
            <Ico icon={MapPin} tone={a === current ? 'henna' : 'ink'} size={22} />
            <Pair main={areaName(a)} ur={areaU(a)} />
          </button>
        ))}
      </div>
    </Sheet>
  );
}
