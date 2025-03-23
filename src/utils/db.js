const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcrypt')

// Asegurarse de que el directorio existe
const dbDir = path.resolve(__dirname, '../../')
const dbPath = path.join(dbDir, 'database.sqlite')

// Verificar si existe el archivo de base de datos
const dbExists = fs.existsSync(dbPath)

// Crear la base de datos con mejor manejo de errores
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message)
        process.exit(1) // Salir si no podemos conectar con la base de datos
    } else {
        console.log('Conexión exitosa con la base de datos SQLite')
        initDb(!dbExists) // Inicializar solo si es una nueva base de datos o pasar true para forzar
    }
})

// Inicializar la base de datos
const initDb = (forceInit = false) => {
    console.log(`Inicializando base de datos (forzar: ${forceInit})`)
    
    db.serialize(() => {
        // Crear tabla de roles
        db.run(`
            CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        `, (err) => {
            if (err) console.error('Error creando tabla roles:', err.message)
        })

        // Crear tabla de usuarios
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
        `, (err) => {
            if (err) console.error('Error creando tabla users:', err.message)
        })

        // Crear tabla de categorías
        db.run(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT
            )
        `, (err) => {
            if (err) console.error('Error creando tabla categories:', err.message)
        })

        // Crear tabla de tiendas
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
        `, (err) => {
            if (err) console.error('Error creando tabla shops:', err.message)
        })

        // Crear tabla de relación tienda-categoría
        db.run(`
            CREATE TABLE IF NOT EXISTS shop_categories (
                shop_id INTEGER NOT NULL,
                category_id INTEGER NOT NULL,
                PRIMARY KEY (shop_id, category_id),
                FOREIGN KEY (shop_id) REFERENCES shops(id),
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        `, (err) => {
            if (err) console.error('Error creando tabla shop_categories:', err.message)
        })

        // Crear tabla de productos
        db.run(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                size TEXT DEFAULT 'M',
                stock INTEGER DEFAULT 0,
                shop_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (shop_id) REFERENCES shops(id)
            )
        `, (err) => {
            if (err) console.error('Error creando tabla products:', err.message)
        })

        // Crear tabla de imágenes de productos
        db.run(`
            CREATE TABLE IF NOT EXISTS product_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                image_url TEXT NOT NULL,
                is_main INTEGER DEFAULT 0,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `, (err) => {
            if (err) console.error('Error creando tabla product_images:', err.message)
        })

        // Crear tabla de estados de pedidos
        db.run(`
            CREATE TABLE IF NOT EXISTS order_statuses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        `, (err) => {
            if (err) console.error('Error creando tabla order_statuses:', err.message)
        })

        // Crear tabla de pedidos
        db.run(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shopper_id INTEGER NOT NULL,
                shop_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING',
                total_amount REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (shopper_id) REFERENCES users(id),
                FOREIGN KEY (shop_id) REFERENCES shops(id)
            )
        `, (err) => {
            if (err) console.error('Error creando tabla orders:', err.message)
        })

        // Crear tabla de detalles de pedido
        db.run(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                price_at_time REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `, (err) => {
            if (err) console.error('Error creando tabla order_items:', err.message)
        })

        // Insertar roles por defecto
        db.run(`
            INSERT OR IGNORE INTO roles (name) VALUES 
            ('ADMIN'),
            ('SALES'),
            ('SHOPPER')
        `, (err) => {
            if (err) console.error('Error insertando roles por defecto:', err.message)
        })

        // Insertar estados de pedido por defecto
        db.run(`
            INSERT OR IGNORE INTO order_statuses (name) VALUES 
            ('PENDING'),
            ('PROCESSING'),
            ('SHIPPED'),
            ('DELIVERED'),
            ('CANCELLED'),
            ('RETURNED')
        `, (err) => {
            if (err) console.error('Error insertando estados de pedido por defecto:', err.message)
        })

        // Insertar categorías de ejemplo
        db.run(`
            INSERT OR IGNORE INTO categories (name, description) VALUES 
            ('Ropa', 'Prendas de vestir'),
            ('Accesorios', 'Complementos'),
            ('Calzado', 'Zapatos y zapatillas'),
            ('Hogar', 'Artículos para el hogar'),
            ('Joyería', 'Joyas y bisutería')
        `, (err) => {
            if (err) console.error('Error insertando categorías:', err.message)
        })

        // Crear usuario admin por defecto
        const saltRounds = 10
        bcrypt.hash('admin123', saltRounds, (err, hash) => {
            if (err) {
                console.error('Error al crear el usuario admin:', err.message)
            } else {
                db.run(`
                    INSERT OR IGNORE INTO users (username, password, email, name, role)
                    VALUES ('admin', ?, 'admin@example.com', 'Administrador', 'ADMIN')
                `, [hash], (err) => {
                    if (err) {
                        console.error('Error al insertar usuario admin:', err.message)
                    } else {
                        console.log('Usuario admin creado o ya existente')
                    }
                })
            }
        })
    })
}

// Manejar errores de la base de datos
db.on('error', (err) => {
    console.error('Error en la base de datos:', err.message)
})

module.exports = db