const router = require('express').Router()
const { verifyToken, checkRole } = require('../middleware/auth')
const shopsModel = require('../models/shops')
const categoriesModel = require('../models/categories')

// Ruta principal - Solo muestra los datos
router.get('/', async (req, res) => {
    try {
        // Obtener todas las tiendas
        const shops = await shopsModel.getAllShops()
        
        // Respuesta solo con datos
        res.json(shops)
    } catch (error) {
        console.error('Error al obtener tiendas:', error)
        res.status(500).json({ error: 'Error al obtener tiendas' })
    }
})

// Obtener tienda por ID
router.get('/:id', async (req, res) => {
    try {
        const shopId = req.params.id
        const shop = await shopsModel.getShopById(shopId)
        
        if (!shop) {
            return res.status(404).json({ error: 'Tienda no encontrada' })
        }
        
        res.json(shop)
    } catch (error) {
        console.error('Error al obtener tienda:', error)
        res.status(500).json({ error: 'Error al obtener tienda' })
    }
})

// Obtener tiendas por propietario
router.get('/owner/:ownerId', verifyToken, async (req, res) => {
    try {
        const ownerId = req.params.ownerId
        
        // Verificar permisos (solo admin o el propio propietario)
        if (req.user.role !== 'ADMIN' && req.user.id != ownerId) {
            return res.status(403).json({ error: 'No tienes permiso para ver estas tiendas' })
        }
        
        const shops = await shopsModel.getShopsByOwner(ownerId)
        res.json(shops)
    } catch (error) {
        console.error('Error al obtener tiendas por propietario:', error)
        res.status(500).json({ error: 'Error al obtener tiendas por propietario' })
    }
})

// Crear tienda (solo admin)
router.post('/', verifyToken, checkRole(['ADMIN']), async (req, res) => {
    try {
        const { name, description, owner_id, categories } = req.body
        
        // Validaciones básicas
        if (!name || !owner_id) {
            return res.status(400).json({ error: 'Nombre y propietario son obligatorios' })
        }
        
        // Crear tienda
        const shop = await shopsModel.createShop({
            name,
            description,
            owner_id
        })
        
        // Añadir categorías si se proporcionan
        if (categories && categories.length > 0) {
            for (const categoryId of categories) {
                await categoriesModel.addShopCategory(shop.id, categoryId)
            }
        }
        
        res.status(201).json(shop)
    } catch (error) {
        console.error('Error al crear tienda:', error)
        res.status(500).json({ error: 'Error al crear tienda' })
    }
})

// Actualizar tienda
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const shopId = req.params.id
        const { name, description, categories } = req.body
        
        // Obtener tienda
        const shop = await shopsModel.getShopById(shopId)
        if (!shop) {
            return res.status(404).json({ error: 'Tienda no encontrada' })
        }
        
        // Verificar permisos (solo admin o propietario)
        if (req.user.role !== 'ADMIN' && req.user.id != shop.owner_id) {
            return res.status(403).json({ error: 'No tienes permiso para actualizar esta tienda' })
        }
        
        // Actualizar tienda
        const updatedShop = await shopsModel.updateShop(shopId, {
            name: name || shop.name,
            description: description || shop.description
        })
        
        // Actualizar categorías si se proporcionan
        if (categories && categories.length > 0) {
            // Primero, eliminar todas las categorías existentes
            await categoriesModel.removeAllShopCategories(shopId)
            
            // Luego, añadir las nuevas categorías
            for (const categoryId of categories) {
                await categoriesModel.addShopCategory(shopId, categoryId)
            }
        }
        
        res.json(updatedShop)
    } catch (error) {
        console.error('Error al actualizar tienda:', error)
        res.status(500).json({ error: 'Error al actualizar tienda' })
    }
})

// Eliminar tienda (solo admin)
router.delete('/:id', verifyToken, checkRole(['ADMIN']), async (req, res) => {
    try {
        const shopId = req.params.id
        
        // Verificar que la tienda existe
        const shop = await shopsModel.getShopById(shopId)
        if (!shop) {
            return res.status(404).json({ error: 'Tienda no encontrada' })
        }
        
        // Eliminar todas las categorías asociadas
        await categoriesModel.removeAllShopCategories(shopId)
        
        // Eliminar tienda
        await shopsModel.deleteShop(shopId)
        
        // En lugar de res.status(204).end(), devolvemos un mensaje de éxito
        res.status(200).json({ message: 'Tienda eliminada correctamente' })
    } catch (error) {
        console.error('Error al eliminar tienda:', error)
        res.status(500).json({ error: 'Error al eliminar tienda' })
    }
})

module.exports = router 