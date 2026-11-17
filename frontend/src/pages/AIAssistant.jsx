import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bot, Sparkles, Loader2, ShieldAlert, Stethoscope, ListChecks, ClipboardList,
  Phone, Mic, MicOff, Info, Send, MessageSquare, CheckCircle2, Globe, Activity,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { PageHeader, Field, Badge, EmptyState } from '../components/ui.jsx';
import { runAiAssessment, errMessage } from '../services/api.js';
import { COMMON_SYMPTOMS, fmtDate, speciesEmoji } from '../lib/helpers.js';
import { computeAnimalBaseline } from '../lib/intelligence.js';
import { trBreed, trAiSource } from '../lib/dynamicTranslate.js';
import { changeAppLanguage } from '../i18n/i18n.js';

const SPEECH_CODES = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
];

export default function AIAssistant() {
  const { t, i18n } = useTranslation();
  const { animals, records, vaccinations, milkRecords, alerts, chatHistory, sendChat, toast, refreshAll } = useApp();
  const [params] = useSearchParams();

  const [modeTab, setModeTab] = useState('chat'); // 'chat' | 'form'
  const [animalId, setAnimalId] = useState(params.get('animal') || animals[1]?._id || animals[0]?._id || '');

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // Structured Form state
  const [chips, setChips] = useState([]);
  const [custom, setCustom] = useState('');
  const [temperature, setTemperature] = useState('');
  const [appetite, setAppetite] = useState('Normal');
  const [description, setDescription] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);
  const [formResult, setFormResult] = useState(null);

  // Speech recognition state
  const [listening, setListening] = useState(false);
  const [speechNote, setSpeechNote] = useState('');
  const recognitionRef = useRef(null);
  const chatBottomRef = useRef(null);

  const language = ['en', 'hi', 'mr'].includes(i18n.language) ? i18n.language : 'en';
  const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const speechSupported = Boolean(SpeechRecognition);

  const animal = animals.find((a) => a._id === animalId) || animals[0];

  useEffect(() => {
    if (animal && animal._id !== animalId) {
      setAnimalId(animal._id);
    }
  }, [animal, animalId]);

  // Live Context for the selected animal
  const animalRecords = useMemo(
    () =>
      records
        .filter((r) => r.animal === animal?._id)
        .sort((a, b) => new Date(b.observationDate) - new Date(a.observationDate)),
    [records, animal]
  );
  const animalAlerts = useMemo(
    () => alerts.filter((al) => al.animal === animal?._id && al.status === 'Active'),
    [alerts, animal]
  );
  const animalVaccs = useMemo(
    () => vaccinations.filter((v) => v.animal === animal?._id && v.status !== 'Completed'),
    [vaccinations, animal]
  );
  const animalMilk = useMemo(
    () => milkRecords.filter((m) => m.animal === animal?._id),
    [milkRecords, animal]
  );
  const baseline = useMemo(
    () => (animal ? computeAnimalBaseline(animal, animalRecords, animalMilk) : null),
    [animal, animalRecords, animalMilk]
  );

  const animalChats = useMemo(
    () => chatHistory.filter((c) => c.animal === animal?._id),
    [chatHistory, animal]
  );

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setListening(false);
  };

  const toggleVoiceInput = (target = 'chat') => {
    setSpeechNote('');
    if (!speechSupported) {
      setSpeechNote(t('ai.noSpeech'));
      return;
    }
    if (listening) {
      stopListening();
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.lang = SPEECH_CODES[language] || 'en-IN';
      rec.interimResults = false;
      rec.continuous = false;

      rec.onstart = () => setListening(true);
      rec.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0]?.transcript || '')
          .join(' ')
          .trim();
        if (transcript) {
          if (target === 'chat') {
            setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          } else {
            setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        }
      };
      rec.onerror = (event) => {
        setListening(false);
        if (event.error === 'not-allowed') {
          setSpeechNote(t('ai.micDenied'));
        } else {
          setSpeechNote(t('ai.noSpeech'));
        }
      };
      rec.onend = () => setListening(false);

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setListening(false);
      setSpeechNote(t('ai.noSpeech'));
    }
  };

  useEffect(() => () => stopListening(), []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [animalChats.length, sendingChat]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    stopListening();
    if (!animal) return toast(t('toasts.selectAnimalErr'), 'error');
    if (!chatInput.trim()) return toast(t('toasts.enterSymptomsErr'), 'error');
    const msg = chatInput.trim();
    setChatInput('');
    setSendingChat(true);
    try {
      await sendChat({
        animalId: animal._id,
        message: msg,
        language,
        contextSnapshot: {
          animal,
          recentRecords: animalRecords,
          activeAlerts: animalAlerts,
          vaccinations: animalVaccs,
          milk: animalMilk,
        },
      });
    } catch (err) {
      setChatInput(msg);
      toast(errMessage(err), 'error');
    } finally {
      setSendingChat(false);
    }
  };

  const applySamplePrompt = (langCode, text) => {
    stopListening();
    if (langCode !== language) changeAppLanguage(langCode);
    setChatInput(text);
  };

  const toggleChip = (s) => setChips((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s]));

  const submitForm = async (e) => {
    e.preventDefault();
    stopListening();
    if (!animal) return toast(t('toasts.selectAnimalErr'), 'error');
    const symptoms = [...chips, ...custom.split(',').map((s) => s.trim()).filter(Boolean)];
    if (!symptoms.length && !description.trim() && !temperature) {
      return toast(t('toasts.enterSymptomsErr'), 'error');
    }
    setLoadingForm(true);
    setFormResult(null);
    try {
      const res = await runAiAssessment({
        animal: animal._id,
        species: animal.species,
        animalName: animal.name,
        symptoms,
        temperature,
        appetite,
        description,
        language,
      });
      setFormResult(res);
      await refreshAll();
    } catch (err) {
      toast(errMessage(err), 'error');
    } finally {
      setLoadingForm(false);
    }
  };

  const riskStyle = { Low: 'from-emerald-500 to-emerald-600', Medium: 'from-amber-400 to-amber-500', High: 'from-red-500 to-red-600' };
  const latestRec = animalRecords[0];

  return (
    <>
      <PageHeader title={t('ai.title')} subtitle={t('ai.subtitle')}>
        {/* Mode Switcher */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setModeTab('chat')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              modeTab === 'chat' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare size={14} /> {t('voiceChat.modeChat')}
          </button>
          <button
            type="button"
            onClick={() => setModeTab('form')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              modeTab === 'form' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ClipboardList size={14} /> {t('voiceChat.modeForm')}
          </button>
        </div>
      </PageHeader>

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <ShieldAlert className="mt-0.5 shrink-0" size={20} />
        <p>{t('ai.disclaimer')}</p>
      </div>

      {modeTab === 'chat' ? (
        /* ================ MULTILINGUAL AI VOICE FARMER CHAT INTERFACE ================ */
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Panel: Animal Selector + Live Context Card */}
          <div className="space-y-4 lg:col-span-4">
            <div className="card p-5 animate-fadeUp">
              <div className="grid gap-3">
                <Field label={t('ai.selectAnimal')}>
                  <select className="input font-semibold" value={animal?._id || ''} onChange={(e) => setAnimalId(e.target.value)}>
                    {animals.map((a) => (
                      <option key={a._id} value={a._id}>
                        {speciesEmoji[a.species]} {a.name} ({a.animalId}) – {t(`enums.species.${a.species}`)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label={t('app.language')}>
                  <div className="grid grid-cols-3 gap-1.5">
                    {LANG_OPTIONS.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => { stopListening(); changeAppLanguage(l.code); }}
                        className={`rounded-xl border py-2 text-xs font-bold transition ${
                          language === l.code
                            ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-brand-400'
                        }`}
                      >
                        {l.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              {/* Context Summary Box */}
              {animal && (
                <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-brand-800">
                      <Activity size={14} /> {t('voiceChat.contextCardTitle')}
                    </p>
                    <Link to={`/digital-twin?animal=${animal._id}`} className="text-[11px] font-bold text-brand-700 hover:underline">
                      {t('earlyWarning.openDigitalTwin')} →
                    </Link>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{t('voiceChat.contextCardSub')}</p>

                  <dl className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-brand-100/80 pb-1.5">
                      <dt className="text-slate-500">{t('voiceChat.ctxSpeciesAge')}:</dt>
                      <dd className="font-bold text-slate-800">
                        {trBreed(animal.breed, t)} · {t(`enums.species.${animal.species}`)}, {animal.age} {t('common.yrs')}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-brand-100/80 pb-1.5">
                      <dt className="text-slate-500">{t('voiceChat.ctxLatestTemp')}:</dt>
                      <dd className="font-bold text-slate-800">
                        {latestRec ? `${latestRec.temperature}°C` : '—'}{' '}
                        {baseline?.avgTemp ? `(${baseline.avgTemp}°C)` : ''}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-brand-100/80 pb-1.5">
                      <dt className="text-slate-500">{t('voiceChat.ctxAppetite')}:</dt>
                      <dd className="font-bold text-slate-800">
                        {latestRec ? t(`enums.appetite.${latestRec.appetite}`) : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-brand-100/80 pb-1.5">
                      <dt className="text-slate-500">{t('voiceChat.ctxActiveAlerts')}:</dt>
                      <dd className="font-bold text-amber-700">{animalAlerts.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">{t('voiceChat.ctxVaccinations')}:</dt>
                      <dd className="font-bold text-violet-700">{animalVaccs.length}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {/* One-Click Sample Farmer Voice Questions (Marathi / Hindi / English) */}
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold text-slate-500">{t('voiceChat.samplePromptsTitle')}</p>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => applySamplePrompt('mr', 'माझ्या गायीला ताप आला आहे आणि ती चारा खात नाही.')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-left text-xs text-slate-700 transition hover:border-brand-400 hover:bg-brand-50"
                  >
                    <span className="font-bold text-brand-700">[मराठी]</span> &ldquo;माझ्या गायीला ताप आला आहे आणि ती चारा खात नाही.&rdquo;
                  </button>
                  <button
                    type="button"
                    onClick={() => applySamplePrompt('hi', 'मेरी गाय खाना नहीं खा रही है और उसे बुखार है।')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-left text-xs text-slate-700 transition hover:border-brand-400 hover:bg-brand-50"
                  >
                    <span className="font-bold text-brand-700">[हिन्दी]</span> &ldquo;मेरी गाय खाना नहीं खा रही है और उसे बुखार है।&rdquo;
                  </button>
                  <button
                    type="button"
                    onClick={() => applySamplePrompt('en', 'My cow has a fever and is not eating properly.')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-left text-xs text-slate-700 transition hover:border-brand-400 hover:bg-brand-50"
                  >
                    <span className="font-bold text-brand-700">[English]</span> &ldquo;My cow has a fever and is not eating properly.&rdquo;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Chat Stream + Voice/Text Input Box */}
          <div className="card flex flex-col overflow-hidden lg:col-span-8 animate-fadeUp" style={{ minHeight: '560px' }}>
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <Bot size={19} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{t('voiceChat.chatHistoryTitle')}</h2>
                  <p className="text-xs text-slate-500">
                    {animal ? `${animal.name} (${animal.animalId})` : ''}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                <Globe size={13} /> {LANG_OPTIONS.find((l) => l.code === language)?.label}
              </span>
            </div>

            {/* Messages Container */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6" style={{ maxHeight: '440px' }}>
              {animalChats.length === 0 && !sendingChat ? (
                <EmptyState
                  title={t('voiceChat.emptyChatTitle', { name: animal?.name || '' })}
                  text={t('voiceChat.emptyChatSub')}
                />
              ) : (
                animalChats.map((msg) => (
                  <div key={msg._id} className="space-y-3">
                    {/* Farmer Bubble */}
                    <div className="flex justify-end">
                      <div className="max-w-xl rounded-2xl rounded-tr-sm bg-brand-600 px-4 py-3 text-sm text-white shadow-sm">
                        <p className="font-medium">{msg.userMessage}</p>
                        <p className="mt-1 text-right text-[10px] text-brand-100">{fmtDate(msg.createdAt)}</p>
                      </div>
                    </div>

                    {/* Assistant Context-Aware Bubble */}
                    <div className="flex justify-start">
                      <div className="w-full max-w-2xl rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <span className="flex items-center gap-1.5 text-xs font-extrabold text-brand-700">
                            <Bot size={15} /> {t('app.name')} {t('app.ai')} · {trAiSource(msg.source, t)}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge>{msg.riskLevel}</Badge>
                            {msg.vetRecommended && (
                              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                                {t('ai.consultVet')} {t('common.yes')}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-800">
                          {msg.assistantReply.replace(/\*\*/g, '')}
                        </p>

                        {/* Supporting Animal Records Box */}
                        {msg.supportingRecords?.length > 0 && (
                          <div className="mt-3 rounded-xl bg-slate-50 p-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              {t('voiceChat.supportingRecordsTitle')}
                            </p>
                            <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                              {msg.supportingRecords.map((sr, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-brand-600" />
                                  <span>{sr}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommended Next Steps */}
                        {msg.recommendedSteps?.length > 0 && (
                          <div className="mt-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              {t('ai.recommendations')}
                            </p>
                            <ol className="mt-1.5 space-y-1.5">
                              {msg.recommendedSteps.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                                    {idx + 1}
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {sendingChat && (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <Loader2 size={20} className="animate-spin text-brand-600" />
                  <span>{t('ai.analysing')}</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Speech Status / Fallback Notice */}
            <div className="border-t border-slate-100 bg-slate-50/70 p-4">
              {listening && (
                <div className="mb-2.5 flex items-center justify-between rounded-xl bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700">
                  <span>🎙️ {t('ai.listening')}</span>
                  <button type="button" onClick={stopListening} className="underline">
                    {t('ai.stopBtn')}
                  </button>
                </div>
              )}
              {(!speechSupported || speechNote) && (
                <div className="mb-2.5 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-2.5 text-xs text-sky-900">
                  <Info size={15} className="mt-0.5 shrink-0 text-sky-600" />
                  <span>{speechNote || t('ai.noSpeech')}</span>
                </div>
              )}

              <form onSubmit={handleSendChat} className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
                <button
                  type="button"
                  onClick={() => toggleVoiceInput('chat')}
                  className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                    listening
                      ? 'animate-pulse bg-red-600 text-white shadow'
                      : 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100'
                  }`}
                >
                  {listening ? <MicOff size={16} /> : <Mic size={16} />}
                  {listening ? t('ai.stopBtn') : t('ai.speakBtn')}
                </button>

                <textarea
                  rows="2"
                  className="input flex-1"
                  placeholder={t('voiceChat.inputPlaceholder')}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />

                <button type="submit" className="btn-primary shrink-0" disabled={sendingChat}>
                  {sendingChat ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {t('voiceChat.sendBtn')}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* ================ STRUCTURED SYMPTOM CHECKLIST FORM ================ */
        <div className="grid gap-6 lg:grid-cols-5">
          <form onSubmit={submitForm} className="card space-y-4 p-6 lg:col-span-2 animate-fadeUp">
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <Stethoscope size={18} className="text-brand-600" /> {t('ai.animalDetails')}
            </h2>
            <Field label={t('ai.selectAnimal')}>
              <select className="input" value={animal?._id || ''} onChange={(e) => setAnimalId(e.target.value)} required>
                {animals.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} – {t(`enums.species.${a.species}`)} ({a.animalId})
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('ai.symptoms')}>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleChip(s)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      chips.includes(s)
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-400'
                    }`}
                  >
                    {t(`enums.symptoms.${s}`)}
                  </button>
                ))}
              </div>
              <input className="input mt-3" placeholder={t('ai.otherSymptoms')} value={custom} onChange={(e) => setCustom(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('ai.temperature')}>
                <input type="number" step="0.1" min="30" max="45" className="input" placeholder="e.g. 40.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
              </Field>
              <Field label={t('ai.appetite')}>
                <select className="input" value={appetite} onChange={(e) => setAppetite(e.target.value)}>
                  <option value="Normal">{t('enums.appetite.Normal')}</option>
                  <option value="Low">{t('enums.appetite.Low')}</option>
                  <option value="No appetite">{t('enums.appetite.No appetite')}</option>
                </select>
              </Field>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label !mb-0">{t('ai.describeSymptoms')}</label>
                <button
                  type="button"
                  onClick={() => toggleVoiceInput('form')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    listening
                      ? 'animate-pulse bg-red-600 text-white shadow-sm'
                      : 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100'
                  }`}
                >
                  {listening ? <MicOff size={14} /> : <Mic size={14} />}
                  {listening ? t('ai.stopBtn') : t('ai.speakBtn')}
                </button>
              </div>
              <textarea
                rows="4"
                className="input"
                placeholder={t('ai.placeholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loadingForm}>
              {loadingForm ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}{' '}
              {loadingForm ? t('ai.analysing') : t('ai.checkAnimalHealth')}
            </button>
          </form>

          <div className="lg:col-span-3">
            {loadingForm && (
              <div className="card flex flex-col items-center justify-center gap-3 p-16 text-slate-500">
                <Loader2 className="animate-spin text-brand-600" size={36} />
                <p className="text-sm">{t('ai.analysing')}</p>
              </div>
            )}
            {!loadingForm && !formResult && (
              <div className="card"><EmptyState title={t('ai.emptyTitle')} text={t('ai.emptyText')} /></div>
            )}
            {formResult && !loadingForm && (
              <div className="card overflow-hidden animate-pop">
                <div className={`bg-gradient-to-r ${riskStyle[formResult.riskLevel]} px-6 py-5 text-white`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider opacity-90">{t('ai.riskAssessment')}</p>
                      <p className="text-3xl font-extrabold">
                        {t(`enums.riskLevel.${formResult.riskLevel}`, { defaultValue: formResult.riskLevel })}
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold">
                      <Bot size={14} /> {trAiSource(formResult.source, t)}
                    </span>
                  </div>
                </div>
                <div className="space-y-5 p-6">
                  {formResult.urgent && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm font-semibold text-red-700">
                      <Phone size={18} /> {t('ai.urgentBanner')}
                    </div>
                  )}
                  <div>
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('ai.possibleConcern')}</h3>
                    <p className="text-lg font-bold text-slate-900">{formResult.possibleConcern}</p>
                  </div>
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <ClipboardList size={14} /> {t('ai.reasons')}
                    </h3>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {formResult.reasons.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <ListChecks size={14} /> {t('ai.recommendations')}
                    </h3>
                    <ol className="space-y-2">
                      {formResult.nextSteps.map((s, i) => (
                        <li key={s} className="flex gap-3 text-sm text-slate-700">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                            {i + 1}
                          </span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <span className="text-sm font-semibold text-slate-700">{t('ai.consultVet')}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${formResult.vetRecommended ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {formResult.vetRecommended ? t('common.yes') : t('common.notUrgent')}
                    </span>
                  </div>
                  <p className="border-t border-slate-100 pt-4 text-xs text-slate-400">
                    {formResult.disclaimer || t('ai.disclaimer')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
