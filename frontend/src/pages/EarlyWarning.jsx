import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell, Siren, CheckCircle2, AlertTriangle, Plus, MessageSquarePlus,
  RotateCcw, ArrowUpRight, ShieldAlert, Clock, Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { PageHeader, StatCard, Badge, EmptyState, Modal, Field, SampleTag } from '../components/ui.jsx';
import { HealthForm } from '../components/forms.jsx';
import { fmtDate, speciesEmoji } from '../lib/helpers.js';
import {
  trFarm,
  trDetectedChange,
  trAlertReason,
  trRecommendedAction,
  trWeightValue,
  trNote,
} from '../lib/dynamicTranslate.js';

export default function EarlyWarning() {
  const { t } = useTranslation();
  const { animals, alerts, reviewAlert, addAlertFollowUp } = useApp();
  const [statusFilter, setStatusFilter] = useState('Active'); // 'Active' | 'Reviewed' | 'All'
  const [recording, setRecording] = useState(false);
  const [followUpModal, setFollowUpModal] = useState(null);
  const [note, setNote] = useState('');
  const [temp, setTemp] = useState('');
  const [appetite, setAppetite] = useState('');
  const [saving, setSaving] = useState(false);

  const byId = Object.fromEntries(animals.map((a) => [a._id, a]));

  const validAlerts = alerts
    .filter((al) => byId[al.animal])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const visibleAlerts =
    statusFilter === 'All' ? validAlerts : validAlerts.filter((al) => al.status === statusFilter);

  const activeCount = validAlerts.filter((al) => al.status === 'Active').length;
  const highRiskCount = validAlerts.filter((al) => al.status === 'Active' && al.riskLevel === 'High').length;
  const reviewedCount = validAlerts.filter((al) => al.status === 'Reviewed').length;

  const openFollowUp = (alert) => {
    setFollowUpModal(alert);
    setNote('');
    setTemp('');
    setAppetite('Normal');
  };

  const submitFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpModal) return;
    setSaving(true);
    const ok = await addAlertFollowUp(followUpModal._id, {
      note,
      temperature: temp ? Number(temp) : undefined,
      appetite: appetite || undefined,
    });
    setSaving(false);
    if (ok) setFollowUpModal(null);
  };

  return (
    <>
      <PageHeader title={t('earlyWarning.title')} subtitle={t('earlyWarning.subtitle')}>
        <button className="btn-primary" onClick={() => setRecording(true)}>
          <Plus size={17} /> {t('earlyWarning.logObservationBtn')}
        </button>
      </PageHeader>

      {/* Veterinary Non-Diagnosis Disclaimer */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <ShieldAlert className="mt-0.5 shrink-0 text-amber-600" size={20} />
        <p>{t('earlyWarning.disclaimer')}</p>
      </div>

      {/* Top Stat Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Bell} label={t('earlyWarning.activeAlertsStat')} value={activeCount} tone="amber" />
        <StatCard icon={Siren} label={t('earlyWarning.highRiskStat')} value={highRiskCount} tone="red" />
        <StatCard icon={CheckCircle2} label={t('earlyWarning.reviewedStat')} value={reviewedCount} tone="green" />
      </div>

      {/* Filter Pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { key: 'Active', label: `${t('earlyWarning.filterActive')} (${activeCount})` },
          { key: 'Reviewed', label: `${t('earlyWarning.filterReviewed')} (${reviewedCount})` },
          { key: 'All', label: `${t('earlyWarning.filterAll')} (${validAlerts.length})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              statusFilter === f.key
                ? 'bg-brand-600 text-white shadow'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {visibleAlerts.length === 0 ? (
        <div className="card">
          <EmptyState
            title={t('earlyWarning.noAlertsTitle')}
            text={t('earlyWarning.noAlertsText')}
            action={
              <button className="btn-primary" onClick={() => setRecording(true)}>
                <Plus size={16} /> {t('earlyWarning.logObservationBtn')}
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {visibleAlerts.map((al) => {
            const animal = byId[al.animal];
            const borderTone =
              al.riskLevel === 'High'
                ? 'border-l-4 border-l-red-500'
                : al.riskLevel === 'Medium'
                ? 'border-l-4 border-l-amber-500'
                : 'border-l-4 border-l-emerald-500';

            return (
              <div key={al._id} className={`card p-6 transition hover:shadow-md animate-fadeUp ${borderTone}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                      {speciesEmoji[animal.species]}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <Link to={`/digital-twin?animal=${animal._id}`} className="text-base font-extrabold text-slate-900 hover:text-brand-700 sm:text-lg">
                          {animal.name} ({animal.animalId})
                        </Link>
                        {al.isSample && <SampleTag />}
                        <Badge>{al.riskLevel}</Badge>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            al.status === 'Reviewed' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {al.status === 'Reviewed' ? t('earlyWarning.statusReviewed') : t('earlyWarning.statusActive')}
                        </span>
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={12} /> {fmtDate(al.createdAt)} · {t(`enums.species.${animal.species}`)} · {trFarm(animal.farmName, t)}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                    <Link to={`/digital-twin?animal=${animal._id}`} className="btn-ghost !min-h-[38px] flex-1 !px-3 !py-1.5 text-xs sm:flex-initial">
                      {t('earlyWarning.openDigitalTwin')} <ArrowUpRight size={14} />
                    </Link>
                    <button onClick={() => openFollowUp(al)} className="btn-ghost !min-h-[38px] flex-1 !px-3 !py-1.5 text-xs sm:flex-initial">
                      <MessageSquarePlus size={14} /> {t('earlyWarning.addFollowUp')}
                    </button>
                    {al.status === 'Active' ? (
                      <button
                        onClick={() => reviewAlert(al._id, { status: 'Reviewed' })}
                        className="btn-primary !min-h-[38px] w-full !px-3.5 !py-1.5 text-xs sm:w-auto"
                      >
                        <CheckCircle2 size={14} /> {t('earlyWarning.markReviewed')}
                      </button>
                    ) : (
                      <button
                        onClick={() => reviewAlert(al._id, { status: 'Active' })}
                        className="btn-ghost !min-h-[38px] w-full !px-3 !py-1.5 text-xs sm:w-auto"
                      >
                        <RotateCcw size={14} /> {t('earlyWarning.reopenAlert')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Detected Change & Explainable Reason */}
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4 lg:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {t('earlyWarning.detectedChange')}
                    </p>
                    <p className="mt-1 font-bold text-slate-900">{trDetectedChange(al.detectedChange, t)}</p>

                    <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                      {t('earlyWarning.reasonForAlert')}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{trAlertReason(al.reason, t)}</p>
                  </div>

                  {/* Previous vs Current Values Comparison Box */}
                  <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200/80 p-4 text-xs">
                    <div>
                      <p className="font-bold uppercase text-slate-400">{t('earlyWarning.previousValue')}</p>
                      <p className="mt-1.5 font-semibold text-slate-700">
                        {t('health.tempShort')}: <span className="font-bold">{trWeightValue(al.previousValue?.temperature, t)}</span>
                      </p>
                      <p className="mt-1 text-slate-600">
                        {t('health.appetite')}: {t(`enums.appetite.${al.previousValue?.appetite || 'Normal'}`, { defaultValue: al.previousValue?.appetite })}
                      </p>
                      <p className="mt-1 text-slate-600">
                        {t('animals.weightLabel')}: {trWeightValue(al.previousValue?.weight, t)}
                      </p>
                    </div>
                    <div className="border-l border-slate-200 pl-3">
                      <p className="font-bold uppercase text-red-600">{t('earlyWarning.currentValue')}</p>
                      <p className="mt-1.5 font-semibold text-slate-900">
                        {t('health.tempShort')}: <span className="font-extrabold text-red-600">{trWeightValue(al.currentValue?.temperature, t)}</span>
                      </p>
                      <p className="mt-1 text-slate-800">
                        {t('health.appetite')}: <span className="font-bold">{t(`enums.appetite.${al.currentValue?.appetite || 'Normal'}`, { defaultValue: al.currentValue?.appetite })}</span>
                      </p>
                      <p className="mt-1 text-slate-700">
                        {t('animals.weightLabel')}: {trWeightValue(al.currentValue?.weight, t)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-brand-50/70 p-3.5 text-sm text-brand-900">
                  <AlertTriangle size={17} className="mt-0.5 shrink-0 text-brand-700" />
                  <div>
                    <span className="font-bold">{t('earlyWarning.recommendedAction')}: </span>
                    <span>{trRecommendedAction(al.recommendedAction, t)}</span>
                  </div>
                </div>

                {/* Follow-up Observations */}
                {al.followUps?.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      {t('earlyWarning.followUpHistory', { count: al.followUps.length })}
                    </p>
                    <ul className="space-y-2">
                      {al.followUps.map((f, idx) => (
                        <li key={idx} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                          <span>
                            <strong>{fmtDate(f.date)}:</strong> {trNote(f.note, t)}
                            {f.temperature ? ` (${f.temperature}°C)` : ''}
                            {f.appetite ? ` · ${t(`enums.appetite.${f.appetite}`, { defaultValue: f.appetite })}` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to record a new observation (which triggers early warning evaluation) */}
      <HealthForm open={recording} onClose={() => setRecording(false)} />

      {/* Modal to add a Follow-Up observation on an alert */}
      <Modal
        open={Boolean(followUpModal)}
        title={t('earlyWarning.followUpModalTitle', { name: byId[followUpModal?.animal]?.name || '' })}
        onClose={() => setFollowUpModal(null)}
      >
        <form onSubmit={submitFollowUp} className="space-y-4">
          <Field label={t('earlyWarning.followUpNoteLabel')}>
            <textarea
              required
              rows="3"
              className="input"
              placeholder={t('earlyWarning.followUpNotePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('earlyWarning.followUpTempLabel')}>
              <input
                type="number"
                step="0.1"
                min="30"
                max="45"
                className="input"
                placeholder="e.g. 38.9"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
              />
            </Field>
            <Field label={t('earlyWarning.followUpAppetiteLabel')}>
              <select className="input" value={appetite} onChange={(e) => setAppetite(e.target.value)}>
                <option value="Normal">{t('enums.appetite.Normal')}</option>
                <option value="Low">{t('enums.appetite.Low')}</option>
                <option value="No appetite">{t('enums.appetite.No appetite')}</option>
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setFollowUpModal(null)}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving && <Loader2 size={16} className="animate-spin" />} {t('earlyWarning.saveFollowUp')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
