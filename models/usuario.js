var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var rolesValidos = {
    values: ['ADMIN_ROLES', 'USER_ROLE'],
    message: '{VALUE} no es un rol válido'
};

var usuarioSchema = new Schema({
    nombre: { type: String, required: [true, 'El nombre es necesario'] },
    email: { type: String, unique: true, required: [true, 'El correo es necesario'] },
    password: { type: String, required: [true, 'La clave es necesaria'] },
    img: { type: String, required: false },
<<<<<<< HEAD
    role: { type: String, required: true, default: 'USER_ROLE', enum: rolesValidos },
    google: { type: Boolean, default: false} //Para saber si el usuario se creó por Google
    // si google es true quiere decir que se dió de alta usando su cuenta de google
=======
    role: { type: String, required: true, default: 'USER_ROLE', enum: rolesValidos }
>>>>>>> a6c0b89026ff9a93c41efd3d3b1fa4d5c6809d43
});

usuarioSchema.plugin(uniqueValidator, { message: '{PATH} debe ser único' });

module.exports = mongoose.model('Usuario', usuarioSchema);