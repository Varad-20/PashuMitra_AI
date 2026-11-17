import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Modal, Field, Badge } from './ui.jsx';
import { useApp } from '../context/AppContext.jsx';
import { SPECIES, HEALTH_STATUSES, VACCINE_STATUSES, COMMON_SYMPTOMS, toInputDate, today, nextAnimalId, suggestVaccineStatus } from '../lib/helpers.js';
import { assessRecord } from '../lib/assess.js';
import { trHealthReason } from '../lib/dynamicTranslate.js';

function FormShell({ onSubmit, saving, onClose, submitText, children }) {
  const { t } = useTranslation();
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {children}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 size={16} className="animate-spin" />} {submitText}
        </button>
      </div>
    </form>
  );
}

// ---------------- Animal form ----------------
export function AnimalForm({ open, initial, onClose }) {
  const { t } = useTranslation();
  const { animals, saveAnimal } = useApp();
  const [f, setF] = useState({});
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initial?._id);

  useEffect(() => {
    if (!open) return;
    let defaultFarm = '';
    try {
      const prefs = JSON.parse(localStorage.getItem('pashumitra_prefs') || '{}');
      defaultFarm = prefs.defaultFarmName || '';
    } catch { /* ignore */ }
    setF(
      initial?._id
        ? { ...initial, dateAdded: toInputDate(initial.dateAdded) }
        : {
            animalId: nextAnimalId('Cow', animals),
            name: '',
            species: 'Cow',
            breed: '',
            age: '',
            gender: 'Female',
            weight: '',
            farmName: defaultFarm,
            healthStatus: 'Healthy',
            dateAdded: today(),
          }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const changeSpecies = (e) => {
    const species = e.target.value;
    setF((p) => ({ ...p, species, animalId: editing ? p.animalId : nextAnimalId(species, animals) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...f, age: Number(f.age), weight: Number(f.weight) };
    delete payload._id; delete payload.__v; delete payload.createdAt; delete payload.updatedAt;
    const ok = await saveAnimal(payload, initial?._id);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal open={open} title={editing ? t('animals.editAnimal') : t('animals.addAnimal')} onClose={onClose} wide>
      <FormShell onSubmit={submit} saving={saving} onClose={onClose} submitText={editing ? t('common.saveChanges') : t('animals.addAnimal')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('animals.species')}>
            <select className="input" value={f.species || 'Cow'} onChange={changeSpecies}>
              {SPECIES.map((s) => <option key={s} value={s}>{t(`enums.species.${s}`)}</option>)}
            </select>
          </Field>
          <Field label={t('animals.animalId')}><input required className="input" value={f.animalId || ''} onChange={set('animalId')} /></Field>
          <Field label={t('animals.animalName')}><input required className="input" placeholder={t('animals.animalNamePlaceholder')} value={f.name || ''} onChange={set('name')} /></Field>
          <Field label={t('animals.breed')}><input required className="input" placeholder={t('animals.breedPlaceholder')} value={f.breed || ''} onChange={set('breed')} /></Field>
          <Field label={t('animals.age')}><input required type="number" min="0" max="40" step="0.5" className="input" value={f.age ?? ''} onChange={set('age')} /></Field>
          <Field label={t('animals.gender')}>
            <select className="input" value={f.gender || 'Female'} onChange={set('gender')}>
              <option value="Female">{t('enums.gender.Female')}</option>
              <option value="Male">{t('enums.gender.Male')}</option>
            </select>
          </Field>
          <Field label={t('animals.weight')}><input required type="number" min="1" step="0.1" className="input" value={f.weight ?? ''} onChange={set('weight')} /></Field>
          <Field label={t('animals.farmName')}><input required className="input" placeholder={t('animals.farmPlaceholder')} value={f.farmName || ''} onChange={set('farmName')} /></Field>
          <Field label={t('animals.healthStatus')}>
            <select className="input" value={f.healthStatus || 'Healthy'} onChange={set('healthStatus')}>
              {HEALTH_STATUSES.map((s) => <option key={s} value={s}>{t(`enums.healthStatus.${s}`)}</option>)}
            </select>
          </Field>
          <Field label={t('animals.dateAdded')}><input type="date" className="input" value={f.dateAdded || ''} onChange={set('dateAdded')} /></Field>
        </div>
      </FormShell>
    </Modal>
  );
}

// ---------------- Health record form ----------------
export function HealthForm({ open, initial, animalId, onClose }) {
  const { t } = useTranslation();
  const { animals, saveRecord } = useApp();
  const [f, setF] = useState({});
  const [chips, setChips] = useState([]);
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initial?._id);

  useEffect(() => {
    if (!open) return;
    if (initial?._id) {
      setF({ ...initial, observationDate: toInputDate(initial.observationDate) });
      setChips(initial.symptoms.filter((s) => COMMON_SYMPTOMS.includes(s)));
      setCustom(initial.symptoms.filter((s) => !COMMON_SYMPTOMS.includes(s)).join(', '));
    } else {
      setF({ animal: animalId || animals[0]?._id || '', temperature: '', weight: '', appetite: 'Normal', activity: 'Normal', notes: '', observationDate: today() });
      setChips([]); setCustom('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, animalId]);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const toggle = (s) => setChips((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s]));
  const symptoms = [...chips, ...custom.split(',').map((s) => s.trim()).filter(Boolean)];
  const species = animals.find((a) => a._id === f.animal)?.species;
  const preview = f.temperature ? assessRecord({ temperature: Number(f.temperature), appetite: f.appetite, activity: f.activity, symptoms }, species) : null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      animal: f.animal, temperature: Number(f.temperature), weight: f.weight ? Number(f.weight) : undefined,
      appetite: f.appetite, activity: f.activity, symptoms, notes: f.notes || '', observationDate: f.observationDate,
    };
    const ok = await saveRecord(payload, initial?._id);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal open={open} title={editing ? t('health.editHealthRecord') : t('health.recordHealthObs')} onClose={onClose} wide>
      <FormShell onSubmit={submit} saving={saving} onClose={onClose} submitText={editing ? t('common.saveChanges') : t('health.saveRecord')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('animals.animal')}>
            <select required className="input" value={f.animal || ''} onChange={set('animal')}>
              <option value="" disabled>{t('health.selectAnimal')}</option>
              {animals.map((a) => <option key={a._id} value={a._id}>{a.name} ({a.animalId})</option>)}
            </select>
          </Field>
          <Field label={t('health.observationDate')}><input required type="date" className="input" value={f.observationDate || ''} onChange={set('observationDate')} /></Field>
          <Field label={t('health.bodyTemperature')}><input required type="number" step="0.1" min="30" max="45" className="input" placeholder="e.g. 38.6" value={f.temperature ?? ''} onChange={set('temperature')} /></Field>
          <Field label={t('animals.weight')}><input type="number" step="0.1" min="1" className="input" value={f.weight ?? ''} onChange={set('weight')} /></Field>
          <Field label={t('health.appetite')}>
            <select className="input" value={f.appetite || 'Normal'} onChange={set('appetite')}>
              <option value="Normal">{t('enums.appetite.Normal')}</option>
              <option value="Low">{t('enums.appetite.Low')}</option>
              <option value="No appetite">{t('enums.appetite.No appetite')}</option>
            </select>
          </Field>
          <Field label={t('health.activityLevel')}>
            <select className="input" value={f.activity || 'Normal'} onChange={set('activity')}>
              <option value="Normal">{t('enums.activity.Normal')}</option>
              <option value="Low">{t('enums.activity.Low')}</option>
            </select>
          </Field>
        </div>
        <Field label={t('health.symptoms')}>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map((s) => (
              <button type="button" key={s} onClick={() => toggle(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${chips.includes(s) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-400'}`}>
                {t(`enums.symptoms.${s}`)}
              </button>
            ))}
          </div>
          <input className="input mt-3" placeholder={t('health.otherSymptomsPlaceholder')} value={custom} onChange={(e) => setCustom(e.target.value)} />
        </Field>
        <Field label={t('common.notes')}><textarea rows="2" className="input" value={f.notes || ''} onChange={set('notes')} /></Field>
        {preview && (
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-slate-700">{t('health.quickCheck')} <Badge>{preview.level}</Badge></div>
            {preview.reasons.length > 0 && <ul className="mt-2 list-disc space-y-0.5 pl-5 text-slate-600">{preview.reasons.map((r) => <li key={r}>{trHealthReason(r, t)}</li>)}</ul>}
            <p className="mt-2 text-xs text-slate-400">{t('health.simpleFlagNote')}</p>
          </div>
        )}
      </FormShell>
    </Modal>
  );
}

// ---------------- Vaccination form ----------------
export function VaccinationForm({ open, initial, onClose }) {
  const { t } = useTranslation();
  const { animals, saveVaccination, toast } = useApp();
  const [f, setF] = useState({});
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initial?._id);

  useEffect(() => {
    if (!open) return;
    setF(initial?._id
      ? { ...initial, vaccinationDate: toInputDate(initial.vaccinationDate), nextDueDate: toInputDate(initial.nextDueDate) }
      : { animal: initial?.animal || animals[0]?._id || '', vaccineName: '', vaccinationDate: today(), nextDueDate: '', status: 'Completed' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setDue = (e) => { const v = e.target.value; setF((p) => ({ ...p, nextDueDate: v, status: suggestVaccineStatus(v) })); };

  const submit = async (e) => {
    e.preventDefault();
    if (f.nextDueDate < f.vaccinationDate) {
      return toast(t('vaccinations.dateOrderError'), 'error');
    }
    setSaving(true);
    const payload = { animal: f.animal, vaccineName: f.vaccineName, vaccinationDate: f.vaccinationDate, nextDueDate: f.nextDueDate, status: f.status };
    const ok = await saveVaccination(payload, initial?._id);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal open={open} title={editing ? t('vaccinations.editVaccination') : t('vaccinations.addVaccination')} onClose={onClose}>
      <FormShell onSubmit={submit} saving={saving} onClose={onClose} submitText={editing ? t('common.saveChanges') : t('vaccinations.addVaccination')}>
        <Field label={t('animals.animal')}>
          <select required className="input" value={f.animal || ''} onChange={set('animal')}>
            <option value="" disabled>{t('health.selectAnimal')}</option>
            {animals.map((a) => <option key={a._id} value={a._id}>{a.name} ({a.animalId})</option>)}
          </select>
        </Field>
        <Field label={t('vaccinations.vaccineName')}><input required className="input" placeholder={t('vaccinations.vaccinePlaceholder')} value={f.vaccineName || ''} onChange={set('vaccineName')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('vaccinations.vaccinationDate')}><input required type="date" className="input" value={f.vaccinationDate || ''} onChange={set('vaccinationDate')} /></Field>
          <Field label={t('vaccinations.nextDueDate')}><input required type="date" className="input" value={f.nextDueDate || ''} onChange={setDue} /></Field>
        </div>
        <Field label={t('common.status')}>
          <select className="input" value={f.status || 'Completed'} onChange={set('status')}>
            {VACCINE_STATUSES.map((s) => <option key={s} value={s}>{t(`enums.vaccineStatus.${s}`)}</option>)}
          </select>
        </Field>
        <p className="text-xs text-slate-400">{t('vaccinations.statusHint')}</p>
      </FormShell>
    </Modal>
  );
}

// ---------------- Treatment form ----------------
export function TreatmentForm({ open, initial, animalId, onClose }) {
  const { t } = useTranslation();
  const { animals, saveTreatment } = useApp();
  const [f, setF] = useState({});
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initial?._id);

  useEffect(() => {
    if (!open) return;
    setF(
      initial?._id
        ? { ...initial, date: toInputDate(initial.date) }
        : { animal: animalId || animals[0]?._id || '', treatment: '', details: '', vetName: '', date: today() }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, animalId]);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      animal: f.animal,
      treatment: f.treatment,
      details: f.details || '',
      vetName: f.vetName || '',
      date: f.date,
    };
    const ok = await saveTreatment(payload, initial?._id);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal open={open} title={editing ? t('animals.editTreatmentTitle') : t('animals.recordTreatmentTitle')} onClose={onClose}>
      <FormShell onSubmit={submit} saving={saving} onClose={onClose} submitText={editing ? t('common.saveChanges') : t('animals.saveTreatment')}>
        <Field label={t('animals.animal')}>
          <select required className="input" value={f.animal || ''} onChange={set('animal')}>
            <option value="" disabled>{t('health.selectAnimal')}</option>
            {animals.map((a) => <option key={a._id} value={a._id}>{a.name} ({a.animalId})</option>)}
          </select>
        </Field>
        <Field label={t('animals.treatmentName')}>
          <input required className="input" placeholder={t('animals.treatmentPlaceholder')} value={f.treatment || ''} onChange={set('treatment')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('animals.treatmentDate')}>
            <input required type="date" className="input" value={f.date || ''} onChange={set('date')} />
          </Field>
          <Field label={t('animals.vetName')}>
            <input className="input" placeholder={t('animals.vetPlaceholder')} value={f.vetName || ''} onChange={set('vetName')} />
          </Field>
        </div>
        <Field label={t('animals.treatmentNotes')}>
          <textarea rows="2" className="input" placeholder={t('animals.treatmentNotesPlaceholder')} value={f.details || ''} onChange={set('details')} />
        </Field>
      </FormShell>
    </Modal>
  );
}
