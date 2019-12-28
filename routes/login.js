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

var mdAutenticacion = require('../middleware/autenticacion');


var app = express();

//==================================================
// Renovar token
//=================================================

// antes de renovar el token hay que comprobar que el actual es válido

app.get('/renuevatoken', mdAutenticacion.verificaToken, (req, res) => {

    // Si no hay error, el token es válido el programa continuará por aquí, status 200,
    // y ahora a renovar el token:
    var token = jwt.sign({ usuario: req.usuario }, SEED, { expiresIn: 14400 }); // expira en 4 horas


    // respuesta status(200) y nuevo token:

    res.status(200).json({
        ok: true,
        token: token
    });

    


});






//==================================================
// Autenticación normal
// =================================================

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
            mensaje: 'Credenciales correctas - OK',
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id,
            menu: obtenerMenu( usuarioDB.role)

        });

    });

});


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
/* verify().catch(console.error);  */

// Es obligatorio que la función sea async para usar el await (esperar)

app.post('/google', async(req, res) => {

    var token = req.body.token;

    var googleUser = await verify(token)
        .catch(e => {
            return res.status(403).json({
                ok: false,
                mensaje: 'Tocken no válido'
            });

        });

        console.log('googleUser',googleUser);

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
                        id: usuarioDB._id,
                        menu: obtenerMenu( usuarioDB.role)
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
                        id: usuarioDB._id,
                        menu: obtenerMenu( usuarioDB.role)
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

function obtenerMenu( ROLE) {

  var menu = [
    {
      titulo: 'Principal',
      icono: 'mdi mdi-gauge',
      submenu: [
        { titulo: 'Dashboard', url: '/dashboard'},
        { titulo: 'ProgressBar', url: '/progress'},
        { titulo: 'Gráficas', url: '/graficas1'},
        { titulo: 'Promesas', url: '/promesas'},
        { titulo: 'RxJs', url: '/rxjs'}
      ]
    },
    {
      titulo: 'Mantenimientos',
      icono: 'mdi mdi-folder-lock-open',
      submenu: [
        // { titulo: 'Usuarios', url: '/usuarios'},
        { titulo: 'Hospitales', url: '/hospitales'},
        { titulo: 'Médicos', url: '/medicos'}
      ]
    }
  ];

  if (ROLE ==='ADMIN_ROLE') {
      // si el rol del usuario conectado es administrador, se añade al array del menú la opción de
      // mto de usuarios. Se usa unshift en vez de push porque push agrega al final y unshift al ppio.
      menu[1].submenu.unshift( { titulo: 'Usuarios', url: '/usuarios'} );
  }

  return menu;

}


module.exports = app;