
import { Meteor } from 'meteor/meteor'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

import { CollectionFS_templates } from '/server/imports/collectionFS/Files_CollectionFS_templates'; 
import { CollectionFS_logos } from '/server/imports/collectionFS/Files_CollectionFS_logos'; 

Meteor.publish('collectionFS_files', function(tipoArchivo) {
    // regresamos registros solo para la cia seleccionada ...
    const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

    if (!companiaSeleccionada) {
        return [];
    }

    const filtro = {
        'metadata.cia': companiaSeleccionada.companiaID,
    };

    if (tipoArchivo) {
        const search = new RegExp(tipoArchivo, 'i');
        filtro['metadata.tipo'] = search;
    }

    return [
        CollectionFS_logos.find(filtro),
        CollectionFS_templates.find(filtro),
    ];
  })