const fs = require('fs');
const path = require('path');

const LEADS_FILE = path.join(process.cwd(), 'leads.json');

function readLeads() {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const data = fs.readFileSync(LEADS_FILE, 'utf8').trim();
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    // ignore
  }
  return [];
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-pass');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'scoutwiki2026';

  const pass =
    req.headers['x-admin-pass'] ||
    req.query.pass ||
    (typeof req.body === 'object' && req.body ? req.body.pass : null);

  if (!pass || pass !== ADMIN_PASSWORD) {
    res.status(401).json({ success: false, error: 'Contraseña incorrecta o no autorizada.' });
    return;
  }

  try {
    const leads = readLeads();
    res.status(200).json({ success: true, leads });
    return;
  } catch (err) {
    res.status(500).json({ success: false, error: 'No se pudieron obtener los leads.' });
    return;
  }
};
