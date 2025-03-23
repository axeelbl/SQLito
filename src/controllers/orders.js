const ordersRouter = require('express').Router()
const ordersModel = require('../models/orders')
const shopsModel = require('../models/shops')
const { verifyToken, checkRole } = require('../middleware/auth')

// Endpoint principal - Solo muestra los datos
ordersRouter.get('/', async (req, res) => {
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

    // Verificar que la tienda existe
    const shop = await shopsModel.getShopById(shop_id)
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
        if (product.shop_id !== shop_id) {
            return response.status(400).json({ error: `El producto ${item.product_id} no pertenece a esta tienda` })
        }
        total_amount += product.price * item.quantity
    }

    // Crear el pedido
    const order = await ordersModel.createOrder({
        shopper_id: request.user.id,
        shop_id,
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
    if (request.user.role !== 'ADMIN' && 
        request.user.role !== 'SALES' && 
        order.shopper_id !== request.user.id) {
        return response.status(403).json({ error: 'No tienes permiso para ver este pedido' })
    }

    response.json(order)
})

// Obtener pedidos del comprador
ordersRouter.get('/shopper/:shopperId', verifyToken, checkRole(['SHOPPER']), async (request, response) => {
    // Verificar que el comprador sea el usuario actual
    if (request.params.shopperId !== request.user.id) {
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
ordersRouter.put('/:id/status', verifyToken, async (request, response) => {
    const order = await ordersModel.getOrderById(request.params.id)
    if (!order) {
        return response.status(404).json({ error: 'Pedido no encontrado' })
    }

    const shop = await shopsModel.getShopById(order.shop_id)
    if (request.user.role !== 'ADMIN' && shop.owner_id !== request.user.id) {
        return response.status(403).json({ error: 'No tienes permiso para actualizar el estado de este pedido' })
    }

    const { status_id } = request.body
    const updatedOrder = await ordersModel.updateOrderStatus(request.params.id, status_id)
    response.json(updatedOrder)
})

module.exports = ordersRouter 