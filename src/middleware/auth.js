const jwt = require('jsonwebtoken')
const config = require('../utils/config')

/**
 * Middleware para verificar el token JWT
 * Verifica que el token es válido y añade la información del usuario a req.user
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' })
    }

    const token = authHeader.split(' ')[1]
    
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET)
        req.user = decoded
        next()
    } catch (error) {
        console.error('Error verificando token:', error.message)
        return res.status(401).json({ error: 'Token inválido o expirado' })
    }
}

/**
 * Middleware para verificar roles
 * Comprueba si el rol del usuario está incluido en los roles permitidos
 * @param {Array} roles - Array de roles permitidos
 */
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' })
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' })
        }
        
        next()
    }
}

module.exports = {
    verifyToken,
    checkRole
} 