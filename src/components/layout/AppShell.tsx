import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Gauge, LayoutDashboard, Menu, Network, Route, Sigma, X } from 'lucide-react';
import { Spinner } from '../ui/Feedback';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/graphs', label: 'Graph Explorer', icon: Network },
  { to: '/algorithms', label: 'Algorithm Simulator', icon: Route },
  { to: '/recurrence', label: 'Recurrence Lab', icon: Sigma },
  { to: '/concepts', label: 'Concepts Library', icon: BookOpen },
  { to: '/complexity', label: 'Complexity Analyzer', icon: Gauge },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main navigation">
      <ul className="space-y-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-navy-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
        <Network className="h-5 w-5 text-white" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="text-base font-bold text-white">GraphRecur Lab</p>
        <p className="text-[11px] text-navy-200">Discrete Mathematics</p>
      </div>
    </div>
  );
}

export function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-navy-900">
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden bg-navy-900 lg:block">
        <div className="sticky top-0 flex h-screen flex-col gap-6 p-4">
          <Brand />
          <NavList />
          <p className="mt-auto px-1 text-[11px] leading-relaxed text-navy-300">
            Runs entirely in your browser. Graphs and recurrences are saved in localStorage.
          </p>
        </div>
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy-900 px-4 py-2.5 lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          className="rounded-lg p-2 text-white hover:bg-white/10"
        >
          {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 top-[57px] z-20 lg:hidden">
          <button type="button" aria-label="Close navigation menu" className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div id="mobile-nav" className="relative max-h-full overflow-y-auto bg-navy-900 p-4 shadow-xl">
            <NavList onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main id="main" tabIndex={-1} className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <Suspense fallback={<Spinner label="Loading page" />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
