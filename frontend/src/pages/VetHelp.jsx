import { useTranslation } from 'react-i18next';
import { Phone, Stethoscope, MapPin, Clock, AlertTriangle, HeartPulse, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../components/ui.jsx';

const VET_KEYS = [
  { id: 'v1', phone: '+91 98230 11223' },
  { id: 'v2', phone: '+91 98500 44556' },
  { id: 'v3', phone: '1962' },
  { id: 'v4', phone: '+91 97650 77889' },
];

export default function VetHelp() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t('vetHelp.title')} subtitle={t('vetHelp.subtitle')} />

      {/* Emergency Toll-free Banner */}
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 p-6 text-white shadow-md sm:flex-row sm:items-center animate-fadeUp">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-white/20 p-3"><Phone size={24} /></div>
          <div>
            <h2 className="text-lg font-extrabold">{t('vetHelp.emergencyBannerTitle')}</h2>
            <p className="mt-1 text-sm text-red-50">{t('vetHelp.emergencyBannerSub')}</p>
          </div>
        </div>
        <a href="tel:1962" className="btn bg-white text-red-700 hover:bg-red-50 shrink-0 shadow">
          <Phone size={16} /> {t('vetHelp.callHelpline')}
        </a>
      </div>

      {/* Vet Directory */}
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
        <Stethoscope size={20} className="text-brand-600" /> {t('vetHelp.vetDirectory')}
      </h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {VET_KEYS.map((v) => (
          <div key={v.id} className="card flex flex-col justify-between p-5 animate-fadeUp">
            <div>
              <p className="text-base font-extrabold text-slate-900">{t(`dynamic.vets.${v.id}Name`)}</p>
              <p className="text-xs font-semibold text-brand-700">{t(`dynamic.vets.${v.id}Role`)}</p>
              <p className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin size={14} className="text-slate-400" /> {t(`dynamic.vets.${v.id}Clinic`)}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock size={14} className="text-slate-400" /> {t(`dynamic.vets.${v.id}Hours`)}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-bold text-slate-800">{v.phone}</span>
              <a href={`tel:${v.phone}`} className="btn-primary !px-3.5 !py-1.5 text-xs">
                <Phone size={14} /> {t('vetHelp.callNow')}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* First-Aid Guidelines */}
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
        <ShieldAlert size={20} className="text-amber-600" /> {t('vetHelp.firstAidTitle')}
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 animate-fadeUp">
          <div className="mb-3 inline-flex rounded-xl bg-red-50 p-2.5 text-red-600"><AlertTriangle size={20} /></div>
          <h3 className="font-bold text-slate-900">{t('vetHelp.tipBloatTitle')}</h3>
          <p className="mt-1.5 text-sm text-slate-600">{t('vetHelp.tipBloatText')}</p>
        </div>
        <div className="card p-5 animate-fadeUp">
          <div className="mb-3 inline-flex rounded-xl bg-amber-50 p-2.5 text-amber-600"><HeartPulse size={20} /></div>
          <h3 className="font-bold text-slate-900">{t('vetHelp.tipFeverTitle')}</h3>
          <p className="mt-1.5 text-sm text-slate-600">{t('vetHelp.tipFeverText')}</p>
        </div>
        <div className="card p-5 animate-fadeUp">
          <div className="mb-3 inline-flex rounded-xl bg-emerald-50 p-2.5 text-emerald-600"><Stethoscope size={20} /></div>
          <h3 className="font-bold text-slate-900">{t('vetHelp.tipWoundTitle')}</h3>
          <p className="mt-1.5 text-sm text-slate-600">{t('vetHelp.tipWoundText')}</p>
        </div>
      </div>
    </>
  );
}
