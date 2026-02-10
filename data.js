const express = require('express');
const router = express.Router();
const Data = require('../models/Data');

router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.sendStatus(200);
});

// Get all data with filters
router.get('/', async (req, res) => {
  try {
    const { category, type, status = 'active', search, page = 1, limit = 20 } = req.query;

    const filter = { status };
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const total = await Data.countDocuments(filter);
    const results = await Data.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ results, page: Number(page), limit: Number(limit), total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single data by ID
router.get('/:id', async (req, res) => {
  try {
    const data = await Data.findById(req.params.id);
    if (!data) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new data
router.post('/', async (req, res) => {
  try {
    const { title, description, category, type, value, metadata } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const data = new Data({
      title,
      description: description || '',
      category,
      type: type || 'document',
      value: value || null,
      metadata: metadata || {},
      status: 'active'
    });

    await data.save();
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update data
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category, type, value, metadata, status } = req.body;

    const data = await Data.findById(req.params.id);
    if (!data) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (title) data.title = title;
    if (description !== undefined) data.description = description;
    if (category) data.category = category;
    if (type) data.type = type;
    if (value !== undefined) data.value = value;
    if (metadata) data.metadata = metadata;
    if (status) data.status = status;
    data.updatedAt = new Date();

    await data.save();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete data
router.delete('/:id', async (req, res) => {
  try {
    const data = await Data.findByIdAndDelete(req.params.id);
    if (!data) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get data categories (distinct)
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Data.distinct('category');
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
