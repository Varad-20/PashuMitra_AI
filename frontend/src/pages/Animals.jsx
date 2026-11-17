import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
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
        <button className="btn-primary" onClick={() => setForm({ open: true, animal: null })}><Plus size={17} /> {t('animals.addAnimal')}</button>
      </PageHeader>

      <div className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder={t('animals.searchPlaceholder')} value={q} onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {})} />
        </div>
        <select className="input sm:w-44" value={species} onChange={(e) => setSpecies(e.target.value)}>
          <option value="All">{t('animals.allSpecies')}</option>
          {SPECIES.map((s) => <option key={s} value={s}>{t(`enums.species.${s}`)}</option>)}
        </select>
        <select className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="All">{t('animals.allHealthStatus')}</option>
          {HEALTH_STATUSES.map((s) => <option key={s} value={s}>{t(`enums.healthStatus.${s}`)}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden animate-fadeUp">
        {list.length === 0 ? (
          <EmptyState
            title={t('animals.noAnimalsFound')}
            text={animals.length ? t('animals.tryChangingFilters') : t('animals.addFirstAnimal')}
            action={<button className="btn-primary" onClick={() => setForm({ open: true, animal: null })}><Plus size={16} /> {t('animals.addAnimal')}</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
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
        )}
      </div>

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
