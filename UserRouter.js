const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Ruta para registrar un nuevo usuario
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Validar que todos los campos estén presentes
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        // Verificar si el usuario ya existe
        const existingUser  = await User.findOne({ email });
        if (existingUser ) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser  = new User({ name, email, password: hashedPassword });
        const savedUser  = await newUser .save();

        // Generar el token para el nuevo usuario
        const token = jwt.sign({ id: savedUser._id }, process.env.SECRET, { expiresIn: '30min' });

        console.log('Usuario guardado en la base de datos', savedUser );
        res.status(201).json({ 
            message: 'Usuario creado con éxito', 
            user: savedUser,
            token // Incluir el token en la respuesta
        });
    } catch (error) {
        console.error('Error al registrar usuario', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});


// Ruta para obtener todos los usuarios
router.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        console.log('Usuarios recuperados', users);
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al recuperar usuarios', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validar que los campos estén presentes
    if (!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: '20min' });
        res.json({ token });
    } catch (error) {
        console.error('Error al iniciar sesión', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Middleware de autenticación
const authMiddleware = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Acceso denegado' });

    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
    }
};

// Ruta para editar un usuario
router.put('/users/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body; // Puedes agregar más campos si es necesario

    try {
        const updatedUser  = await User.findByIdAndUpdate(id, { name, email }, { new: true });
        if (!updatedUser ) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario actualizado', user: updatedUser  });
    } catch (error) {
        console.error('Error al actualizar usuario', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Ruta para eliminar un usuario
router.delete('/users/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUser  = await User.findByIdAndDelete(id);
        if (!deletedUser ) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario eliminado', deletedID: id });
    } catch (error) {
        console.error('Error al eliminar usuario', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Middleware para manejar errores 404
router.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

module.exports = router;