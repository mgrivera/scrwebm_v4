
Meteor.publish('allUsers', function () {

    // debugger;

    // fallamos con un error si el usuario no tiene el rol admin
    let currentUser = Meteor.users.findOne(this.userId);

    if (!currentUser || !_.isArray(currentUser.roles)) {
        this.ready();
        return;
    }

    rolAdmin = _.find(currentUser.roles, rol => { return rol === 'admin'; });

    if (!rolAdmin){
        this.ready();
        return;
    }

    return Meteor.users.find();
});
