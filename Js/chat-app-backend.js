// ===================================
// SISTEMA DE MENSAJERÍA UNIVERSITARIO
// Con conexión a Backend API
// ===================================

class ChatApp {
    constructor() {
        this.messages = [];
        this.currentUser = null;
        this.editingMessageId = null;
        this.apiUrl = 'http://localhost:5000/api';  // URL del backend
        this.token = null;
        
        this.init();
    }
    
    async init() {
        // Verificar autenticación
        if (!this.checkAuth()) {
            window.location.href = 'login.html';
            return;
        }
        
        await this.loadCurrentUser();
        await this.loadMessages();
        this.setupEventListeners();
        this.renderMessages();
    }
    
    // ===================================
    // AUTENTICACIÓN
    // ===================================
    
    checkAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            return false;
        }
        
        this.token = token;
        return true;
    }
    
    logout() {
        Swal.fire({
            title: '¿Cerrar sesión?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#003366',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetch(`${this.apiUrl}/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.token}`
                        }
                    });
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                }
                
                // Limpiar localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                // Redirigir a login
                window.location.href = 'login.html';
            }
        });
    }
    
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }
    
    // ===================================
    // CARGAR DATOS DESDE API
    // ===================================
    
    async loadCurrentUser() {
        try {
            // Obtener usuario de localStorage
            const userStr = localStorage.getItem('user');
            if (userStr) {
                this.currentUser = JSON.parse(userStr);
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error cargando usuario:', error);
            window.location.href = 'login.html';
        }
    }
    
    async loadMessages() {
        try {
            const response = await fetch(`${this.apiUrl}/messages`);
            if (response.ok) {
                this.messages = await response.json();
            } else {
                console.error('Error cargando mensajes');
                this.messages = [];
            }
        } catch (error) {
            console.error('Error conectando con el servidor:', error);
            Swal.fire({
                icon: 'warning',
                title: 'Sin conexión',
                text: 'No se pudo conectar con el servidor. Usando modo offline.',
                confirmButtonColor: '#003366'
            });
            this.messages = [];
        }
    }
    
    // ===================================
    // EVENT LISTENERS
    // ===================================
    
    setupEventListeners() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const imageInput = document.getElementById('imageInput');
        const attachButton = document.getElementById('attachButton');
        const logoutButton = document.getElementById('logoutButton');
        
        // Enviar mensaje con Enter
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Enviar mensaje con botón
        sendButton.addEventListener('click', () => this.sendMessage());
        
        // Abrir selector de archivos
        attachButton.addEventListener('click', () => imageInput.click());
        
        // Manejar selección de imagen
        imageInput.addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });
        
        // Cerrar banner de anuncios
        const closeAnnouncement = document.querySelector('.announcement-close');
        if (closeAnnouncement) {
            closeAnnouncement.addEventListener('click', () => {
                document.querySelector('.announcement-banner').style.display = 'none';
            });
        }
        
        // Logout
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.logout());
        }
    }
    
    // ===================================
    // ENVIAR MENSAJE
    // ===================================
    
    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const text = messageInput.value.trim();
        
        if (!text && !this.editingMessageId) {
            Swal.fire({
                icon: 'warning',
                title: 'Mensaje vacío',
                text: 'Escribe algo antes de enviar',
                confirmButtonColor: '#003366',
                timer: 2000
            });
            return;
        }
        
        if (this.editingMessageId) {
            // Editar mensaje existente
            await this.updateMessage(this.editingMessageId, text);
        } else {
            // Crear nuevo mensaje
            const messageData = {
                text: text,
                attachments: []
            };
            
            try {
                const response = await fetch(`${this.apiUrl}/messages`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(messageData)
                });
                
                if (response.ok) {
                    const newMessage = await response.json();
                    this.messages.push(newMessage);
                    this.renderMessages();
                    this.scrollToBottom();
                } else if (response.status === 401) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Sesión expirada',
                        text: 'Por favor inicia sesión nuevamente',
                        confirmButtonColor: '#003366'
                    }).then(() => {
                        localStorage.clear();
                        window.location.href = 'login.html';
                    });
                } else {
                    throw new Error('Error al enviar mensaje');
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo enviar el mensaje. Verifica tu conexión.',
                    confirmButtonColor: '#003366'
                });
            }
        }
        
        // Limpiar input
        messageInput.value = '';
        messageInput.focus();
    }
    
    // ===================================
    // SUBIR IMAGEN
    // ===================================
    
    async handleImageUpload(file) {
        if (!file) return;
        
        // Validar que sea imagen
        if (!file.type.startsWith('image/')) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Solo se permiten imágenes',
                confirmButtonColor: '#003366'
            });
            return;
        }
        
        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'Archivo muy grande',
                text: 'La imagen no puede superar los 5MB',
                confirmButtonColor: '#003366'
            });
            return;
        }
        
        // Mostrar loading mientras se sube
        Swal.fire({
            title: 'Subiendo imagen...',
            html: 'Por favor espera',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Leer la imagen como base64
        const reader = new FileReader();
        reader.onload = async (e) => {
            const imageData = e.target.result;
            
            // Crear mensaje con imagen
            const messageData = {
                text: '',
                attachments: [
                    {
                        name: file.name,
                        size: this.formatFileSize(file.size),
                        type: 'image',
                        data: imageData
                    }
                ]
            };
            
            try {
                const response = await fetch(`${this.apiUrl}/messages`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(messageData)
                });
                
                if (response.ok) {
                    const newMessage = await response.json();
                    this.messages.push(newMessage);
                    this.renderMessages();
                    this.scrollToBottom();
                    
                    // Cerrar loading y mostrar éxito
                    Swal.fire({
                        icon: 'success',
                        title: '¡Imagen subida!',
                        text: 'Tu imagen se ha compartido correctamente',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    throw new Error('Error al subir imagen');
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo subir la imagen',
                    confirmButtonColor: '#003366'
                });
            }
        };
        
        reader.readAsDataURL(file);
        
        // Limpiar input
        document.getElementById('imageInput').value = '';
    }
    
    // ===================================
    // EDITAR MENSAJE
    // ===================================
    
    startEditMessage(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (!message) return;
        
        // Solo el autor puede editar
        if (message.author !== this.currentUser.name) {
            Swal.fire({
                icon: 'warning',
                title: 'No permitido',
                text: 'Solo puedes editar tus propios mensajes',
                confirmButtonColor: '#003366'
            });
            return;
        }
        
        this.editingMessageId = messageId;
        const messageInput = document.getElementById('messageInput');
        messageInput.value = message.text;
        messageInput.focus();
        
        // Cambiar placeholder
        messageInput.placeholder = `Editando mensaje... (ESC para cancelar)`;
        
        // Agregar listener para ESC
        const escListener = (e) => {
            if (e.key === 'Escape') {
                this.cancelEdit();
                messageInput.removeEventListener('keydown', escListener);
            }
        };
        messageInput.addEventListener('keydown', escListener);
    }
    
    async updateMessage(messageId, newText) {
        try {
            const response = await fetch(`${this.apiUrl}/messages/${messageId}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ text: newText })
            });
            
            if (response.ok) {
                const updatedMessage = await response.json();
                const index = this.messages.findIndex(m => m.id === messageId);
                if (index !== -1) {
                    this.messages[index] = updatedMessage;
                }
                
                this.editingMessageId = null;
                document.getElementById('messageInput').placeholder = 'Escribe un mensaje en #anuncios';
                
                this.renderMessages();
                
                Swal.fire({
                    icon: 'success',
                    title: 'Mensaje editado',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                throw new Error('Error al editar mensaje');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo editar el mensaje',
                confirmButtonColor: '#003366'
            });
        }
    }
    
    cancelEdit() {
        this.editingMessageId = null;
        const messageInput = document.getElementById('messageInput');
        messageInput.value = '';
        messageInput.placeholder = 'Escribe un mensaje en #anuncios';
    }
    
    // ===================================
    // ELIMINAR MENSAJE
    // ===================================
    
    async deleteMessage(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (!message) return;
        
        // Solo el autor puede eliminar
        if (message.author !== this.currentUser.name) {
            Swal.fire({
                icon: 'warning',
                title: 'No permitido',
                text: 'Solo puedes eliminar tus propios mensajes',
                confirmButtonColor: '#003366'
            });
            return;
        }
        
        // Confirmar eliminación con SweetAlert2
        const result = await Swal.fire({
            title: '¿Eliminar mensaje?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        
        if (result.isConfirmed) {
            try {
                const response = await fetch(`${this.apiUrl}/messages/${messageId}`, {
                    method: 'DELETE',
                    headers: this.getAuthHeaders()
                });
                
                if (response.ok) {
                    this.messages = this.messages.filter(m => m.id !== messageId);
                    this.renderMessages();
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Eliminado',
                        text: 'El mensaje ha sido eliminado',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    throw new Error('Error al eliminar mensaje');
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar el mensaje',
                    confirmButtonColor: '#003366'
                });
            }
        }
    }
    
    // ===================================
    // RENDERIZAR MENSAJES
    // ===================================
    
    renderMessages() {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';
        
        this.messages.forEach(message => {
            const messageEl = this.createMessageElement(message);
            container.appendChild(messageEl);
        });
    }
    
    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = 'message';
        div.dataset.messageId = message.id;
        
        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.style.background = message.avatarColor;
        avatar.textContent = message.authorInitials;
        
        // Contenido
        const content = document.createElement('div');
        content.className = 'message-content';
        
        // Header
        const header = document.createElement('div');
        header.className = 'message-header';
        
        const author = document.createElement('span');
        author.className = 'message-author';
        author.textContent = message.author;
        header.appendChild(author);
        
        // Badge si existe
        if (message.badge) {
            const badge = document.createElement('span');
            badge.className = 'message-badge';
            badge.style.background = message.badgeColor;
            badge.style.color = message.badgeColor === '#006E7F' ? 'white' : '#003366';
            badge.textContent = message.badge;
            header.appendChild(badge);
        }
        
        // Timestamp
        const timestamp = document.createElement('span');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = this.formatTimestamp(message.timestamp);
        header.appendChild(timestamp);
        
        // Indicador de editado
        if (message.edited) {
            const edited = document.createElement('span');
            edited.className = 'message-timestamp';
            edited.textContent = '(editado)';
            edited.style.fontStyle = 'italic';
            header.appendChild(edited);
        }
        
        content.appendChild(header);
        
        // Texto del mensaje
        if (message.text) {
            const text = document.createElement('div');
            text.className = 'message-text';
            text.innerHTML = this.formatMessageText(message.text);
            content.appendChild(text);
        }
        
        // Attachments
        if (message.attachments && message.attachments.length > 0) {
            message.attachments.forEach(attachment => {
                const attachEl = this.createAttachmentElement(attachment);
                content.appendChild(attachEl);
            });
        }
        
        // Botones de acción (solo para mensajes del usuario actual)
        if (message.author === this.currentUser.name) {
            const actions = document.createElement('div');
            actions.className = 'message-actions';
            actions.innerHTML = `
                <button class="message-action-btn" onclick="chatApp.startEditMessage(${message.id})" title="Editar">✏️</button>
                <button class="message-action-btn" onclick="chatApp.deleteMessage(${message.id})" title="Eliminar">🗑️</button>
            `;
            content.appendChild(actions);
        }
        
        div.appendChild(avatar);
        div.appendChild(content);
        
        return div;
    }
    
    createAttachmentElement(attachment) {
        const div = document.createElement('div');
        div.className = 'message-attachment';
        
        if (attachment.type === 'image') {
            // Mostrar imagen
            const img = document.createElement('img');
            img.src = attachment.data;
            img.alt = attachment.name;
            img.style.maxWidth = '400px';
            img.style.borderRadius = '8px';
            img.style.marginTop = '8px';
            img.style.cursor = 'pointer';
            img.onclick = () => window.open(attachment.data, '_blank');
            div.appendChild(img);
        } else {
            // Mostrar archivo
            div.innerHTML = `
                <span class="attachment-icon">📄</span>
                <strong>${attachment.name}</strong>
                <span style="color: #9ca3af; font-size: 0.85rem; margin-left: 8px;">${attachment.size}</span>
            `;
        }
        
        return div;
    }
    
    // ===================================
    // UTILIDADES
    // ===================================
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // Si es hoy
        if (diff < 86400000 && date.getDate() === now.getDate()) {
            return `Hoy a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Si es ayer
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.getDate() === yesterday.getDate()) {
            return `Ayer a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Si es más antiguo
        return date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    formatMessageText(text) {
        // Convertir markdown básico
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **negrita**
            .replace(/\n/g, '<br>'); // saltos de línea
        
        return formatted;
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }
}

// ===================================
// INICIALIZAR APP
// ===================================

let chatApp;
document.addEventListener('DOMContentLoaded', () => {
    chatApp = new ChatApp();
});

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .message-actions {
        display: none;
        gap: 8px;
        margin-top: 8px;
    }
    
    .message:hover .message-actions {
        display: flex;
    }
    
    .message-action-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background 0.2s;
    }
    
    .message-action-btn:hover {
        background: var(--bg-secondary);
    }
`;
document.head.appendChild(style);
