var express = require('express');
const fileUpload = require('express-fileupload');

var app = express();
var fs = require('fs'); // importar el filesystem para borrar las imagenes que no valgan

var Usuario = require('../models/usuario');
var Hospital = require('../models/hospital');
var Medico = require('../models/medico');

app.use(fileUpload());


app.put('/:tabla/:id', (req, res, next) => {

    var tabla = req.params.tabla;
    var id = req.params.id;

    //tablas válidas
    var tablasValidas = ['usuarios', 'medicos', 'hospitales'];

    if (tablasValidas.indexOf(tabla) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'La tabla o tipo de colección no es válida' + tabla,
            errors: { message: 'Las tablas permitidas son ' + tablasValidas.join(', ') }
        });
    }



    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No seleccionó nada',
            errors: { message: 'Debe seleccionar una imagen' }
        });
    }

    //Obtener nombre del archivo
    var archivo = req.files.imagen;
    var nombreRecortado = archivo.name.split('.');
    var extension = nombreRecortado[nombreRecortado.length - 1];

    //Sólo estas extensiones son aceptadas
    var extensionesValidas = ['png', 'jpg', 'gif', 'jpeg', 'bmp'];

    if (extensionesValidas.indexOf(extension) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'El fichero no es válido',
            errors: { message: 'Los tipos permitidos son ' + extensionesValidas.join(', ') }
        });
    }

    // Nombre de archivo personalizado. Será el id del objeto a actualizar que lo hemos  
    // recibido por la URL como parámetro seguido de un número aleatorio (los milisegundos de la 
    // fecha) y la extensión.
    var nombreArchivo = `${ id }-${ new Date().getMilliseconds() }.${ extension }`;

    //Mover el archivo desde el temporal a la carpeta donde estarán las imágenes y el nombre
    // dado al archivo subido
    var path = `./uploads/${ tabla }/${ nombreArchivo }`;

    archivo.mv(path, err => {

        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El fichero no es válido',
                errors: err
            });
        }

        subirPorTabla(tabla, id, nombreArchivo, res);

    });



});

function subirPorTabla(tabla, id, nombreArchivo, res) {

    if (tabla === 'usuarios') {
        actualzarImagen(Usuario, './uploads/usuarios/', id, nombreArchivo, res);
    }

    if (tabla === 'medicos') {
        actualzarImagen(Medico, './uploads/medicos/', id, nombreArchivo, res);
    }

    if (tabla === 'hospitales') {
        actualzarImagen(Hospital, './uploads/hospitales/', id, nombreArchivo, res);
    }

}

function actualzarImagen(objeto, ruta, id, nombreArchivo, res) {
    objeto.findById(id, (err, objetoActualizar) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Entidad no encontrada',
                errors: err
            });
        }

        // si el objeto ya tenía imagen hay que borrarla

        if (objetoActualizar.img !== '' && objetoActualizar.img !== null) {

            var imagenAntigua = ruta + objetoActualizar.img;

            if (fs.existsSync(imagenAntigua)) {
                fs.unlinkSync(imagenAntigua);
            }
        }

        objetoActualizar.img = nombreArchivo;

        objetoActualizar.save((err, objetoGuardado) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al actualizar imagen de entidad',
                    errors: err
                });
            }

            return res.status(200).json({
                ok: true,
                mensaje: 'Imagen de entidad actualizada ',
                objetoGuardado: objetoGuardado
            });
        });
    });

}


module.exports = app;