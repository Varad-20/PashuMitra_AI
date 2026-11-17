import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Milk, IndianRupee, TrendingUp, Wheat, Plus, Pencil, Trash2, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useApp } from '../context/AppContext.jsx';
import { PageHeader, StatCard, Field, EmptyState, ConfirmDialog, SampleTag } from '../components/ui.jsx';
import { fmtDate, getDateLocale, today, toInputDate, speciesEmoji } from '../lib/helpers.js';

function getDayKey(daysOffset) {
  const d = new Date(Date.now() + daysOffset * 86400000);
  return toInputDate(d);
}

const getDefaultPrefs = () => {
  try {
    const p = JSON.parse(localStorage.getItem('pashumitra_prefs') || '{}');
    return {
      price: p.defaultMilkPrice ? String(p.defaultMilkPrice) : '58',
      feed: p.defaultFeedCost ? String(p.defaultFeedCost) : '260',
    };
  } catch {
    return { price: '58', feed: '260' };
  }
};

export default function MilkProduction() {
  const { t } = useTranslation();
  const { animals, milkRecords, saveMilk, deleteMilk } = useApp();
  const [animalFilter, setAnimalFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const defaultAnimal = animals.find((a) => a.gender === 'Female')?.['_id'] || animals[0]?._id || '';
  const prefs = getDefaultPrefs();
  const [f, setF] = useState({
    animal: defaultAnimal,
    date: today(),
    morning: '',
    evening: '',
    pricePerLitre: prefs.price,
    feedExpense: prefs.feed,
  });

  useEffect(() => {
    if (!f.animal && defaultAnimal) setF((p) => ({ ...p, animal: defaultAnimal }));
  }, [defaultAnimal, f.animal]);

  const byId = useMemo(() => Object.fromEntries(animals.map((a) => [a._id, a])), [animals]);

  // Live form calculations
  const morningVal = Number(f.morning) || 0;
  const eveningVal = Number(f.evening) || 0;
  const priceVal = Number(f.pricePerLitre) || 0;
  const feedVal = Number(f.feedExpense) || 0;
  const formTotalMilk = +(morningVal + eveningVal).toFixed(2);
  const formRevenue = Math.round(formTotalMilk * priceVal);
  const formProfit = Math.round(formRevenue - feedVal);

  const startEdit = (rec) => {
    setEditingId(rec._id);
    setF({
      animal: rec.animal,
      date: rec.date,
      morning: String(rec.morning ?? 0),
      evening: String(rec.evening ?? 0),
      pricePerLitre: String(rec.pricePerLitre ?? 0),
      feedExpense: String(rec.feedExpense ?? 0),
    });
  };

  const resetForm = () => {
    const pr = getDefaultPrefs();
    setEditingId(null);
    setF({
      animal: defaultAnimal,
      date: today(),
      morning: '',
      evening: '',
      pricePerLitre: pr.price,
      feedExpense: pr.feed,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      animal: f.animal,
      date: f.date,
      morning: morningVal,
      evening: eveningVal,
      pricePerLitre: priceVal,
      feedExpense: feedVal,
    };
    const ok = await saveMilk(payload, editingId);
    setBusy(false);
    if (ok) resetForm();
  };

  const confirmDelete = async () => {
    setBusy(true);
    const ok = await deleteMilk(toDelete._id);
    setBusy(false);
    if (ok) setToDelete(null);
  };

  // Filtered records (newest first)
  const list = milkRecords
    .filter((m) => byId[m.animal] && (animalFilter === 'All' || m.animal === animalFilter))
    .sort((a, b) => b.date.localeCompare(a.date));

  const todayStr = today();
  const todayRecs = milkRecords.filter((m) => m.date === todayStr && byId[m.animal]);
  const todayLitres = +todayRecs.reduce((s, m) => s + (m.morning || 0) + (m.evening || 0), 0).toFixed(1);
  const todayRevenue = Math.round(
    todayRecs.reduce((s, m) => s + ((m.morning || 0) + (m.evening || 0)) * (m.pricePerLitre || 0), 0)
  );
  const todayFeed = Math.round(todayRecs.reduce((s, m) => s + (m.feedExpense || 0), 0));
  const todayProfit = todayRevenue - todayFeed;

  // Weekly chart data (last 7 days)
  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const key = getDayKey(-i);
      const dayRecs = list.filter((m) => m.date === key);
      const morning = +dayRecs.reduce((s, m) => s + (m.morning || 0), 0).toFixed(1);
      const evening = +dayRecs.reduce((s, m) => s + (m.evening || 0), 0).toFixed(1);
      days.push({
        day: new Date(key + 'T00:00:00').toLocaleDateString(getDateLocale(), { weekday: 'short', day: '2-digit' }),
        Morning: morning,
        Evening: evening,
      });
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, t]);

  // Monthly chart data (4 weekly buckets over the last 28 days)
  const monthlyData = useMemo(() => {
    const buckets = [];
    for (let w = 3; w >= 0; w--) {
      const startKey = getDayKey(-(w * 7 + 6));
      const endKey = getDayKey(-(w * 7));
      const inRange = list.filter((m) => m.date >= startKey && m.date <= endKey);
      const litres = +inRange.reduce((s, m) => s + (m.morning || 0) + (m.evening || 0), 0).toFixed(1);
      const rev = Math.round(
        inRange.reduce((s, m) => s + ((m.morning || 0) + (m.evening || 0)) * (m.pricePerLitre || 0), 0)
      );
      const feed = Math.round(inRange.reduce((s, m) => s + (m.feedExpense || 0), 0));
      buckets.push({
        label: w === 0 ? t('milk.thisWeek') : t('milk.weeksAgo', { count: w + 1 }),
        Litres: litres,
        Profit: rev - feed,
      });
    }
    return buckets;
  }, [list, t]);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  return (
    <>
      <PageHeader title={t('milk.title')} subtitle={t('milk.subtitle')} />

      {/* Top Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Milk} label={t('milk.todaysMilkYield')} value={`${todayLitres} ${t('common.litres')}`} hint={t('milk.animalsRecordedToday', { count: todayRecs.length })} />
        <StatCard icon={IndianRupee} label={t('milk.dailyRevenue')} value={`₹${todayRevenue.toLocaleString('en-IN')}`} tone="blue" hint={t('milk.revenueHint')} />
        <StatCard icon={Wheat} label={t('milk.feedExpenses')} value={`₹${todayFeed.toLocaleString('en-IN')}`} tone="amber" hint={t('milk.feedHint')} />
        <StatCard
          icon={TrendingUp}
          label={t('milk.estimatedProfit')}
          value={`${todayProfit >= 0 ? '₹' : '-₹'}${Math.abs(todayProfit).toLocaleString('en-IN')}`}
          tone={todayProfit >= 0 ? 'green' : 'red'}
          hint={t('milk.profitHint')}
        />
      </div>

      {/* Form + Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Record Form */}
        <form onSubmit={submit} className="card space-y-4 p-6 lg:col-span-2 animate-fadeUp">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <Milk size={18} className="text-brand-600" /> {editingId ? t('milk.editFormTitle') : t('milk.recordFormTitle')}
            </h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                {t('milk.cancelEdit')}
              </button>
            )}
          </div>

          <Field label={t('animals.animal')}>
            <select required className="input" value={f.animal} onChange={set('animal')}>
              <option value="" disabled>{t('health.selectAnimal')}</option>
              {animals.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.animalId}) – {t(`enums.species.${a.species}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('common.date')}>
            <input required type="date" className="input" value={f.date} onChange={set('date')} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('milk.morningMilk')}>
              <input required type="number" step="0.1" min="0" className="input" placeholder="e.g. 7.5" value={f.morning} onChange={set('morning')} />
            </Field>
            <Field label={t('milk.eveningMilk')}>
              <input required type="number" step="0.1" min="0" className="input" placeholder="e.g. 6.5" value={f.evening} onChange={set('evening')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('milk.milkSellingPrice')}>
              <input required type="number" step="0.5" min="0" className="input" placeholder="e.g. 58" value={f.pricePerLitre} onChange={set('pricePerLitre')} />
            </Field>
            <Field label={t('milk.dailyFeedExpense')}>
              <input required type="number" step="1" min="0" className="input" placeholder="e.g. 260" value={f.feedExpense} onChange={set('feedExpense')} />
            </Field>
          </div>

          {/* Live Calculation Preview */}
          <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-800">{t('milk.liveCalcTitle')}</p>
            <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white p-2.5 shadow-sm">
                <p className="text-[11px] font-medium text-slate-500">{t('milk.totalMilkProduction')}</p>
                <p className="text-base font-extrabold text-slate-900">{formTotalMilk} {t('common.litres')}</p>
              </div>
              <div className="rounded-xl bg-white p-2.5 shadow-sm">
                <p className="text-[11px] font-medium text-slate-500">{t('milk.dailyRevenue')}</p>
                <p className="text-base font-extrabold text-sky-700">₹{formRevenue}</p>
              </div>
              <div className="rounded-xl bg-white p-2.5 shadow-sm">
                <p className="text-[11px] font-medium text-slate-500">{t('milk.estimatedProfit')}</p>
                <p className={`text-base font-extrabold ${formProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formProfit >= 0 ? `₹${formProfit}` : `-₹${Math.abs(formProfit)}`}
                </p>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
            {editingId ? t('common.saveChanges') : t('milk.saveMilkRecord')}
          </button>
        </form>

        {/* Weekly & Monthly Charts */}
        <div className="space-y-6 lg:col-span-3">
          <div className="card p-6 animate-fadeUp">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-slate-900">{t('milk.weeklyChartTitle')}</h2>
                <p className="text-xs text-slate-500">{t('milk.weeklyChartSub')}</p>
              </div>
              <select className="input !w-auto !py-1.5 text-xs" value={animalFilter} onChange={(e) => setAnimalFilter(e.target.value)}>
                <option value="All">{t('health.allAnimals')}</option>
                {animals.map((a) => (
                  <option key={a._id} value={a._id}>{a.name} ({a.animalId})</option>
                ))}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit=" L" />
                <Tooltip />
                <Legend iconType="circle" />
                <Bar dataKey="Morning" name={t('milk.morningMilk')} stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Evening" name={t('milk.eveningMilk')} stackId="a" fill="#4ade80" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6 animate-fadeUp">
            <h2 className="font-bold text-slate-900">{t('milk.monthlyChartTitle')}</h2>
            <p className="mb-3 text-xs text-slate-500">{t('milk.monthlyChartSub')}</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} unit=" L" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} unit=" ₹" />
                <Tooltip />
                <Legend iconType="circle" />
                <Area yAxisId="left" type="monotone" dataKey="Litres" name={t('milk.totalMilkProduction')} stroke="#16a34a" fill="#dcfce7" strokeWidth={2.5} />
                <Area yAxisId="right" type="monotone" dataKey="Profit" name={t('milk.estimatedProfit')} stroke="#0ea5e9" fill="#e0f2fe" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Milk Log Table */}
      <div className="card mt-6 overflow-hidden animate-fadeUp">
        <div className="border-b border-slate-100 p-6 pb-4">
          <h2 className="font-bold text-slate-900">{t('milk.tableTitle')}</h2>
          <p className="text-xs text-slate-500">{t('milk.showingEntries', { count: list.length })}</p>
        </div>
        {list.length === 0 ? (
          <EmptyState title={t('milk.noRecordsTitle')} text={t('milk.noRecordsText')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr>
                  <th className="th">{t('common.date')}</th>
                  <th className="th">{t('animals.animal')}</th>
                  <th className="th">{t('milk.morningMilk')}</th>
                  <th className="th">{t('milk.eveningMilk')}</th>
                  <th className="th">{t('milk.totalMilkProduction')}</th>
                  <th className="th">{t('milk.pricePerLitreShort')}</th>
                  <th className="th">{t('milk.dailyRevenue')}</th>
                  <th className="th">{t('milk.feedExpenses')}</th>
                  <th className="th">{t('milk.estimatedProfit')}</th>
                  <th className="th text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((m) => {
                  const animal = byId[m.animal];
                  const total = +((m.morning || 0) + (m.evening || 0)).toFixed(1);
                  const rev = Math.round(total * (m.pricePerLitre || 0));
                  const profit = Math.round(rev - (m.feedExpense || 0));
                  return (
                    <tr key={m._id} className="transition hover:bg-brand-50/40">
                      <td className="td whitespace-nowrap">{fmtDate(m.date)}</td>
                      <td className="td font-semibold">
                        {speciesEmoji[animal?.species]} {animal?.name}
                        {m.isSample && <SampleTag />}
                        <span className="block text-xs font-normal text-slate-500">{animal?.animalId}</span>
                      </td>
                      <td className="td">{m.morning} {t('common.litres')}</td>
                      <td className="td">{m.evening} {t('common.litres')}</td>
                      <td className="td font-bold text-brand-700">{total} {t('common.litres')}</td>
                      <td className="td">₹{m.pricePerLitre}</td>
                      <td className="td font-medium text-sky-700">₹{rev}</td>
                      <td className="td text-amber-700">₹{m.feedExpense}</td>
                      <td className={`td font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {profit >= 0 ? `+₹${profit}` : `-₹${Math.abs(profit)}`}
                      </td>
                      <td className="td">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => startEdit(m)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-sky-600" title={t('common.edit')}><Pencil size={16} /></button>
                          <button onClick={() => setToDelete(m)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" title={t('common.delete')}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        busy={busy}
        title={t('milk.deleteTitle')}
        message={t('milk.deleteMsg')}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
