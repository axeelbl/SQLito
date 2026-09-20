const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const bcrypt = require('bcrypt')

let database

const databasePath = () => path.resolve(
    process.env.DATABASE_PATH || path.join(__dirname, '../../database.sqlite')
)

const initializeDatabase = db => {
    db.serialize(() => {
        db.run('PRAGMA foreign_keys = ON')

        db.run(`
            CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        `)
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'SHOPPER',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        db.run(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT
            )
        `)
        db.run(`
            CREATE TABLE IF NOT EXISTS shops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                owner_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id)
            )
        `)
        db.run(`
            CREATE TABLE IF NOT EXISTS shop_categories (
                shop_id INTEGER NOT NULL,
                category_id INTEGER NOT NULL,
                PRIMARY KEY (shop_id, category_id),
                FOREIGN KEY (shop_id) REFERENCES shops(id),
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        `)
        db.run(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL CHECK (price >= 0),
                size TEXT DEFAULT 'M',
                stock INTEGER DEFAULT 0 CHECK (stock >= 0),
                shop_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (shop_id) REFERENCES shops(id)
            )
        `)
        db.run(`
            CREATE TABLE IF NOT EXISTS product_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                image_url TEXT NOT NULL,
                is_main INTEGER DEFAULT 0,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `)
        db.run(`
            CREATE TABLE IF NOT EXISTS order_statuses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        `)
        db.run(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shopper_id INTEGER NOT NULL,
                shop_id INTEGER NOT NULL,
                status_id INTEGER NOT NULL DEFAULT 1,
                address TEXT NOT NULL,
                total_amount REAL NOT NULL CHECK (total_amount >= 0),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (shopper_id) REFERENCES users(id),
                FOREIGN KEY (shop_id) REFERENCES shops(id),
                FOREIGN KEY (status_id) REFERENCES order_statuses(id)
            )
        `)
        db.run(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL CHECK (quantity > 0),
                price_at_time REAL NOT NULL CHECK (price_at_time >= 0),
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `)

        db.run(`
            INSERT OR IGNORE INTO roles (name) VALUES
            ('ADMIN'), ('SALES'), ('SHOPPER')
        `)
        db.run(`
            INSERT OR IGNORE INTO order_statuses (name) VALUES
            ('PENDING'), ('PROCESSING'), ('SHIPPED'),
            ('DELIVERED'), ('CANCELLED'), ('RETURNED')
        `)
        db.run(`
            INSERT OR IGNORE INTO categories (name, description) VALUES
            ('Ropa', 'Prendas de vestir'),
            ('Accesorios', 'Complementos'),
            ('Calzado', 'Zapatos y zapatillas'),
            ('Hogar', 'Artículos para el hogar'),
            ('Joyería', 'Joyas y bisutería')
        `)
    })

    const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD
    if (bootstrapPassword) {
        if (bootstrapPassword.length < 12) {
            throw new Error('BOOTSTRAP_ADMIN_PASSWORD debe tener al menos 12 caracteres')
        }

        bcrypt.hash(bootstrapPassword, 12).then(hash => {
            db.run(`
                INSERT OR IGNORE INTO users (username, password, email, name, role)
                VALUES (?, ?, ?, ?, 'ADMIN')
            `, [
                process.env.BOOTSTRAP_ADMIN_USERNAME || 'admin',
                hash,
                process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@example.com',
                process.env.BOOTSTRAP_ADMIN_NAME || 'Administrador'
            ])
        }).catch(error => {
            console.error('No se pudo crear el administrador inicial:', error.message)
        })
    }
}

const getDatabase = () => {
    if (!database) {
        database = new sqlite3.Database(databasePath())
        database.on('error', error => {
            console.error('Error en la base de datos:', error.message)
        })
        initializeDatabase(database)
    }

    return database
}

const db = {}
for (const method of ['all', 'get', 'run', 'serialize']) {
    db[method] = (...args) => getDatabase()[method](...args)
}

db.close = callback => {
    if (!database) {
        if (callback) callback()
        return
    }

    const currentDatabase = database
    database = undefined
    currentDatabase.close(callback)
}

module.exports = db
