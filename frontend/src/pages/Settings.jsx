import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Building2, Database, RotateCcw, Check, Save, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { PageHeader, Field, ConfirmDialog } from '../components/ui.jsx';
import { changeAppLanguage } from '../i18n/i18n.js';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English (Default)' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी (Hindi)' },
  { code: 'mr', name: 'Marathi', native: 'मराठी (Marathi)' },
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, mode, toast, resetDemo } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  const savedPrefs = (() => {
    try {
      return JSON.parse(localStorage.getItem('pashumitra_prefs') || '{}');
    } catch {
      return {};
    }
  })();

  const [farmName, setFarmName] = useState(savedPrefs.defaultFarmName || 'Green Valley Dairy');
  const [milkPrice, setMilkPrice] = useState(savedPrefs.defaultMilkPrice || '58');
  const [feedCost, setFeedCost] = useState(savedPrefs.defaultFeedCost || '260');

  const savePrefs = (e) => {
    e.preventDefault();
    localStorage.setItem(
      'pashumitra_prefs',
      JSON.stringify({
        defaultFarmName: farmName,
        defaultMilkPrice: milkPrice,
        defaultFeedCost: feedCost,
      })
    );
    toast(t('settings.settingsSaved'));
  };

  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Language Selector Card */}
        <div className="card p-6 animate-fadeUp">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <Globe size={19} className="text-brand-600" /> {t('settings.languageSection')}
          </h2>
          <p className="mt-1 text-xs text-slate-500">{t('settings.languageSub')}</p>

          <div className="mt-4 space-y-2.5">
            {LANGUAGES.map((l) => {
              const active = (i18n.language || 'en') === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => changeAppLanguage(l.code)}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                    active ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-200' : 'border-slate-200 bg-white hover:border-brand-300'
                  }`}
                >
                  <div>
                    <p className="font-bold text-slate-900">{l.native}</p>
                    <p className="text-xs text-slate-500">{l.name}</p>
                  </div>
                  {active && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white">
                      <Check size={15} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Farm & Pricing Preferences */}
        <form onSubmit={savePrefs} className="card space-y-4 p-6 animate-fadeUp">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <Building2 size={19} className="text-brand-600" /> {t('settings.farmDefaults')}
          </h2>
          <Field label={t('settings.defaultFarmName')}>
            <input className="input" value={farmName} onChange={(e) => setFarmName(e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('settings.defaultMilkPrice')}>
              <input type="number" step="0.5" min="0" className="input" value={milkPrice} onChange={(e) => setMilkPrice(e.target.value)} />
            </Field>
            <Field label={t('settings.defaultFeedCost')}>
              <input type="number" step="1" min="0" className="input" value={feedCost} onChange={(e) => setFeedCost(e.target.value)} />
            </Field>
          </div>
          <button type="submit" className="btn-primary">
            <Save size={16} /> {t('settings.saveSettings')}
          </button>
        </form>

        {/* Theme & Appearance Section */}
        <div className="card p-6 lg:col-span-2 animate-fadeUp">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            {theme === 'dark' ? <Moon size={19} className="text-brand-500" /> : <Sun size={19} className="text-amber-500" />}
            {t('settings.themeSection', { defaultValue: 'Appearance & Theme' })}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {t('settings.themeSub', { defaultValue: 'Switch between Light Theme and Dark Theme. You can also toggle it anytime from the top navigation bar.' })}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                theme === 'light' ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-200' : 'border-slate-200 bg-white hover:border-brand-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Sun size={20} />
                </span>
                <div>
                  <p className="font-bold text-slate-900">{t('app.lightTheme', { defaultValue: 'Light Theme' })}</p>
                  <p className="text-xs text-slate-500">{t('settings.lightDesc', { defaultValue: 'Clean green & white daylight view' })}</p>
                </div>
              </div>
              {theme === 'light' && (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Check size={15} />
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                theme === 'dark' ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-200' : 'border-slate-200 bg-white hover:border-brand-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-amber-300">
                  <Moon size={20} />
                </span>
                <div>
                  <p className="font-bold text-slate-900">{t('app.darkTheme', { defaultValue: 'Dark Theme' })}</p>
                  <p className="text-xs text-slate-500">{t('settings.darkDesc', { defaultValue: 'Comfortable low-glare dark mode' })}</p>
                </div>
              </div>
              {theme === 'dark' && (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Check size={15} />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Data & Connection Mode */}
        <div className="card p-6 lg:col-span-2 animate-fadeUp">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <Database size={19} className="text-brand-600" /> {t('settings.dataSection')}
          </h2>
          <div className="mt-4 flex flex-col justify-between gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('settings.currentMode')}</p>
              <p className="mt-1 font-bold text-slate-900">
                {mode === 'api' ? t('settings.liveModeDesc') : t('settings.demoModeDesc')}
              </p>
            </div>
            {mode === 'demo' && (
              <button type="button" className="btn-ghost" onClick={() => setConfirmReset(true)}>
                <RotateCcw size={16} /> {t('settings.resetDemoBtn')}
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title={t('app.resetDemoTitle')}
        confirmText={t('app.reset')}
        message={t('app.resetDemoMsg')}
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => { await resetDemo(); setConfirmReset(false); }}
      />
    </>
  );
}
