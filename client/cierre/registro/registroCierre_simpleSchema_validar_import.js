
// este schema es una copia del que existe para el collection (cierreRegistro). La idea es poder validar los 
// items que el usuario importe a la lista mediante la opción "Importar". 
// Nota: luego que el usuario importa los items y se validan contra este schema, se vuelven a validar contra el 
// schema original nuevamente. Por ejemplo, una validación super importante que no está aquí es la fecha del 
// cierre. El usaurio no debe editar registros anteriores a la fecha del último cierre. 
import SimpleSchema from 'simpl-schema';

// origen_keys: la idea de esta estructura es guardar, para cada registro del cierre, los IDs de su 'origen'; por ejemplo, 
// en el caso de registros que provienen de proporcionales, el ID del contrato y de la definición de cuenta técnica. 
// Con estos dos IDs, podríamos buscar fácilemente el registro de origen (ej: saldo de cuenta técnica) y obtener 
// su monto de corretaje ...
export const registroCierre_simpleSchema_validar_import = new SimpleSchema({
    _id: { type: String, optional: false },

    fecha: { type: Date, label: "Fecha", optional: false, },
    moneda: { type: String, label: "Moneda", optional: false, },
    compania: { type: String, label: "Compania", optional: false, },
    cedente: { type: String, label: "Cedente", optional: true, },
    tipo: { type: String, label: "Tipo (Manual)", optional: false, allowedValues: ["M"] },
    origen: { type: String, label: "Origen", optional: true, },
    referencia: { type: String, label: "Referencia", optional: true, },
    cobroPagoFlag: { type: Boolean, label: "Cobro o pago", optional: false, },
    serie: { type: SimpleSchema.Integer, label: "Serie", optional: true, min: 2000, max: 2050 },
    tipoNegocio: { type: String, label: "Tipo de negocio", optional: true, allowedValues: ["Prop", "NoProp", "Fac", "Otro"] },
    categoria: { type: String, label: "Categoría", optional: true, allowedValues: ["Prima", "Sin", "Saldo", "Cobro", "Pago", "ComAdic", "PartBeneficios", "RetCartPr", "EntCartPr", "RetCartSn", "EntCartSn"] },
    descripcion: { type: String, label: "Descripcion", optional: false, },
    monto: { type: Number, label: "Monto", optional: false, },

    origen_keys: { type: Array, required: false, },
    'origen_keys.$': { type: String, },

    usuario: { type: String, label: "Usuario que efectuó el cierre", optional: false, },
    ingreso: { type: Date, label: "Ingreso", optional: false, },
    ultAct: { type: Date, label: "Ult act", optional: false, },
    cia: { type: String, label: "Cia", optional: false, },
    
    docState: { type: Number, optional: true, }
})