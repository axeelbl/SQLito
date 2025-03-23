const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const usersModel = require('../models/users')
const { verifyToken, checkRole } = require('../middleware/auth')

// Registrar un nuevo usuario (por defecto SHOPPER)
usersRouter.post('/register', async (req, res) => {
    try {
        const { username, name, password, email } = req.body

        // Validaciones básicas
        if (!username || !name || !password || !email) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' })
        }

        // Validar que el usuario no exista
        const existingUser = await usersModel.getUserByUsername(username)
        if (existingUser) {
            return res.status(400).json({ error: 'El nombre de usuario ya existe' })
        }

        // Validar que el email no exista
        const existingEmail = await usersModel.getUserByEmail(email)
        if (existingEmail) {
            return res.status(400).json({ error: 'El email ya está registrado' })
        }

        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        const user = {
            username,
            name,
            password: hashedPassword,
            email,
            role: 'SHOPPER' // Por defecto es SHOPPER
        }

        const savedUser = await usersModel.createUser(user)
        res.status(201).json(savedUser)
    } catch (error) {
        console.error('Error al registrar usuario:', error)
        res.status(500).json({ error: 'Error al registrar usuario' })
    }
})

// Crear usuario (solo admin)
usersRouter.post('/', verifyToken, checkRole(['ADMIN']), async (req, res) => {
    try {
        const { username, name, password, email, role } = req.body

        // Validaciones básicas
        if (!username || !name || !password || !email || !role) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' })
        }

        // Validar rol válido
        if (!['ADMIN', 'SALES', 'SHOPPER'].includes(role)) {
            return res.status(400).json({ error: 'Rol no válido' })
        }

        // Validar que el usuario no exista
        const existingUser = await usersModel.getUserByUsername(username)
        if (existingUser) {
            return res.status(400).json({ error: 'El nombre de usuario ya existe' })
        }

        // Validar que el email no exista
        const existingEmail = await usersModel.getUserByEmail(email)
        if (existingEmail) {
            return res.status(400).json({ error: 'El email ya está registrado' })
        }

        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        const user = {
            username,
            name,
            password: hashedPassword,
            email,
            role
        }

        const savedUser = await usersModel.createUser(user)
        res.status(201).json(savedUser)
    } catch (error) {
        console.error('Error al crear usuario:', error)
        res.status(500).json({ error: 'Error al crear usuario' })
    }
})

// Endpoint principal - solo muestra datos
usersRouter.get('/', async (req, res) => {
    try {
        // Obtener usuarios sin verificación de token (temporalmente)
        const users = await usersModel.getAllUsers()
        
        // Respuesta solo con datos
        res.json(users)
    } catch (error) {
        console.error('Error al obtener usuarios:', error)
        res.status(500).json({ error: 'Error al obtener usuarios' })
    }
})

// Obtener usuario por ID (acceso público temporal)
usersRouter.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id
        
        const user = await usersModel.getUserById(userId)
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' })
        }
        
        res.json(user)
    } catch (error) {
        console.error('Error al obtener usuario:', error)
        res.status(500).json({ error: 'Error al obtener usuario' })
    }
})

// Actualizar usuario (admin o propietario)
usersRouter.put('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.params.id
        const { name, email, password, role } = req.body
        
        // Verificar permisos (solo admin o el propio usuario)
        if (req.user.role !== 'ADMIN' && req.user.id != userId) {
            return res.status(403).json({ error: 'No tienes permiso para actualizar este usuario' })
        }
        
        // Solo el admin puede cambiar el rol
        if (role && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'No tienes permiso para cambiar el rol' })
        }
        
        const user = await usersModel.getUserById(userId)
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' })
        }
        
        const updateData = {
            name: name || user.name,
            email: email || user.email
        }
        
        // Si se proporciona nueva contraseña, hashearla
        if (password) {
            const saltRounds = 10
            updateData.password = await bcrypt.hash(password, saltRounds)
        }
        
        // Si es admin y proporciona rol, actualizarlo
        if (req.user.role === 'ADMIN' && role) {
            updateData.role = role
        }
        
        const updatedUser = await usersModel.updateUser(userId, updateData)
        res.json(updatedUser)
    } catch (error) {
        console.error('Error al actualizar usuario:', error)
        res.status(500).json({ error: 'Error al actualizar usuario' })
    }
})

// Eliminar usuario (solo admin)
usersRouter.delete('/:id', verifyToken, checkRole(['ADMIN']), async (req, res) => {
    try {
        const userId = req.params.id
        
        const user = await usersModel.getUserById(userId)
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' })
        }
        
        await usersModel.deleteUser(userId)
        res.status(200).json({ message: 'Usuario eliminado correctamente' })
    } catch (error) {
        console.error('Error al eliminar usuario:', error)
        res.status(500).json({ error: 'Error al eliminar usuario' })
    }
})

module.exports = usersRouter