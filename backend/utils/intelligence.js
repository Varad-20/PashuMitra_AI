// Smart Animal Intelligence utilities:
// 1. Individual Health Baseline calculation (with minimum data requirement)
// 2. Illustrative Health Score indicator (NOT a medical score)
// 3. Early Health Warning evaluation against baseline + veterinary-reviewed configurable thresholds
// 4. Context-aware multilingual AI voice assistant fallback (English, Hindi, Marathi)

export const MIN_BASELINE_RECORDS = 3;

export const SPECIES_THRESHOLDS = {
  Cow: { maxNormalTemp: 39.5, criticalTemp: 40.5, tempDeltaWarn: 0.6, tempDeltaHigh: 1.1, weightDropPct: 4, milkDropPct: 18 },
  Buffalo: { maxNormalTemp: 39.5, criticalTemp: 40.5, tempDeltaWarn: 0.6, tempDeltaHigh: 1.1, weightDropPct: 4, milkDropPct: 18 },
  Goat: { maxNormalTemp: 40.3, criticalTemp: 41.0, tempDeltaWarn: 0.6, tempDeltaHigh: 1.1, weightDropPct: 5, milkDropPct: 20 },
  Sheep: { maxNormalTemp: 40.3, criticalTemp: 41.0, tempDeltaWarn: 0.6, tempDeltaHigh: 1.1, weightDropPct: 5, milkDropPct: 20 },
};

const avg = (nums) => (nums.length ? +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : null);

/**
 * Computes an animal's individual baseline from its historical records and milk records.
 * Expects records sorted oldest -> newest or newest -> oldest (we sort internally).
 * To compare a new observation against prior history, pass `excludeRecordId` or slice prior records.
 */
export function computeAnimalBaseline(animal, allRecords = [], allMilk = []) {
  const sortedRecs = [...allRecords]
    .filter((r) => String(r.animal) === String(animal._id))
    .sort((a, b) => new Date(a.observationDate) - new Date(b.observationDate));

  const sortedMilk = [...allMilk]
    .filter((m) => String(m.animal) === String(animal._id))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const recordCount = sortedRecs.length;
  const ready = recordCount >= MIN_BASELINE_RECORDS;

  // Use normal/earlier records when possible, or all historical records excluding the very latest if >= 4
  const baselinePool = sortedRecs.length >= 4 ? sortedRecs.slice(0, -1) : sortedRecs;

  const temps = baselinePool.map((r) => Number(r.temperature)).filter((n) => !Number.isNaN(n));
  const weights = baselinePool.map((r) => Number(r.weight)).filter((n) => !Number.isNaN(n) && n > 0);
  const milkTotals = sortedMilk.map((m) => Number(m.morning || 0) + Number(m.evening || 0)).filter((n) => n > 0);
  const milkBaselinePool = milkTotals.length >= 4 ? milkTotals.slice(0, -1) : milkTotals;

  const avgTemp = ready ? avg(temps) : null;
  const avgWeight = weights.length >= 2 ? avg(weights) : animal.weight || null;
  const avgMilk = milkBaselinePool.length >= 2 ? avg(milkBaselinePool) : null;

  // Typical appetite
  const normalAppetiteCount = baselinePool.filter((r) => r.appetite === 'Normal').length;
  const usualAppetite = baselinePool.length ? (normalAppetiteCount / baselinePool.length >= 0.6 ? 'Normal' : 'Low') : 'Normal';

  // Compare latest reading against baseline
  const latestRec = sortedRecs[sortedRecs.length - 1] || null;
  const prevRec = sortedRecs.length >= 2 ? sortedRecs[sortedRecs.length - 2] : null;
  const latestMilk = sortedMilk[sortedMilk.length - 1] || null;
  const latestMilkTotal = latestMilk ? +(Number(latestMilk.morning || 0) + Number(latestMilk.evening || 0)).toFixed(1) : null;

  const limits = SPECIES_THRESHOLDS[animal.species] || SPECIES_THRESHOLDS.Cow;

  const comparisons = {
    temperature: { status: 'missing', current: null, baseline: avgTemp, delta: null },
    appetite: { status: 'missing', current: null, baseline: usualAppetite },
    weight: { status: 'missing', current: null, baseline: avgWeight, deltaPct: null },
    milk: { status: 'missing', current: latestMilkTotal, baseline: avgMilk, deltaPct: null },
  };

  if (latestRec) {
    const curTemp = Number(latestRec.temperature);
    const deltaT = avgTemp != null ? +(curTemp - avgTemp).toFixed(2) : null;
    const tempUnusual =
      curTemp > limits.maxNormalTemp || (deltaT != null && Math.abs(deltaT) >= limits.tempDeltaWarn);
    comparisons.temperature = {
      status: !ready ? 'building' : tempUnusual ? 'unusual' : 'normal',
      current: curTemp,
      previous: prevRec ? Number(prevRec.temperature) : avgTemp,
      baseline: avgTemp,
      delta: deltaT,
    };

    comparisons.appetite = {
      status: latestRec.appetite === 'Normal' ? 'normal' : 'unusual',
      current: latestRec.appetite,
      previous: prevRec ? prevRec.appetite : usualAppetite,
      baseline: usualAppetite,
    };

    if (latestRec.weight && avgWeight) {
      const wDeltaPct = +(((Number(latestRec.weight) - avgWeight) / avgWeight) * 100).toFixed(1);
      comparisons.weight = {
        status: Math.abs(wDeltaPct) >= limits.weightDropPct ? 'unusual' : 'normal',
        current: Number(latestRec.weight),
        previous: prevRec?.weight ? Number(prevRec.weight) : avgWeight,
        baseline: avgWeight,
        deltaPct: wDeltaPct,
      };
    }
  }

  if (latestMilkTotal != null && avgMilk != null) {
    const mDeltaPct = +(((latestMilkTotal - avgMilk) / avgMilk) * 100).toFixed(1);
    comparisons.milk = {
      status: mDeltaPct <= -limits.milkDropPct ? 'unusual' : 'normal',
      current: latestMilkTotal,
      baseline: avgMilk,
      deltaPct: mDeltaPct,
    };
  }

  return {
    status: ready ? 'ready' : 'building',
    recordCount,
    minRequired: MIN_BASELINE_RECORDS,
    avgTemp,
    avgWeight,
    avgMilk,
    usualAppetite,
    latestRecord: latestRec,
    previousRecord: prevRec,
    comparisons,
  };
}

/**
 * Calculates an illustrative 0-100 application Health Score indicator.
 * Explicitly labelled in the UI as an application indicator, not a medical score.
 */
export function computeIllustrativeHealthScore(animal, baseline, vaccinations = []) {
  let score = 94;
  if (animal.healthStatus === 'Needs Attention') score -= 18;
  if (animal.healthStatus === 'Critical') score -= 38;

  const latest = baseline?.latestRecord;
  if (latest) {
    if (latest.appetite === 'Low') score -= 8;
    if (latest.appetite === 'No appetite') score -= 18;
    if (latest.activity === 'Low') score -= 8;
    if (latest.symptoms?.length) score -= Math.min(18, latest.symptoms.length * 6);
  }
  if (baseline?.comparisons?.temperature?.status === 'unusual') score -= 10;

  const animalVaccs = vaccinations.filter((v) => String(v.animal) === String(animal._id));
  if (animalVaccs.some((v) => v.status === 'Overdue')) score -= 8;
  else if (animalVaccs.some((v) => v.status === 'Due Soon')) score -= 3;

  return Math.max(25, Math.min(98, Math.round(score)));
}

/**
 * Evaluates a new health observation against the animal's historical records + species thresholds.
 * Returns null if normal, or an Early Warning alert payload if an unusual deviation or threshold breach is found.
 */
export function evaluateEarlyWarning({ animal, newRecord, priorRecords = [] }) {
  const limits = SPECIES_THRESHOLDS[animal.species] || SPECIES_THRESHOLDS.Cow;
  const sortedPrior = [...priorRecords]
    .filter((r) => String(r._id) !== String(newRecord._id))
    .sort((a, b) => new Date(a.observationDate) - new Date(b.observationDate));

  const prevRec = sortedPrior[sortedPrior.length - 1] || null;
  const hasBaseline = sortedPrior.length >= MIN_BASELINE_RECORDS - 1;
  const priorTemps = sortedPrior.map((r) => Number(r.temperature)).filter((n) => !Number.isNaN(n));
  const baselineTemp = priorTemps.length ? avg(priorTemps) : null;

  const curTemp = Number(newRecord.temperature);
  const refPrevTemp = prevRec ? Number(prevRec.temperature) : baselineTemp;
  const tempDeltaFromBaseline = baselineTemp != null ? +(curTemp - baselineTemp).toFixed(1) : null;
  const tempDeltaFromPrev = refPrevTemp != null ? +(curTemp - refPrevTemp).toFixed(1) : null;

  const changes = [];
  const reasons = [];
  let riskScore = 0;

  // 1. Temperature check (species threshold + personal baseline deviation)
  if (curTemp >= limits.criticalTemp) {
    riskScore += 4;
    changes.push(`High fever (${curTemp}°C)`);
    reasons.push(
      baselineTemp
        ? `Temperature (${curTemp}°C) is critically above ${animal.name}'s recorded baseline (${baselineTemp}°C) and species limit (${limits.maxNormalTemp}°C).`
        : `Temperature (${curTemp}°C) is critically above the safe range (${limits.maxNormalTemp}°C).`
    );
  } else if (curTemp > limits.maxNormalTemp) {
    riskScore += 2;
    changes.push(`Elevated temperature (${curTemp}°C)`);
    reasons.push(
      baselineTemp
        ? `Temperature rose to ${curTemp}°C compared to ${animal.name}'s baseline of ${baselineTemp}°C (${tempDeltaFromBaseline >= 0 ? '+' : ''}${tempDeltaFromBaseline}°C).`
        : `Temperature (${curTemp}°C) is above the normal species threshold (${limits.maxNormalTemp}°C).`
    );
  } else if (hasBaseline && tempDeltaFromBaseline != null && tempDeltaFromBaseline >= limits.tempDeltaWarn) {
    riskScore += 2;
    changes.push(`Temperature +${tempDeltaFromBaseline}°C above personal baseline`);
    reasons.push(
      `Temperature (${curTemp}°C) is ${tempDeltaFromBaseline}°C higher than ${animal.name}'s individual baseline (${baselineTemp}°C).`
    );
  }

  // 2. Appetite change
  if (newRecord.appetite === 'No appetite') {
    riskScore += 3;
    changes.push('Complete loss of appetite');
    reasons.push('Animal has stopped eating (No appetite recorded).');
  } else if (newRecord.appetite === 'Low') {
    riskScore += 2;
    changes.push('Appetite reduced');
    reasons.push(
      prevRec && prevRec.appetite === 'Normal'
        ? 'Appetite dropped from Normal to Reduced.'
        : 'Reduced appetite observed.'
    );
  }

  // 3. Activity change
  if (newRecord.activity === 'Low') {
    riskScore += 1;
    changes.push('Low activity / lethargy');
    reasons.push('Animal is showing reduced physical activity.');
  }

  // 4. Symptoms
  const syms = newRecord.symptoms || [];
  if (syms.length > 0) {
    riskScore += syms.length >= 2 ? 3 : 1;
    changes.push(`Symptoms: ${syms.join(', ')}`);
    reasons.push(`Observed symptoms: ${syms.join(', ')}.`);
  }

  // 5. Weight drop check
  if (newRecord.weight && prevRec?.weight) {
    const dropPct = +(((prevRec.weight - newRecord.weight) / prevRec.weight) * 100).toFixed(1);
    if (dropPct >= limits.weightDropPct) {
      riskScore += 2;
      changes.push(`Weight dropped by ${dropPct}%`);
      reasons.push(`Body weight decreased from ${prevRec.weight} kg to ${newRecord.weight} kg (-${dropPct}%).`);
    }
  }

  if (riskScore === 0 || changes.length === 0) return null;

  const riskLevel = riskScore >= 5 ? 'High' : riskScore >= 3 ? 'Medium' : 'Low';

  const recommendedAction =
    riskLevel === 'High'
      ? 'Isolate the animal in a comfortable shaded area, check water intake, and contact a veterinarian promptly for clinical assessment.'
      : riskLevel === 'Medium'
      ? 'Monitor body temperature and appetite closely every 4–6 hours. Contact a veterinarian if observations do not normalize within 24 hours.'
      : 'Continue routine observation and record a follow-up check tomorrow.';

  return {
    animal: animal._id,
    healthRecord: newRecord._id,
    riskLevel,
    detectedChange: changes.join(' · '),
    reason: reasons.join(' '),
    previousValue: {
      temperature: refPrevTemp != null ? `${refPrevTemp}°C` : 'Baseline pending',
      appetite: prevRec?.appetite || 'Normal',
      weight: prevRec?.weight ? `${prevRec.weight} kg` : animal.weight ? `${animal.weight} kg` : '—',
    },
    currentValue: {
      temperature: `${curTemp}°C`,
      appetite: newRecord.appetite || 'Normal',
      weight: newRecord.weight ? `${newRecord.weight} kg` : animal.weight ? `${animal.weight} kg` : '—',
    },
    recommendedAction,
    status: 'Active',
    followUps: [],
    createdAt: newRecord.observationDate || new Date().toISOString(),
  };
}

/**
 * Context-aware multilingual fallback response for the AI Voice Farmer Assistant.
 * Uses the selected animal's real records, baseline, alerts, and vaccinations, and explains which records support the guidance.
 */
export function buildContextAwareFallbackReply({ message = '', language = 'en', animal, baseline, recentRecords = [], activeAlerts = [], vaccinations = [] }) {
  const q = String(message).toLowerCase();
  const lang = ['en', 'hi', 'mr'].includes(language) ? language : 'en';

  const latest = recentRecords[0] || baseline?.latestRecord;
  const avgTemp = baseline?.avgTemp;
  const dueVaccs = vaccinations.filter((v) => v.status !== 'Completed');

  // Detect topics in English, Hindi, Marathi
  const hasFever = /fever|temp|hot|बुखार|तापमान|गर्म|ताप|गरम/.test(q) || (latest && latest.temperature > 39.5);
  const hasAppetite = /eat|food|fodder|appetite|चारा|खाना|भूख|खात|भूक/.test(q) || (latest && latest.appetite !== 'Normal');
  const hasBloat = /bloat|swollen|belly|stomach|आफरा|पेट|पोट|फुग/.test(q);
  const hasCough = /cough|breath|nasal|खांसी|सांस|नाक|खोकला|श्वास/.test(q);
  const hasMilk = /milk|udder|yield|दूध|थन|कास/.test(q);

  let riskLevel = 'Low';
  if (hasBloat || (hasFever && hasAppetite) || activeAlerts.some((a) => a.riskLevel === 'High')) {
    riskLevel = 'High';
  } else if (hasFever || hasAppetite || hasCough || hasMilk || activeAlerts.length > 0) {
    riskLevel = 'Medium';
  }

  // Build supporting evidence list from actual animal records
  const evidence = {
    en: [],
    hi: [],
    mr: [],
  };

  if (animal) {
    evidence.en.push(`Animal profile: ${animal.name} (${animal.animalId}), ${animal.age} yrs ${animal.breed} ${animal.species}, status: ${animal.healthStatus}.`);
    evidence.hi.push(`पशु प्रोफ़ाइल: ${animal.name} (${animal.animalId}), ${animal.age} वर्ष, ${animal.breed} (${animal.species}), वर्तमान स्थिति: ${animal.healthStatus}।`);
    evidence.mr.push(`जनावर प्रोफाईल: ${animal.name} (${animal.animalId}), वय ${animal.age} वर्षे, ${animal.breed} (${animal.species}), सद्यस्थिती: ${animal.healthStatus}.`);
  }

  if (latest) {
    const tempNoteEn = avgTemp ? ` (individual baseline: ${avgTemp}°C)` : '';
    const tempNoteHi = avgTemp ? ` (व्यक्तिगत औसत बेसलाइन: ${avgTemp}°C)` : '';
    const tempNoteMr = avgTemp ? ` (वैयक्तिक सरासरी बेसलाईन: ${avgTemp}°C)` : '';

    evidence.en.push(`Latest recorded observation: Temp ${latest.temperature}°C${tempNoteEn}, Appetite: ${latest.appetite}, Activity: ${latest.activity}${latest.symptoms?.length ? `, Symptoms: ${latest.symptoms.join(', ')}` : ''}.`);
    evidence.hi.push(`नवीनतम स्वास्थ्य रिकॉर्ड: तापमान ${latest.temperature}°C${tempNoteHi}, भूख: ${latest.appetite}, सक्रियता: ${latest.activity}${latest.symptoms?.length ? `, लक्षण: ${latest.symptoms.join(', ')}` : ''}।`);
    evidence.mr.push(`अलीकडील आरोग्य नोंद: तापमान ${latest.temperature}°C${tempNoteMr}, भूक: ${latest.appetite}, हालचाल: ${latest.activity}${latest.symptoms?.length ? `, लक्षणे: ${latest.symptoms.join(', ')}` : ''}.`);
  } else {
    evidence.en.push('No prior temperature or appetite observations are recorded for this animal yet.');
    evidence.hi.push('इस पशु के लिए अभी तक कोई पिछला तापमान या भूख का रिकॉर्ड दर्ज नहीं है।');
    evidence.mr.push('या जनावरासाठी अद्याप कोणतीही मागील तापमान किंवा भुकेची नोंद उपलब्ध नाही.');
  }

  if (activeAlerts.length > 0) {
    evidence.en.push(`Active Early Warning Alert (${activeAlerts[0].riskLevel} risk): ${activeAlerts[0].detectedChange}.`);
    evidence.hi.push(`सक्रिय प्रारंभिक चेतावनी (${activeAlerts[0].riskLevel} जोखिम): ${activeAlerts[0].detectedChange}।`);
    evidence.mr.push(`सक्रिय पूर्वसूचना अलर्ट (${activeAlerts[0].riskLevel} धोका): ${activeAlerts[0].detectedChange}.`);
  }

  if (dueVaccs.length > 0) {
    evidence.en.push(`Vaccination record: ${dueVaccs[0].vaccineName} is ${dueVaccs[0].status}.`);
    evidence.hi.push(`टीकाकरण रिकॉर्ड: ${dueVaccs[0].vaccineName} की स्थिति '${dueVaccs[0].status}' है।`);
    evidence.mr.push(`लसीकरण नोंद: ${dueVaccs[0].vaccineName} ची स्थिती '${dueVaccs[0].status}' आहे.`);
  }

  if (lang === 'mr') {
    let reply = `${animal ? `**${animal.name} (${animal.animalId})** साठीच्या नोंदी आणि तुमच्या संदेशाच्या आधारे:` : 'तुमच्या संदेशाच्या आधारे:'}\n\n`;
    if (hasBloat) {
      reply += `पोट फुगणे (आफरा) आणि चारा न खाणे हे तातडीचे लक्षण असू शकते. `;
    } else if (hasFever && hasAppetite) {
      reply += `जनावराला ताप असणे आणि चारा न खाणे हे संसर्ग किंवा पचनाच्या त्रासाचे लक्षण असू शकते. `;
    } else if (hasFever) {
      reply += `शरीराचे वाढलेले तापमान तापाचे संकेत देते. `;
    } else if (hasAppetite) {
      reply += `भूक कमी होणे किंवा चारा न खाणे हे ताण, अपचन किंवा आजाराची सुरुवात असू शकते. `;
    } else {
      reply += `तुम्ही नोंदवलेल्या लक्षणांवर लक्ष ठेवणे आवश्यक आहे. `;
    }

    if (latest) {
      reply += `आमच्या रेकॉर्डनुसार शेवटचे तापमान **${latest.temperature}°C**${avgTemp ? ` (सरासरी बेसलाईन ${avgTemp}°C)` : ''} आणि भूक **${latest.appetite}** नोंदवली गेली आहे.`;
    }

    const steps = [
      riskLevel === 'High'
        ? 'तात्काळ पशुवैद्यकाशी (किंवा टोल-फ्री १९६२ हेल्पलाईनवर) संपर्क साधा.'
        : 'दर ४ ते ६ तासांनी शरीराचे तापमान आणि चारा-पाणी पिण्याचे निरीक्षण करा.',
      'जनावराला स्वच्छ, सावलीच्या आणि हवेशीर ठिकाणी ठेवा व पुरेसे स्वच्छ पाणी द्या.',
      'पशुवैद्यकाच्या सल्ल्याशिवाय कोणतीही मानवी औषधे किंवा प्रतिजैविक (Antibiotics) देऊ नका.',
    ];

    return {
      reply,
      riskLevel,
      supportingRecords: evidence.mr,
      recommendedSteps: steps,
      vetRecommended: riskLevel !== 'Low',
      disclaimer: 'टीप: ही माहिती केवळ मार्गदर्शनासाठी आहे, हे वैद्यकीय निदान नाही. कृपया पशुवैद्यकाकडून प्रत्यक्ष तपासणी करून घ्या.',
      source: 'Context-Aware Rule Engine',
    };
  }

  if (lang === 'hi') {
    let reply = `${animal ? `**${animal.name} (${animal.animalId})** के उपलब्ध स्वास्थ्य रिकॉर्ड और आपके संदेश के आधार पर:` : 'आपके संदेश के आधार पर:'}\n\n`;
    if (hasBloat) {
      reply += `पेट फूलना (आफरा) और चारा न खाना एक गंभीर स्थिति हो सकती है। `;
    } else if (hasFever && hasAppetite) {
      reply += `बुखार होना और चारा न खाना किसी संक्रमण या पाचन समस्या का संकेत हो सकता है। `;
    } else if (hasFever) {
      reply += `शरीर का बढ़ा हुआ तापमान बुखार का संकेत देता है। `;
    } else if (hasAppetite) {
      reply += `भूख कम होना या चारा छोड़ना अपच या अस्वस्थता का प्रारंभिक संकेत हो सकता है। `;
    } else {
      reply += `आपके द्वारा बताए गए लक्षणों पर ध्यान देने की आवश्यकता है। `;
    }

    if (latest) {
      reply += `रिकॉर्ड के अनुसार पिछला तापमान **${latest.temperature}°C**${avgTemp ? ` (व्यक्तिगत बेसलाइन ${avgTemp}°C)` : ''} और भूख की स्थिति **${latest.appetite}** दर्ज है।`;
    }

    const steps = [
      riskLevel === 'High'
        ? 'तुरंत नजदीकी पशु चिकित्सक से संपर्क करें (या टोल-फ्री हेल्पलाइन 1962 पर कॉल करें)।'
        : 'हर 4–6 घंटे में तापमान, जुगाली और भूख की निगरानी करें।',
      'पशु को साफ, छायादार और हवादार जगह पर रखें तथा ताजा पीने का पानी उपलब्ध कराएं।',
      'पशु चिकित्सक की सलाह के बिना कोई भी दवा न दें।',
    ];

    return {
      reply,
      riskLevel,
      supportingRecords: evidence.hi,
      recommendedSteps: steps,
      vetRecommended: riskLevel !== 'Low',
      disclaimer: 'अस्वीकरण: यह जानकारी केवल मार्गदर्शन के लिए है और पशु चिकित्सा निदान नहीं है। कृपया पशु चिकित्सक से जांच कराएं।',
      source: 'Context-Aware Rule Engine',
    };
  }

  // Default English
  let reply = `${animal ? `Based on your message and the recorded health history for **${animal.name} (${animal.animalId})**:` : 'Based on your message:'}\n\n`;
  if (hasBloat) {
    reply += `Swollen belly (possible bloat) combined with reduced feeding requires immediate attention. `;
  } else if (hasFever && hasAppetite) {
    reply += `Elevated temperature together with reduced appetite may indicate an active infection or digestive upset. `;
  } else if (hasFever) {
    reply += `An elevated body temperature indicates possible fever that should be monitored against the animal's baseline. `;
  } else if (hasAppetite) {
    reply += `Reduced appetite is often an early sign of discomfort, feed change, or emerging illness. `;
  } else {
    reply += `Please monitor the reported signs closely and compare them with the animal's baseline readings. `;
  }

  if (latest) {
    reply += `The most recent logged observation shows a body temperature of **${latest.temperature}°C**${avgTemp ? ` (individual baseline: ${avgTemp}°C)` : ''} and appetite recorded as **${latest.appetite}**.`;
  }

  const steps = [
    riskLevel === 'High'
      ? 'Contact a qualified veterinarian promptly (or call the 1962 livestock helpline) for a physical examination.'
      : 'Re-check body temperature, cud-chewing, and appetite in 4–6 hours and log a follow-up observation.',
    'Keep the animal in a shaded, well-ventilated area with clean drinking water.',
    'Avoid administering unprescribed medications without veterinary guidance.',
  ];

  return {
    reply,
    riskLevel,
    supportingRecords: evidence.en,
    recommendedSteps: steps,
    vetRecommended: riskLevel !== 'Low',
    disclaimer: 'Informational guidance only — not a veterinary diagnosis. A veterinarian must examine the animal to confirm any condition.',
    source: 'Context-Aware Rule Engine',
  };
}
