# 🪢 Scout Wiki — Landing Page Oficial

> Página de lanzamiento y captación de leads para **Scout Wiki**, la app Android 100% offline para scouts y dirigentes.

---

## 📖 ¿Qué es esto?

Este repositorio contiene la **landing page oficial** del proyecto Scout Wiki.  
La web sirve como vitrina del producto y como sistema de **registro de contactos (leads)**, guardando el teléfono principal y número de contacto de cada persona interesada.

**Características de la landing:**
- 🏕️ Secciones de presentación de la app con diseño oscuro premium
- 📱 Vista previa de funcionalidades: nudos, fogatas, cancionero, GPS, SOS, brújula
- 📋 Formulario de registro que guarda datos localmente en `leads.json`
- 📡 Mini API REST para administrar los leads (ver, guardar)
- 🔒 `.htaccess` configurado para Apache (seguridad, caché, compresión Gzip)
- 📲 Diseño responsivo con menú móvil

---

## 📁 Estructura del Proyecto

```
appsclanding/
├── index.html          → Página principal (toda la landing)
├── style.css           → Estilos personalizados y animaciones
├── server.js           → Servidor Node.js (API + archivos estáticos)
├── leads.json          → Base de datos local de leads registrados
├── package.json        → Configuración del proyecto Node
├── .htaccess           → Configuración para hosting Apache/cPanel
├── .gitignore          → Archivos ignorados por Git
├── logoappscout.png    → Logo principal de AppScout
├── scout_logo.jpg      → Logo alternativo Scout
└── img/
    └── logoappscout.png → Favicon y logo de la web
```

---

## 🚀 Cómo ejecutar localmente

### Requisitos
- [Node.js](https://nodejs.org/) v18 o superior
- Terminal (PowerShell, CMD o Git Bash)

### Pasos

```powershell
# 1. Entrar al directorio del proyecto
cd d:\Systemsbeer\appsclanding

# 2. Instalar dependencias (solo la primera vez)
npm install

# 3. Iniciar el servidor
node server.js
```

La web estará disponible en:
**👉 http://localhost:3000**

### Alternativa con Live Server (VS Code)
Si tenés la extensión **Live Server** instalada en VS Code:
- El puerto configurado es el `5501` (ver `.vscode/settings.json`)
- Clic derecho sobre `index.html` → `Open with Live Server`
- Abre en: **http://127.0.0.1:5501**

> ⚠️ Con Live Server **no correrá el servidor Node** — la API de leads no funcionará. Usar `node server.js` para tener todas las funcionalidades activas.

---

## 🌐 Rutas Disponibles

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/` | `GET` | Landing page principal |
| `/api/leads` | `POST` | Registrar un nuevo lead |
| `/api/leads` | `GET` | Ver todos los leads guardados |
| `/api/health` | `GET` | Verificar que el servidor está activo |

---

## 📋 API de Leads

### `POST /api/leads` — Registrar contacto

**Body (JSON):**
```json
{
  "name": "Nombre Scout",
  "phone": "+502 5555-1234",
  "contactNumber": "+502 5555-5678",
  "email": "scout@ejemplo.com",
  "role": "Dirigente"
}
```

> Campos **obligatorios**: `phone` y `contactNumber`
> Campos **opcionales**: `name`, `email`, `role`

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "¡Registro guardado exitosamente en leads.json!",
  "lead": {
    "id": 1,
    "name": "Nombre Scout",
    "phone": "+502 5555-1234",
    "contactNumber": "+502 5555-5678",
    "email": "scout@ejemplo.com",
    "role": "Dirigente",
    "registeredAt": "2026-10-24T05:00:00.000Z"
  }
}
```

### `GET /api/leads` — Ver todos los registros

```bash
curl http://localhost:3000/api/leads
```

### `GET /api/health` — Estado del servidor

```bash
curl http://localhost:3000/api/health
# → {"status":"ok","timestamp":"..."}
```

---

## 🗄️ Datos guardados (`leads.json`)

Los leads se almacenan localmente en `leads.json` en la raíz del proyecto.
El archivo se **inicializa automáticamente** si no existe o está corrupto.

Cada registro guarda:

| Campo | Descripción |
|-------|-------------|
| `id` | ID único autoincremental |
| `name` | Nombre del contacto |
| `phone` | Teléfono principal (**requerido**) |
| `contactNumber` | Número de contacto alternativo (**requerido**) |
| `email` | Correo electrónico (opcional) |
| `role` | Rol: Scout, Dirigente, etc. |
| `registeredAt` | Fecha y hora del registro (ISO 8601) |
| `updatedAt` | Fecha de última actualización (si se actualizó) |

> Si se envía un `phone` o `email` que ya existe, el registro se **actualiza** en lugar de duplicarse.

---

## ☁️ Despliegue en Hosting Apache (cPanel)

1. Subir todos los archivos al `public_html` o subdirectorio deseado
2. El `.htaccess` ya está configurado con:
   - ✅ Compresión Gzip para carga rápida
   - ✅ Caché del navegador (imágenes 1 año, CSS/JS 1 semana)
   - ✅ Protección de archivos sensibles (`server.js`, `package.json`, `leads.json`)
   - ✅ Cabeceras de seguridad HTTP
   - ✅ Fallback a `index.html` para rutas no encontradas

> En hosting compartido Apache **no corre Node.js** — el formulario requiere adaptar el endpoint a PHP o usar un servicio externo (Formspree, Netlify Forms, etc.)

---

## 📦 Despliegue en Vercel (recomendado para Node)

```bash
# Instalar CLI de Vercel
npm i -g vercel

# Login y deploy
vercel
```

El `package.json` ya tiene el script `start` configurado:
```json
"scripts": {
  "start": "node server.js"
}
```

---

## 🛠️ Desarrollo

### Editar la landing

- **Contenido y estructura:** editar `index.html`
- **Estilos personalizados:** editar `style.css`
- **Lógica del servidor / API:** editar `server.js`

### Stack usado

| Tecnología | Uso |
|-----------|-----|
| HTML5 + Tailwind CSS (CDN) | Estructura y diseño |
| CSS3 (Vanilla) | Animaciones y estilos custom |
| JavaScript (Vanilla) | Interactividad del frontend |
| Node.js (`http`, `fs`) | Servidor y API sin frameworks externos |
| Font Awesome 6 | Íconos |
| Google Fonts (Inter, Outfit) | Tipografía |

### Funcionalidades de la app que se muestran en la landing

| Sección | Descripción |
|---------|-------------|
| 🪢 Nudos Scout | Visor interactivo de nudos y amarres |
| 🔥 Cancionero / Fogatas | Cancionero con modo fogata (pantalla cálida) |
| 🧭 Brújula Digital | Brújula funcional usando sensor del dispositivo |
| 📡 GPS + SOS | Localización de emergencia con código Morse |
| 📋 Agenda Scout | Planificador de actividades |
| 📖 Enciclopedia | Manuales y guías 100% offline |

---

## 🔐 Seguridad

- Path traversal protegido en el servidor (no se puede acceder a rutas fuera del directorio raíz)
- Payloads limitados a 1MB en la API
- Validación de formato de correo electrónico en el servidor
- `.htaccess` bloquea acceso directo a `server.js`, `leads.json` y `package.json`

---

## 📄 Licencia

Proyecto privado — **AppScout / Scout Wiki**
© 2026 Beer17. Todos los derechos reservados.
