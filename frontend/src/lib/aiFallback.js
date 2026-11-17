// Rule-based fallback for the AI Health Assistant (used when Gemini is unavailable).
// Supports English ('en'), Hindi ('hi'), and Marathi ('mr').
// Informational only - never a diagnosis.

const SEVERE = [
  'bloat', 'difficulty breathing', 'breathing', 'collapse', 'unable to stand', 'seizure', 'bleeding', 'blood', 'convulsion', 'paralysis', 'unconscious',
  'आफरा', 'सांस', 'खून', 'गिर', 'बेहोश', 'पोट फुगणे', 'श्वास', 'रक्त', 'कोसळणे', 'बेशुद्ध',
];

const CONCERNS = [
  {
    keys: ['cough', 'nasal discharge', 'breathing', 'runny nose', 'खांसी', 'नाक', 'सांस', 'खोकला', 'नाक गळणे', 'श्वास'],
    name: {
      en: 'Possible respiratory discomfort',
      hi: 'संभावित श्वसन संबंधी परेशानी',
      mr: 'संभाव्य श्वसन संबंधित त्रास',
    },
  },
  {
    keys: ['diarrhea', 'diarrhoea', 'loose', 'dung', 'दस्त', 'जुलाब', 'पातळ शेण'],
    name: {
      en: 'Possible digestive upset',
      hi: 'संभावित पाचन संबंधी गड़बड़ी',
      mr: 'संभाव्य पचनाचा त्रास',
    },
  },
  {
    keys: ['bloat', 'swollen belly', 'swollen abdomen', 'आफरा', 'पेट फूलना', 'पोट फुगणे'],
    name: {
      en: 'Possible bloat / digestive emergency',
      hi: 'संभावित आफरा (पेट फूलना) / पाचन आपातकाल',
      mr: 'संभाव्य पोट फुगणे (आफरा) / तातडीची पचन समस्या',
    },
  },
  {
    keys: ['limp', 'lameness', 'swollen leg', 'hoof', 'लंगड़ाना', 'पैर', 'खुर', 'लंगडणे', 'पाय', 'खूर'],
    name: {
      en: 'Possible leg or hoof problem',
      hi: 'संभावित पैर या खुर की समस्या',
      mr: 'संभाव्य पाय किंवा खुरांची समस्या',
    },
  },
  {
    keys: ['milk', 'udder', 'mastitis', 'दूध', 'थन', 'कास', 'स्तनदाह'],
    name: {
      en: 'Possible udder health issue',
      hi: 'संभावित थन (अयन) स्वास्थ्य समस्या',
      mr: 'संभाव्य कासेची (थन) आरोग्य समस्या',
    },
  },
  {
    keys: ['skin', 'itch', 'rash', 'lump', 'wound', 'tick', 'त्वचा', 'खुजली', 'घाव', 'गांठ', 'खाज', 'जखम', 'गोचिड'],
    name: {
      en: 'Possible skin condition or external parasites',
      hi: 'संभावित त्वचा की समस्या या बाहरी परजीवी',
      mr: 'संभाव्य त्वचेचा आजार किंवा बाह्य परजीवी',
    },
  },
  {
    keys: ['eye', 'tearing', 'watery', 'आंख', 'डोळे', 'पाणी येणे'],
    name: {
      en: 'Possible eye irritation',
      hi: 'संभावित आंख में जलन या संक्रमण',
      mr: 'संभाव्य डोळ्यांची जळजळ किंवा संसर्ग',
    },
  },
  {
    keys: ['vomit', 'drool', 'saliva', 'mouth', 'लार', 'मुंह', 'लाळ', 'तोंड'],
    name: {
      en: 'Possible mouth or throat discomfort',
      hi: 'संभावित मुंह या गले की परेशानी',
      mr: 'संभाव्य तोंड किंवा घशाचा त्रास',
    },
  },
  {
    keys: ['fever', 'बुखार', 'ताप'],
    name: {
      en: 'Possible fever or systemic infection',
      hi: 'संभावित बुखार या संक्रमण',
      mr: 'संभाव्य ताप किंवा संसर्ग',
    },
  },
];

const HIGH_TEMP = { Cow: 39.5, Buffalo: 39.5, Goat: 40.3, Sheep: 40.3 };

const TEXTS = {
  en: {
    tempVeryHigh: (t, s) => `Temperature ${t}°C is much higher than the usual range for a ${s.toLowerCase()}`,
    tempHigh: (t, s) => `Temperature ${t}°C is above the usual range for a ${s.toLowerCase()}`,
    noAppetite: 'The animal is not eating at all',
    lowAppetite: 'Appetite is reduced',
    severeSign: (w) => `Severe warning sign mentioned: ${w}`,
    multiSymptoms: (n) => `${n} symptoms reported together`,
    someSymptoms: (list) => `Symptoms reported: ${list.join(', ')}`,
    noConcerns: 'No concerning signs were reported in the details provided',
    cleanArea: 'Keep the animal in a clean, shaded, comfortable area with fresh water',
    highSteps: ['Contact a veterinarian promptly', 'Separate the animal from the herd if possible'],
    medSteps: ['Monitor temperature, appetite and behaviour every few hours', 'Call a veterinarian if there is no improvement within 24 hours'],
    lowSteps: ['Continue routine observation and record any changes'],
    noHumanMeds: 'Do not give human medicines without veterinary advice',
    noClearConcern: 'No clear concern from the details given',
    generalIllness: 'General signs of illness (cause unclear)',
  },
  hi: {
    tempVeryHigh: (t) => `शरीर का तापमान (${t}°C) सामान्य सीमा से बहुत अधिक है`,
    tempHigh: (t) => `शरीर का तापमान (${t}°C) सामान्य सीमा से अधिक है`,
    noAppetite: 'पशु बिल्कुल भी चारा नहीं खा रहा है',
    lowAppetite: 'पशु की भूख कम हो गई है',
    severeSign: (w) => `गंभीर लक्षण देखा गया: ${w}`,
    multiSymptoms: (n) => `एक साथ ${n} लक्षण दर्ज किए गए हैं`,
    someSymptoms: (list) => `दर्ज किए गए लक्षण: ${list.join(', ')}`,
    noConcerns: 'दिए गए विवरण में कोई चिंताजनक संकेत नहीं मिला',
    cleanArea: 'पशु को साफ, छायादार और हवादार जगह पर रखें और ताजा पानी दें',
    highSteps: ['तुरंत पशु चिकित्सक से संपर्क करें', 'संभव हो तो पशु को बाकी झुंड से अलग रखें'],
    medSteps: ['हर कुछ घंटों में तापमान, भूख और व्यवहार की निगरानी करें', '24 घंटे में सुधार न होने पर पशु चिकित्सक को बुलाएं'],
    lowSteps: ['नियमित निगरानी जारी रखें और किसी भी बदलाव को नोट करें'],
    noHumanMeds: 'पशु चिकित्सक की सलाह के बिना इंसानों की दवा न दें',
    noClearConcern: 'दिए गए विवरण से कोई स्पष्ट समस्या नहीं दिख रही है',
    generalIllness: 'अस्वस्थता के सामान्य लक्षण (कारण स्पष्ट नहीं)',
  },
  mr: {
    tempVeryHigh: (t) => `शरीराचे तापमान (${t}°C) सामान्य मर्यादेपेक्षा खूप जास्त आहे`,
    tempHigh: (t) => `शरीराचे तापमान (${t}°C) सामान्य मर्यादेपेक्षा जास्त आहे`,
    noAppetite: 'जनावर अजिबात चारा खात नाहीये',
    lowAppetite: 'जनावराची भूक कमी झाली आहे',
    severeSign: (w) => `गंभीर लक्षण आढळले: ${w}`,
    multiSymptoms: (n) => `एकत्र ${n} लक्षणे आढळली आहेत`,
    someSymptoms: (list) => `नोंदवलेली लक्षणे: ${list.join(', ')}`,
    noConcerns: 'दिलेल्या माहितीत कोणतीही गंभीर लक्षणे आढळली नाहीत',
    cleanArea: 'जनावराला स्वच्छ, सावलीच्या ठिकाणी ठेवा आणि ताजे पाणी द्या',
    highSteps: ['तात्काळ पशुवैद्यकाशी संपर्क साधा', 'शक्य असल्यास जनावराला कळपापासून वेगळे ठेवा'],
    medSteps: ['दर काही तासांनी तापमान, भूक आणि हालचालींवर लक्ष ठेवा', '२४ तासांत सुधारणा न झाल्यास पशुवैद्यकांना बोलवा'],
    lowSteps: ['नियमित निरीक्षण सुरू ठेवा आणि कोणताही बदल नोंदवा'],
    noHumanMeds: 'पशुवैद्यकाच्या सल्ल्याशिवाय मानवी औषधे देऊ नका',
    noClearConcern: 'दिलेल्या माहितीवरून कोणतीही स्पष्ट समस्या दिसत नाही',
    generalIllness: 'आजारपणाची सामान्य लक्षणे (नेमके कारण अस्पष्ट)',
  },
};

export function ruleBasedAssessment({ species = 'Cow', symptoms = [], temperature, appetite = 'Normal', description = '', language = 'en' }) {
  const lang = TEXTS[language] ? language : 'en';
  const T = TEXTS[lang];
  const text = [...symptoms, description].join(' ').toLowerCase();
  const limit = HIGH_TEMP[species] || 39.5;
  const reasons = [];
  let score = 0;

  const temp = Number(temperature);
  if (!Number.isNaN(temp) && temperature !== '' && temperature != null) {
    if (temp >= limit + 1) { score += 3; reasons.push(T.tempVeryHigh(temp, species)); }
    else if (temp > limit) { score += 2; reasons.push(T.tempHigh(temp, species)); }
  }
  if (appetite === 'No appetite') { score += 3; reasons.push(T.noAppetite); }
  else if (appetite === 'Low') { score += 1; reasons.push(T.lowAppetite); }

  const severe = SEVERE.filter((k) => text.includes(k));
  if (severe.length) { score += 4; reasons.push(T.severeSign(severe[0])); }
  if (symptoms.length >= 3) { score += 2; reasons.push(T.multiSymptoms(symptoms.length)); }
  else if (symptoms.length >= 1) { score += 1; reasons.push(T.someSymptoms(symptoms)); }

  const matched = CONCERNS.filter((c) => c.keys.some((k) => text.includes(k))).map((c) => c.name[lang] || c.name.en);
  const riskLevel = score >= 5 ? 'High' : score >= 2 ? 'Medium' : 'Low';
  if (!reasons.length) reasons.push(T.noConcerns);

  const steps = [T.cleanArea];
  if (riskLevel === 'High') steps.unshift(...T.highSteps);
  if (riskLevel === 'Medium') steps.unshift(...T.medSteps);
  if (riskLevel === 'Low') steps.unshift(...T.lowSteps);
  steps.push(T.noHumanMeds);

  return {
    possibleConcern: matched.length ? matched.join('; ') : riskLevel === 'Low' ? T.noClearConcern : T.generalIllness,
    riskLevel,
    reasons,
    nextSteps: steps,
    vetRecommended: riskLevel !== 'Low',
    urgent: riskLevel === 'High' || severe.length > 0,
    source: 'Rule-based',
  };
}
