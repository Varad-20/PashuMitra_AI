import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Syringe, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { PageHeader, Badge, EmptyState, ConfirmDialog, StatCard } from '../components/ui.jsx';
import { VaccinationForm } from '../components/forms.jsx';
import { fmtDate, relativeDay, VACCINE_STATUSES } from '../lib/helpers.js';
import { trVaccine } from '../lib/dynamicTranslate.js';

export default function Vaccinations() {
  const { t } = useTranslation();
  const { animals, vaccinations, deleteVaccination } = useApp();
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({ open: false, item: null });
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const byId = Object.fromEntries(animals.map((a) => [a._id, a]));
  const list = vaccinations.filter((v) => byId[v.animal] && (filter === 'All' || v.status === filter)).sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
  const count = (s) => vaccinations.filter((v) => v.status === s).length;

  const confirmDelete = async () => {
    setBusy(true);
    const ok = await deleteVaccination(toDelete._id);
    setBusy(false);
    if (ok) setToDelete(null);
  };

  return (
    <>
      <PageHeader title={t('vaccinations.title')} subtitle={t('vaccinations.subtitle')}>
        <button className="btn-primary" onClick={() => setForm({ open: true, item: null })}><Plus size={17} /> {t('vaccinations.addVaccination')}</button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={CheckCircle2} label={t('vaccinations.completed')} value={count('Completed')} />
        <StatCard icon={Clock} label={t('vaccinations.dueSoon')} value={count('Due Soon')} tone="amber" />
        <StatCard icon={AlertTriangle} label={t('vaccinations.overdue')} value={count('Overdue')} tone="red" />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {['All', ...VACCINE_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filter === s ? 'bg-brand-600 text-white shadow' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand-300'
            }`}
          >
            {s === 'All' ? t('common.all') : t(`enums.vaccineStatus.${s}`)}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden animate-fadeUp">
        {list.length === 0 ? (
          <EmptyState
            title={t('vaccinations.noRecordsTitle')}
            text={t('vaccinations.noRecordsText')}
            action={<button className="btn-primary" onClick={() => setForm({ open: true, item: null })}><Syringe size={16} /> {t('vaccinations.addVaccination')}</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr>
                  <th className="th">{t('animals.animal')}</th>
                  <th className="th">{t('vaccinations.vaccineName')}</th>
                  <th className="th">{t('vaccinations.vaccinatedOn')}</th>
                  <th className="th">{t('vaccinations.nextDueDate')}</th>
                  <th className="th">{t('common.status')}</th>
                  <th className="th text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((v) => (
                  <tr key={v._id} className="transition hover:bg-brand-50/40">
                    <td className="td font-semibold">{byId[v.animal].name}<span className="block text-xs font-normal text-slate-500">{byId[v.animal].animalId}</span></td>
                    <td className="td">{trVaccine(v.vaccineName, t)}</td>
                    <td className="td text-slate-500">{fmtDate(v.vaccinationDate)}</td>
                    <td className="td">{fmtDate(v.nextDueDate)}<span className="block text-xs text-slate-400">{relativeDay(v.nextDueDate, t)}</span></td>
                    <td className="td"><Badge>{v.status}</Badge></td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setForm({ open: true, item: v })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-sky-600" title={t('common.edit')}><Pencil size={17} /></button>
                        <button onClick={() => setToDelete(v)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" title={t('common.delete')}><Trash2 size={17} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <VaccinationForm open={form.open} initial={form.item} onClose={() => setForm({ open: false, item: null })} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        busy={busy}
        title={t('vaccinations.deleteTitle')}
        message={t('vaccinations.deleteMsg')}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
