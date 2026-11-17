import i18n from '../i18n/i18n.js';

export const SPECIES = ['Cow', 'Buffalo', 'Goat', 'Sheep'];
export const HEALTH_STATUSES = ['Healthy', 'Needs Attention', 'Critical'];
export const VACCINE_STATUSES = ['Completed', 'Due Soon', 'Overdue'];
export const COMMON_SYMPTOMS = ['Cough', 'Nasal discharge', 'Diarrhea', 'Limping', 'Swollen belly', 'Skin lesions', 'Eye discharge', 'Reduced milk', 'Fever', 'Weakness'];

const DAY = 24 * 60 * 60 * 1000;

export const getDateLocale = (lang) => {
  const l = lang || i18n.language || 'en';
  if (l === 'hi') return 'hi-IN';
  if (l === 'mr') return 'mr-IN';
  return 'en-IN';
};

export const fmtDate = (d, lang) =>
  d ? new Date(d).toLocaleDateString(getDateLocale(lang), { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtShortDate = (d, lang) =>
  d ? new Date(d).toLocaleDateString(getDateLocale(lang), { day: '2-digit', month: 'short' }) : '—';
export const toInputDate = (d) => {
  if (!d) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};
export const today = () => toInputDate(new Date());

export function daysUntil(d) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(d); end.setHours(0, 0, 0, 0);
  return Math.round((end - start) / DAY);
}

export function relativeDay(d, t) {
  const n = daysUntil(d);
  if (t) {
    if (n === 0) return t('common.today');
    if (n === 1) return t('common.tomorrow');
    if (n === -1) return t('common.yesterday');
    return n > 0 ? t('common.inDays', { count: n }) : t('common.daysAgo', { count: -n });
  }
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  return n > 0 ? `In ${n} days` : `${-n} days ago`;
}

// Suggest vaccination status from the next due date
export function suggestVaccineStatus(nextDue) {
  if (!nextDue) return 'Completed';
  const n = daysUntil(nextDue);
  if (n < 0) return 'Overdue';
  if (n <= 14) return 'Due Soon';
  return 'Completed';
}

export function nextAnimalId(species, animals) {
  const prefix = { Cow: 'COW', Buffalo: 'BUF', Goat: 'GOT', Sheep: 'SHP' }[species] || 'ANM';
  const nums = animals.filter((a) => a.animalId.startsWith(prefix)).map((a) => parseInt(a.animalId.split('-')[1], 10) || 0);
  return `${prefix}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
}

export const speciesEmoji = { Cow: '🐄', Buffalo: '🐃', Goat: '🐐', Sheep: '🐑' };

export const SPECIES_COLORS = { Cow: '#16a34a', Buffalo: '#0ea5e9', Goat: '#f59e0b', Sheep: '#8b5cf6' };
export const HEALTH_COLORS = { Healthy: '#16a34a', 'Needs Attention': '#f59e0b', Critical: '#ef4444' };
export const VACC_COLORS = { Completed: '#16a34a', 'Due Soon': '#f59e0b', Overdue: '#ef4444' };
