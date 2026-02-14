# 🚀 GUÍA RÁPIDA DE INSTALACIÓN

## 📁 Estructura de Carpetas

Organiza los archivos descargados así:

```
Javascript/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── .gitignore
│   └── venv/  (crear con: python -m venv venv)
│
├── pages/
│   ├── index.html                    (landing page)
│   ├── login.html
│   ├── register.html
│   └── chat.html                     (renombrar discord-university-demo.html)
│
├── styles/
│   ├── landing.css
│   └── discord-university.css
│
└── src/
    └── chat-app-backend.js
```

---

## ⚙️ INSTALACIÓN PASO A PASO

### 1️⃣ Crear entorno virtual

```bash
cd Javascript/backend
python -m venv venv
```

### 2️⃣ Activar entorno virtual

**Windows (PowerShell):**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 3️⃣ Instalar dependencias

```bash
pip install -r requirements.txt
```

O manualmente:
```bash
pip install Flask Flask-CORS Flask-SQLAlchemy python-dotenv PyJWT
```

---

## 🔧 ACTUALIZAR RUTAS EN HTML

### En `pages/index.html`:
Línea 6:
```html
<link rel="stylesheet" href="../styles/landing.css">
```

### En `pages/login.html`:
Línea 7:
```html
<link rel="stylesheet" href="../styles/discord-university.css">
```

Línea 92 (aproximadamente):
```javascript
window.location.href = 'chat.html';
```

### En `pages/register.html`:
Línea 7:
```html
<link rel="stylesheet" href="../styles/discord-university.css">
```

Línea 197 (aproximadamente):
```javascript
window.location.href = 'chat.html';
```

### En `pages/chat.html`:
Línea 7:
```html
<link rel="stylesheet" href="../styles/discord-university.css">
```

Línea ~330:
```html
<script src="../src/chat-app-backend.js"></script>
```

---

## 🚀 EJECUTAR EL PROYECTO

### Paso 1: Ir a la carpeta backend
```bash
cd Javascript/backend
```

### Paso 2: Activar entorno virtual
```bash
venv\Scripts\activate
```

### Paso 3: Iniciar servidor
```bash
python app.py
```

### Paso 4: Abrir navegador
```
http://localhost:5000
```

---

## ✅ VERIFICAR QUE TODO FUNCIONE

1. Abre `http://localhost:5000` → Debe mostrar la landing page
2. Click en "Registrarse" → Debe abrir el formulario
3. Crea una cuenta de prueba
4. Deberías ser redirigido al chat
5. Envía un mensaje de prueba

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "No module named 'flask'"
```bash
pip install Flask
```

### Error: "No such file or directory: requirements.txt"
Asegúrate de estar en la carpeta `backend/`

### Error: 404 al cargar CSS/JS
Revisa que las rutas usen `../` correctamente

### Base de datos no se crea
El archivo `campus.db` se crea automáticamente al iniciar el servidor

---

## 📝 CHECKLIST

- [ ] Descargué todos los archivos
- [ ] Organicé en las carpetas correctas
- [ ] Creé entorno virtual: `python -m venv venv`
- [ ] Activé entorno: `venv\Scripts\activate`
- [ ] Instalé dependencias: `pip install -r requirements.txt`
- [ ] Actualicé rutas en HTML (../)
- [ ] Ejecuté: `python app.py`
- [ ] Abrí: `http://localhost:5000`
- [ ] Registré una cuenta de prueba
- [ ] Envié un mensaje

---

## 🎓 PRÓXIMOS PASOS

1. Personaliza los textos de la landing page
2. Cambia los colores si quieres (en las variables CSS)
3. Agrega más usuarios de prueba
4. Explora todas las funcionalidades

---

¡Disfruta tu Campus Virtual! 🚀
