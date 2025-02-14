const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRouter = require('./Routers/UserRouter'); 

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const app = express();
const mongoURI = 'mongodb://localhost:27017/Avance'; 
// Configuración de CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conectado a la base de MongoDB'))
    .catch(err => console.log('Error al conectar con MongoDB', err));

// Usar el router de usuarios
app.use('/user', userRouter);

// Configuración del puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor en ejecución en http://localhost:${PORT}`));