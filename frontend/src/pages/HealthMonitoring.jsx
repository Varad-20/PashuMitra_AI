import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Info, HeartPulse, AlertTriangle, Siren, Thermometer } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { PageHeader, Badge, EmptyState, ConfirmDialog, StatCard } from '../components/ui.jsx';
import { HealthForm } from '../components/forms.jsx';
import { fmtDate } from '../lib/helpers.js';

export default function HealthMonitoring() {
  const { t } = useTranslation();
  const { animals, records, deleteRecord } = useApp();
  const [animalFilter, setAnimalFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [form, setForm] = useState({ open: false, record: null });
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const byId = Object.fromEntries(animals.map((a) => [a._id, a]));
  const list = records
    .filter((r) => byId[r.animal] && (animalFilter === 'All' || r.animal === animalFilter) && (levelFilter === 'All' || r.assessment?.level === levelFilter))
    .sort((a, b) => new Date(b.observationDate) - new Date(a.observationDate));

  const countLevel = (l) => records.filter((r) => r.assessment?.level === l).length;

  const confirmDelete = async () => {
    setBusy(true);
    const ok = await deleteRecord(toDelete._id);
    setBusy(false);
    if (ok) setToDelete(null);
  };

  const translateSymptoms = (arr) =>
    (arr || []).map((s) => t(`enums.symptoms.${s}`, { defaultValue: s })).join(', ');

  return (
    <>
      <PageHeader title={t('health.title')} subtitle={t('health.subtitle')}>
        <button className="btn-primary w-full sm:w-auto" onClick={() => setForm({ open: true, record: null })}>
          <Plus size={17} /> {t('health.recordHealth')}
        </button>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard icon={HeartPulse} label={t('health.normalRecords')} value={countLevel('Normal')} />
        <StatCard icon={AlertTriangle} label={t('health.attentionWarnings')} value={countLevel('Attention')} tone="amber" />
        <StatCard icon={Siren} label={t('health.highPriorityWarnings')} value={countLevel('High Priority')} tone="red" />
      </div>

      <div className="mb-5 flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 p-3.5 text-xs text-sky-800 sm:text-sm">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>{t('health.rulesDisclaimer')}</p>
      </div>

      <div className="card mb-5 grid grid-cols-1 gap-2.5 p-3.5 sm:flex sm:flex-row sm:gap-3 sm:p-4">
        <select className="input sm:w-64" value={animalFilter} onChange={(e) => setAnimalFilter(e.target.value)}>
          <option value="All">{t('health.allAnimals')}</option>
          {animals.map((a) => <option key={a._id} value={a._id}>{a.name} ({a.animalId})</option>)}
        </select>
        <select className="input sm:w-52" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          <option value="All">{t('health.allResults')}</option>
          <option value="Normal">{t('enums.assessmentLevel.Normal')}</option>
          <option value="Attention">{t('enums.assessmentLevel.Attention')}</option>
          <option value="High Priority">{t('enums.assessmentLevel.High Priority')}</option>
        </select>
      </div>

      {list.length === 0 ? (
        <div className="card animate-fadeUp">
          <EmptyState
            title={t('health.noRecordsTitle')}
            text={t('health.noRecordsText')}
            action={<button className="btn-primary" onClick={() => setForm({ open: true, record: null })}><Plus size={16} /> {t('health.recordHealth')}</button>}
          />
        </div>
      ) : (
        <>
          {/* Mobile Cards (< md) */}
          <div className="grid gap-3 md:hidden animate-fadeUp">
            {list.map((r) => {
              const animal = byId[r.animal];
              const isHighTemp = r.assessment?.level !== 'Normal' && r.assessment?.reasons?.[0]?.includes('temperature');
              return (
                <div key={r._id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{animal.name} <span className="text-xs font-normal text-slate-500">({animal.animalId})</span></p>
                      <p className="mt-0.5 text-xs text-slate-400">{fmtDate(r.observationDate)}</p>
                    </div>
                    <Badge>{r.assessment?.level}</Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs">
                    <div>
                      <span className="text-slate-400">{t('health.tempShort')}</span>
                      <p className={`mt-0.5 font-bold ${isHighTemp ? 'text-red-600' : 'text-slate-800'}`}>
                        <Thermometer size={12} className="mr-0.5 inline" />{r.temperature}°C
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">{t('health.appetite')}</span>
                      <p className="mt-0.5 font-semibold text-slate-800">{t(`enums.appetite.${r.appetite}`)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">{t('health.activityLevel')}</span>
                      <p className="mt-0.5 font-semibold text-slate-800">{t(`enums.activity.${r.activity}`)}</p>
                    </div>
                  </div>

                  {r.symptoms?.length > 0 && (
                    <p className="mt-2.5 text-xs text-slate-600">
                      <span className="font-semibold text-slate-500">{t('health.symptoms')}: </span>
                      {translateSymptoms(r.symptoms)}
                    </p>
                  )}

                  <div className="mt-3 flex justify-end gap-1.5 border-t border-slate-100 pt-2.5">
                    <button
                      onClick={() => setForm({ open: true, record: r })}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      <Pencil size={14} /> {t('common.edit')}
                    </button>
                    <button
                      onClick={() => setToDelete(r)}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-100 bg-red-50/50 px-3 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={14} /> {t('common.delete')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (md+) */}
          <div className="card hidden overflow-hidden md:block animate-fadeUp">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px]">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr>
                    <th className="th">{t('common.date')}</th>
                    <th className="th">{t('animals.animal')}</th>
                    <th className="th">{t('health.tempShort')}</th>
                    <th className="th">{t('health.appetite')}</th>
                    <th className="th">{t('health.activityLevel')}</th>
                    <th className="th">{t('health.symptoms')}</th>
                    <th className="th">{t('health.assessment')}</th>
                    <th className="th text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((r) => (
                    <tr key={r._id} className="transition hover:bg-brand-50/40">
                      <td className="td whitespace-nowrap">{fmtDate(r.observationDate)}</td>
                      <td className="td font-semibold">{byId[r.animal].name}<span className="block text-xs font-normal text-slate-500">{byId[r.animal].animalId}</span></td>
                      <td className={`td font-medium ${r.assessment?.level !== 'Normal' && r.assessment?.reasons?.[0]?.includes('temperature') ? 'text-red-600' : ''}`}>{r.temperature}°C</td>
                      <td className="td">{t(`enums.appetite.${r.appetite}`)}</td>
                      <td className="td">{t(`enums.activity.${r.activity}`)}</td>
                      <td className="td max-w-[180px] text-slate-500">{r.symptoms?.length ? translateSymptoms(r.symptoms) : '—'}</td>
                      <td className="td"><Badge>{r.assessment?.level}</Badge></td>
                      <td className="td">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setForm({ open: true, record: r })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-sky-600" title={t('common.edit')}><Pencil size={17} /></button>
                          <button onClick={() => setToDelete(r)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" title={t('common.delete')}><Trash2 size={17} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <HealthForm open={form.open} initial={form.record} onClose={() => setForm({ open: false, record: null })} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        busy={busy}
        title={t('health.deleteRecordTitle')}
        message={t('health.deleteRecordMsg')}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
