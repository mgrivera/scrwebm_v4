
import { Mongo } from 'meteor/mongo';

// nótese que no usamos schema en tablas de este tipo ... 
export const Temp_consulta_riesgosEmitidos = new Mongo.Collection("temp_consulta_riesgosEmitidos");
export const Temp_consulta_riesgosEmitidos_config = new Mongo.Collection("temp_consulta_riesgosEmitidos_config");