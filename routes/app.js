var express = require('express');

var app = express();


app.get('/', (req, res, next) => {

    //respuesta a la solicitud
    res.status(200).json({
        ok: true,
        mensaje: 'Petición resuelta correctamente'
    });

});

module.exports = app;