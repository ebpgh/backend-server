var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var Usuario = require('../models/usuario');
var SEED = require('../config/config').SEED;


// google
var CLIENT_ID = require('../config/config').CLIENT_ID;
const { OAuth2Client } = require('google-auth-library'); // La estructura {OAuth2Client}  extrae
// OAuth2Client  de la librería google-auth-library
const client = new OAuth2Client(CLIENT_ID);


var app = express();

//==================================================
// Autenticación google
// =================================================

// Una función async retorna una promesa
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    //const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];

    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true,
        payload
    }

}

verify().catch(console.error);

// Es obligatorio que la función sea async para usar el await (esperar)

app.post('/google', async(req, res) => {

    var token = req.body.token;

    var googleUser = await verify(token)
        .catch(e => {
            return res.status(403).json({
                ok: false,
                mensaje: 'Tocken que no vale'
            });

        });

        Usuario.findOne({email:googleUser.email}, (err, usuarioDB) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar usuario',
                    errors: err
                });
            }

            if (usuarioDB) {

                if (usuarioDB.google === false) {
                    // el usuario existe en la BD pero no se validó con su cuenta de google
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Debe autenticarse con su cuenta normal',
                        errors: err
                    });
                } else {
                    // el usuario existe ya en la BD y se validó con su cuenta de google
                    // se genera su token y se devuelven los datos del usuario como respuesta
                    
                    var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // expira en 4 horas
            
                    res.status(200).json({
                        ok: true,
                        mensaje: 'Usuario validado correctamente con su cta google',
                        usuario: usuarioDB,
                        token: token,
                        id: usuarioDB._id
                    });
                }

            } else  {

                // el usaurio no existe en la BD y por lo tanto hay que crearlo en la BD

                var usuario = new Usuario();

                usuario.nombre = googleUser.nombre;
                usuario.email = googleUser.email;
                usuario.img = googleUser.img;
                usuario.google = true;
                usuario.password = ':)';

                usuario.save((err, usuarioDB) => {
                    usuarioDB.password = ':)';
                    var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // expira en 4 horas
            
                    res.status(200).json({
                        ok: true,
                        usuario: usuarioDB,
                        token: token,
                        id: usuarioDB._id
                    });

                })

            }



        }); 



/*     return res.status(200).json({
        ok: true,
        mensaje: 'Login correcto',
        googleUser: googleUser
    });  */
});

//==================================================
// Autenticación normal
// =================================================

var app = express();


app.post('/', (req, res) => {

    var body = req.body;

    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - email',
                errors: err
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - password',
                errors: err
            });
        }

        // Crear tocken
        usuarioDB.password = ':)';
        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // expira en 4 horas

        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id
        });

    });




});







module.exports = app;