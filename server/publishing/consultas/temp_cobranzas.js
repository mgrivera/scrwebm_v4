
Meteor.publish("temp_cobranzas", function () {
    return Temp_Cobranzas.find({ usuario: this.userId });
});
