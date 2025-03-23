// Script para iniciar el servidor directamente sin npm
console.log('Iniciando servidor...');

// Importar el archivo principal de la aplicación
const app = require('./src/app');
const config = require('./src/utils/config');

// Definir el puerto
const PORT = process.env.PORT || 3000;

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
    console.log('Para detener el servidor, presiona Ctrl+C');
}); 