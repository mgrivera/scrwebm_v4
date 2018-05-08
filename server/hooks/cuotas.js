

import { Cuotas } from '/imports/collections/principales/cuotas'; 

Cuotas.before.remove(function (userId, doc) {

    // cuotas
    // impedimos eliminar una cuota que haya sido cobrada/pagada
    let cuota = Cuotas.findOne({ _id: doc._id, $and: [ { pagos: { $exists: true }}, { pagos: { $ne: [] }}, ] });

    if (cuota) {
        throw new Meteor.Error("dataBaseError",
                    "Cuota cobrada/pagada.",
                    `La cuota que Ud. intenta eliminar tiene cobros (o pagos) asociados.<br />
                    Una cuota con cobros/pagos asociados no puede ser eliminada.<br />
                    <b>Nota:</b> Ud. debe <b>antes</b> editar la remesa que corresponde y <em>revertirla</em> (para eliminar sus cobros/pagos).<br />
                    Solo luego podrá regresar y eliminar esta cuota. 
                    `);
    }
})