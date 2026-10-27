const fs = require('fs');
const path = require('path');

const LEADS_FILE = path.join(process.cwd(), 'leads.json');

function initLeadsFile() {
  try {
    if (!fs.existsSync(LEADS_FILE)) {
      fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf8');
    } else {
      const content = fs.readFileSync(LEADS_FILE, 'utf8').trim();
      if (!content) {
        fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf8');
      } else {
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf8');
        }
      }
    }
  } catch (err) {
    try {
      fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf8');
    } catch (e) {
      // ignore
    }
  }
}
initLeadsFile();

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

function writeLeads(leads) {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
  } catch (err) {
    throw err;
  }
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const leads = readLeads();
      res.status(200).json(leads);
      return;
    } catch (err) {
      res.status(500).json({ error: 'No se pudo leer la base de datos de leads.' });
      return;
    }
  }

  if (req.method === 'POST') {
    try {
      let body = '';
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (typeof req.body === 'object' && req.body !== null) {
        body = JSON.stringify(req.body);
      } else {
        body = '';
      }

      if (!body) {
        res.status(400).json({ success: false, error: 'Cuerpo de solicitud vacío.' });
        return;
      }

      const lead = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(body);

      const name = String(lead.name || 'Contacto Scout').trim();
      const phone = String(lead.phone || '').trim();
      const contactNumber = String(lead.contactNumber || lead.numContacto || lead.phone2 || '').trim();
      const email = String(lead.email || '').trim().toLowerCase();
      const role = String(lead.role || 'Scout / Dirigente').trim();

      if (!phone || !contactNumber) {
        if (phone && !contactNumber && (lead.email || email)) {
          // Allow if only phone provided? keep validation but be lenient? original requires both
        }
        if (!phone && !contactNumber) {
          res.status(400).json({ 
            success: false, 
            error: 'Debes ingresar el número de teléfono principal y el número de contacto.' 
          });
          return;
        }
        if (!phone || !contactNumber) {
          res.status(400).json({ 
            success: false, 
            error: 'Debes ingresar el número de teléfono principal y el número de contacto.' 
          });
          return;
        }
      }

      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          res.status(400).json({ success: false, error: 'El formato del correo electrónico no es válido.' });
          return;
        }
      }

      const leads = readLeads();

      const existingIndex = leads.findIndex(l => 
        (phone && l.phone === phone) || 
        (email && l.email && l.email === email)
      );

      if (existingIndex !== -1) {
        leads[existingIndex].name = name;
        leads[existingIndex].phone = phone;
        if (contactNumber) leads[existingIndex].contactNumber = contactNumber;
        if (email) leads[existingIndex].email = email;
        leads[existingIndex].role = role;
        leads[existingIndex].updatedAt = new Date().toISOString();
        writeLeads(leads);

        res.status(200).json({ 
          success: true, 
          message: '¡Datos actualizados exitosamente en leads.json!', 
          lead: leads[existingIndex] 
        });
        return;
      }

      const nextId = leads.length > 0 ? Math.max(...leads.map(l => l.id || 0)) + 1 : 1;
      const newLead = {
        id: nextId,
        name,
        phone,
        contactNumber,
        email,
        role,
        registeredAt: new Date().toISOString()
      };
      leads.push(newLead);
      writeLeads(leads);

      res.status(200).json({ success: true, message: '¡Registro guardado exitosamente en leads.json!', lead: newLead });
      return;
    } catch (err) {
      res.status(500).json({ success: false, error: 'Error interno del servidor al procesar los datos.' });
      return;
    }
  }

  res.status(405).json({ error: 'Método no permitido' });
};
