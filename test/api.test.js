const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
const request = require('supertest')

const testDataDirectory = path.join(__dirname, '..', '.test-data')
const databasePath = path.join(testDataDirectory, 'database.sqlite')

process.env.NODE_ENV = 'test'
process.env.DATABASE_PATH = databasePath
process.env.JWT_SECRET = 'test-access-secret-with-at-least-32-characters'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-at-least-32-characters'

afterAll(done => {
    const db = require('../src/utils/db')
    db.close(() => {
        fs.rmSync(testDataDirectory, { recursive: true, force: true })
        done()
    })
})

beforeAll(() => {
    fs.rmSync(testDataDirectory, { recursive: true, force: true })
    fs.mkdirSync(testDataDirectory, { recursive: true })
})

const app = require('../src/app')

describe('Virtual REC API', () => {
    test('health check does not create the database', async () => {
        const response = await request(app).get('/health')

        expect(response.status).toBe(200)
        expect(response.body).toEqual({ status: 'ok' })
        expect(fs.existsSync(databasePath)).toBe(false)
        expect(response.headers['x-powered-by']).toBeUndefined()
    })

    test('rejects incomplete login input without touching the database', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'demo' })

        expect(response.status).toBe(400)
        expect(fs.existsSync(databasePath)).toBe(false)
    })

    test('registers and authenticates a valid shopper', async () => {
        const registration = await request(app)
            .post('/api/users/register')
            .send({
                username: 'shopper',
                name: 'Usuario de prueba',
                password: 'strong-password',
                email: 'shopper@example.com'
            })

        expect(registration.status).toBe(201)
        expect(registration.body).toMatchObject({
            username: 'shopper',
            email: 'shopper@example.com',
            role: 'SHOPPER'
        })
        expect(registration.body.password).toBeUndefined()

        const login = await request(app)
            .post('/api/auth/login')
            .send({ username: 'shopper', password: 'strong-password' })

        expect(login.status).toBe(200)
        expect(login.body.token).toEqual(expect.any(String))
        expect(login.body.refreshToken).toEqual(expect.any(String))
    })

    test('protects the user directory and allows administrators', async () => {
        const unauthorized = await request(app).get('/api/users')
        expect(unauthorized.status).toBe(401)

        const adminToken = jwt.sign(
            { id: 999, username: 'test-admin', role: 'ADMIN' },
            process.env.JWT_SECRET,
            { expiresIn: '1m' }
        )
        const authorized = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)

        expect(authorized.status).toBe(200)
        expect(authorized.body).toEqual(expect.arrayContaining([
            expect.objectContaining({ username: 'shopper' })
        ]))
        expect(authorized.body[0].password).toBeUndefined()

        const shopperToken = jwt.sign(
            { id: 1, username: 'shopper', role: 'SHOPPER' },
            process.env.JWT_SECRET,
            { expiresIn: '1m' }
        )
        const forbidden = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${shopperToken}`)
        expect(forbidden.status).toBe(403)
    })

    test('creates and retrieves an order with the initialized schema', async () => {
        const adminToken = jwt.sign(
            { id: 999, username: 'test-admin', role: 'ADMIN' },
            process.env.JWT_SECRET,
            { expiresIn: '1m' }
        )
        const shop = await request(app)
            .post('/api/shops')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Tienda de prueba', owner_id: 1 })
        expect(shop.status).toBe(201)

        const product = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Producto de prueba', price: 9.99, stock: 5, shop_id: shop.body.id })
        expect(product.status).toBe(201)

        const shopperToken = jwt.sign(
            { id: 1, username: 'shopper', role: 'SHOPPER' },
            process.env.JWT_SECRET,
            { expiresIn: '1m' }
        )
        const order = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${shopperToken}`)
            .send({
                shop_id: shop.body.id,
                items: [{ product_id: product.body.id, quantity: 2 }],
                address: 'Calle de prueba 1'
            })

        expect(order.status).toBe(201)
        expect(order.body).toMatchObject({
            shopper_id: 1,
            shop_id: shop.body.id,
            total_amount: 19.98,
            address: 'Calle de prueba 1'
        })

        const detail = await request(app)
            .get(`/api/orders/${order.body.id}`)
            .set('Authorization', `Bearer ${shopperToken}`)
        expect(detail.status).toBe(200)
        expect(detail.body.status_name).toBe('PENDING')

        const unrelatedSalesToken = jwt.sign(
            { id: 2, username: 'sales', role: 'SALES' },
            process.env.JWT_SECRET,
            { expiresIn: '1m' }
        )
        const forbiddenDetail = await request(app)
            .get(`/api/orders/${order.body.id}`)
            .set('Authorization', `Bearer ${unrelatedSalesToken}`)
        expect(forbiddenDetail.status).toBe(403)
    })

    test('rejects malformed order payloads before database access', async () => {
        const shopperToken = jwt.sign(
            { id: 1, username: 'shopper', role: 'SHOPPER' },
            process.env.JWT_SECRET,
            { expiresIn: '1m' }
        )
        const response = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${shopperToken}`)
            .send({ shop_id: 1, items: [], address: '' })

        expect(response.status).toBe(400)
        expect(response.body).toEqual({ error: 'Pedido inválido' })
    })
})
