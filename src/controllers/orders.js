const ordersRouter = require('express').Router()
const ordersModel = require('../models/orders')
const shopsModel = require('../models/shops')
const productsModel = require('../models/products')
const { verifyToken, checkRole } = require('../middleware/auth')

// Endpoint principal - Solo muestra los datos
ordersRouter.get('/', verifyToken, checkRole(['ADMIN']), async (req, res) => {
    try {
        // Obtener todos los pedidos
        const orders = await ordersModel.getAllOrders()

        // Respuesta solo con datos
        res.json(orders)
    } catch (error) {
        console.error('Error al obtener pedidos:', error)
        res.status(500).json({ error: 'Error al obtener pedidos' })
    }
})

// Crear pedido (solo shoppers)
ordersRouter.post('/', verifyToken, checkRole(['SHOPPER']), async (request, response) => {
    const { shop_id, items, address } = request.body
    const shopId = Number(shop_id)
    if (!Number.isInteger(shopId) || shopId < 1 || !Array.isArray(items) || items.length === 0 ||
        typeof address !== 'string' || !address.trim() ||
        items.some(item => !Number.isInteger(Number(item.product_id)) ||
            !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
        return response.status(400).json({ error: 'Pedido inválido' })
    }

    // Verificar que la tienda existe
    const shop = await shopsModel.getShopById(shopId)
    if (!shop) {
        return response.status(404).json({ error: 'Tienda no encontrada' })
    }

    // Calcular el total del pedido
    let total_amount = 0
    for (const item of items) {
        const product = await productsModel.getProductById(item.product_id)
        if (!product) {
            return response.status(404).json({ error: `Producto ${item.product_id} no encontrado` })
        }
        if (product.shop_id !== shopId) {
            return response.status(400).json({ error: `El producto ${item.product_id} no pertenece a esta tienda` })
        }
        total_amount += product.price * item.quantity
    }

    // Crear el pedido
    const order = await ordersModel.createOrder({
        shopper_id: request.user.id,
        shop_id: shopId,
        status_id: 1, // 1 = PENDING
        address,
        total_amount
    })

    // Añadir los items del pedido
    for (const item of items) {
        const product = await productsModel.getProductById(item.product_id)
        await ordersModel.addOrderItem({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_time: product.price
        })
    }

    response.status(201).json(order)
})

// Obtener pedido por ID
ordersRouter.get('/:id', verifyToken, async (request, response) => {
    const order = await ordersModel.getOrderById(request.params.id)
    if (!order) {
        return response.status(404).json({ error: 'Pedido no encontrado' })
    }

    // Verificar permisos
    let permitted = request.user.role === 'ADMIN' || order.shopper_id === request.user.id
    if (request.user.role === 'SALES') {
        const shop = await shopsModel.getShopById(order.shop_id)
        permitted = Boolean(shop && shop.owner_id === request.user.id)
    }
    if (!permitted) {
        return response.status(403).json({ error: 'No tienes permiso para ver este pedido' })
    }

    response.json(order)
})

// Obtener pedidos del comprador
ordersRouter.get('/shopper/:shopperId', verifyToken, checkRole(['SHOPPER']), async (request, response) => {
    // Verificar que el comprador sea el usuario actual
    if (Number(request.params.shopperId) !== request.user.id) {
        return response.status(403).json({ error: 'No tienes permiso para ver estos pedidos' })
    }

    const orders = await ordersModel.getOrdersByShopper(request.params.shopperId)
    response.json(orders)
})

// Obtener pedidos de una tienda
ordersRouter.get('/shop/:shopId', verifyToken, checkRole(['SALES']), async (request, response) => {
    const shop = await shopsModel.getShopById(request.params.shopId)
    if (!shop) {
        return response.status(404).json({ error: 'Tienda no encontrada' })
    }

    // Verificar que el usuario sea el propietario de la tienda
    if (shop.owner_id !== request.user.id) {
        return response.status(403).json({ error: 'No tienes permiso para ver los pedidos de esta tienda' })
    }

    const orders = await ordersModel.getOrdersByShop(request.params.shopId)
    response.json(orders)
})

// Actualizar estado del pedido (solo propietario de la tienda o admin)
ordersRouter.put('/:id/status', verifyToken, checkRole(['ADMIN', 'SALES']), async (request, response) => {
    const order = await ordersModel.getOrderById(request.params.id)
    if (!order) {
        return response.status(404).json({ error: 'Pedido no encontrado' })
    }

    const shop = await shopsModel.getShopById(order.shop_id)
    if (request.user.role !== 'ADMIN' && shop.owner_id !== request.user.id) {
        return response.status(403).json({ error: 'No tienes permiso para actualizar el estado de este pedido' })
    }

    const statusId = Number(request.body.status_id)
    if (!Number.isInteger(statusId) || statusId < 1 || statusId > 6) {
        return response.status(400).json({ error: 'Estado de pedido inválido' })
    }
    const updatedOrder = await ordersModel.updateOrderStatus(request.params.id, statusId)
    response.json(updatedOrder)
})

module.exports = ordersRouter
