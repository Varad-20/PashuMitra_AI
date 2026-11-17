import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity, Thermometer, Utensils, Weight, Milk, Syringe, Bell, Bot,
  HeartPulse, Info, AlertTriangle, CheckCircle2, HelpCircle, Clock,
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useApp } from '../context/AppContext.jsx';
import { PageHeader, Badge, EmptyState, SampleTag } from '../components/ui.jsx';
import { HealthForm } from '../components/forms.jsx';
import { fmtDate, fmtShortDate, relativeDay, speciesEmoji } from '../lib/helpers.js';
import { computeAnimalBaseline, computeIllustrativeHealthScore } from '../lib/intelligence.js';
import {
  trBreed,
  trFarm,
  trVaccine,
  trDetectedChange,
  trAlertReason,
  trSymptomsList,
} from '../lib/dynamicTranslate.js';

function StatusChip({ status, t }) {
  const map = {
    normal: {
      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      Icon: CheckCircle2,
      label: t('digitalTwin.statusNormal'),
    },
    unusual: {
      cls: 'bg-red-50 text-red-700 ring-red-600/20',
      Icon: AlertTriangle,
      label: t('digitalTwin.statusUnusual'),
    },
    building: {
      cls: 'bg-amber-50 text-amber-700 ring-amber-600/20',
      Icon: Clock,
      label: t('digitalTwin.statusBuilding'),
    },
    missing: {
      cls: 'bg-slate-100 text-slate-600 ring-slate-500/20',
      Icon: HelpCircle,
      label: t('digitalTwin.statusMissing'),
    },
  };
  const cfg = map[status] || map.missing;
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cfg.cls}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

export default function DigitalTwin() {
  const { t } = useTranslation();
  const { animals, records, vaccinations, milkRecords, alerts } = useApp();
  const [params, setParams] = useSearchParams();
  const [recording, setRecording] = useState(false);

  const selectedId = params.get('animal') || animals[1]?._id || animals[0]?._id || '';
  const animal = animals.find((a) => a._id === selectedId) || animals[0];

  const selectAnimal = (id) => setParams({ animal: id });

  const animalRecords = useMemo(
    () =>
      records
        .filter((r) => r.animal === animal?._id)
        .sort((a, b) => new Date(b.observationDate) - new Date(a.observationDate)),
    [records, animal]
  );

  const animalMilk = useMemo(
    () =>
      milkRecords
        .filter((m) => m.animal === animal?._id)
        .sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [milkRecords, animal]
  );

  const animalVaccs = useMemo(
    () =>
      vaccinations
        .filter((v) => v.animal === animal?._id)
        .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate)),
    [vaccinations, animal]
  );

  const animalAlerts = useMemo(
    () =>
      alerts
        .filter((al) => al.animal === animal?._id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [alerts, animal]
  );

  const baseline = useMemo(
    () => (animal ? computeAnimalBaseline(animal, animalRecords, animalMilk) : null),
    [animal, animalRecords, animalMilk]
  );

  const illustrativeScore = useMemo(
    () => (animal ? computeIllustrativeHealthScore(animal, baseline, animalVaccs) : 0),
    [animal, baseline, animalVaccs]
  );

  if (!animal) {
    return <EmptyState title={t('animals.noAnimalsFound')} text={t('animals.addFirstAnimal')} />;
  }

  const chronologicalRecs = [...animalRecords].reverse();
  const tempChartData = chronologicalRecs.map((r) => ({
    date: fmtShortDate(r.observationDate),
    temp: r.temperature,
    baseline: baseline?.avgTemp || null,
  }));

  const weightChartData = chronologicalRecs.map((r) => ({
    date: fmtShortDate(r.observationDate),
    weight: r.weight || animal.weight,
    appetite: r.appetite,
  }));

  const milkChartData = animalMilk.slice(-10).map((m) => ({
    date: fmtShortDate(m.date),
    litres: +((m.morning || 0) + (m.evening || 0)).toFixed(1),
  }));

  const scoreTone =
    illustrativeScore >= 80
      ? 'text-emerald-600 border-emerald-500 bg-emerald-50/60'
      : illustrativeScore >= 60
      ? 'text-amber-600 border-amber-500 bg-amber-50/60'
      : 'text-red-600 border-red-500 bg-red-50/60';

  const translateSymptoms = (arr) => trSymptomsList(arr, t);

  return (
    <>
      <PageHeader title={t('digitalTwin.title')} subtitle={t('digitalTwin.subtitle')}>
        <button className="btn-ghost" onClick={() => setRecording(true)}>
          <HeartPulse size={16} /> {t('digitalTwin.recordNewObs')}
        </button>
        <Link to={`/assistant?animal=${animal._id}`} className="btn-primary">
          <Bot size={16} /> {t('digitalTwin.askVoiceAi')}
        </Link>
      </PageHeader>

      {/* Animal Selector Pills */}
      <div className="card mb-6 p-4 animate-fadeUp">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          {t('digitalTwin.selectAnimal')}
        </p>
        <div className="flex flex-wrap gap-2">
          {animals.map((a) => {
            const active = a._id === animal._id;
            return (
              <button
                key={a._id}
                onClick={() => selectAnimal(a._id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                  active
                    ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/50'
                }`}
              >
                <span className="text-base">{speciesEmoji[a.species]}</span>
                <span>{a.name}</span>
                <span className={`text-[11px] ${active ? 'text-brand-100' : 'text-slate-400'}`}>({a.animalId})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Digital Twin Identity Header + Illustrative Health Score */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2 animate-fadeUp">
          <div className="bg-gradient-to-r from-brand-800 to-brand-600 p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-4xl">
                  {speciesEmoji[animal.species]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-extrabold">{animal.name}</h2>
                    {animal.isSample && <SampleTag />}
                  </div>
                  <p className="text-sm text-brand-100">
                    {animal.animalId} · {trBreed(animal.breed, t)} · {t(`enums.species.${animal.species}`)} · {trFarm(animal.farmName, t)}
                  </p>
                </div>
              </div>
              <Badge>{animal.healthStatus}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-xs text-slate-500">{t('animals.speciesBreed')}</p>
              <p className="mt-1 font-bold text-slate-900">
                {t(`enums.species.${animal.species}`)} · {trBreed(animal.breed, t)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-xs text-slate-500">{t('animals.ageGender')}</p>
              <p className="mt-1 font-bold text-slate-900">
                {animal.age} {t('common.yrs')} · {t(`enums.gender.${animal.gender}`)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-xs text-slate-500">{t('animals.weightLabel')}</p>
              <p className="mt-1 font-bold text-slate-900">
                {animal.weight} {t('common.kg')}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-xs text-slate-500">{t('animals.healthStatus')}</p>
              <div className="mt-1"><Badge>{animal.healthStatus}</Badge></div>
            </div>
          </div>
        </div>

        {/* Illustrative Health Score Card */}
        <div className="card flex flex-col justify-between p-6 animate-fadeUp">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{t('digitalTwin.healthScoreTitle')}</h3>
              <Activity size={18} className="text-brand-600" />
            </div>
            <div className="my-4 flex items-center gap-4">
              <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 text-2xl font-extrabold ${scoreTone}`}>
                {illustrativeScore}
              </div>
              <div>
                <Badge>{animal.healthStatus}</Badge>
                <p className="mt-1.5 text-xs text-slate-600">
                  {baseline.status === 'ready'
                    ? t('digitalTwin.baselineReady', { count: baseline.recordCount })
                    : t('digitalTwin.buildingBaseline', { count: baseline.recordCount, min: baseline.minRequired })}
                </p>
              </div>
            </div>
          </div>
          <p className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500">
            <Info size={13} className="mr-1 inline text-slate-400" />
            {t('digitalTwin.healthScoreDisclaimer')}
          </p>
        </div>
      </div>

      {/* Individual Health Baseline Section */}
      <div className="card mt-6 p-6 animate-fadeUp">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('digitalTwin.baselineTitle')}</h2>
            <p className="text-xs text-slate-500">{t('digitalTwin.baselineDisclaimer')}</p>
          </div>
          <StatusChip status={baseline.status === 'ready' ? 'normal' : 'building'} t={t} />
        </div>

        {baseline.status === 'building' && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-900">
            <Clock size={17} className="shrink-0 text-amber-600" />
            <span>
              <strong>{t('digitalTwin.buildingBaseline', { count: baseline.recordCount, min: baseline.minRequired })}:</strong>{' '}
              {t('digitalTwin.buildingBaselineSub', { min: baseline.minRequired })}
            </span>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Temperature Baseline */}
          <div className="rounded-2xl border border-slate-200/80 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Thermometer size={15} className="text-brand-600" /> {t('digitalTwin.avgTempLabel')}
              </span>
              <StatusChip status={baseline.comparisons.temperature.status} t={t} />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {baseline.avgTemp != null ? `${baseline.avgTemp}°C` : t('digitalTwin.statusBuilding')}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {baseline.comparisons.temperature.current != null
                ? t('digitalTwin.latestTempLabel', { val: baseline.comparisons.temperature.current })
                : t('digitalTwin.statusMissing')}
              {baseline.comparisons.temperature.delta != null && (
                <span className={`ml-1.5 font-bold ${baseline.comparisons.temperature.status === 'unusual' ? 'text-red-600' : 'text-emerald-600'}`}>
                  ({baseline.comparisons.temperature.delta >= 0 ? `+${baseline.comparisons.temperature.delta}` : baseline.comparisons.temperature.delta}°C)
                </span>
              )}
            </p>
          </div>

          {/* Appetite Baseline */}
          <div className="rounded-2xl border border-slate-200/80 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Utensils size={15} className="text-brand-600" /> {t('digitalTwin.usualAppetiteLabel')}
              </span>
              <StatusChip status={baseline.comparisons.appetite.status} t={t} />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {t(`enums.appetite.${baseline.usualAppetite}`)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {baseline.comparisons.appetite.current
                ? t('digitalTwin.latestAppetiteLabel', { val: t(`enums.appetite.${baseline.comparisons.appetite.current}`) })
                : t('digitalTwin.statusMissing')}
            </p>
          </div>

          {/* Weight Baseline */}
          <div className="rounded-2xl border border-slate-200/80 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Weight size={15} className="text-brand-600" /> {t('digitalTwin.avgWeightLabel')}
              </span>
              <StatusChip status={baseline.comparisons.weight.status} t={t} />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {baseline.avgWeight ? `${baseline.avgWeight} ${t('common.kg')}` : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {baseline.comparisons.weight.current
                ? t('digitalTwin.latestWeightLabel', { val: baseline.comparisons.weight.current })
                : t('digitalTwin.statusMissing')}
              {baseline.comparisons.weight.deltaPct != null && (
                <span className="ml-1 font-semibold">({baseline.comparisons.weight.deltaPct > 0 ? `+${baseline.comparisons.weight.deltaPct}` : baseline.comparisons.weight.deltaPct}%)</span>
              )}
            </p>
          </div>

          {/* Milk Baseline */}
          <div className="rounded-2xl border border-slate-200/80 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Milk size={15} className="text-brand-600" /> {t('digitalTwin.avgMilkLabel')}
              </span>
              <StatusChip status={baseline.comparisons.milk.status} t={t} />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {baseline.avgMilk != null ? `${baseline.avgMilk} ${t('common.litres')}` : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {baseline.comparisons.milk.current != null
                ? t('digitalTwin.latestMilkLabel', { val: baseline.comparisons.milk.current })
                : t('digitalTwin.noMilkData')}
            </p>
          </div>
        </div>
      </div>

      {/* Historical Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6 animate-fadeUp">
          <h3 className="font-bold text-slate-900">{t('digitalTwin.tempChartTitle')}</h3>
          <p className="mb-4 text-xs text-slate-500">{t('digitalTwin.tempChartSub')}</p>
          {tempChartData.length === 0 ? (
            <EmptyState title={t('animals.noHealthRecords')} />
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={tempChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 12 }} />
                <Tooltip />
                {baseline.avgTemp && (
                  <ReferenceLine
                    y={baseline.avgTemp}
                    stroke="#0ea5e9"
                    strokeDasharray="4 4"
                    label={{ value: `${t('digitalTwin.baselineLine')} (${baseline.avgTemp}°C)`, fontSize: 11, fill: '#0284c7' }}
                  />
                )}
                <Line type="monotone" dataKey="temp" name={`${t('health.tempShort')} °C`} stroke="#16a34a" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6 animate-fadeUp">
          <h3 className="font-bold text-slate-900">
            {milkChartData.length > 0 ? t('digitalTwin.milkChartTitle') : t('digitalTwin.weightChartTitle')}
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            {milkChartData.length > 0 ? t('digitalTwin.milkChartSub') : t('digitalTwin.weightChartSub')}
          </p>
          {milkChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={milkChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit=" L" />
                <Tooltip />
                {baseline.avgMilk && (
                  <ReferenceLine y={baseline.avgMilk} stroke="#0ea5e9" strokeDasharray="4 4" />
                )}
                <Area type="monotone" dataKey="litres" name={t('milk.totalMilkProduction')} stroke="#16a34a" fill="#dcfce7" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit=" kg" />
                <Tooltip />
                <Bar dataKey="weight" name={t('animals.weightLabel')} fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Previous Health Alerts + Vaccinations */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6 animate-fadeUp">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-slate-900">
              <Bell size={18} className="text-amber-500" /> {t('digitalTwin.alertsSectionTitle')}
            </h3>
            <Link to="/early-warning" className="text-xs font-semibold text-brand-700 hover:underline">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          {animalAlerts.length === 0 ? (
            <p className="text-sm text-slate-500">{t('digitalTwin.noAlertsForAnimal')}</p>
          ) : (
            <div className="space-y-3">
              {animalAlerts.map((al) => (
                <div key={al._id} className="rounded-xl border border-slate-200/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge>{al.riskLevel}</Badge>
                      <span className="text-xs font-semibold text-slate-500">
                        {al.status === 'Reviewed' ? t('earlyWarning.statusReviewed') : t('earlyWarning.statusActive')}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{fmtDate(al.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-slate-900">{trDetectedChange(al.detectedChange, t)}</p>
                  <p className="mt-1 text-xs text-slate-600">{trAlertReason(al.reason, t)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6 animate-fadeUp">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
            <Syringe size={18} className="text-violet-500" /> {t('digitalTwin.vaccSectionTitle')}
          </h3>
          {animalVaccs.length === 0 ? (
            <p className="text-sm text-slate-500">{t('animals.noVaccForAnimal')}</p>
          ) : (
            <div className="space-y-3">
              {animalVaccs.map((v) => (
                <div key={v._id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5">
                  <div>
                    <p className="font-semibold text-slate-800">{trVaccine(v.vaccineName, t)}</p>
                    <p className="text-xs text-slate-500">
                      {t('animals.nextDue')}: {fmtDate(v.nextDueDate)} ({relativeDay(v.nextDueDate, t)})
                    </p>
                  </div>
                  <Badge>{v.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Health Observation Timeline */}
      <div className="card mt-6 p-6 animate-fadeUp">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">{t('digitalTwin.timelineSectionTitle')}</h3>
          <button className="btn-primary !py-1.5 text-xs" onClick={() => setRecording(true)}>
            <HeartPulse size={14} /> {t('digitalTwin.recordNewObs')}
          </button>
        </div>
        {animalRecords.length === 0 ? (
          <EmptyState title={t('animals.noHealthRecords')} text={t('animals.recordFirstCheck')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="border-y border-slate-100 bg-slate-50/70">
                <tr>
                  <th className="th">{t('common.date')}</th>
                  <th className="th">{t('health.tempShort')}</th>
                  <th className="th">{t('animals.weightLabel')}</th>
                  <th className="th">{t('health.appetite')}</th>
                  <th className="th">{t('health.activityLevel')}</th>
                  <th className="th">{t('health.symptoms')}</th>
                  <th className="th">{t('health.result')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {animalRecords.map((r) => (
                  <tr key={r._id}>
                    <td className="td">{fmtDate(r.observationDate)}</td>
                    <td className="td font-semibold">{r.temperature}°C</td>
                    <td className="td">{r.weight ? `${r.weight} ${t('common.kg')}` : '—'}</td>
                    <td className="td">{t(`enums.appetite.${r.appetite}`)}</td>
                    <td className="td">{t(`enums.activity.${r.activity}`)}</td>
                    <td className="td text-slate-500">{r.symptoms?.length ? translateSymptoms(r.symptoms) : '—'}</td>
                    <td className="td"><Badge>{r.assessment?.level}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <HealthForm open={recording} animalId={animal._id} onClose={() => setRecording(false)} />
    </>
  );
}
