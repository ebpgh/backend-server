var express = require('express');

var app = express();

var Hospital = require('../models/hospital');
var Medico = require('../models/medico');
var Usuario = require('../models/usuario');

// ========================
// Búsqueda por coleccion específica
// ========================

app.get('/coleccion/:tabla/:busqueda', (req, res, next) => {

    var tabla = req.params.tabla;
    var busqueda = req.params.busqueda;
    var regex = new RegExp(busqueda, 'i'); // esta expresión regular hace que se añada la i de case insensitive

    var promesa;
    switch (tabla) {
        case 'usuarios':
            promesa = buscarUsuarios(busqueda, regex);
            break;
        case 'hospitales':
            promesa = buscarHospitales(busqueda, regex);
            break;
        case 'medicos':
            promesa = buscarMedicos(busqueda, regex);
            break;
        default:
            return res.status(400).json({
                ok: false,
                mensaje: 'Los tipos de búsqueda son medicos, usuarios y hospitales',
                error: { message: 'Colección no válida' }
            });
    }


    promesa
        .then(respuesta => {
            res.status(200).json({
                ok: true,
                [tabla]: respuesta
            });
        });


});

// ========================
// Búsqueda general
// ========================

app.get('/todo/:busqueda', (req, res, next) => {

    var busqueda = req.params.busqueda;
    var regex = new RegExp(busqueda, 'i'); // esta expresión regular hace que se añada la i de case insensitive

    //Promise.all --> array de promesas que se lanzan en paralelo y cuyas respuetas también se
    //cargan en un arreglo en el mismo orden en el que aparecen las búsquedas
    Promise.all([
            buscarHospitales(busqueda, regex),
            buscarMedicos(busqueda, regex),
            buscarUsuarios(busqueda, regex)
        ])
        .then(respuestas => {
            res.status(200).json({
                ok: true,
                hospitales: respuestas[0],
                medicos: respuestas[1],
                usuarios: respuestas[2]
            });
        });

    /*     buscarHospitales(busqueda, regex)
            .then(hospitales => {
                res.status(200).json({
                    ok: true,
                    hospitales: hospitales
                });
            }); */

});

function buscarHospitales(busqueda, regex) {
    return new Promise((resolve, reject) => {

        Hospital.find({ nombre: regex })

        .populate('usuario', 'nombre email img')
            .exec((err, hospitales) => {

                if (err) {
                    reject('Error al cargar hospitales', err);
                } else {
                    resolve(hospitales);
                }

            });
    });
}

function buscarMedicos(busqueda, regex) {
    return new Promise((resolve, reject) => {

        Medico.find({ nombre: regex })

        .populate('usuario', 'nombre email img')
            .populate('hospital')
            .exec((err, medicos) => {

                if (err) {
                    reject('Error al cargar medicos', err);
                } else {
                    resolve(medicos);
                }

            });
    });
}

function buscarUsuarios(busqueda, regex) {
    return new Promise((resolve, reject) => {

        Usuario.find({}, 'nombre email role img')
            .or([{ 'nombre': regex }, { 'email': regex }])
            .exec((err, usuarios) => {

                if (err) {
                    reject('Error al cargar usuarios', err);
                } else {
                    resolve(usuarios);
                }

            });
    });
}

module.exports = app;