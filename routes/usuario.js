var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var Usuario = require('../models/usuario');
var mdAutenticacion = require('../middleware/autenticacion');
// var SEED = require('../config/config').SEED;

var app = express();

// ==========================
// Obtener todos los usuarios
// ==========================
app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0; // si no mandan el parámetro desde, la variable desde toma 0
    desde = Number(desde);

    Usuario.find({}, 'role _id nombre email img google')

    .skip(desde)
        .limit(5)

    .exec(

        (err, usuarios) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error usuarios',
                    errors: err
                });
            }

            Usuario.count({}, (err, total) => {

                res.status(200).json({
                    ok: true,
                    usuarios: usuarios,
                    total: total
                });

            });
        });

    /*     //respuesta a la solicitud
        res.status(200).json({
            ok: true,
            mensaje: 'Get de usuarios correcto'
        }); */

});

// ==========================
// Verificar token (lo comentamos todo porque se convirtió en una función que está en middleware)
// ==========================
/* 
app.use('/', (req, res, next) => {

    var token = req.query.token;
    jwt.verify(token, SEED, (err, decoded) => {

        if (err) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Token no valido',
                errors: err
            });
        }

        next();
    }); 

}); */

// ==========================
// Actualizar un usuario
// ==========================
app.put('/:id', [ mdAutenticacion.verificaToken, mdAutenticacion.verificaADMIN_o_mismoUsuario ], (req, res) => {

    // [ mdAutenticacion.verificaToken, mdAutenticacion.verificaADMIN_o_mismoUsuario ] es el middleware que permite incluir condiciones,
    // se puede poner una condición (sin los corchetes) o varias (enytre corchetes).

    var id = req.params.id;
    var body = req.body;

    Usuario.findById(id, (err, usuario) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar el usuario',
                errors: err
            });
        }

        if (!usuario) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe el usuario con el id ' + id,
                errors: { mensaje: 'No existe un usuario con ese ID' }
            });
        }

        usuario.nombre = body.nombre;
        usuario.email = body.email;
        usuario.role = body.role;

        usuario.save((err, usuarioGuardado) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar el usuario',
                    errors: err
                });
            }

            usuarioGuardado.password = ':)';

            res.status(201).json({
                ok: true,
                usuario: usuarioGuardado,
                usuarioToken: req.usuario
            });

        });

    });

});


// ==========================
// Crear un usuario
// ==========================

// A la función post le quitamos la verificacion del token para que cualquiera,
// un usuario no registrado, pueda crear un usuario
//app.post('/', mdAutenticacion.verificaToken, (req, res) => {

app.post('/', (req, res) => {

    var body = req.body;

    var usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        img: body.img,
        role: body.role
    });

    usuario.save((err, usuarioGuardado) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear usuario',
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            usuario: usuarioGuardado,
            usuarioToken: req.usuario
        });

    });

});

// ==========================
// Borrar un usuario
// ==========================

app.delete('/:id', [ mdAutenticacion.verificaToken, mdAutenticacion.verificaADMIN ], (req, res) => {

    // [ mdAutenticacion.verificaToken, mdAutenticacion.verificaADMIN ] es el middleware que permite incluir condiciones,
    // se puede poner una condición (sin los corchetes) o varias (enytre corchetes).

    var id = req.params.id;

    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {

        if (err) {
            res.status(500).json({
                ok: false,
                mensaje: 'Error al eliminar usuario',
                errors: err
            });
        }

        if (!usuarioBorrado) {
            res.status(400).json({
                ok: false,
                mensaje: 'No se encontró un usuario con el id ' + id,
                errors: { message: 'No existe un usuario con ese ID' }
            });
        }

        res.status(200).json({
            ok: true,
            usuario: usuarioBorrado,
            usuarioToken: req.usuario
        });

    });

});

module.exports = app;