
Meteor.publish("referencias", function (ciaSeleccionadaID) {
    return Referencias.find({ cia: ciaSeleccionadaID });
});
