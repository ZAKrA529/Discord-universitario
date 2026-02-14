# 🎓 Campus Virtual - Sistema Completo con Autenticación

Sistema de mensajería estilo Discord para universidades con registro, login y autenticación JWT.

## ✨ Características

- 🔐 **Registro de usuarios** - Crear cuenta con email y contraseña
- 🔑 **Login/Logout** - Sistema de autenticación con JWT
- 💬 **Chat en tiempo real** - Enviar mensajes solo usuarios autenticados
- 🖼️ **Subir imágenes** - Compartir imágenes en el chat
- ✏️ **Editar mensajes** - Solo tus propios mensajes
- 🗑️ **Eliminar mensajes** - Solo tus propios mensajes
- 🎨 **Avatares automáticos** - Colores y iniciales generados
- 👥 **Roles** - Estudiante, Monitor, Profesor

---

## 🚀 Instalación Paso a Paso

### **1. Instalar Python**
Descarga Python 3.8+ desde https://python.org

### **2. Crear carpeta del proyecto**
```bash
mkdir campus-virtual
cd campus-virtual
```

### **3. Crear entorno virtual**
```bash
python -m venv venv
```

### **4. Activar entorno virtual**

**Windows (PowerShell):**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### **5. Instalar dependencias**
```bash
pip install Flask Flask-CORS Flask-SQLAlchemy python-dotenv PyJWT
```

O con requirements.txt:
```bash
pip install -r requirements.txt
```

### **6. Colocar archivos**
```
campus-virtual/
├── app.py                           ← Backend
├── requirements.txt
├── login.html                       ← Página de login
├── register.html                    ← Página de registro
├── discord-university-demo.html     ← Chat principal
├── discord-university.css           ← Estilos
├── chat-app-backend.js             ← JavaScript del chat
└── campus.db                        ← BD (se crea automáticamente)
```

---

## 🏃 Ejecutar el Proyecto

### **Paso 1: Iniciar el servidor**
```bash
python app.py
```

Deberías ver:
```
* Running on http://127.0.0.1:5000
* Running on http://0.0.0.0:5000
```

### **Paso 2: Abrir en navegador**

1. Abre **login.html** en tu navegador
2. O ve directo a: `http://localhost:5000` (si configuras ruta estática)

---

## 📝 Cómo Usar

### **1. Crear una cuenta**

1. Abre `register.html` en tu navegador
2. Llena el formulario:
   - **Nombre completo**: Juan Pérez
   - **Email**: juan@universidad.edu
   - **Contraseña**: mínimo 6 caracteres
   - **Rol** (opcional): Estudiante/Monitor/Profesor
3. Click en "Crear Cuenta"
4. Serás redirigido automáticamente al chat

### **2. Iniciar sesión**

1. Abre `login.html` 
2. Ingresa tu email y contraseña
3. Click en "Iniciar Sesión"
4. Serás redirigido al chat

### **3. Enviar mensajes**

1. Escribe en el input de abajo
2. Presiona **Enter** o click en 📤
3. Tu mensaje aparecerá en el chat

### **4. Subir imágenes**

1. Click en 📎 (clip)
2. Selecciona una imagen (máx 5MB)
3. Se subirá automáticamente

### **5. Editar mensajes**

1. Pasa el mouse sobre TU mensaje
2. Click en ✏️
3. Edita el texto
4. Presiona Enter

### **6. Eliminar mensajes**

1. Pasa el mouse sobre TU mensaje
2. Click en 🗑️
3. Confirma la eliminación

### **7. Cerrar sesión**

Click en 🚪 (puerta) en la esquina inferior del sidebar

---

## 🔒 Sistema de Autenticación

### **¿Cómo funciona?**

1. **Registro**: 
   - Password se encripta con `bcrypt`
   - Se genera un token JWT de 24 horas
   - Token y usuario se guardan en `localStorage`

2. **Login**:
   - Verifica email y password
   - Genera nuevo token JWT
   - Guarda en `localStorage`

3. **Protección de rutas**:
   - Cada request incluye: `Authorization: Bearer TOKEN`
   - Backend verifica el token
   - Si es inválido/expirado → Error 401

4. **Logout**:
   - Limpia `localStorage`
   - Redirige a login

### **Tokens JWT**

El token contiene:
```json
{
  "user_id": 1,
  "email": "juan@universidad.edu",
  "exp": 1234567890  // Expira en 24h
}
```

---

## 🗄️ Base de Datos

### **Tablas**

**users:**
- id
- email (único)
- password_hash
- name
- initials (auto-generadas)
- avatar_color (aleatorio de la paleta)
- badge (PROFESOR, MONITOR, null)
- status (online/offline)
- created_at

**messages:**
- id
- user_id (foreign key)
- author
- author_initials
- avatar_color
- badge
- badge_color
- text
- edited (true/false)
- timestamp

**attachments:**
- id
- message_id (foreign key)
- name
- size
- type (image/pdf)
- data (base64)
- created_at

### **Ver la BD**

Instala DB Browser for SQLite:
https://sqlitebrowser.org/

Abre `campus.db` para ver los datos.

---

## 📡 Endpoints de la API

### **Autenticación**

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/register` | Registrar usuario | No |
| POST | `/api/login` | Iniciar sesión | No |
| POST | `/api/logout` | Cerrar sesión | Sí |
| GET | `/api/me` | Usuario actual | Sí |

### **Mensajes**

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/messages` | Todos los mensajes | No |
| POST | `/api/messages` | Crear mensaje | Sí |
| PUT | `/api/messages/:id` | Editar mensaje | Sí |
| DELETE | `/api/messages/:id` | Eliminar mensaje | Sí |

### **Usuarios**

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | Todos los usuarios | No |
| GET | `/api/users/:id` | Usuario específico | No |

---

## 🔧 Solución de Problemas

### **Error: "Token expirado"**
- El token dura 24 horas
- Cierra sesión y vuelve a iniciar

### **Error: "No se pudo conectar con el servidor"**
- Verifica que el servidor esté corriendo: `python app.py`
- Revisa la URL: debe ser `http://localhost:5000/api`

### **Error: "El email ya está registrado"**
- Ese email ya existe en la BD
- Usa otro email o inicia sesión

### **Error: "CORS policy"**
- Asegúrate de tener Flask-CORS instalado
- Verifica que `CORS(app)` esté en app.py

### **Los mensajes no se muestran**
- Abre la consola del navegador (F12)
- Verifica errores de JavaScript
- Revisa que tengas un token válido en localStorage

---

## 🎨 Personalización

### **Cambiar colores**

En `app.py`, línea ~140:
```python
colors = ['#003366', '#FFB81C', '#006E7F', '#8B1538', '#4A90E2']
```

### **Cambiar duración del token**

En `app.py`, línea ~18:
```python
app.config['JWT_EXPIRATION_HOURS'] = 24  # Cambiar a 48, 72, etc.
```

### **Agregar más roles**

En `register.html`, línea ~115:
```html
<option value="ADMIN">Administrador</option>
```

---

## 🚀 Deploy a Producción

### **Heroku**

1. Crea `Procfile`:
```
web: gunicorn app:app
```

2. Instala gunicorn:
```bash
pip install gunicorn
pip freeze > requirements.txt
```

3. Deploy:
```bash
git init
git add .
git commit -m "Initial commit"
heroku create campus-virtual-app
git push heroku main
```

### **Railway**

1. Conecta tu repo de GitHub
2. Railway detecta Flask automáticamente
3. Configura variables de entorno

### **Cambios necesarios para producción:**

1. **SECRET_KEY**: Cambiar en app.py
```python
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback-key')
```

2. **Base de datos**: Migrar a PostgreSQL
```python
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
```

3. **CORS**: Configurar dominios permitidos
```python
CORS(app, origins=['https://tu-dominio.com'])
```

4. **HTTPS**: Usar siempre en producción

---

## 📚 Próximas Mejoras

- [ ] WebSockets para chat en tiempo real
- [ ] Recuperar contraseña por email
- [ ] Verificación de email
- [ ] Paginación de mensajes
- [ ] Búsqueda de mensajes
- [ ] Múltiples canales
- [ ] Mensajes directos
- [ ] Notificaciones push
- [ ] Soporte para archivos (PDF, Word)
- [ ] Videollamadas
- [ ] Tests unitarios

---

## 🐛 Reportar Errores

Si encuentras algún error, por favor reporta:
- Pasos para reproducir
- Mensaje de error completo
- Navegador y versión
- Capturas de pantalla

---

## 📄 Licencia

MIT License - Libre para uso educativo

---

¡Disfruta tu Campus Virtual! 🎓✨
