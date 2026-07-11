const Visitor = require('../models/Visitor');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { validationResult } = require('express-validator');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');
const qrDir = path.join(DATA_DIR, 'qrcodes');
if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir, { recursive: true });
}

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const HOST = process.env.HOST || getLocalIp();
const PORT = process.env.PORT || 3000;

function getBaseUrl() {
  return `http://${HOST}:${PORT}`;
}

exports.getStats = (req, res) => {
  try {
    const stats = Visitor.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = (req, res) => {
  try {
    const { search, date, page, limit } = req.query;
    const result = Visitor.getAll({
      search: search || '',
      date: date || '',
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = (req, res) => {
  try {
    const { id } = req.params;
    const visitor = Visitor.getByVisitorId(id) || Visitor.getById(parseInt(id));
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let photo = '';
    if (req.file) {
      photo = req.file.filename;
    }

    const data = {
      fullName: req.body.fullName,
      phone: req.body.phone,
      email: req.body.email || '',
      address: req.body.address,
      company: req.body.company,
      personToMeet: req.body.personToMeet,
      purpose: req.body.purpose,
      entryDate: req.body.entryDate,
      entryTime: req.body.entryTime,
      exitTime: req.body.exitTime || '',
      vehicleNumber: req.body.vehicleNumber || '',
      photo: photo
    };

    const visitor = Visitor.create(data);

    const qrUrl = `${getBaseUrl()}/visitor/${visitor.visitorId}`;
    const qrPath = path.join(qrDir, `${visitor.visitorId}.png`);

    try {
      await QRCode.toFile(qrPath, qrUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' }
      });
    } catch (qrErr) {
      console.error('QR generation error:', qrErr);
    }

    res.status(201).json({
      visitor,
      qrCodeUrl: `/qrcodes/${visitor.visitorId}.png`,
      qrData: qrUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = (req, res) => {
  try {
    const { id } = req.params;
    let photo = undefined;
    if (req.file) {
      photo = req.file.filename;
    }

    const data = {
      fullName: req.body.fullName,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      company: req.body.company,
      personToMeet: req.body.personToMeet,
      purpose: req.body.purpose,
      entryDate: req.body.entryDate,
      entryTime: req.body.entryTime,
      exitTime: req.body.exitTime,
      vehicleNumber: req.body.vehicleNumber,
      photo: photo
    };

    const visitor = Visitor.update(parseInt(id), data);
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = (req, res) => {
  try {
    const { id } = req.params;
    const deleted = Visitor.delete(parseInt(id));
    if (!deleted) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    res.json({ message: 'Visitor deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkIn = (req, res) => {
  try {
    const { id } = req.params;
    const visitor = Visitor.checkIn(parseInt(id));
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkOut = (req, res) => {
  try {
    const { id } = req.params;
    const visitor = Visitor.checkOut(parseInt(id));
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = Visitor.getByVisitorId(id) || Visitor.getById(parseInt(id));
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    const qrData = `${getBaseUrl()}/visitor/${visitor.visitorId}`;
    const qrPath = path.join(qrDir, `${visitor.visitorId}.png`);

    if (!fs.existsSync(qrPath)) {
      await QRCode.toFile(qrPath, qrData, {
        width: 300,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' }
      });
    }

    res.download(qrPath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadPhoto = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ filename: req.file.filename, path: `/uploads/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
