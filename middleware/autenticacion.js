var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

// ==========================
// Verificar token
// ==========================

exports.verificaToken = function(req, res, next) {


    var token = req.query.token;
    jwt.verify(token, SEED, (err, decoded) => {

        if (err) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Token no valido',
                errors: err
            });
        }

        req.usuario = decoded.usuario;

        next();

        /*         res.status(200).json({
                    ok: true,
                    decoded: decoded
                }); */

    });


};

// ==========================
// Verificar si es admin
// ==========================

exports.verificaADMIN = function(req, res, next) {

    var usuario = req.usuario;

    if ( usuario.role === 'ADMIN_ROLE' ) {
        next();
    } else {

        return res.status(401).json({
            ok: false,
            mensaje: 'Token no valido - no es administrador',
            errors: { message: 'No puede hacer esa acción. No es administrador.' }
        });
    }
};

// ==========================
// Verificar si es admin o es el mismo usuario
// ==========================

// este middleware sirve para comprobar si el usuario conectado es administrador (el usuario que va en el req) o si es
// el mismo que el que se pretende modificar (el id que va en parámetro en la url dentro de la petición)

exports.verificaADMIN_o_mismoUsuario = function(req, res, next) {

    var usuario = req.usuario;
    var id = req.params.id;

    if ( usuario.role === 'ADMIN_ROLE' || id === usuario._id ) {
        next();
    } else {

        return res.status(401).json({
            ok: false,
            mensaje: 'Token no valido - no es administrador y no es el mismo usuario',
            errors: { message: 'No puede hacer esa acción. No es administrador.' }
        });
    }
};