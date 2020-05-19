
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