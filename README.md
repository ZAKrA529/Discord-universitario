# 🎓 Campus Virtual - Backend API

Backend completo para el sistema de mensajería del Campus Virtual Universitario.

## 🚀 Tecnologías

- **Python 3.8+**
- **Flask** - Framework web
- **SQLAlchemy** - ORM para base de datos
- **SQLite** - Base de datos (puede migrar a PostgreSQL/MySQL)
- **Flask-CORS** - Manejo de CORS

## 📦 Instalación

### 1. Crear entorno virtual

```bash
python -m venv venv
```

### 2. Activar entorno virtual

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno (opcional)

```bash
cp .env.example .env
```

Edita `.env` según tus necesidades.

## 🏃 Ejecutar el servidor

```bash
python app.py
```

El servidor estará disponible en: `http://localhost:5000`

## 🔧 Inicializar la base de datos

**Opción 1: Automática (con datos de ejemplo)**

Hacer una petición POST a:
```
POST http://localhost:5000/api/init
```

Esto creará las tablas y agregará usuarios y mensajes de ejemplo.

**Opción 2: Manual**

Las tablas se crean automáticamente al iniciar el servidor por primera vez.

## 📡 Endpoints de la API

### Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Obtener todos los usuarios |
| GET | `/api/users/<id>` | Obtener usuario específico |
| POST | `/api/users` | Crear nuevo usuario |
| PUT | `/api/users/<id>` | Actualizar usuario |

### Mensajes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/messages` | Obtener todos los mensajes |
| GET | `/api/messages/<id>` | Obtener mensaje específico |
| POST | `/api/messages` | Crear nuevo mensaje |
| PUT | `/api/messages/<id>` | Editar mensaje |
| DELETE | `/api/messages/<id>` | Eliminar mensaje |

### Imágenes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/upload-image` | Subir imagen adjunta |

### Inicialización

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/init` | Inicializar BD con datos de ejemplo |

## 📝 Ejemplos de uso

### Crear un mensaje

```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 4,
    "author": "Juan Pérez",
    "authorInitials": "JD",
    "avatarColor": "#003366",
    "text": "Hola, este es mi primer mensaje",
    "attachments": []
  }'
```

### Editar un mensaje

```bash
curl -X PUT http://localhost:5000/api/messages/1 \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Mensaje editado"
  }'
```

### Eliminar un mensaje

```bash
curl -X DELETE http://localhost:5000/api/messages/1
```

### Obtener todos los mensajes

```bash
curl http://localhost:5000/api/messages
```

## 🗄️ Estructura de la Base de Datos

### Tabla: users
- `id` - INTEGER (Primary Key)
- `name` - VARCHAR(100)
- `initials` - VARCHAR(5)
- `avatar_color` - VARCHAR(20)
- `badge` - VARCHAR(50) (nullable)
- `status` - VARCHAR(20)
- `created_at` - DATETIME

### Tabla: messages
- `id` - INTEGER (Primary Key)
- `user_id` - INTEGER (Foreign Key)
- `author` - VARCHAR(100)
- `author_initials` - VARCHAR(5)
- `avatar_color` - VARCHAR(20)
- `badge` - VARCHAR(50) (nullable)
- `badge_color` - VARCHAR(20) (nullable)
- `text` - TEXT
- `edited` - BOOLEAN
- `timestamp` - DATETIME

### Tabla: attachments
- `id` - INTEGER (Primary Key)
- `message_id` - INTEGER (Foreign Key)
- `name` - VARCHAR(200)
- `size` - VARCHAR(20)
- `type` - VARCHAR(50)
- `data` - TEXT (Base64 para imágenes)
- `created_at` - DATETIME

## 🔐 Seguridad

Para producción, recuerda:

1. Cambiar `SECRET_KEY` en `.env`
2. Configurar CORS apropiadamente
3. Usar HTTPS
4. Agregar autenticación (JWT)
5. Validar y sanitizar inputs
6. Migrar a PostgreSQL/MySQL

## 🚀 Despliegue

### Heroku

```bash
# Instalar Heroku CLI
heroku login
heroku create campus-virtual-api
git push heroku main
```

### Railway

1. Conecta tu repositorio
2. Railway detectará Flask automáticamente
3. Agrega variables de entorno

### Render

1. Crea un nuevo Web Service
2. Conecta tu repositorio
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `python app.py`

## 📚 Próximas mejoras

- [ ] Autenticación con JWT
- [ ] WebSockets para chat en tiempo real
- [ ] Paginación de mensajes
- [ ] Búsqueda de mensajes
- [ ] Notificaciones push
- [ ] Rate limiting
- [ ] Tests unitarios
- [ ] Documentación con Swagger

## 📄 Licencia

MIT License - Libre para uso educativo
