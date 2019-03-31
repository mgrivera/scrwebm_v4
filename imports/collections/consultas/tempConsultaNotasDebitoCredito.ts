

import { Mongo } from 'meteor/mongo';

// nótese cómo *no* asociamos un schema a esta tabla. Dejamos de hacerlo para este tipo de tablas 
// que usamos en forma temporal para consultas, etc. 
export const Temp_Consulta_NotasDebitoCredito: any = new Mongo.Collection("temp_consulta_notasDebitoCredito");