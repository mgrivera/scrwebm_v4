

import ForerunnerDB from "forerunnerdb";

let fdb = new ForerunnerDB();
let db = fdb.db("scrwebm");

let ContProp_tablaConf = db.collection("contProp_tablaConf");
ContProp_tablaConf.deferredCalls(false);        // los inserts serán siempre síncronos ahora ... 

export { ContProp_tablaConf }; 
