require('express-async-errors')
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()
const config = require('./utils/config')

const authRouter = require('./controllers/auth')
const usersRouter = require('./controllers/users')
const shopsRouter = require('./controllers/shops')
const productsRouter = require('./controllers/products')
const ordersRouter = require('./controllers/orders')

const app = express()

// Middleware
app.disable('x-powered-by')
app.use(cors({
    origin: config.CORS_ORIGINS.length > 0 ? config.CORS_ORIGINS : false
}))
app.use(express.json({ limit: '100kb' }))
app.use(morgan('dev'))

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'Bienvenido a la API de Virtual REC',
        version: '1.0.0'
    })
})

app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

// Ruta de documentación
app.get('/api/docs', (req, res) => {
    res.json({
        name: 'Virtual REC API',
        version: '1.0.0',
        description: 'API para la tienda virtual del festival REC.0',
        endpoints: {
            auth: {
                login: 'POST /api/auth/login',
                refresh: 'POST /api/auth/refresh'
            },
            users: {
                register: 'POST /api/users/register',
                getAll: 'GET /api/users',
                getById: 'GET /api/users/:id',
                update: 'PUT /api/users/:id',
                delete: 'DELETE /api/users/:id'
            },
            shops: {
                create: 'POST /api/shops',
                getAll: 'GET /api/shops',
                getById: 'GET /api/shops/:id',
                getByOwner: 'GET /api/shops/owner/:ownerId',
                update: 'PUT /api/shops/:id',
                delete: 'DELETE /api/shops/:id'
            },
            products: {
                create: 'POST /api/products',
                getAll: 'GET /api/products',
                getById: 'GET /api/products/:id',
                getByShop: 'GET /api/products/shop/:shopId',
                update: 'PUT /api/products/:id',
                delete: 'DELETE /api/products/:id'
            },
            orders: {
                create: 'POST /api/orders',
                getAll: 'GET /api/orders',
                getById: 'GET /api/orders/:id',
                getByShopper: 'GET /api/orders/shopper/:shopperId',
                getByShop: 'GET /api/orders/shop/:shopId',
                updateStatus: 'PUT /api/orders/:id/status'
            }
        }
    })
})

// Rutas de la API
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/shops', shopsRouter)
app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)

// Manejador de errores
app.use((err, req, res, next) => {
    console.error(err.stack)
    if (err instanceof SyntaxError && err.status === 400) {
        return res.status(400).json({ error: 'JSON inválido' })
    }
    res.status(500).json({ error: 'Algo salió mal!' })
})

module.exports = app