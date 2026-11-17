import { Animal, MilkRecord, Treatment, AiAssessment } from '../models/index.js';

// Small generic CRUD handlers for the extra collections (milk, treatments, saved AI assessments)
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function makeCrud(Model, sort) {
  return {
    list: wrap(async (req, res) => {
      const filter = req.query.animal ? { animal: req.query.animal } : {};
      res.json(await Model.find(filter).sort(sort));
    }),
    create: wrap(async (req, res) => {
      const { isSample, ...body } = req.body;
      if (!(await Animal.exists({ _id: body.animal }))) return res.status(400).json({ message: 'Selected animal does not exist' });
      res.status(201).json(await Model.create(body));
    }),
    update: wrap(async (req, res) => {
      const { isSample, ...body } = req.body;
      const doc = await Model.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
      if (!doc) return res.status(404).json({ message: 'Record not found' });
      res.json(doc);
    }),
    remove: wrap(async (req, res) => {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Record not found' });
      res.json({ message: 'Deleted' });
    }),
  };
}

export const milk = makeCrud(MilkRecord, { date: -1 });
export const treatments = makeCrud(Treatment, { date: -1 });
export const aiLogs = makeCrud(AiAssessment, { date: -1 });
