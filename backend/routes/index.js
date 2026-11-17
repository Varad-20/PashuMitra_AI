import { Router } from 'express';
import * as c from '../controllers/index.js';
import { milk, treatments, aiLogs } from '../controllers/extra.js';
import * as intel from '../controllers/intelligenceController.js';
import { validateObjectId, requireDb } from '../middleware/index.js';

const router = Router();

// AI works with or without the database
router.post('/ai/assess', c.aiAssess);
router.post('/ai/chat', intel.postContextualChat);

router.use(requireDb);

router.get('/animals', c.listAnimals);
router.post('/animals', c.createAnimal);
router.get('/animals/:id', validateObjectId, c.getAnimal);
router.put('/animals/:id', validateObjectId, c.updateAnimal);
router.delete('/animals/:id', validateObjectId, c.deleteAnimal);

router.get('/health-records', c.listRecords);
router.post('/health-records', c.createRecord);
router.put('/health-records/:id', validateObjectId, c.updateRecord);
router.delete('/health-records/:id', validateObjectId, c.deleteRecord);

router.get('/vaccinations', c.listVaccinations);
router.post('/vaccinations', c.createVaccination);
router.put('/vaccinations/:id', validateObjectId, c.updateVaccination);
router.delete('/vaccinations/:id', validateObjectId, c.deleteVaccination);

// Milk production, treatments and saved AI assessments
for (const [path, h] of [['/milk', milk], ['/treatments', treatments], ['/ai-assessments', aiLogs]]) {
  router.get(path, h.list);
  router.post(path, h.create);
  router.put(`${path}/:id`, validateObjectId, h.update);
  router.delete(`${path}/:id`, validateObjectId, h.remove);
}

router.get('/animals/:id/digital-twin', validateObjectId, intel.getAnimalDigitalTwin);

router.get('/alerts', intel.listAlerts);
router.patch('/alerts/:id/review', validateObjectId, intel.reviewAlert);
router.post('/alerts/:id/follow-up', validateObjectId, intel.addAlertFollowUp);
router.delete('/alerts/:id', validateObjectId, intel.deleteAlert);

router.get('/ai/chat-history', intel.listChatHistory);

router.get('/dashboard/stats', c.dashboardStats);

export default router;
