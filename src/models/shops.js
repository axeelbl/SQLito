const db = require("../utils/db")

const createShop = shop => {
    return new Promise((resolve, reject) => {
        const { name, description, owner_id } = shop

        const sql = "INSERT INTO shops (name, description, owner_id) VALUES (?, ?, ?)"

        db.run(sql, [name, description, owner_id], function (err) {
            if (err) {
                reject(err)
            } else {
                resolve({
                    id: this.lastID,
                    name,
                    description,
                    owner_id
                })
            }
        })
    })
}

const getAllShops = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT s.*, u.name as owner_name
            FROM shops s 
            JOIN users u ON s.owner_id = u.id
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

const getShopById = id => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT s.*, u.name as owner_name
            FROM shops s 
            JOIN users u ON s.owner_id = u.id
            WHERE s.id = ?
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

const getShopsByOwner = ownerId => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT s.*, u.name as owner_name
            FROM shops s 
            JOIN users u ON s.owner_id = u.id
            WHERE s.owner_id = ?
        `
        db.all(sql, [ownerId], (err, rows) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}

const updateShop = (id, shop) => {
    return new Promise((resolve, reject) => {
        const { name, description } = shop
        const sql = "UPDATE shops SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        
        db.run(sql, [name, description, id], function(err) {
            if (err) {
                reject(err)
            } else {
                resolve({ 
                    id: parseInt(id), 
                    name, 
                    description 
                })
            }
        })
    })
}

const deleteShop = id => {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM shops WHERE id = ?"
        db.run(sql, [id], function(err) {
            if (err) {
                reject(err)
            } else {
                resolve({ id: parseInt(id) })
            }
        })
    })
}

module.exports = {
    createShop,
    getAllShops,
    getShopById,
    getShopsByOwner,
    updateShop,
    deleteShop
} 