const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Log = require('../models/Log');
const { createObjectCsvStringifier } = require('csv-writer');

const logSchema = Joi.object({
  timestamp: Joi.date().required(),
  service_name: Joi.string().required(),
  log_level: Joi.string().valid('INFO','WARN','ERROR','DEBUG').required(),
  message: Joi.string().required(),
  server_id: Joi.string().required(),
  trace_id: Joi.string().allow('', null),
  meta: Joi.any()
});

module.exports = (io) => {
  router.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.sendStatus(200);
  });

  router.post('/', async (req, res) => {
    const { error, value } = logSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    try {
      const log = new Log(value);
      await log.save();
      if (io) io.emit('log', log);
      return res.status(201).json({ ok: true, id: log._id });
    } catch (err) {
      console.error('Save log error', err);
      return res.status(500).json({ error: 'Failed to save log' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const {
        q,
        trace_id,
        service_name,
        server_id,
        log_level,
        start,
        end,
        page = 1,
        limit = 50,
        sort = '-timestamp',
        export: exportType
      } = req.query;

      const filter = {};
      if (trace_id) filter.trace_id = trace_id;
      if (service_name) filter.service_name = service_name;
      if (server_id) filter.server_id = server_id;
      if (log_level) filter.log_level = log_level;
      if (start || end) filter.timestamp = {};
      if (start) filter.timestamp.$gte = new Date(start);
      if (end) filter.timestamp.$lte = new Date(end);
      if (q) filter.$or = [
        { message: { $regex: q, $options: 'i' } },
        { service_name: { $regex: q, $options: 'i' } }
      ];

      const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
      const query = Log.find(filter).sort(sort).skip(skip).limit(Number(limit));
      const results = await query.exec();

      if (exportType === 'csv') {
        const csvStringifier = createObjectCsvStringifier({
          header: [
            { id: 'timestamp', title: 'timestamp' },
            { id: 'service_name', title: 'service_name' },
            { id: 'log_level', title: 'log_level' },
            { id: 'message', title: 'message' },
            { id: 'server_id', title: 'server_id' },
            { id: 'trace_id', title: 'trace_id' }
          ]
        });
        const header = csvStringifier.getHeaderString();
        const records = results.map(r => ({
          timestamp: r.timestamp.toISOString(),
          service_name: r.service_name,
          log_level: r.log_level,
          message: r.message,
          server_id: r.server_id,
          trace_id: r.trace_id || ''
        }));
        const csv = header + csvStringifier.stringifyRecords(records);
        res.header('Content-Type', 'text/csv');
        return res.send(csv);
      }

      const total = await Log.countDocuments(filter);
      return res.json({ results, page: Number(page), limit: Number(limit), total });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to query logs' });
    }
  });

  return router;
};
