// Simple rule-based health check used for health records.
// NOTE: These rules only flag things for attention. They do NOT diagnose disease.

const HIGH_TEMP = { Cow: 39.5, Buffalo: 39.5, Goat: 40.3, Sheep: 40.3 };

export function assessRecord({ temperature, appetite, activity, symptoms = [] }, species = 'Cow') {
  const reasons = [];
  let concerns = 0;
  const limit = HIGH_TEMP[species] || 39.5;

  const veryHighTemp = temperature >= limit + 1;
  if (temperature > limit) {
    reasons.push(`Body temperature ${temperature}°C is above the usual range (over ${limit}°C)`);
    concerns += 1;
  }
  if (appetite === 'Low') {
    reasons.push('Appetite is lower than normal');
    concerns += 1;
  } else if (appetite === 'No appetite') {
    reasons.push('Animal is not eating');
    concerns += 2;
  }
  if (activity === 'Low') {
    reasons.push('Activity level is low');
    concerns += 1;
  }
  if (symptoms.length > 0) {
    reasons.push(`Symptoms noted: ${symptoms.join(', ')}`);
    concerns += symptoms.length;
  }

  let level = 'Normal';
  if (reasons.length > 0) level = 'Attention';
  if (concerns >= 3 || veryHighTemp || symptoms.length >= 2) level = 'High Priority';
  if (level === 'High Priority' && !reasons.length) level = 'Normal';

  return { level, reasons };
}

export const levelToStatus = (level) =>
  level === 'High Priority' ? 'Critical' : level === 'Attention' ? 'Needs Attention' : 'Healthy';
