var express = require('express');

var app = express();

const path = require('path');
const fs = require('fs');

app.get('/:tipo/:img', (req, res, next) => {

    var tipo = req.params.tipo; // hospitales, médicos o usuarios
    var img = req.params.img; // id de la imagen

    // __dirname devuelve la ruta donde estoy
    var pathImagen = path.resolve(__dirname, `../uploads/${ tipo }/${ img }`);

    // Se comprueba si existe el path con la imagen solicitada
    if (fs.existsSync(pathImagen)) {

        res.sendFile(pathImagen);

    } else {

        var pathImagenNoAvailabe = path.resolve(__dirname, `../assets/NoImageAvailable.png`);
        res.sendFile(pathImagenNoAvailabe);
    }

});

module.exports = app;