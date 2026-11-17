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
        <button className="btn-primary w-full sm:w-auto" onClick={() => setForm({ open: true, item: null })}>
          <Plus size={17} /> {t('vaccinations.addVaccination')}
        </button>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard icon={CheckCircle2} label={t('vaccinations.completed')} value={count('Completed')} />
        <StatCard icon={Clock} label={t('vaccinations.dueSoon')} value={count('Due Soon')} tone="amber" />
        <StatCard icon={AlertTriangle} label={t('vaccinations.overdue')} value={count('Overdue')} tone="red" />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {['All', ...VACCINE_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`min-h-[38px] rounded-full px-4 py-1.5 text-xs font-semibold transition sm:text-sm ${
              filter === s ? 'bg-brand-600 text-white shadow' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand-300'
            }`}
          >
            {s === 'All' ? t('common.all') : t(`enums.vaccineStatus.${s}`)}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card animate-fadeUp">
          <EmptyState
            title={t('vaccinations.noRecordsTitle')}
            text={t('vaccinations.noRecordsText')}
            action={<button className="btn-primary" onClick={() => setForm({ open: true, item: null })}><Syringe size={16} /> {t('vaccinations.addVaccination')}</button>}
          />
        </div>
      ) : (
        <>
          {/* Mobile Cards (< md) */}
          <div className="grid gap-3 md:hidden animate-fadeUp">
            {list.map((v) => {
              const animal = byId[v.animal];
              return (
                <div key={v._id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{trVaccine(v.vaccineName, t)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{animal.name} ({animal.animalId})</p>
                    </div>
                    <Badge>{v.status}</Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs">
                    <div>
                      <span className="text-slate-400">{t('vaccinations.vaccinatedOn')}</span>
                      <p className="mt-0.5 font-semibold text-slate-800">{fmtDate(v.vaccinationDate)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">{t('vaccinations.nextDueDate')}</span>
                      <p className="mt-0.5 font-semibold text-slate-800">
                        {fmtDate(v.nextDueDate)} <span className="text-slate-400">({relativeDay(v.nextDueDate, t)})</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-1.5 border-t border-slate-100 pt-2.5">
                    <button
                      onClick={() => setForm({ open: true, item: v })}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      <Pencil size={14} /> {t('common.edit')}
                    </button>
                    <button
                      onClick={() => setToDelete(v)}
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
              <table className="w-full min-w-[720px]">
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
          </div>
        </>
      )}

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
