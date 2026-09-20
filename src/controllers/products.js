const router = require('express').Router()
const { verifyToken, checkRole } = require('../middleware/auth')
const productsModel = require('../models/products')
const shopsModel = require('../models/shops')

// Ruta principal - Solo muestra los datos
router.get('/', async (req, res) => {
    try {
        // Obtener todos los productos
        const products = await productsModel.getAllProducts()

        // Respuesta solo con datos
        res.json(products)
    } catch (error) {
        console.error('Error al obtener productos:', error)
        res.status(500).json({ error: 'Error al obtener productos' })
    }
})

// Crear producto (solo propietario de la tienda)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, description, price, size, stock, shop_id } = req.body

        // Validaciones básicas
        const numericPrice = Number(price)
        const numericStock = stock === undefined ? 0 : Number(stock)
        if (typeof name !== 'string' || !name.trim() || !Number.isFinite(numericPrice) || numericPrice < 0 ||
            !Number.isInteger(numericStock) || numericStock < 0 || !Number.isInteger(Number(shop_id))) {
            return res.status(400).json({ error: 'Nombre, precio, stock y tienda deben ser válidos' })
        }

        // Verificar que la tienda existe
        const shop = await shopsModel.getShopById(shop_id)
        if (!shop) {
            return res.status(404).json({ error: 'Tienda no encontrada' })
        }

        // Verificar que el usuario es propietario de la tienda o admin
        if (req.user.role !== 'ADMIN' && req.user.id != shop.owner_id) {
            return res.status(403).json({ error: 'No tienes permiso para crear productos en esta tienda' })
        }

        // Crear producto
        const product = await productsModel.createProduct({
            name,
            description,
            price: numericPrice,
            size: size || 'M',
            stock: numericStock,
            shop_id
        })

        res.status(201).json(product)
    } catch (error) {
        console.error('Error al crear producto:', error)
        res.status(500).json({ error: 'Error al crear producto' })
    }
})

// Obtener producto por ID
router.get('/:id', async (req, res) => {
    try {
        const productId = req.params.id
        const product = await productsModel.getProductById(productId)

        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' })
        }

        res.json(product)
    } catch (error) {
        console.error('Error al obtener producto:', error)
        res.status(500).json({ error: 'Error al obtener producto' })
    }
})

// Obtener productos por tienda
router.get('/shop/:shopId', async (req, res) => {
    try {
        const shopId = req.params.shopId

        // Verificar que la tienda existe
        const shop = await shopsModel.getShopById(shopId)
        if (!shop) {
            return res.status(404).json({ error: 'Tienda no encontrada' })
        }

        const products = await productsModel.getProductsByShop(shopId)
        res.json(products)
    } catch (error) {
        console.error('Error al obtener productos de la tienda:', error)
        res.status(500).json({ error: 'Error al obtener productos de la tienda' })
    }
})

// Actualizar producto
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const productId = req.params.id
        const { name, description, price, size, stock } = req.body

        // Verificar que el producto existe
        const product = await productsModel.getProductById(productId)
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' })
        }

        // Verificar que la tienda existe
        const shop = await shopsModel.getShopById(product.shop_id)
        if (!shop) {
            return res.status(404).json({ error: 'Tienda no encontrada' })
        }

        // Verificar que el usuario es propietario de la tienda o admin
        if (req.user.role !== 'ADMIN' && req.user.id != shop.owner_id) {
            return res.status(403).json({ error: 'No tienes permiso para actualizar este producto' })
        }

        const numericPrice = price === undefined ? product.price : Number(price)
        const numericStock = stock === undefined ? product.stock : Number(stock)
        if (!Number.isFinite(numericPrice) || numericPrice < 0 ||
            !Number.isInteger(numericStock) || numericStock < 0) {
            return res.status(400).json({ error: 'Precio o stock inválido' })
        }

        // Actualizar producto
        const updatedProduct = await productsModel.updateProduct(productId, {
            name: name || product.name,
            description: description ?? product.description,
            price: numericPrice,
            size: size || product.size,
            stock: numericStock
        })

        res.json(updatedProduct)
    } catch (error) {
        console.error('Error al actualizar producto:', error)
        res.status(500).json({ error: 'Error al actualizar producto' })
    }
})

// Eliminar producto
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const productId = req.params.id

        // Verificar que el producto existe
        const product = await productsModel.getProductById(productId)
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' })
        }

        // Verificar que la tienda existe
        const shop = await shopsModel.getShopById(product.shop_id)
        if (!shop) {
            return res.status(404).json({ error: 'Tienda no encontrada' })
        }

        // Verificar que el usuario es propietario de la tienda o admin
        if (req.user.role !== 'ADMIN' && req.user.id != shop.owner_id) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este producto' })
        }

        // Eliminar producto
        await productsModel.deleteProduct(productId)

        // En lugar de res.status(204).end(), devolvemos un mensaje de éxito
        res.status(200).json({ message: 'Producto eliminado correctamente' })
    } catch (error) {
        console.error('Error al eliminar producto:', error)
        res.status(500).json({ error: 'Error al eliminar producto' })
    }
})

module.exports = router
