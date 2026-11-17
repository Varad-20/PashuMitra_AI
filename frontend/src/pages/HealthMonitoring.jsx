import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Info, HeartPulse, AlertTriangle, Siren } from 'lucide-react';
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
        <button className="btn-primary" onClick={() => setForm({ open: true, record: null })}><Plus size={17} /> {t('health.recordHealth')}</button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={HeartPulse} label={t('health.normalRecords')} value={countLevel('Normal')} />
        <StatCard icon={AlertTriangle} label={t('health.attentionWarnings')} value={countLevel('Attention')} tone="amber" />
        <StatCard icon={Siren} label={t('health.highPriorityWarnings')} value={countLevel('High Priority')} tone="red" />
      </div>

      <div className="mb-5 flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 p-3.5 text-sm text-sky-800">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>{t('health.rulesDisclaimer')}</p>
      </div>

      <div className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row">
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

      <div className="card overflow-hidden animate-fadeUp">
        {list.length === 0 ? (
          <EmptyState
            title={t('health.noRecordsTitle')}
            text={t('health.noRecordsText')}
            action={<button className="btn-primary" onClick={() => setForm({ open: true, record: null })}><Plus size={16} /> {t('health.recordHealth')}</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
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
        )}
      </div>

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
