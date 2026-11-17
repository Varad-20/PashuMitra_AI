import { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Pencil, Trash2, HeartPulse, Bot, Thermometer, Weight, Calendar,
  Building2, Syringe, QrCode, Download, Pill, Stethoscope, Clock, Plus, ShieldCheck,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext.jsx';
import { Badge, EmptyState, ConfirmDialog, SampleTag, Modal } from '../components/ui.jsx';
import { AnimalForm, HealthForm, VaccinationForm, TreatmentForm } from '../components/forms.jsx';
import { fmtDate, fmtShortDate, speciesEmoji, relativeDay } from '../lib/helpers.js';
import {
  trBreed,
  trFarm,
  trVaccine,
  trTreatment,
  trTreatmentDetails,
  trNote,
  trHealthReason,
  trSymptomsList,
} from '../lib/dynamicTranslate.js';

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><Icon size={14} /> {label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function AnimalDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { animals, records, vaccinations, treatments, aiAssessments, deleteAnimal, deleteTreatment } = useApp();

  const [tab, setTab] = useState('overview'); // 'overview' | 'passport'
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [qrOpen, setQrOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [vaccinating, setVaccinating] = useState(false);
  const [treating, setTreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const qrBoxRef = useRef(null);

  const animal = animals.find((a) => a._id === id);
  if (!animal) {
    return (
      <EmptyState
        title={t('animals.animalNotFound')}
        text={t('animals.animalNotFoundText')}
        action={<Link to="/animals" className="btn-primary">{t('animals.backToAnimals')}</Link>}
      />
    );
  }

  const history = records.filter((r) => r.animal === id).sort((a, b) => new Date(b.observationDate) - new Date(a.observationDate));
  const vaccs = vaccinations.filter((v) => v.animal === id).sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
  const animalTreatments = treatments.filter((tr) => tr.animal === id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const animalAi = aiAssessments.filter((a) => a.animal === id).sort((a, b) => new Date(b.date) - new Date(a.date));

  const latest = history[0];
  const chart = [...history].reverse().map((r) => ({ date: fmtShortDate(r.observationDate), temp: r.temperature }));

  const TIMELINE_FILTERS = [
    { key: 'all', label: t('animals.filterAll') },
    { key: 'observation', label: t('animals.filterObs') },
    { key: 'vaccination', label: t('animals.filterVac') },
    { key: 'treatment', label: t('animals.filterTrt') },
    { key: 'ai', label: t('animals.filterAi') },
  ];

  const translateSymptoms = (list) => trSymptomsList(list, t);

  // Build unified chronological timeline for Digital Animal Health Passport
  const timelineEvents = [
    ...history.map((r) => ({
      id: `obs-${r._id}`,
      type: 'observation',
      typeLabel: t('animals.eventObs'),
      date: r.observationDate,
      title: `${t('health.tempShort')}: ${r.temperature}°C · ${t('health.appetite')}: ${t(`enums.appetite.${r.appetite}`)} · ${t('health.activityLevel')}: ${t(`enums.activity.${r.activity}`)}`,
      badge: r.assessment?.level || 'Normal',
      details: [
        r.symptoms?.length ? `${t('health.symptoms')}: ${translateSymptoms(r.symptoms)}` : null,
        r.assessment?.reasons?.length ? r.assessment.reasons.map((rs) => trHealthReason(rs, t)).join(' • ') : null,
        r.notes ? trNote(r.notes, t) : null,
      ].filter(Boolean),
      isSample: r.isSample,
    })),
    ...vaccs.map((v) => ({
      id: `vac-${v._id}`,
      type: 'vaccination',
      typeLabel: t('animals.eventVac'),
      date: v.vaccinationDate,
      title: trVaccine(v.vaccineName, t),
      badge: v.status,
      details: [`${t('animals.nextDue')}: ${fmtDate(v.nextDueDate)} (${relativeDay(v.nextDueDate, t)})`],
      isSample: v.isSample,
    })),
    ...animalTreatments.map((tr) => ({
      id: `trt-${tr._id}`,
      rawId: tr._id,
      type: 'treatment',
      typeLabel: t('animals.eventTrt'),
      date: tr.date,
      title: trTreatment(tr.treatment, t),
      badge: 'Completed',
      details: [
        tr.details ? trTreatmentDetails(tr.details, t) : null,
        tr.vetName ? tr.vetName : null,
      ].filter(Boolean),
      isSample: tr.isSample,
    })),
    ...animalAi.map((a) => ({
      id: `ai-${a._id}`,
      type: 'ai',
      typeLabel: t('animals.eventAi'),
      date: a.date,
      title: a.result?.possibleConcern || t('animals.eventAi'),
      badge: a.result?.riskLevel || 'Low',
      details: [
        a.symptoms?.length ? `${t('health.symptoms')}: ${translateSymptoms(a.symptoms)}` : null,
        a.temperature ? `${t('health.tempShort')}: ${a.temperature}°C · ${t('health.appetite')}: ${t(`enums.appetite.${a.appetite}`)}` : null,
        a.description ? `"${trNote(a.description, t)}"` : null,
        a.result?.nextSteps?.length ? a.result.nextSteps[0] : null,
      ].filter(Boolean),
      isSample: a.isSample,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const visibleTimeline = timelineFilter === 'all' ? timelineEvents : timelineEvents.filter((e) => e.type === timelineFilter);

  const qrPayload = JSON.stringify({
    app: 'PashuMitraAI',
    id: animal._id,
    animalId: animal.animalId,
    name: animal.name,
    species: animal.species,
  });

  const downloadQr = () => {
    const qrCanvas = qrBoxRef.current?.querySelector('canvas');
    if (!qrCanvas) return;

    const out = document.createElement('canvas');
    out.width = 420;
    out.height = 500;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);

    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, out.width, 74);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PashuMitra AI – Animal ID', out.width / 2, 46);

    ctx.drawImage(qrCanvas, 85, 100, 250, 250);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText(`${animal.name} (${animal.animalId})`, out.width / 2, 392);
    ctx.fillStyle = '#475569';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(`${animal.breed} ${animal.species} • ${animal.farmName}`, out.width / 2, 424);
    ctx.fillStyle = '#64748b';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText('Scan in PashuMitra AI to open animal profile', out.width / 2, 462);

    const link = document.createElement('a');
    link.download = `${animal.animalId}-${animal.name}-QR.png`;
    link.href = out.toDataURL('image/png');
    link.click();
  };

  const remove = async () => {
    setBusy(true);
    const ok = await deleteAnimal(id);
    setBusy(false);
    if (ok) navigate('/animals');
  };

  const iconStyle = {
    observation: { Icon: HeartPulse, cls: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
    vaccination: { Icon: Syringe, cls: 'bg-violet-100 text-violet-700 ring-violet-200' },
    treatment: { Icon: Pill, cls: 'bg-sky-100 text-sky-700 ring-sky-200' },
    ai: { Icon: Bot, cls: 'bg-amber-100 text-amber-700 ring-amber-200' },
  };

  return (
    <>
      <Link to="/animals" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
        <ArrowLeft size={16} /> {t('animals.backToAnimals')}
      </Link>

      <div className="card overflow-hidden animate-fadeUp">
        <div className="bg-gradient-to-r from-brand-700 to-brand-500 px-6 py-6 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl">{speciesEmoji[animal.species]}</div>
              <div>
                <h1 className="text-2xl font-extrabold">{animal.name}{animal.isSample && <SampleTag />}</h1>
                <p className="text-brand-100">{animal.animalId} · {trBreed(animal.breed, t)} · {t(`enums.species.${animal.species}`)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn bg-white text-brand-800 hover:bg-brand-50 shadow-sm" onClick={() => setQrOpen(true)}>
                <QrCode size={16} /> {t('animals.viewQrCode')}
              </button>
              <Link to={`/digital-twin?animal=${id}`} className="btn bg-white/15 text-white hover:bg-white/25">
                {t('nav.digitalTwin')}
              </Link>
              <Link to={`/assistant?animal=${id}`} className="btn bg-white/15 text-white hover:bg-white/25"><Bot size={16} /> {t('animals.aiCheck')}</Link>
              <button className="btn bg-white/15 text-white hover:bg-white/25" onClick={() => setEditing(true)}><Pencil size={16} /> {t('common.edit')}</button>
              <button className="btn bg-white/15 text-white hover:bg-red-500" onClick={() => setDeleting(true)}><Trash2 size={16} /> {t('common.delete')}</button>
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Info icon={HeartPulse} label={t('animals.healthStatus')} value={<Badge>{animal.healthStatus}</Badge>} />
          <Info icon={Calendar} label={t('animals.ageGender')} value={`${animal.age} ${t('common.yrs')} · ${t(`enums.gender.${animal.gender}`)}`} />
          <Info icon={Weight} label={t('animals.weightLabel')} value={`${animal.weight} ${t('common.kg')}`} />
          <Info icon={Building2} label={t('animals.farm')} value={trFarm(animal.farmName, t)} />
        </div>

        {/* Profile Tabs */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3">
          <button
            onClick={() => setTab('overview')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === 'overview' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
            }`}
          >
            <Stethoscope size={16} /> {t('animals.overviewTab')}
          </button>
          <button
            onClick={() => setTab('passport')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === 'passport' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
            }`}
          >
            <ShieldCheck size={16} /> {t('animals.passportTab')}
            <span className={`rounded-full px-2 py-0.5 text-xs ${tab === 'passport' ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'}`}>
              {timelineEvents.length}
            </span>
          </button>
        </div>
      </div>

      {tab === 'overview' ? (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="card p-6 lg:col-span-2 animate-fadeUp">
              <h2 className="mb-1 font-bold text-slate-900">{t('animals.tempTrend')}</h2>
              <p className="mb-4 text-xs text-slate-500">{t('animals.tempTrendSub')}</p>
              {chart.length < 2 ? <EmptyState title={t('animals.notEnoughData')} text={t('animals.notEnoughDataText')} /> : (
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="temp" name={`${t('health.tempShort')} °C`} stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card p-6 animate-fadeUp">
              <h2 className="mb-3 font-bold text-slate-900">{t('animals.latestAssessment')}</h2>
              {latest ? (
                <>
                  <div className="flex items-center gap-2"><Badge>{latest.assessment?.level}</Badge><span className="text-xs text-slate-500">{fmtDate(latest.observationDate)}</span></div>
                  <p className="mt-3 flex items-center gap-2 text-sm">
                    <Thermometer size={16} className="text-slate-400" /> {latest.temperature}°C · {t('health.appetite')}: {t(`enums.appetite.${latest.appetite}`)}
                  </p>
                  {latest.assessment?.reasons?.length > 0
                    ? <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">{latest.assessment.reasons.map((r) => <li key={r}>{trHealthReason(r, t)}</li>)}</ul>
                    : <p className="mt-3 text-sm text-slate-500">{t('animals.noConcernsFlagged')}</p>}
                  <p className="mt-4 text-xs text-slate-400">{t('animals.ruleFlagNote')}</p>
                </>
              ) : <p className="text-sm text-slate-500">{t('animals.noHealthChecksYet')}</p>}
            </div>
          </div>

          <div className="card mt-6 animate-fadeUp">
            <div className="flex items-center justify-between p-6 pb-3">
              <h2 className="font-bold text-slate-900">{t('animals.healthObservations')}</h2>
              <button className="btn-primary !py-2" onClick={() => setRecording(true)}><HeartPulse size={16} /> {t('health.recordHealth')}</button>
            </div>
            {history.length === 0 ? <EmptyState title={t('animals.noHealthRecords')} text={t('animals.recordFirstCheck')} /> : (
              <>
                {/* Mobile Cards (< md) */}
                <div className="grid gap-3 p-4 pt-1 md:hidden">
                  {history.map((r) => (
                    <div key={r._id} className="rounded-xl border border-slate-200/80 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-500">{fmtDate(r.observationDate)}</span>
                        <Badge>{r.assessment?.level}</Badge>
                      </div>
                      <div className="mt-2.5 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2 text-xs">
                        <div>
                          <span className="text-slate-400">{t('health.tempShort')}</span>
                          <p className="font-bold text-slate-900">{r.temperature}°C</p>
                        </div>
                        <div>
                          <span className="text-slate-400">{t('health.appetite')}</span>
                          <p className="font-semibold text-slate-800">{t(`enums.appetite.${r.appetite}`)}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">{t('health.activityLevel')}</span>
                          <p className="font-semibold text-slate-800">{t(`enums.activity.${r.activity}`)}</p>
                        </div>
                      </div>
                      {r.symptoms?.length > 0 && (
                        <p className="mt-2 text-xs text-slate-600">
                          <span className="font-semibold text-slate-500">{t('health.symptoms')}: </span>
                          {translateSymptoms(r.symptoms)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table (md+) */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[640px]">
                    <thead className="border-y border-slate-100 bg-slate-50/70">
                      <tr>
                        <th className="th">{t('common.date')}</th>
                        <th className="th">{t('health.tempShort')}</th>
                        <th className="th">{t('health.appetite')}</th>
                        <th className="th">{t('health.activityLevel')}</th>
                        <th className="th">{t('health.symptoms')}</th>
                        <th className="th">{t('health.result')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.map((r) => (
                        <tr key={r._id}>
                          <td className="td">{fmtDate(r.observationDate)}</td>
                          <td className="td">{r.temperature}°C</td>
                          <td className="td">{t(`enums.appetite.${r.appetite}`)}</td>
                          <td className="td">{t(`enums.activity.${r.activity}`)}</td>
                          <td className="td text-slate-500">{r.symptoms?.length ? translateSymptoms(r.symptoms) : '—'}</td>
                          <td className="td"><Badge>{r.assessment?.level}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="card mt-6 p-6 animate-fadeUp">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold text-slate-900"><Syringe size={18} className="text-violet-500" /> {t('nav.vaccinations')}</h2>
              <button className="btn-ghost !py-1.5 text-xs" onClick={() => setVaccinating(true)}><Plus size={14} /> {t('animals.addVaccine')}</button>
            </div>
            {vaccs.length === 0 ? <p className="text-sm text-slate-500">{t('animals.noVaccForAnimal')}</p> : (
              <div className="grid gap-3 sm:grid-cols-2">
                {vaccs.map((v) => (
                  <div key={v._id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                    <div>
                      <p className="font-semibold text-slate-800">{trVaccine(v.vaccineName, t)}</p>
                      <p className="text-xs text-slate-500">{t('animals.nextDue')}: {fmtDate(v.nextDueDate)} ({relativeDay(v.nextDueDate, t)})</p>
                    </div>
                    <Badge>{v.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ---------------- DIGITAL ANIMAL HEALTH PASSPORT TAB ---------------- */
        <div className="card mt-6 p-6 animate-fadeUp">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-brand-600" size={22} />
                <h2 className="text-lg font-extrabold text-slate-900">{t('animals.passportTitle')}</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {t('animals.passportSub', { name: animal.name, id: animal.animalId })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-ghost !py-2 text-xs" onClick={() => setRecording(true)}><HeartPulse size={15} /> {t('animals.addObservationBtn')}</button>
              <button className="btn-ghost !py-2 text-xs" onClick={() => setVaccinating(true)}><Syringe size={15} /> {t('animals.addVaccinationBtn')}</button>
              <button className="btn-primary !py-2 text-xs" onClick={() => setTreating(true)}><Pill size={15} /> {t('animals.addTreatmentBtn')}</button>
            </div>
          </div>

          {/* Filter pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {TIMELINE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setTimelineFilter(f.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  timelineFilter === f.key ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {visibleTimeline.length === 0 ? (
            <EmptyState title={t('animals.noTimelineTitle')} text={t('animals.noTimelineText')} />
          ) : (
            <ol className="relative mt-6 ml-3 space-y-6 border-l-2 border-brand-200 pl-6">
              {visibleTimeline.map((item) => {
                const { Icon, cls } = iconStyle[item.type] || iconStyle.observation;
                return (
                  <li key={item.id} className="relative">
                    <span className={`absolute -left-[37px] top-1 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${cls}`}>
                      <Icon size={15} />
                    </span>
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-brand-200">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-brand-700">{item.typeLabel}</span>
                          {item.isSample && <SampleTag />}
                          <Badge>{item.badge}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock size={13} /> {fmtDate(item.date)}
                          {item.type === 'treatment' && item.rawId && (
                            <button
                              onClick={() => deleteTreatment(item.rawId)}
                              className="ml-1 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title={t('common.delete')}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-1.5 font-bold text-slate-900">{item.title}</p>
                      {item.details.length > 0 && (
                        <ul className="mt-2 space-y-1 text-sm text-slate-600">
                          {item.details.map((d, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      {/* QR Code Modal */}
      <Modal open={qrOpen} title={t('animals.qrModalTitle', { name: animal.name })} onClose={() => setQrOpen(false)}>
        <div className="flex flex-col items-center text-center">
          <div ref={qrBoxRef} className="rounded-2xl border-2 border-brand-200 bg-white p-5 shadow-inner">
            <QRCodeCanvas value={qrPayload} size={220} level="M" includeMargin />
          </div>
          <p className="mt-4 text-lg font-extrabold text-slate-900">{animal.name} <span className="text-brand-700">({animal.animalId})</span></p>
          <p className="text-sm text-slate-500">{trBreed(animal.breed, t)} · {t(`enums.species.${animal.species}`)} · {trFarm(animal.farmName, t)}</p>
          <p className="mt-2 max-w-xs text-xs text-slate-400">
            {t('animals.qrModalSub', { name: animal.name })}
          </p>
          <div className="mt-5 flex w-full justify-center gap-2">
            <button className="btn-ghost" onClick={() => setQrOpen(false)}>{t('common.close')}</button>
            <button className="btn-primary" onClick={downloadQr}><Download size={16} /> {t('animals.downloadQrCard')}</button>
          </div>
        </div>
      </Modal>

      <AnimalForm open={editing} initial={animal} onClose={() => setEditing(false)} />
      <HealthForm open={recording} animalId={id} onClose={() => setRecording(false)} />
      <VaccinationForm open={vaccinating} initial={{ animal: id, vaccineName: '', vaccinationDate: new Date().toISOString().slice(0, 10), nextDueDate: '', status: 'Completed' }} onClose={() => setVaccinating(false)} />
      <TreatmentForm open={treating} animalId={id} onClose={() => setTreating(false)} />
      <ConfirmDialog
        open={deleting}
        busy={busy}
        title={t('animals.deleteConfirmTitle')}
        onCancel={() => setDeleting(false)}
        onConfirm={remove}
        message={t('animals.deleteConfirmMsg', { name: animal.name })}
      />
    </>
  );
}
