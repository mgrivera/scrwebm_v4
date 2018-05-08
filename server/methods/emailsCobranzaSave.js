

Meteor.methods(
{
    'emailsCobranza.save': function (item) {

        // debugger;
        lodash(item.usuarios).remove((x) => { return x.docState == 3; }).value();
        lodash(item.firmantes).remove((x) => { return x.docState == 3; }).value();
        lodash(item.cuentasBancarias).remove((x) => { return x.docState == 3; }).value();
        lodash(item.reglas).remove((x) => { return x.docState == 3; }).value();

        item.usuarios.forEach((x) => {
            delete x.docState;
        });

        item.firmantes.forEach((x) => {
            delete x.docState;
        });

        item.cuentasBancarias.forEach((x) => {
            delete x.docState;
        });

        item.reglas.forEach((x) => {
            delete x.docState;
        });

        if (item.docState && item.docState == 1) {
            delete item.docState;
            EmailsCobranzaCuotasPendientes.insert(item);
        };


        if (item.docState && item.docState == 2) {
            var item2 = _.clone(item, true);

            delete item2.docState;
            delete item2._id;

            EmailsCobranzaCuotasPendientes.update({ _id: item._id }, { $set: item2 });
        };


        if (item.docState && item.docState == 3) {
            EmailsCobranzaCuotasPendientes.remove({ _id: item._id });
        };

        return {
            message: "Ok, los datos han sido actualizados en la base de datos."
        };
    }
});
