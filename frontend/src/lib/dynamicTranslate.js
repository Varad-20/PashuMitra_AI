// Centralized dynamic content & system message translator.
// Translates dynamically generated sentences (health assessment reasons, early warning changes,
// alert reasons, recommended actions, breeds, farms, vaccines, treatments, notes, and dates)
// into the active i18next language (en, hi, mr) while preserving user-entered text.

import i18n from '../i18n/i18n.js';

export function getLocaleCode(lang) {
  const l = lang || i18n.language || 'en';
  if (l === 'hi') return 'hi-IN';
  if (l === 'mr') return 'mr-IN';
  return 'en-IN';
}

export function trBreed(breed, t) {
  if (!breed || !t) return breed || '';
  return t(`dynamic.breeds.${breed}`, { defaultValue: breed });
}

export function trFarm(farm, t) {
  if (!farm || !t) return farm || '';
  return t(`dynamic.farms.${farm}`, { defaultValue: farm });
}

export function trVaccine(vaccine, t) {
  if (!vaccine || !t) return vaccine || '';
  return t(`dynamic.vaccines.${vaccine}`, { defaultValue: vaccine });
}

export function trTreatment(name, t) {
  if (!name || !t) return name || '';
  return t(`dynamic.treatments.${name}`, { defaultValue: name });
}

export function trTreatmentDetails(details, t) {
  if (!details || !t) return details || '';
  return t(`dynamic.treatmentDetails.${details}`, { defaultValue: details });
}

export function trNote(note, t) {
  if (!note || !t) return note || '';
  return t(`dynamic.notes.${note}`, { defaultValue: note });
}

export function trAiSource(source, t) {
  if (!source || !t) return source || '';
  return t(`dynamic.aiSources.${source}`, { defaultValue: source });
}

export function trSymptomsList(symptoms, t) {
  if (!Array.isArray(symptoms) || !symptoms.length) return '';
  if (!t) return symptoms.join(', ');
  return symptoms.map((s) => t(`enums.symptoms.${s}`, { defaultValue: s })).join(', ');
}

export function trWeightValue(val, t) {
  if (!val || !t) return val || '—';
  const s = String(val);
  if (s === 'Baseline pending') return t('dynamic.alerts.baselinePending');
  return s.replace(/\bkg\b/i, t('common.kg'));
}

/**
 * Translates a single health record assessment reason string:
 * e.g. "Body temperature 39.8°C is above the usual range (over 39.5°C)"
 */
export function trHealthReason(reason, t) {
  if (!reason || !t) return reason || '';
  const s = String(reason).trim();

  const tempMatch = s.match(/^Body temperature ([\d.]+)°C is above the usual range \(over ([\d.]+)°C\)$/i);
  if (tempMatch) {
    return t('dynamic.reasons.tempAboveRange', { temp: tempMatch[1], limit: tempMatch[2] });
  }
  if (s === 'Appetite is lower than normal') return t('dynamic.reasons.appetiteLow');
  if (s === 'Animal is not eating') return t('dynamic.reasons.noAppetite');
  if (s === 'Activity level is low') return t('dynamic.reasons.activityLow');

  const symMatch = s.match(/^Symptoms noted:\s*(.+)$/i);
  if (symMatch) {
    const rawSyms = symMatch[1].split(',').map((x) => x.trim()).filter(Boolean);
    return t('dynamic.reasons.symptomsNoted', { symptoms: trSymptomsList(rawSyms, t) });
  }
  return s;
}

/**
 * Translates a single part of `detectedChange` (split by ' · ')
 */
function translateChangeSegment(seg, t) {
  const s = seg.trim();

  let m = s.match(/^High fever \(([\d.]+)°C vs ([\d.]+)°C baseline\)$/i);
  if (m) return t('dynamic.alerts.highFeverVsBaseline', { temp: m[1], baseline: m[2] });

  m = s.match(/^High fever \(([\d.]+)°C\)$/i);
  if (m) return t('dynamic.alerts.highFeverChange', { temp: m[1] });

  m = s.match(/^Elevated temperature \(([\d.]+)°C vs ([\d.]+)°C baseline\)$/i);
  if (m) return t('dynamic.alerts.elevatedTempVsBaseline', { temp: m[1], baseline: m[2] });

  m = s.match(/^Elevated temperature \(([\d.]+)°C\)$/i);
  if (m) return t('dynamic.alerts.elevatedTempChange', { temp: m[1] });

  m = s.match(/^Temperature \+([\d.]+)°C above personal baseline \(([\d.]+)°C\)$/i);
  if (m) return t('dynamic.alerts.tempDeltaChange', { delta: m[1], temp: m[2] });

  m = s.match(/^Temperature \+([\d.]+)°C above personal baseline$/i);
  if (m) return t('dynamic.alerts.tempDeltaSimple', { delta: m[1] });

  m = s.match(/^Mild afternoon temperature rise \(([\d.]+)°C\) after heat exposure$/i);
  if (m) return t('dynamic.alerts.mildAfternoonTemp', { temp: m[1] });

  if (s === 'Complete loss of appetite') return t('dynamic.alerts.lossOfAppetite');
  if (s === 'Appetite reduced') return t('dynamic.alerts.appetiteReduced');
  if (s === 'Low activity / lethargy' || s === 'Low activity') return t('dynamic.alerts.lowActivity');
  if (s === 'Milk yield dropped') return t('dynamic.alerts.milkYieldDropped');

  m = s.match(/^Weight dropped by ([\d.]+)%$/i);
  if (m) return t('dynamic.alerts.weightDropped', { pct: m[1] });

  m = s.match(/^Symptoms:\s*(.+)$/i);
  if (m) {
    const syms = m[1].split(',').map((x) => x.trim()).filter(Boolean);
    return t('dynamic.alerts.symptomsList', { symptoms: trSymptomsList(syms, t) });
  }

  return s;
}

export function trDetectedChange(detectedChange, t) {
  if (!detectedChange || !t) return detectedChange || '';
  return String(detectedChange)
    .split(/\s*·\s*/)
    .map((seg) => translateChangeSegment(seg, t))
    .join(' · ');
}

function translateSingleAlertSentence(sentence, t) {
  const s = sentence.trim();
  if (!s) return '';

  if (s.includes("Temperature is above the animal's recorded baseline (38.5°C -> 39.8°C") || s.includes("Temperature is above the animal's recorded baseline (38.5°C → 39.8°C")) {
    return t('dynamic.alerts.reasonGauri');
  }
  if (s.startsWith('Slight afternoon rise above 38.5°C baseline after summer grazing')) {
    return t('dynamic.alerts.reasonLakshmi');
  }

  let m = s.match(/^Temperature \(([\d.]+)°C\) is critically above (.+)'s recorded baseline \(([\d.]+)°C\) and species limit \(([\d.]+)°C\)\.?$/i);
  if (m) return t('dynamic.alerts.reasonCriticalBaseline', { temp: m[1], name: m[2], baseline: m[3], limit: m[4] });

  m = s.match(/^Temperature \(([\d.]+)°C\) is critically above the safe range \(([\d.]+)°C\)\.?$/i);
  if (m) return t('dynamic.alerts.reasonCriticalSafe', { temp: m[1], limit: m[2] });

  m = s.match(/^Temperature rose to ([\d.]+)°C compared to (.+)'s baseline of ([\d.]+)°C \(([+-]?[\d.]+)°C\)\.?$/i);
  if (m) return t('dynamic.alerts.reasonElevatedBaseline', { temp: m[1], name: m[2], baseline: m[3], delta: m[4] });

  m = s.match(/^Temperature \(([\d.]+)°C\) is above the normal species threshold \(([\d.]+)°C\)\.?$/i);
  if (m) return t('dynamic.alerts.reasonElevatedThreshold', { temp: m[1], limit: m[2] });

  m = s.match(/^Temperature \(([\d.]+)°C\) is ([\d.]+)°C higher than (.+)'s individual baseline \(([\d.]+)°C\)\.?$/i);
  if (m) return t('dynamic.alerts.reasonDeltaBaseline', { temp: m[1], delta: m[2], name: m[3], baseline: m[4] });

  if (/^Animal has stopped eating \(No appetite recorded\)\.?$/i.test(s)) {
    return t('dynamic.alerts.reasonStoppedEating');
  }
  if (/^Appetite dropped from Normal to Reduced\.?$/i.test(s)) {
    return t('dynamic.alerts.reasonAppetiteDropped');
  }
  if (/^Appetite dropped from Normal to Low and activity level is reduced\.?$/i.test(s)) {
    return t('dynamic.alerts.reasonAppetiteDroppedLow');
  }
  if (/^Reduced appetite observed\.?$/i.test(s)) {
    return t('dynamic.alerts.reasonReducedAppetite');
  }
  if (/^Animal is showing reduced physical activity\.?$/i.test(s)) {
    return t('dynamic.alerts.reasonReducedActivity');
  }

  m = s.match(/^Observed symptoms:\s*(.+?)\.?$/i);
  if (m) {
    const syms = m[1].split(',').map((x) => x.trim()).filter(Boolean);
    return t('dynamic.alerts.reasonObservedSymptoms', { symptoms: trSymptomsList(syms, t) });
  }

  m = s.match(/^Body weight decreased from ([\d.]+) kg to ([\d.]+) kg \(-([\d.]+)%\)\.?$/i);
  if (m) return t('dynamic.alerts.reasonWeightDecreased', { prev: m[1], curr: m[2], pct: m[3] });

  return s;
}

export function trAlertReason(reason, t) {
  if (!reason || !t) return reason || '';
  const full = String(reason).trim();
  if (full.includes("Temperature is above the animal's recorded baseline (38.5°C")) {
    return t('dynamic.alerts.reasonGauri');
  }
  if (full.startsWith('Slight afternoon rise above 38.5°C baseline after summer grazing')) {
    return t('dynamic.alerts.reasonLakshmi');
  }
  // Split into sentences without breaking decimal numbers like 38.5°C
  const sentences = full.split(/(?<=\.)\s+(?=[A-Z])/);
  return sentences.map((sent) => translateSingleAlertSentence(sent, t)).join(' ');
}

export function trRecommendedAction(action, t) {
  if (!action || !t) return action || '';
  const s = String(action).trim();
  if (s.startsWith('Isolate the animal in a comfortable shaded area')) return t('dynamic.alerts.actionHigh');
  if (s.includes('Check hooves and grazing comfort')) return t('dynamic.alerts.actionMediumHooves');
  if (s.startsWith('Monitor body temperature and appetite closely every 4–6 hours')) return t('dynamic.alerts.actionMedium');
  if (s.startsWith('Continue routine observation and record a follow-up check tomorrow')) return t('dynamic.alerts.actionLow');
  if (s.startsWith('Provide cool drinking water and shade')) return t('dynamic.alerts.actionLowWater');
  return s;
}
