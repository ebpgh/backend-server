var express = require('express');

var Usuario = require('../models/usuario');
var Hospital = require('../models/hospital');
var Medico = require('../models/medico');

var mdAutenticacion = require('../middleware/autenticacion');

var app = express();

// ==========================
// Obtener todos los medicos
// ==========================
app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0; // si no mandan el parámetro desde, la variable desde toma 0
    desde = Number(desde);

    Medico.find({}, '_id nombre img usuario hospital')

    .populate('usuario', 'nombre email')
        .populate('hospital', 'nombre')
        .skip(desde)
        .limit(5)
        .exec(

            (err, medicos) => {

                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error medicos',
                        errors: err
                    });
                }

                Medico.count({}, (err, total) => {

                    res.status(200).json({
                        ok: true,
                        medicos: medicos,
                        total: total
                    });

                });

            });

});

// ==========================
// Obtener un médiico
// ==========================
app.get('/:id', (req, res) => {

    var id = req.params.id;

    Medico.findById(id)

        .populate('usuario', 'nombre email img') // para que se traiga también estos campos de la tabla usuarios
        .populate('hospital') // para que se traiga todos los campos del hospital
        .exec((err, medico) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar el médico',
                errors: err
            });
        }

        if (!medico) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe el médico con el id ' + id,
                errors: { mensaje: 'No existe un médico con ese ID' }
            });
        }

        res.status(200).json({
            ok: true,
            medico: medico
        })

    });

});

// ==========================
// Actualizar un medico
// ==========================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Medico.findById(id, (err, medico) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar el medico',
                errors: err
            });
        }

        if (!medico) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe el medico con el id ' + id,
                errors: { mensaje: 'No existe un medico con ese ID' }
            });
        }

        medico.nombre = body.nombre;
        medico.hospital = body.hospital;

        Hospital.findById(medico.hospital, (err, hospitalAsignado) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar el hospital',
                    errors: err
                });
            }

            if (!hospitalAsignado) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'No existe el hospital con el id ' + medico.hospital,
                    errors: { mensaje: 'No existe un hospital con ese ID' }
                });
            }

            medico.save((err, medicoGuardado) => {

                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al actualizar el medico',
                        errors: err
                    });
                }

                res.status(201).json({
                    ok: true,
                    medico: medicoGuardado,
                    usuarioToken: req.usuario
                });

            });

        });
    });
});


// ==========================
// Crear un medico
// ==========================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    var body = req.body;

    var medico = new Medico({
        nombre: body.nombre,
        usuario: req.usuario._id,
        hospital: body.hospital,
        img: body.img
    });

    Hospital.findById(medico.hospital, (err, hospitalAsignado) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar el hospital',
                errors: err
            });
        }

        if (!hospitalAsignado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe el hospital con el id ' + medico.hospital,
                errors: { mensaje: 'No existe un hospital con ese ID' }
            });
        }

        medico.save((err, medicoGuardado) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al crear medico',
                    errors: err
                });
            }

            res.status(201).json({
                ok: true,
                medico: medicoGuardado,
                usuarioToken: req.usuario
            });

        });

    });

});

// ==========================
// Borrar un medico
// ==========================

app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Medico.findByIdAndRemove(id, (err, medicoBorrado) => {

        if (err) {
            res.status(500).json({
                ok: false,
                mensaje: 'Error al eliminar medico',
                errors: err
            });
        }

        if (!medicoBorrado) {
            res.status(400).json({
                ok: false,
                mensaje: 'No se encontró un medico con el id ' + id,
                errors: { message: 'No existe un medico con ese ID' }
            });
        }

        res.status(200).json({
            ok: true,
            medico: medicoBorrado,
            usuarioToken: req.usuario
        });

    });

});

module.exports = app;