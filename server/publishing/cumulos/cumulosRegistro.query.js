
import { Meteor } from 'meteor/meteor'; 

import { Cumulos } from '/imports/collections/catalogos/cumulos'; 
import { Cumulos_Registro } from '/imports/collections/principales/cumulos_registro';  

const cumulos = Cumulos.find().fetch(); 

// ---------------------------------------------------------------------------------------------------
// esta publicación crea su propio resutado, en vez que regresar un collection; es útil para listas 
// que muestran descripciones en vez de _ids. 
// NOTESE cómo se deben usar dos conceptos de meteor para lograr ésto: 
// 1) meteor publish api: pub.added / pub.changed / pub.removed
// 2) collection.find().observe(): added / changed / removed: observe callbacks 
Meteor.publish('cumulosRegistro.query', function(entityId) {
  const publication = this;

  const handle = Cumulos_Registro.find({ entityId }).observe({
    added(doc) {
      const newFields = transformDoc(doc); 
      publication.added('cumulosRegistroQuery', doc._id, newFields);
    },

    changed(doc) {
      const newFields = transformDoc(doc); 
      publication.changed('cumulosRegistroQuery', doc._id, newFields);
    },

    removed(doc) {
      publication.removed('cumulosRegistroQuery', doc._id);
    },
  });

  publication.ready();

  publication.onStop(() => {
    handle.stop();
  });
})

function transformDoc(doc) {
  // Do the transforms we want to the document here //  
  const tipoCumulo = cumulos.find(x => x._id === doc.tipoCumulo); 
  const zona = tipoCumulo.zonas ? tipoCumulo.zonas.find(x => x._id === doc.zona) : {}; 

  doc = { 
    ...doc, 
    
    tipoCumulo: tipoCumulo && tipoCumulo.descripcion ? tipoCumulo.descripcion : 'Indefinido', 
    zona: zona && zona.descripcion ? zona.descripcion : 'Indefinido', 

    ingreso: doc.ingreso, 
    ultAct: doc.ultAct
  }

  return doc
}