

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

Meteor.publish('collectionFS_files', function(tipoArchivo) {
    // regresamos registros solo para la cia seleccionada ...
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

    if (!companiaSeleccionada) {
        return [];
    }

    let filtro = {
        'metadata.cia': companiaSeleccionada.companiaID,
    };

    if (tipoArchivo) {
        let search = new RegExp(tipoArchivo, 'i');
        filtro['metadata.tipo'] = search;
    }

    return [
        CollectionFS_logos.find(filtro),
        CollectionFS_templates.find(filtro),
    ];
  });
