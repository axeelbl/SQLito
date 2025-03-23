const db = require("../utils/db")

const createProduct = product => {
    return new Promise((resolve, reject) => {
        const { name, description, price, size, stock, shop_id } = product

        const sql = "INSERT INTO products (name, description, price, size, stock, shop_id) VALUES (?, ?, ?, ?, ?, ?)"

        db.run(sql, [name, description, price, size, stock, shop_id], function (err) {
            if (err) {
                reject(err)
            } else {
                resolve({
                    id: this.lastID,
                    name,
                    description,
                    price,
                    size,
                    stock,
                    shop_id
                })
            }
        })
    })
}

const getAllProducts = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT p.*, s.name as shop_name 
            FROM products p
            JOIN shops s ON p.shop_id = s.id
        `
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}

const getProductById = id => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT p.*, s.name as shop_name 
            FROM products p
            JOIN shops s ON p.shop_id = s.id
            WHERE p.id = ?
        `
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err)
            } else {
                resolve(row)
            }
        })
    })
}

const getProductsByShop = shopId => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM products WHERE shop_id = ?"
        db.all(sql, [shopId], (err, rows) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}

const updateProduct = (id, product) => {
    return new Promise((resolve, reject) => {
        const { name, description, price, size, stock } = product
        const sql = "UPDATE products SET name = ?, description = ?, price = ?, size = ?, stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        
        db.run(sql, [name, description, price, size, stock, id], function(err) {
            if (err) {
                reject(err)
            } else {
                resolve({ 
                    id: parseInt(id), 
                    name, 
                    description, 
                    price,
                    size,
                    stock
                })
            }
        })
    })
}

const deleteProduct = id => {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM products WHERE id = ?"
        db.run(sql, [id], function(err) {
            if (err) {
                reject(err)
            } else {
                resolve({ id: parseInt(id) })
            }
        })
    })
}

// Funciones para gestionar imágenes de productos
const addProductImage = (productId, imageUrl, isMain = false) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, ?)"
        db.run(sql, [productId, imageUrl, isMain ? 1 : 0], function(err) {
            if (err) {
                reject(err)
            } else {
                resolve({
                    id: this.lastID,
                    product_id: productId,
                    image_url: imageUrl,
                    is_main: isMain
                })
            }
        })
    })
}

const getProductImages = productId => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM product_images WHERE product_id = ? ORDER BY is_main DESC"
        db.all(sql, [productId], (err, rows) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}

const deleteProductImages = productId => {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM product_images WHERE product_id = ?"
        db.run(sql, [productId], function(err) {
            if (err) {
                reject(err)
            } else {
                resolve({ product_id: productId })
            }
        })
    })
}

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    getProductsByShop,
    updateProduct,
    deleteProduct,
    addProductImage,
    getProductImages,
    deleteProductImages
} 