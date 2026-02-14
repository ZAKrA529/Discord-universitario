"""
Backend API para Campus Virtual Universitario
Python + Flask + SQLite + JWT Authentication
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import os
import base64
from functools import wraps

# Inicializar Flask
app = Flask(__name__)
CORS(app)  # Permitir CORS para desarrollo

# Configuración de la base de datos
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'campus.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['SECRET_KEY'] = 'tu-clave-super-secreta-cambiar-en-produccion'  # Cambiar en producción
app.config['JWT_EXPIRATION_HOURS'] = 24  # Token expira en 24 horas

db = SQLAlchemy(app)

# ===================================
# DECORADOR PARA PROTEGER RUTAS
# ===================================

def token_required(f):
    """Decorador para verificar token JWT"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Obtener token del header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # "Bearer TOKEN"
            except IndexError:
                return jsonify({'error': 'Token mal formado'}), 401
        
        if not token:
            return jsonify({'error': 'Token no proporcionado'}), 401
        
        try:
            # Decodificar token
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(payload['user_id'])
            
            if not current_user:
                return jsonify({'error': 'Usuario no encontrado'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# ===================================
# MODELOS DE BASE DE DATOS
# ===================================

class User(db.Model):
    """Modelo de Usuario"""
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    initials = db.Column(db.String(5), nullable=False)
    avatar_color = db.Column(db.String(20), default='#003366')
    badge = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(20), default='online')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación con mensajes
    messages = db.relationship('Message', backref='user', lazy=True)
    
    def set_password(self, password):
        """Encriptar contraseña"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verificar contraseña"""
        return check_password_hash(self.password_hash, password)
    
    def generate_token(self):
        """Generar token JWT"""
        payload = {
            'user_id': self.id,
            'email': self.email,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
        return token
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'initials': self.initials,
            'avatarColor': self.avatar_color,
            'badge': self.badge,
            'status': self.status
        }


class Message(db.Model):
    """Modelo de Mensaje"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    author = db.Column(db.String(100), nullable=False)
    author_initials = db.Column(db.String(5), nullable=False)
    avatar_color = db.Column(db.String(20), nullable=False)
    badge = db.Column(db.String(50), nullable=True)
    badge_color = db.Column(db.String(20), nullable=True)
    text = db.Column(db.Text, nullable=False)
    edited = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación con attachments
    attachments = db.relationship('Attachment', backref='message', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'author': self.author,
            'authorInitials': self.author_initials,
            'avatarColor': self.avatar_color,
            'badge': self.badge,
            'badgeColor': self.badge_color,
            'timestamp': self.timestamp.isoformat(),
            'text': self.text,
            'attachments': [att.to_dict() for att in self.attachments],
            'edited': self.edited
        }


class Attachment(db.Model):
    """Modelo de Archivo Adjunto"""
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('message.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    size = db.Column(db.String(20), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    data = db.Column(db.Text, nullable=True)  # Base64 para imágenes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'size': self.size,
            'type': self.type,
            'data': self.data
        }


# ===================================
# RUTAS DE AUTENTICACIÓN
# ===================================

@app.route('/api/register', methods=['POST'])
def register():
    """Registrar nuevo usuario"""
    data = request.json
    
    # Validar datos requeridos
    if not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'error': 'Email, contraseña y nombre son requeridos'}), 400
    
    # Verificar si el email ya existe
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'El email ya está registrado'}), 400
    
    # Generar iniciales automáticamente
    name_parts = data['name'].strip().split()
    if len(name_parts) >= 2:
        initials = (name_parts[0][0] + name_parts[-1][0]).upper()
    else:
        initials = data['name'][:2].upper()
    
    # Generar color aleatorio de la paleta universitaria
    colors = ['#003366', '#FFB81C', '#006E7F', '#8B1538', '#4A90E2']
    import random
    avatar_color = random.choice(colors)
    
    # Crear nuevo usuario
    new_user = User(
        email=data['email'],
        name=data['name'],
        initials=initials,
        avatar_color=avatar_color,
        badge=data.get('badge'),  # Opcional
        status='online'
    )
    new_user.set_password(data['password'])
    
    try:
        db.session.add(new_user)
        db.session.commit()
        
        # Generar token
        token = new_user.generate_token()
        
        return jsonify({
            'message': 'Usuario registrado exitosamente',
            'user': new_user.to_dict(),
            'token': token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al crear usuario: {str(e)}'}), 500


@app.route('/api/login', methods=['POST'])
def login():
    """Iniciar sesión"""
    data = request.json
    
    # Validar datos
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email y contraseña son requeridos'}), 400
    
    # Buscar usuario
    user = User.query.filter_by(email=data['email']).first()
    
    # Verificar usuario y contraseña
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Email o contraseña incorrectos'}), 401
    
    # Actualizar estado a online
    user.status = 'online'
    db.session.commit()
    
    # Generar token
    token = user.generate_token()
    
    return jsonify({
        'message': 'Inicio de sesión exitoso',
        'user': user.to_dict(),
        'token': token
    }), 200


@app.route('/api/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Cerrar sesión"""
    current_user.status = 'offline'
    db.session.commit()
    
    return jsonify({'message': 'Sesión cerrada exitosamente'}), 200


@app.route('/api/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Obtener información del usuario actual"""
    return jsonify(current_user.to_dict()), 200


# ===================================
# RUTAS API - USUARIOS
# ===================================

@app.route('/api/users', methods=['GET'])
def get_users():
    """Obtener todos los usuarios"""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])


@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Obtener un usuario específico"""
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


@app.route('/api/users', methods=['POST'])
def create_user():
    """Crear un nuevo usuario"""
    data = request.json
    
    new_user = User(
        name=data['name'],
        initials=data['initials'],
        avatar_color=data.get('avatarColor', '#003366'),
        badge=data.get('badge'),
        status=data.get('status', 'online')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify(new_user.to_dict()), 201


@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Actualizar un usuario"""
    user = User.query.get_or_404(user_id)
    data = request.json
    
    user.name = data.get('name', user.name)
    user.initials = data.get('initials', user.initials)
    user.avatar_color = data.get('avatarColor', user.avatar_color)
    user.badge = data.get('badge', user.badge)
    user.status = data.get('status', user.status)
    
    db.session.commit()
    
    return jsonify(user.to_dict())


# ===================================
# RUTAS API - MENSAJES
# ===================================

@app.route('/api/messages', methods=['GET'])
def get_messages():
    """Obtener todos los mensajes"""
    messages = Message.query.order_by(Message.timestamp.asc()).all()
    return jsonify([msg.to_dict() for msg in messages])


@app.route('/api/messages/<int:message_id>', methods=['GET'])
def get_message(message_id):
    """Obtener un mensaje específico"""
    message = Message.query.get_or_404(message_id)
    return jsonify(message.to_dict())


@app.route('/api/messages', methods=['POST'])
@token_required
def create_message(current_user):
    """Crear un nuevo mensaje (requiere autenticación)"""
    data = request.json
    
    # Usar datos del usuario autenticado
    new_message = Message(
        user_id=current_user.id,
        author=current_user.name,
        author_initials=current_user.initials,
        avatar_color=current_user.avatar_color,
        badge=current_user.badge,
        badge_color='#FFB81C' if current_user.badge else None,
        text=data['text'],
        edited=False
    )
    
    db.session.add(new_message)
    db.session.commit()
    
    # Agregar attachments si existen
    if 'attachments' in data and data['attachments']:
        for att_data in data['attachments']:
            attachment = Attachment(
                message_id=new_message.id,
                name=att_data['name'],
                size=att_data['size'],
                type=att_data['type'],
                data=att_data.get('data')
            )
            db.session.add(attachment)
        
        db.session.commit()
    
    return jsonify(new_message.to_dict()), 201


@app.route('/api/messages/<int:message_id>', methods=['PUT'])
@token_required
def update_message(current_user, message_id):
    """Actualizar un mensaje (editar) - Solo el autor puede editar"""
    message = Message.query.get_or_404(message_id)
    
    # Verificar que el usuario sea el autor
    if message.user_id != current_user.id:
        return jsonify({'error': 'No tienes permiso para editar este mensaje'}), 403
    
    data = request.json
    
    message.text = data.get('text', message.text)
    message.edited = True
    
    db.session.commit()
    
    return jsonify(message.to_dict())


@app.route('/api/messages/<int:message_id>', methods=['DELETE'])
@token_required
def delete_message(current_user, message_id):
    """Eliminar un mensaje - Solo el autor puede eliminar"""
    message = Message.query.get_or_404(message_id)
    
    # Verificar que el usuario sea el autor
    if message.user_id != current_user.id:
        return jsonify({'error': 'No tienes permiso para eliminar este mensaje'}), 403
    
    db.session.delete(message)
    db.session.commit()
    
    return jsonify({'message': 'Mensaje eliminado correctamente'}), 200


# ===================================
# RUTAS API - ATTACHMENTS
# ===================================

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    """Subir una imagen"""
    data = request.json
    
    # Validar datos
    if 'messageId' not in data or 'image' not in data:
        return jsonify({'error': 'Datos incompletos'}), 400
    
    attachment = Attachment(
        message_id=data['messageId'],
        name=data['name'],
        size=data['size'],
        type='image',
        data=data['image']
    )
    
    db.session.add(attachment)
    db.session.commit()
    
    return jsonify(attachment.to_dict()), 201


# ===================================
# RUTA DE INICIALIZACIÓN
# ===================================

@app.route('/api/init', methods=['POST'])
def initialize_database():
    """Inicializar la base de datos con datos de ejemplo"""
    
    # Limpiar base de datos existente
    db.drop_all()
    db.create_all()
    
    # Crear usuarios de ejemplo
    users = [
        User(
            name="Dr. Roberto Gómez",
            initials="DR",
            avatar_color="#8B1538",
            badge="PROFESOR"
        ),
        User(
            name="Administración",
            initials="AD",
            avatar_color="#006E7F",
            badge="OFICIAL"
        ),
        User(
            name="María López",
            initials="ML",
            avatar_color="#4A90E2",
            badge="MONITOR"
        ),
        User(
            name="Juan Pérez",
            initials="JD",
            avatar_color="#003366",
            badge=None
        ),
        User(
            name="Carlos Silva",
            initials="CS",
            avatar_color="#003366",
            badge=None
        )
    ]
    
    for user in users:
        db.session.add(user)
    
    db.session.commit()
    
    # Crear mensajes de ejemplo
    messages = [
        Message(
            user_id=1,
            author="Dr. Roberto Gómez",
            author_initials="DR",
            avatar_color="#8B1538",
            badge="PROFESOR",
            badge_color="#FFB81C",
            text="¡Buenos días a todos! Les recuerdo que mañana tenemos examen parcial de Cálculo I. El examen será presencial en el Aula Magna a las 8:00 AM. Lleguen 15 minutos antes con su identificación estudiantil.",
            timestamp=datetime(2025, 2, 13, 10, 30)
        ),
        Message(
            user_id=2,
            author="Administración",
            author_initials="AD",
            avatar_color="#006E7F",
            badge="OFICIAL",
            badge_color="#006E7F",
            text="📚 **Biblioteca Virtual Actualizada**\nYa están disponibles los nuevos recursos digitales para el semestre. Pueden acceder desde el canal #biblioteca-virtual con sus credenciales institucionales.",
            timestamp=datetime(2025, 2, 13, 9, 15)
        ),
        Message(
            user_id=3,
            author="María López",
            author_initials="ML",
            avatar_color="#4A90E2",
            badge="MONITOR",
            badge_color="#10b981",
            text="Hola equipo 👋 Les comparto el calendario de tutorías de esta semana:",
            timestamp=datetime(2025, 2, 13, 8, 45)
        )
    ]
    
    for msg in messages:
        db.session.add(msg)
    
    db.session.commit()
    
    # Agregar attachment al mensaje 3
    attachment = Attachment(
        message_id=3,
        name="calendario-tutorias-marzo.pdf",
        size="245 KB",
        type="pdf"
    )
    db.session.add(attachment)
    db.session.commit()
    
    return jsonify({
        'message': 'Base de datos inicializada correctamente',
        'users': len(users),
        'messages': len(messages)
    }), 201


# ===================================
# RUTA PRINCIPAL
# ===================================

@app.route('/')
def index():
    """Ruta principal"""
    return jsonify({
        'message': 'Campus Virtual API',
        'version': '1.0',
        'endpoints': {
            'users': '/api/users',
            'messages': '/api/messages',
            'init': '/api/init (POST)'
        }
    })


# ===================================
# MANEJO DE ERRORES
# ===================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Recurso no encontrado'}), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Error interno del servidor'}), 500


# ===================================
# EJECUTAR SERVIDOR
# ===================================

if __name__ == '__main__':
    # Crear las tablas si no existen
    with app.app_context():
        db.create_all()
    
    # Iniciar servidor
    app.run(debug=True, host='0.0.0.0', port=5000)
