const db = require("../utils/db")

const createOrder = order => {
    return new Promise((resolve, reject) => {
        const { shopper_id, shop_id, status_id, address, total_amount } = order

        const sql = "INSERT INTO orders (shopper_id, shop_id, status_id, address, total_amount) VALUES (?, ?, ?, ?, ?)"

        db.run(sql, [shopper_id, shop_id, status_id, address, total_amount], function (err) {
            err
                ? reject(err)
                : resolve({
                    id: this.lastID,
                    shopper_id,
                    shop_id,
                    status_id,
                    address,
                    total_amount
                })
        })
    })
}

const addOrderItem = orderItem => {
    return new Promise((resolve, reject) => {
        const { order_id, product_id, quantity, price_at_time } = orderItem

        const sql = "INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)"

        db.run(sql, [order_id, product_id, quantity, price_at_time], function (err) {
            err
                ? reject(err)
                : resolve({
                    id: this.lastID,
                    order_id,
                    product_id,
                    quantity,
                    price_at_time
                })
        })
    })
}

const getAllOrders = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT o.*, 
                   u.name as shopper_name,
                   s.name as shop_name,
                   os.name as status_name,
                   GROUP_CONCAT(
                       json_object(
                           'product_id', oi.product_id,
                           'quantity', oi.quantity,
                           'price', oi.price_at_time
                       )
                   ) as items
            FROM orders o
            JOIN users u ON o.shopper_id = u.id
            JOIN shops s ON o.shop_id = s.id
            JOIN order_statuses os ON o.status_id = os.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id
        `
        db.all(sql, [], (err, rows) => {
            err ? reject(err) : resolve(rows)
        })
    })
}

const getOrderById = id => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT o.*, 
                   u.name as shopper_name,
                   s.name as shop_name,
                   os.name as status_name,
                   GROUP_CONCAT(
                       json_object(
                           'product_id', oi.product_id,
                           'quantity', oi.quantity,
                           'price', oi.price_at_time
                       )
                   ) as items
            FROM orders o
            JOIN users u ON o.shopper_id = u.id
            JOIN shops s ON o.shop_id = s.id
            JOIN order_statuses os ON o.status_id = os.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = ?
            GROUP BY o.id
        `
        db.get(sql, [id], (err, row) => {
            err ? reject(err) : resolve(row)
        })
    })
}

const getOrdersByShopper = shopperId => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT o.*, 
                   u.name as shopper_name,
                   s.name as shop_name,
                   os.name as status_name,
                   GROUP_CONCAT(
                       json_object(
                           'product_id', oi.product_id,
                           'quantity', oi.quantity,
                           'price', oi.price_at_time
                       )
                   ) as items
            FROM orders o
            JOIN users u ON o.shopper_id = u.id
            JOIN shops s ON o.shop_id = s.id
            JOIN order_statuses os ON o.status_id = os.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.shopper_id = ?
            GROUP BY o.id
        `
        db.all(sql, [shopperId], (err, rows) => {
            err ? reject(err) : resolve(rows)
        })
    })
}

const getOrdersByShop = shopId => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT o.*, 
                   u.name as shopper_name,
                   s.name as shop_name,
                   os.name as status_name,
                   GROUP_CONCAT(
                       json_object(
                           'product_id', oi.product_id,
                           'quantity', oi.quantity,
                           'price', oi.price_at_time
                       )
                   ) as items
            FROM orders o
            JOIN users u ON o.shopper_id = u.id
            JOIN shops s ON o.shop_id = s.id
            JOIN order_statuses os ON o.status_id = os.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.shop_id = ?
            GROUP BY o.id
        `
        db.all(sql, [shopId], (err, rows) => {
            err ? reject(err) : resolve(rows)
        })
    })
}

const updateOrderStatus = (orderId, statusId) => {
    return new Promise((resolve, reject) => {
        const sql = "UPDATE orders SET status_id = ? WHERE id = ?"
        db.run(sql, [statusId, orderId], function(err) {
            err ? reject(err) : resolve({ id: orderId, status_id: statusId })
        })
    })
}

module.exports = {
    createOrder,
    addOrderItem,
    getAllOrders,
    getOrderById,
    getOrdersByShopper,
    getOrdersByShop,
    updateOrderStatus
} 