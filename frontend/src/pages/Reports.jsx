import { useTranslation } from 'react-i18next';
import { PawPrint, HeartPulse, Syringe, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useApp } from '../context/AppContext.jsx';
import { PageHeader, StatCard, EmptyState } from '../components/ui.jsx';
import { SPECIES, SPECIES_COLORS, VACC_COLORS, VACCINE_STATUSES, toInputDate, getDateLocale } from '../lib/helpers.js';

function weeklyData(records) {
  const weeks = [];
  const now = new Date(); now.setHours(0, 0, 0, 0);
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now.getTime() - (i * 7 + 6) * 86400000);
    const end = new Date(now.getTime() - i * 7 * 86400000 + 86399999);
    const inWeek = records.filter((r) => { const d = new Date(r.observationDate); return d >= start && d <= end; });
    weeks.push({
      week: end.toLocaleDateString(getDateLocale(), { day: '2-digit', month: 'short' }),
      Normal: inWeek.filter((r) => r.assessment?.level === 'Normal').length,
      Attention: inWeek.filter((r) => r.assessment?.level === 'Attention').length,
      'High Priority': inWeek.filter((r) => r.assessment?.level === 'High Priority').length,
    });
  }
  return weeks;
}

function dailyMilkReport(milkRecords) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(Date.now() - i * 86400000);
    const key = toInputDate(dt);
    const dayRecs = milkRecords.filter((m) => m.date === key);
    const litres = +dayRecs.reduce((s, m) => s + (m.morning || 0) + (m.evening || 0), 0).toFixed(1);
    days.push({
      day: dt.toLocaleDateString(getDateLocale(), { weekday: 'short', day: '2-digit' }),
      Litres: litres,
    });
  }
  return days;
}

const Card = ({ title, subtitle, children }) => (
  <div className="card p-6 animate-fadeUp">
    <h2 className="font-bold text-slate-900">{title}</h2>
    <p className="mb-4 text-xs text-slate-500">{subtitle}</p>
    {children}
  </div>
);

export default function Reports() {
  const { t } = useTranslation();
  const { animals, records, vaccinations, milkRecords } = useApp();
  if (animals.length === 0) return <EmptyState title={t('reports.noDataTitle')} text={t('reports.noDataText')} />;

  const species = SPECIES.map((s) => ({
    raw: s,
    name: t(`enums.species.${s}`),
    Animals: animals.filter((a) => a.species === s).length,
  }));
  const healthy = animals.filter((a) => a.healthStatus === 'Healthy').length;
  const healthSplit = [
    { name: t('enums.healthStatus.Healthy'), value: healthy },
    { name: t('enums.healthStatus.Needs Attention'), value: animals.length - healthy },
  ];
  const vacc = VACCINE_STATUSES.map((s) => ({
    raw: s,
    name: t(`enums.vaccineStatus.${s}`),
    value: vaccinations.filter((v) => v.status === s).length,
  }));
  const weekly = weeklyData(records);
  const milkReport = dailyMilkReport(milkRecords);

  return (
    <>
      <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={PawPrint} label={t('dashboard.totalAnimals')} value={animals.length} />
        <StatCard icon={HeartPulse} label={t('reports.healthyRate')} value={`${Math.round((healthy / animals.length) * 100)}%`} tone="green" />
        <StatCard icon={ClipboardList} label={t('reports.healthReports')} value={records.length} tone="blue" />
        <StatCard icon={Syringe} label={t('reports.vaccinationsTracked')} value={vaccinations.length} tone="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t('reports.animalDistribution')} subtitle={t('reports.animalDistributionSub')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={species}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip cursor={{ fill: '#f0fdf4' }} />
              <Bar dataKey="Animals" name={t('nav.animals')} radius={[8, 8, 0, 0]}>{species.map((s) => <Cell key={s.raw} fill={SPECIES_COLORS[s.raw]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t('reports.healthyVsAttention')} subtitle={t('reports.healthyVsAttentionSub')}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={healthSplit} dataKey="value" nameKey="name" outerRadius={95} innerRadius={55} paddingAngle={3} stroke="none" label>
                <Cell fill="#16a34a" /><Cell fill="#f59e0b" />
              </Pie>
              <Tooltip /><Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t('reports.vaccinationStatistics')} subtitle={t('reports.vaccinationStatisticsSub')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vacc} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 11 }} /><Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" name={t('nav.vaccinations')} radius={[0, 8, 8, 0]}>{vacc.map((v) => <Cell key={v.raw} fill={VACC_COLORS[v.raw]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t('reports.healthRecordsOverTime')} subtitle={t('reports.healthRecordsOverTimeSub')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} /><Tooltip /><Legend iconType="circle" />
              <Bar dataKey="Normal" name={t('enums.assessmentLevel.Normal')} stackId="a" fill="#16a34a" />
              <Bar dataKey="Attention" name={t('enums.assessmentLevel.Attention')} stackId="a" fill="#f59e0b" />
              <Bar dataKey="High Priority" name={t('enums.assessmentLevel.High Priority')} stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="lg:col-span-2">
          <Card title={t('reports.milkProductionReports')} subtitle={t('reports.milkProductionReportsSub')}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={milkReport}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} unit=" L" /><Tooltip />
                <Bar dataKey="Litres" name={t('milk.totalMilkProduction')} fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </>
  );
}
