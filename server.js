const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const LEADS_FILE = path.join(__dirname, 'leads.json');

// Ensure leads.json exists and contains a valid JSON array
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
    console.warn('⚠️ Archivo leads.json inválido o corrupto, inicializando array vacío:', err.message);
    fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf8');
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
    console.error('❌ Error al leer leads.json:', err.message);
  }
  return [];
}

function writeLeads(leads) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL safely
  let pathname = '/';
  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    pathname = decodeURIComponent(parsedUrl.pathname);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify({ success: false, error: 'URL malformada.' }));
    return;
  }

  // POST /api/leads → Guardar lead en leads.json
  if (req.method === 'POST' && pathname === '/api/leads') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
      // Protege contra payloads excesivos (> 1MB)
      if (body.length > 1e6) {
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        if (!body) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
          res.end(JSON.stringify({ success: false, error: 'Cuerpo de solicitud vacío.' }));
          return;
        }

        const lead = JSON.parse(body);

        const name = String(lead.name || 'Contacto Scout').trim();
        const phone = String(lead.phone || '').trim();
        const contactNumber = String(lead.contactNumber || lead.numContacto || lead.phone2 || '').trim();
        const email = String(lead.email || '').trim().toLowerCase();
        const role = String(lead.role || 'Scout / Dirigente').trim();

        // Validación: Teléfono y Número de Contacto requeridos
        if (!phone || !contactNumber) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Debes ingresar el número de teléfono principal y el número de contacto.' 
          }));
          return;
        }

        // Si se provee correo, validar su formato
        if (email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
            res.end(JSON.stringify({ success: false, error: 'El formato del correo electrónico no es válido.' }));
            return;
          }
        }

        // Leer leads actuales de manera segura
        const leads = readLeads();

        // Verificar si el lead ya existe por teléfono o correo para actualizarlo
        const existingIndex = leads.findIndex(l => 
          (phone && l.phone === phone) || 
          (email && l.email && l.email === email)
        );

        if (existingIndex !== -1) {
          leads[existingIndex].name = name;
          leads[existingIndex].phone = phone;
          leads[existingIndex].contactNumber = contactNumber;
          if (email) leads[existingIndex].email = email;
          leads[existingIndex].role = role;
          leads[existingIndex].updatedAt = new Date().toISOString();
          writeLeads(leads);

          console.log(`🔄 Registro actualizado #${leads[existingIndex].id}: ${name} | Tel: ${phone} | Contacto: ${contactNumber} | ${role}`);

          res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
          res.end(JSON.stringify({ 
            success: true, 
            message: '¡Datos actualizados exitosamente en leads.json!', 
            lead: leads[existingIndex] 
          }));
          return;
        }

        // Agregar nuevo lead con fecha y hora
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

        // Guardar archivo actualizado
        writeLeads(leads);

        console.log(`✅ Nuevo registro #${newLead.id}: ${name} | Tel: ${phone} | Contacto: ${contactNumber} | ${role}`);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ success: true, message: '¡Registro guardado exitosamente en leads.json!', lead: newLead }));

      } catch (err) {
        console.error('❌ Error al procesar lead:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ success: false, error: 'Error interno del servidor al procesar los datos.' }));
      }
    });
    return;
  }

  // GET /api/leads → Ver todos los leads registrados (admin)
  if (req.method === 'GET' && pathname === '/api/leads') {
    try {
      const leads = readLeads();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(JSON.stringify(leads, null, 2));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(JSON.stringify({ error: 'No se pudo leer la base de datos de leads.' }));
    }
    return;
  }

  // GET /api/health → Health check
  if (req.method === 'GET' && pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Servir archivos estáticos
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('405 - Método no permitido');
    return;
  }

  let requestedFile = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const rootDir = path.resolve(__dirname);
  const filePath = path.resolve(rootDir, requestedFile);

  // Seguridad contra Path Traversal
  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('403 - Acceso denegado');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 - Archivo no encontrado');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n🪢 ══════════════════════════════════════════════`);
  console.log(`   SCOUT WIKI Landing Page Server`);
  console.log(`   🌐 http://localhost:${PORT}`);
  console.log(`   📁 Leads guardados en: ${LEADS_FILE}`);
  console.log(`   📡 API POST /api/leads   → Registrar lead`);
  console.log(`   📡 API GET  /api/leads   → Ver todos los leads`);
  console.log(`   📡 API GET  /api/health  → Healthcheck`);
  console.log(`🪢 ══════════════════════════════════════════════\n`);
});
