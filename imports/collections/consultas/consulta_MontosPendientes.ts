
import { Mongo } from 'meteor/mongo';

// nótese como nos vamos acostumbrando a no asociar un schema a collections temporales que se usan, básicamente, 
// para registrar datos de consultas (reportes, etc.)
export const Consulta_MontosPendientes = new Mongo.Collection("consulta_montosPendientes");
export const Consulta_MontosPendientes_config = new Mongo.Collection("consulta_montosPendientes_config");
