import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  detectMode,
  listAll,
  createItem,
  updateItem,
  removeItem,
  markAlertReviewed,
  addAlertFollowUpItem,
  sendContextualAiChat,
  errMessage,
  resetDemoData,
} from '../services/api.js';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('demo');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [animals, setAnimals] = useState([]);
  const [records, setRecords] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [milkRecords, setMilkRecords] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [aiAssessments, setAiAssessments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((tList) => [...tList, { id, message, type }]);
    setTimeout(() => setToasts((tList) => tList.filter((x) => x.id !== id)), 4000);
  }, []);
  const dismissToast = (id) => setToasts((tList) => tList.filter((x) => x.id !== id));

  const refresh = useCallback(async () => {
    const [a, r, v, m, tr, ai, al, ch] = await Promise.all([
      listAll('animals'),
      listAll('records'),
      listAll('vaccinations'),
      listAll('milk'),
      listAll('treatments'),
      listAll('aiAssessments'),
      listAll('alerts'),
      listAll('chatHistory'),
    ]);
    setAnimals(a);
    setRecords(r);
    setVaccinations(v);
    setMilkRecords(m);
    setTreatments(tr);
    setAiAssessments(ai);
    setAlerts(al);
    setChatHistory(ch);
  }, []);

  const init = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setMode(await detectMode());
      await refresh();
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => { init(); }, [init]);

  // Run an API action; show a toast ONLY after it really succeeded.
  const run = async (action, successMessage) => {
    try {
      const result = await action();
      await refresh();
      if (successMessage) toast(successMessage);
      return result || true;
    } catch (err) {
      toast(errMessage(err), 'error');
      return false;
    }
  };

  const actions = {
    saveAnimal: (data, id) => run(() => (id ? updateItem('animals', id, data) : createItem('animals', data)), id ? t('toasts.animalUpdated') : t('toasts.animalAdded')),
    deleteAnimal: (id) => run(() => removeItem('animals', id), t('toasts.animalDeleted')),
    saveRecord: (data, id) => run(() => (id ? updateItem('records', id, data) : createItem('records', data)), id ? t('toasts.recordUpdated') : t('toasts.recordSaved')),
    deleteRecord: (id) => run(() => removeItem('records', id), t('toasts.recordDeleted')),
    saveVaccination: (data, id) => run(() => (id ? updateItem('vaccinations', id, data) : createItem('vaccinations', data)), id ? t('toasts.vaccinationUpdated') : t('toasts.vaccinationAdded')),
    deleteVaccination: (id) => run(() => removeItem('vaccinations', id), t('toasts.vaccinationDeleted')),
    saveMilk: (data, id) => run(() => (id ? updateItem('milk', id, data) : createItem('milk', data)), id ? t('toasts.milkUpdated') : t('toasts.milkSaved')),
    deleteMilk: (id) => run(() => removeItem('milk', id), t('toasts.milkDeleted')),
    saveTreatment: (data, id) => run(() => (id ? updateItem('treatments', id, data) : createItem('treatments', data)), id ? t('toasts.treatmentUpdated') : t('toasts.treatmentSaved')),
    deleteTreatment: (id) => run(() => removeItem('treatments', id), t('toasts.treatmentDeleted')),
    reviewAlert: (id, payload) => run(() => markAlertReviewed(id, payload), t('toasts.alertReviewed')),
    addAlertFollowUp: (id, payload) => run(() => addAlertFollowUpItem(id, payload), t('toasts.followUpAdded')),
    deleteAlert: (id) => run(() => removeItem('alerts', id), t('toasts.alertDeleted')),
    sendChat: async (payload) => {
      const res = await sendContextualAiChat(payload);
      await refresh();
      setChatHistory((prev) => {
        if (prev.some((c) => c._id === res.chatId)) return prev;
        return [
          ...prev,
          {
            _id: res.chatId || 'chat-' + Date.now(),
            animal: payload.animalId,
            language: payload.language,
            userMessage: payload.message,
            assistantReply: res.reply,
            riskLevel: res.riskLevel,
            supportingRecords: res.supportingRecords || [],
            recommendedSteps: res.recommendedSteps || [],
            vetRecommended: res.vetRecommended,
            source: res.source,
            createdAt: res.createdAt || new Date().toISOString(),
          },
        ];
      });
      return res;
    },
    refreshAll: refresh,
    resetDemo: async () => { resetDemoData(); await refresh(); toast(t('toasts.demoReset')); },
  };

  const value = useMemo(
    () => ({
      mode,
      loading,
      error,
      animals,
      records,
      vaccinations,
      milkRecords,
      treatments,
      aiAssessments,
      alerts,
      chatHistory,
      toasts,
      dismissToast,
      toast,
      reload: init,
      ...actions,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, loading, error, animals, records, vaccinations, milkRecords, treatments, aiAssessments, alerts, chatHistory, toasts]
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
