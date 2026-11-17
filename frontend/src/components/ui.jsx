import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Inbox, AlertTriangle, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

const BADGE = {
  Healthy: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Normal: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Low: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Needs Attention': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'Due Soon': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Attention: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Critical: 'bg-red-50 text-red-700 ring-red-600/20',
  Overdue: 'bg-red-50 text-red-700 ring-red-600/20',
  'High Priority': 'bg-red-50 text-red-700 ring-red-600/20',
  High: 'bg-red-50 text-red-700 ring-red-600/20',
};

const ENUM_KEY_MAP = {
  Healthy: 'enums.healthStatus.Healthy',
  'Needs Attention': 'enums.healthStatus.Needs Attention',
  Critical: 'enums.healthStatus.Critical',
  Completed: 'enums.vaccineStatus.Completed',
  'Due Soon': 'enums.vaccineStatus.Due Soon',
  Overdue: 'enums.vaccineStatus.Overdue',
  Normal: 'enums.assessmentLevel.Normal',
  Attention: 'enums.assessmentLevel.Attention',
  'High Priority': 'enums.assessmentLevel.High Priority',
  Low: 'enums.riskLevel.Low',
  Medium: 'enums.riskLevel.Medium',
  High: 'enums.riskLevel.High',
};

export function Badge({ children }) {
  const { t } = useTranslation();
  const label = ENUM_KEY_MAP[children] ? t(ENUM_KEY_MAP[children]) : children;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${BADGE[children] || 'bg-slate-100 text-slate-600 ring-slate-500/20'}`}>
      {label}
    </span>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between animate-fadeUp">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl break-words">{title}</h1>
        {subtitle && <p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'green' }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="card p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fadeUp">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 sm:text-sm truncate">{label}</p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-900 sm:mt-2 sm:text-3xl">{value}</p>
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 sm:p-3 ${tones[tone]}`}><Icon size={20} /></div>
      </div>
      {hint && <p className="mt-2.5 text-xs text-slate-500 sm:mt-3">{hint}</p>}
    </div>
  );
}

export function Loader({ text }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
      <Loader2 className="animate-spin text-brand-600" size={34} />
      <p className="text-sm">{text || t('app.loading')}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle /></div>
      <h3 className="font-bold text-slate-900">{t('app.errorTitle')}</h3>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      {onRetry && <button className="btn-primary mt-5" onClick={onRetry}><RefreshCw size={16} /> {t('app.tryAgain')}</button>}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="flex flex-col items-center px-4 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Inbox size={26} /></div>
      <h3 className="font-bold text-slate-800">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({ open, title, onClose, children, wide }) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`animate-pop flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg pr-2">{title}</h2>
          <button onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={t('common.close')}><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmText, busy, onConfirm, onCancel }) {
  const { t } = useTranslation();
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onCancel}>{t('common.cancel')}</button>
        <button className="btn-danger" onClick={onConfirm} disabled={busy}>
          {busy && <Loader2 size={16} className="animate-spin" />} {confirmText || t('common.delete')}
        </button>
      </div>
    </Modal>
  );
}

export function Field({ label, children, error }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`animate-slideIn flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg ${t.type === 'error' ? 'border-red-200' : 'border-brand-200'}`}>
          {t.type === 'error' ? <XCircle className="mt-0.5 shrink-0 text-red-500" size={20} /> : <CheckCircle2 className="mt-0.5 shrink-0 text-brand-600" size={20} />}
          <p className="flex-1 text-sm font-medium text-slate-700">{t.message}</p>
          <button onClick={() => onDismiss(t.id)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}

export function SampleTag() {
  const { t } = useTranslation();
  return <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">{t('app.sample')}</span>;
}
