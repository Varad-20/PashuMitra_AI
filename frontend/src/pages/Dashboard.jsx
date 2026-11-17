import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PawPrint, HeartPulse, AlertTriangle, Building2, Syringe, ArrowRight, Activity, Bell, Milk, QrCode } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useApp } from '../context/AppContext.jsx';
import { PageHeader, StatCard, Badge, EmptyState } from '../components/ui.jsx';
import { fmtDate, relativeDay, today, HEALTH_COLORS, SPECIES_COLORS, speciesEmoji } from '../lib/helpers.js';
import { trHealthReason, trVaccine, trFarm } from '../lib/dynamicTranslate.js';

const count = (list, fn, labelFn) =>
  Object.entries(list.reduce((acc, x) => ({ ...acc, [fn(x)]: (acc[fn(x)] || 0) + 1 }), {})).map(([raw, value]) => ({
    raw,
    name: labelFn ? labelFn(raw) : raw,
    value,
  }));

function Donut({ data, colors }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} stroke="none">
          {data.map((d) => <Cell key={d.raw} fill={colors[d.raw] || '#94a3b8'} />)}
        </Pie>
        <Tooltip />
        <Legend iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { animals, records, vaccinations, milkRecords } = useApp();
  const byId = Object.fromEntries(animals.map((a) => [a._id, a]));

  const healthy = animals.filter((a) => a.healthStatus === 'Healthy').length;
  const attention = animals.length - healthy;
  const farms = new Set(animals.map((a) => a.farmName)).size;
  const dueSoon = vaccinations.filter((v) => v.status === 'Due Soon').length;

  const todayStr = today();
  const todayMilkRecs = milkRecords.filter((m) => m.date === todayStr && byId[m.animal]);
  const todayMilk = +todayMilkRecs.reduce((s, m) => s + (m.morning || 0) + (m.evening || 0), 0).toFixed(1);
  const todayProfit = Math.round(
    todayMilkRecs.reduce(
      (s, m) => s + ((m.morning || 0) + (m.evening || 0)) * (m.pricePerLitre || 0) - (m.feedExpense || 0),
      0
    )
  );

  const upcoming = vaccinations.filter((v) => v.status !== 'Completed').sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate)).slice(0, 5);

  // Alerts: abnormal health records (newest first) + overdue vaccinations
  const alerts = [
    ...records.filter((r) => r.assessment?.level !== 'Normal' && byId[r.animal]).map((r) => ({
      id: r._id,
      date: r.observationDate,
      animal: byId[r.animal],
      level: r.assessment.level,
      text: trHealthReason(r.assessment.reasons[0], t),
    })),
    ...vaccinations.filter((v) => v.status === 'Overdue' && byId[v.animal]).map((v) => ({
      id: v._id,
      date: v.nextDueDate,
      animal: byId[v.animal],
      level: 'Overdue',
      text: t('dashboard.isOverdue', { vaccine: trVaccine(v.vaccineName, t) }),
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const activity = [
    ...animals.map((a) => ({
      id: a._id,
      date: a.dateAdded,
      text: t('dashboard.activityAdded', { name: a.name, id: a.animalId, farm: trFarm(a.farmName, t) }),
      icon: PawPrint,
    })),
    ...records.filter((r) => byId[r.animal]).map((r) => ({
      id: r._id,
      date: r.observationDate,
      text: t('dashboard.activityHealth', { name: byId[r.animal].name, temp: r.temperature }),
      icon: HeartPulse,
    })),
    ...vaccinations.filter((v) => byId[v.animal] && v.status === 'Completed').map((v) => ({
      id: v._id,
      date: v.vaccinationDate,
      text: t('dashboard.activityVaccine', { vaccine: trVaccine(v.vaccineName, t), name: byId[v.animal].name }),
      icon: Syringe,
    })),
  ].filter((x) => new Date(x.date) <= new Date(Date.now() + 86400000)).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);

  return (
    <>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')}>
        <Link to="/scan" className="btn-ghost"><QrCode size={16} /> {t('dashboard.scanQr')}</Link>
        <Link to="/animals" className="btn-primary">{t('dashboard.manageAnimals')} <ArrowRight size={16} /></Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={PawPrint} label={t('dashboard.totalAnimals')} value={animals.length} hint={t('dashboard.acrossAllFarms')} />
        <StatCard icon={HeartPulse} label={t('dashboard.healthyAnimals')} value={healthy} tone="green" hint={animals.length ? t('dashboard.percentOfHerd', { percent: Math.round((healthy / animals.length) * 100) }) : ''} />
        <StatCard icon={AlertTriangle} label={t('dashboard.animalsRequiringAttention')} value={attention} tone="amber" hint={t('dashboard.attentionHint')} />
        <StatCard icon={Building2} label={t('dashboard.totalFarms')} value={farms} tone="blue" />
        <StatCard icon={Syringe} label={t('dashboard.vaccinationsDueSoon')} value={dueSoon} tone="violet" hint={t('dashboard.within14Days')} />
        <StatCard icon={Milk} label={t('dashboard.todaysMilk')} value={`${todayMilk} ${t('common.litres')}`} tone="green" hint={t('dashboard.estProfitHint', { profit: todayProfit.toLocaleString('en-IN') })} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6 animate-fadeUp">
          <h2 className="font-bold text-slate-900">{t('dashboard.animalStatistics')}</h2>
          {animals.length
            ? <Donut data={count(animals, (a) => a.healthStatus, (k) => t(`enums.healthStatus.${k}`))} colors={HEALTH_COLORS} />
            : <EmptyState title={t('dashboard.noAnimalsYet')} />}
        </div>
        <div className="card p-6 animate-fadeUp">
          <h2 className="font-bold text-slate-900">{t('dashboard.categoryDistribution')}</h2>
          {animals.length
            ? <Donut data={count(animals, (a) => a.species, (k) => t(`enums.species.${k}`))} colors={SPECIES_COLORS} />
            : <EmptyState title={t('dashboard.noAnimalsYet')} />}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 animate-fadeUp">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900"><Bell size={18} className="text-amber-500" /> {t('dashboard.recentAlerts')}</h2>
          {alerts.length === 0 ? <EmptyState title={t('dashboard.noAlerts')} text={t('dashboard.allAnimalsFine')} /> : (
            <ul className="space-y-3">
              {alerts.map((a) => (
                <li key={a.id}>
                  <Link to={`/animals/${a.animal._id}`} className="block rounded-xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">{speciesEmoji[a.animal.species]} {a.animal.name}</span>
                      <Badge>{a.level}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{a.text}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{fmtDate(a.date)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6 animate-fadeUp">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-slate-900"><Syringe size={18} className="text-violet-500" /> {t('dashboard.upcomingVaccinations')}</h2>
            <Link to="/vaccinations" className="text-xs font-semibold text-brand-700 hover:underline">{t('dashboard.viewAll')}</Link>
          </div>
          {upcoming.length === 0 ? <EmptyState title={t('dashboard.nothingDue')} text={t('dashboard.noUpcomingVacc')} /> : (
            <ul className="space-y-3">
              {upcoming.map((v) => (
                <li key={v._id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{trVaccine(v.vaccineName, t)}</p>
                    <p className="text-xs text-slate-500">{byId[v.animal]?.name} · {relativeDay(v.nextDueDate, t)}</p>
                  </div>
                  <Badge>{v.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6 animate-fadeUp">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900"><Activity size={18} className="text-brand-600" /> {t('dashboard.recentActivities')}</h2>
          {activity.length === 0 ? <EmptyState title={t('dashboard.noActivityYet')} /> : (
            <ol className="space-y-4">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"><a.icon size={15} /></div>
                  <div><p className="text-sm text-slate-700">{a.text}</p><p className="text-xs text-slate-400">{fmtDate(a.date)}</p></div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}
