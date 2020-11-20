
import { Meteor } from 'meteor/meteor';

Meteor.publish('usuarios', function () {
    return Meteor.users.find({}, { fields: { username: 1, emails: 1, createdAt: 1 }});
})