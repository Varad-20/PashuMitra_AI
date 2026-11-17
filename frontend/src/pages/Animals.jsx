import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Eye, Pencil, Trash2, Building2, Weight, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { PageHeader, Badge, EmptyState, ConfirmDialog, SampleTag } from '../components/ui.jsx';
import { AnimalForm } from '../components/forms.jsx';
import { SPECIES, HEALTH_STATUSES, speciesEmoji, fmtDate } from '../lib/helpers.js';
import { trBreed, trFarm } from '../lib/dynamicTranslate.js';

export default function Animals() {
  const { t } = useTranslation();
  const { animals, deleteAnimal } = useApp();
  const [params, setParams] = useSearchParams();
  const [species, setSpecies] = useState('All');
  const [status, setStatus] = useState('All');
  const [form, setForm] = useState({ open: false, animal: null });
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const q = params.get('q') || '';

  const list = animals.filter((a) => {
    const text = `${a.name} ${a.animalId} ${a.breed} ${a.farmName}`.toLowerCase();
    return text.includes(q.toLowerCase()) && (species === 'All' || a.species === species) && (status === 'All' || a.healthStatus === status);
  });

  const confirmDelete = async () => {
    setBusy(true);
    const ok = await deleteAnimal(toDelete._id);
    setBusy(false);
    if (ok) setToDelete(null);
  };

  return (
    <>
      <PageHeader title={t('animals.title')} subtitle={t('animals.subtitle', { count: animals.length })}>
        <button className="btn-primary w-full sm:w-auto" onClick={() => setForm({ open: true, animal: null })}>
          <Plus size={17} /> {t('animals.addAnimal')}
        </button>
      </PageHeader>

      <div className="card mb-5 flex flex-col gap-3 p-3.5 sm:flex-row sm:p-4">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder={t('animals.searchPlaceholder')}
            value={q}
            onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {})}
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:gap-3">
          <select className="input sm:w-44" value={species} onChange={(e) => setSpecies(e.target.value)}>
            <option value="All">{t('animals.allSpecies')}</option>
            {SPECIES.map((s) => <option key={s} value={s}>{t(`enums.species.${s}`)}</option>)}
          </select>
          <select className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">{t('animals.allHealthStatus')}</option>
            {HEALTH_STATUSES.map((s) => <option key={s} value={s}>{t(`enums.healthStatus.${s}`)}</option>)}
          </select>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card animate-fadeUp">
          <EmptyState
            title={t('animals.noAnimalsFound')}
            text={animals.length ? t('animals.tryChangingFilters') : t('animals.addFirstAnimal')}
            action={<button className="btn-primary" onClick={() => setForm({ open: true, animal: null })}><Plus size={16} /> {t('animals.addAnimal')}</button>}
          />
        </div>
      ) : (
        <>
          {/* Mobile & Small Tablet Cards (< md) */}
          <div className="grid gap-3 md:hidden animate-fadeUp">
            {list.map((a) => (
              <div key={a._id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/animals/${a._id}`} className="flex items-center gap-3 min-w-0">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl">
                      {speciesEmoji[a.species]}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">
                        {a.name} {a.isSample && <SampleTag />}
                      </p>
                      <p className="text-xs text-slate-500">
                        {a.animalId} · {trBreed(a.breed, t)} ({t(`enums.species.${a.species}`)})
                      </p>
                    </div>
                  </Link>
                  <Badge>{a.healthStatus}</Badge>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs">
                  <div>
                    <span className="flex items-center gap-1 text-slate-400"><Calendar size={12} /> {t('animals.ageLabel')}</span>
                    <p className="mt-0.5 font-semibold text-slate-800">{a.age} {t('common.yrs')} · {t(`enums.gender.${a.gender}`)}</p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-slate-400"><Weight size={12} /> {t('animals.weightLabel')}</span>
                    <p className="mt-0.5 font-semibold text-slate-800">{a.weight} {t('common.kg')}</p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-slate-400"><Building2 size={12} /> {t('animals.farm')}</span>
                    <p className="mt-0.5 font-semibold text-slate-800 truncate">{trFarm(a.farmName, t)}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <span className="text-xs text-slate-400">{t('animals.added')}: {fmtDate(a.dateAdded)}</span>
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/animals/${a._id}`}
                      className="inline-flex h-9 items-center gap-1 rounded-lg bg-brand-50 px-3 text-xs font-bold text-brand-700 hover:bg-brand-100"
                    >
                      <Eye size={14} /> {t('common.view')}
                    </Link>
                    <button
                      onClick={() => setForm({ open: true, animal: a })}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                      title={t('common.edit')}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setToDelete(a)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50/50 text-red-600 hover:bg-red-100"
                      title={t('common.delete')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop & Large Tablet Table (md+) */}
          <div className="card hidden overflow-hidden md:block animate-fadeUp">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px]">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr>
                    <th className="th">{t('animals.animal')}</th>
                    <th className="th">{t('animals.speciesBreed')}</th>
                    <th className="th">{t('animals.ageLabel')}</th>
                    <th className="th">{t('animals.weightLabel')}</th>
                    <th className="th">{t('animals.farm')}</th>
                    <th className="th">{t('animals.healthStatus')}</th>
                    <th className="th">{t('animals.added')}</th>
                    <th className="th text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((a) => (
                    <tr key={a._id} className="transition hover:bg-brand-50/40">
                      <td className="td">
                        <Link to={`/animals/${a._id}`} className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-xl">{speciesEmoji[a.species]}</span>
                          <span><span className="block font-semibold text-slate-900">{a.name}{a.isSample && <SampleTag />}</span><span className="text-xs text-slate-500">{a.animalId}</span></span>
                        </Link>
                      </td>
                      <td className="td">
                        <span className="font-medium">{t(`enums.species.${a.species}`)}</span>
                        <span className="block text-xs text-slate-500">{trBreed(a.breed, t)} · {t(`enums.gender.${a.gender}`)}</span>
                      </td>
                      <td className="td">{a.age} {t('common.yrs')}</td>
                      <td className="td">{a.weight} {t('common.kg')}</td>
                      <td className="td">{trFarm(a.farmName, t)}</td>
                      <td className="td"><Badge>{a.healthStatus}</Badge></td>
                      <td className="td text-slate-500">{fmtDate(a.dateAdded)}</td>
                      <td className="td">
                        <div className="flex justify-end gap-1">
                          <Link to={`/animals/${a._id}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700" title={t('common.view')}><Eye size={17} /></Link>
                          <button onClick={() => setForm({ open: true, animal: a })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-sky-600" title={t('common.edit')}><Pencil size={17} /></button>
                          <button onClick={() => setToDelete(a)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" title={t('common.delete')}><Trash2 size={17} /></button>
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

      <AnimalForm open={form.open} initial={form.animal} onClose={() => setForm({ open: false, animal: null })} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        busy={busy}
        title={t('animals.deleteConfirmTitle')}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        message={t('animals.deleteConfirmMsg', { name: toDelete?.name || '' })}
      />
    </>
  );
}
