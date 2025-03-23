const db = require("../utils/db")

// Obtener todas las categorías
const getAllCategories = () => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM categories"
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}

// Obtener categoría por ID
const getCategoryById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM categories WHERE id = ?"
        
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err)
            } else {
                resolve(row)
            }
        })
    })
}

// Crear nueva categoría
const createCategory = (category) => {
    return new Promise((resolve, reject) => {
        const { name, description } = category
        const sql = "INSERT INTO categories (name, description) VALUES (?, ?)"
        
        db.run(sql, [name, description], function(err) {
            if (err) {
                reject(err)
            } else {
                resolve({
                    id: this.lastID,
                    name,
                    description
                })
            }
        })
    })
}

// Añadir categoría a una tienda
const addShopCategory = (shopId, categoryId) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT OR IGNORE INTO shop_categories (shop_id, category_id) VALUES (?, ?)"
        
        db.run(sql, [shopId, categoryId], function(err) {
            if (err) {
                reject(err)
            } else {
                resolve({
                    shop_id: shopId,
                    category_id: categoryId
                })
            }
        })
    })
}

// Eliminar categoría de una tienda
const removeShopCategory = (shopId, categoryId) => {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM shop_categories WHERE shop_id = ? AND category_id = ?"
        
        db.run(sql, [shopId, categoryId], function(err) {
            if (err) {
                reject(err)
            } else {
                resolve({
                    shop_id: shopId,
                    category_id: categoryId
                })
            }
        })
    })
}

// Eliminar todas las categorías de una tienda
const removeAllShopCategories = (shopId) => {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM shop_categories WHERE shop_id = ?"
        
        db.run(sql, [shopId], function(err) {
            if (err) {
                reject(err)
            } else {
                resolve({
                    shop_id: shopId
                })
            }
        })
    })
}

// Obtener categorías de una tienda
const getShopCategories = (shopId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT c.* 
            FROM categories c
            JOIN shop_categories sc ON c.id = sc.category_id
            WHERE sc.shop_id = ?
        `
        
        db.all(sql, [shopId], (err, rows) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    addShopCategory,
    removeShopCategory,
    removeAllShopCategories,
    getShopCategories
} 