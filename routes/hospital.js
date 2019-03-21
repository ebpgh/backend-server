var express = require('express');

var Usuario = require('../models/usuario');
var Hospital = require('../models/hospital');
var mdAutenticacion = require('../middleware/autenticacion');

var app = express();

// ==========================
// Obtener todos los hospitales
// ==========================
app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0; // si no mandan el parámetro desde, la variable desde toma 0
    desde = Number(desde);

    Hospital.find({}, '_id nombre img usuario')
        .populate('usuario', 'nombre email')
        .skip(desde)
        .limit(5)
        .exec(

            (err, hospitales) => {

                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error hospitales',
                        errors: err
                    });
                }

                Hospital.count({}, (err, total) => {

                    res.status(200).json({
                        ok: true,
                        hospitales: hospitales,
                        total: total
                    });

                });

            });
});

// ==========================
// Actualizar un hospital
// ==========================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Hospital.findById(id, (err, hospital) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar el hospital',
                errors: err
            });
        }

        if (!hospital) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe el hospital con el id ' + id,
                errors: { mensaje: 'No existe un hospital con ese ID' }
            });
        }

        hospital.nombre = body.nombre;

        hospital.save((err, hospitalGuardado) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar el hospital',
                    errors: err
                });
            }

            res.status(201).json({
                ok: true,
                hospital: hospitalGuardado,
                usuarioToken: req.usuario
            });

        });

    });

});


// ==========================
// Crear un hospital
// ==========================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    var body = req.body;

    var hospital = new Hospital({
        nombre: body.nombre,
        usuario: req.usuario._id,
        img: body.img
    });

    hospital.save((err, hospitalGuardado) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear hospital',
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            hospital: hospitalGuardado,
            usuarioToken: req.usuario
        });

    });

});

// ==========================
// Borrar un hospital
// ==========================

app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;

    Hospital.findByIdAndRemove(id, (err, hospitalBorrado) => {

        if (err) {
            res.status(500).json({
                ok: false,
                mensaje: 'Error al eliminar hospital',
                errors: err
            });
        }

        if (!hospitalBorrado) {
            res.status(400).json({
                ok: false,
                mensaje: 'No se encontró un hospital con el id ' + id,
                errors: { message: 'No existe un hospital con ese ID' }
            });
        }

        res.status(200).json({
            ok: true,
            hospital: hospitalBorrado,
            usuarioToken: req.usuario
        });

    });

});

module.exports = app;