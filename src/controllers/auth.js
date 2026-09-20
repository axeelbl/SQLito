const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const usersModel = require('../models/users')
const config = require('../utils/config')

const router = require('express').Router()

// Ruta GET para mostrar información sobre los endpoints de autenticación
router.get('/', (req, res) => {
    res.json({
        message: 'Endpoints de autenticación disponibles',
        endpoints: {
            login: {
                method: 'POST',
                path: '/api/auth/login',
                description: 'Iniciar sesión y obtener tokens',
                body: {
                    username: 'string',
                    password: 'string'
                }
            },
            refresh: {
                method: 'POST',
                path: '/api/auth/refresh',
                description: 'Renovar el token de acceso',
                body: {
                    refreshToken: 'string'
                }
            }
        }
    })
})

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body
        if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' })
        }

        // Buscar usuario por username
        const user = await usersModel.getUserByUsername(username)
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' })
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' })
        }

        // Generar tokens
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            config.JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '24h' }
        )

        const refreshToken = jwt.sign(
            { id: user.id },
            config.JWT_REFRESH_SECRET,
            { algorithm: 'HS256', expiresIn: '7d' }
        )

        res.json({
            token,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    } catch (error) {
        console.error('Error en login:', error)
        res.status(500).json({ error: 'Error al iniciar sesión' })
    }
})

// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body
        if (typeof refreshToken !== 'string' || !refreshToken) {
            return res.status(401).json({ error: 'Refresh token no proporcionado' })
        }

        // Verificar refresh token
        const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET, { algorithms: ['HS256'] })
        const user = await usersModel.getUserById(decoded.id)

        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado' })
        }

        // Generar nuevos tokens
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            config.JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '24h' }
        )

        const newRefreshToken = jwt.sign(
            { id: user.id },
            config.JWT_REFRESH_SECRET,
            { algorithm: 'HS256', expiresIn: '7d' }
        )

        res.json({
            token,
            refreshToken: newRefreshToken
        })
    } catch (error) {
        console.error('Error al refrescar token:', error)
        res.status(401).json({ error: 'Token inválido' })
    }
})

module.exports = router 