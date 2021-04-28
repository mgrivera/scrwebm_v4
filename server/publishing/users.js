
import { Meteor } from 'meteor/meteor'; 
import lodash from 'lodash';

Meteor.publish('allUsers', function () {

    // fallamos con un error si el usuario no tiene el rol admin
    const currentUser = Meteor.users.findOne(this.userId);

    if (!currentUser || !Array.isArray(currentUser.roles)) {
        this.ready();
        return;
    }

    const rolAdmin = lodash.find(currentUser.roles, rol => { return rol === 'admin'; });

    if (!rolAdmin){
        this.ready();
        return;
    }

    return Meteor.users.find();
})

Meteor.publish('userData', function () {

    // para publicar el field personales en users. Allí tenemos: título, nombre, cargo 
    if (this.userId) {
        return Meteor.users.find({ _id: this.userId }, { fields: { personales: 1 }});
    } else {
        this.ready();
    }
})