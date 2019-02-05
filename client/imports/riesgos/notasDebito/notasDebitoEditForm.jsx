

import React, { Component } from "react";
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { Alert } from 'react-bootstrap';
 
import Form from "react-jsonschema-form";
import LayoutGridField from "react-jsonschema-form-layout-grid"; 

import moment from 'moment'; 

import { NotasDebitoCredito } from '/imports/collections/principales/notasDebitoCredito'; 
import { Companias } from "/imports/collections/catalogos/companias";
import { Monedas } from "/imports/collections/catalogos/monedas";
import { Bancos } from '/imports/collections/catalogos/bancos'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 
import { TiposFacultativo } from '/imports/collections/catalogos/tiposFacultativo'; 

export default class NotasDebitoEditForm extends React.Component {

  render() {

    // reactjs props 
    const riesgoID = this.props.riesgoId; 
    const movimientoSeleccionadoID = this.props.movimientoSeleccionadoId; 

    const companias = Companias.find({}, { sort: { abreviatura: 1 }, fields: { _id: 1, abreviatura: 1, }}).fetch(); 
    const monedas = Monedas.find({}, { sort: { simbolo: 1 }, fields: { _id: 1, simbolo: 1, }}).fetch(); 
    const tiposNegocio = TiposFacultativo.find({}, { sort: { descripcion: 1 }, fields: { _id: 1, descripcion: 1, }}).fetch(); 

    let bancos = Bancos.find().fetch(); 
    let cuentasBancarias = CuentasBancarias.find({}, { sort: { numero: 1 }}).fetch(); 

    // construimos un array de cuentas bancarias con una descripción que incluya el banco, moneda, ... 
    let cuentasBancariasPreparadas = prepararCuentasBancarias(bancos, monedas, cuentasBancarias); 

    const json_schema = {
      title: "Notas de débito",
      description: "Notas de débito para el movimiento seleccionado",
      type: "array",
      items: { 
        type: "object", 
        required: [ "tipo", "ano", "numero", "compania", "moneda", "fecha", "cuentaBancaria", "monto", ],

        properties: {
          tipo: { title: "Tipo (NC/ND)", type: "string" },

          tipoNegocio: { title: "Tipo de negocio", type: "string", 
            "enum": tiposNegocio.map(x => x._id),
            "enumNames": tiposNegocio.map(x => x.descripcion), 
          },

          ano: { title: "Año", type: "integer" },
          numero: { title: "Número", type: "integer" },

          compania: { title: "Compañía", type: "string", 
            "enum": companias.map(x => x._id),
            "enumNames": companias.map(x => x.abreviatura), 
          },

          moneda: { title: "Moneda", type: "string", 
            "enum": monedas.map(x => x._id),
            "enumNames": monedas.map(x => x.simbolo), 
          },

          fecha: { title: "Fecha", type: "string", format: "date", },
          fechaCuota: { title: "F cuota", type: "string", format: "date", },
          fechaVencimientoCuota: { title: "F venc cuota", type: "string", format: "date", },

          cuentaBancaria: { title: "Cuenta bancaria", type: "string", 
            "enum": cuentasBancariasPreparadas.map(x => x._id),
            "enumNames": cuentasBancariasPreparadas.map(x => x.descripcion), 
          },

          monto: { title: "Monto", type: "number" },
          observaciones: { title: "Observaciones", type: "string" },
          docState: { title: "Editado", type: "integer" },
        }, 
      }
    }

    const fields = {
      layout_grid: LayoutGridField
    }    

    const ui_schema = {

      "ui:options": {
        "addable": false,
        "orderable": false,
        "removable": false
      }, 

      items: {

        'ui:field': 'layout_grid',
        'ui:layout_grid':
        {
          'ui:row': [
            {
              'ui:col': {
                md: 12, children: [
                  {
                    'ui:row': [
                      { 'ui:col': { md: 3, children: ['tipo'] } },
                      { 'ui:col': { md: 3, children: ['ano'] } },
                      { 'ui:col': { md: 3, children: ['numero'] } },
                    ]
                  },
                  {
                    'ui:row': [
                      { 'ui:col': { md: 6, children: ['compania'] } },
                      { 'ui:col': { md: 3, children: ['moneda'] } },
                      { 'ui:col': { md: 3, children: ['fecha'] } },
                    ]
                  },


                  {
                    'ui:row': [
                      { 'ui:col': { md: 6, children: ['tipoNegocio'] } },
                      { 'ui:col': { md: 3, children: ['fechaCuota'] } },
                      { 'ui:col': { md: 3, children: ['fechaVencimientoCuota'] } },
                    ]
                  },


                  {
                    'ui:row': [
                      { 'ui:col': { md: 6, children: ['cuentaBancaria'] } },
                      { 'ui:col': { md: 6, children: ['monto'] } },
                    ]
                  },
                  {
                    'ui:row': [
                      { 'ui:col': { md: 11, children: ['observaciones'] } },
                      { 'ui:col': { md: 1, children: ['docState'] } },
                    ]
                  },
                ]
              }
            },
          ]
        },

        tipo: {
          "ui:help": "(ND/NC)", 
          "ui:disabled": true, 
        },
        tipoNegocio: {
          "ui:help": "(ej: Riesgo fac exc pérdidas)", 
        },
        ano: {
          "ui:disabled": true, 
        },
        numero: {
          "ui:disabled": true, 
        },
        compania: {
          "ui:disabled": true, 
        },
        moneda: {
          "ui:disabled": true, 
        },
        fecha: {
        },
        fechaCuota: {
        },
        fechaVencimientoCuota: {
        },
        cuentaBancaria: {
          "ui:help": "Para recibir el monto del pago"
        },
        observaciones: {
          "ui:widget": "textarea"
        },
        docState: { 
          "ui:title": " "
        }
      }
    }

    // las notas de débito están en minimongo, pues fueron leídas (subscribe) desde el código que ejecuta a éste 
    // TODO: debemos recibir IDs del riesgo y movimiento para leer desde aquí solo las notas de débito para éste 
    let notasDebito = NotasDebitoCredito.find({ 'source.entityID': riesgoID, 'source.subEntityID': movimientoSeleccionadoID }).fetch(); 

    // TODO: por ahora, no sabemos como usar dates nativos en json-schema; por ahora vamos a usar strings (???!!!!) 
    for (let nd of notasDebito) { 
      nd.fecha = moment(nd.fecha).format('YYYY-MM-DD'); 
      nd.fechaCuota = moment(nd.fechaCuota).format('YYYY-MM-DD'); 
      nd.fechaVencimientoCuota = moment(nd.fechaVencimientoCuota).format('YYYY-MM-DD'); 
    }

    function reactForm_onSubmit(formData) {
      // en formData vienen los cambios que el usuario hizo a través de la forma (notasDebito) 
      let myData = formData.formData;

      Meteor.call('notasDebito_grabar', myData, (err, result) => {

        let alertStyle = "";
        let alertMessage = `<h4>Las notas de débito han sido registradas</h4>
                            <p>
                              Ok, las notas de débito han sido registradas. Ahora Ud. puede obtenerlas en formato  
                              <em>Microsoft Word</em> para imprimirlas, guardarlas o enviarlas en un e-mail. 
                            </p>`;

        if (err) {
          alertStyle = "danger";
          alertMessage = `<h4>Se ha obtenido un error al intentar ejecutar el proceso</h4>
                          <p>${err.message}</p>`;
        } else if (result.error) {
                alertStyle = "danger";
                alertMessage = `<h4>Se ha obtenido un error al intentar ejecutar el proceso</h4>
                                <p>${result.message}</p>`;
              } else { 
                alertStyle = "info";
                alertMessage = `<h4>Los cambios se han registrado en forma satisfactoria</h4>
                                <p>${result.message}</p>`;
              }

        

        const alertInstance = (
          <Alert bsStyle={alertStyle}>
            <div style={{ textAlign: 'left' }}>
              {alertMessage}
            </div>
          </Alert>
        );
        ReactDOM.render(alertInstance, document.getElementById('btAlert'));
      })
    }

    function reactForm_onBlur(inputId, inputValue) { 
      // TODO: nótese que esto no está realmente funcionando como lo esperabamos, pues como accedemos y editamos 
      // los items que maneja la forma. Al editar notasDebito (formData), los cambios no se reflejan en la forma (???!!!) 
      const editedField = inputId.split("_"); 
      const rowIndex = parseInt(editedField[1], 10); 
      const fieldName = editedField[2]; 

      // cuando el usuario edita el regitro, ponemos su rowState en 2 
      let row = notasDebito[rowIndex]; 

      if (!row.docState) { 
        row.docState = 2; 
      }
    }
      
    return (
      <div>

        <div id="btAlert"></div>

        <h2>Notas de débito para el riesgo y movimiento seleccionado.</h2>
        <p>
            Estas son las notas de débito que se han construido y registrado para el movimiento seleccionado.<br />
            Ud. puede editar su información y hacer un click en Grabar, para que los cambios se registren en forma permanente. 
        </p>

        <div className="row">
            <div className="col-sm-10 col-sm-offset-1" style={{textAlign: 'left'}}>
                <Form schema={json_schema}
                      uiSchema={ui_schema}
                      formData={notasDebito}
                      fields={fields}
                      onBlur={reactForm_onBlur}
                      onSubmit={reactForm_onSubmit} />
            </div>
        </div>

      </div>
    );
  }
}

// nota: con propTypes no tenemos que definir los props desde el componente angular
// ejemplo: .component('renderImage', react2angular(RenderImage, [ 'prop1', 'prop2', ..., ]));
NotasDebitoEditForm.propTypes = {
  riesgoId: PropTypes.string.isRequired,
  movimientoSeleccionadoId: PropTypes.string.isRequired,
};

// para regresar las cuentas bancarias, pero con la moneda y el banco en su descripción ... 
function prepararCuentasBancarias(bancos, monedas, cuentasBancarias) { 

  let cuentasBancarias_array = []; 

  // las cuentas bancarias y los bancos están siempre en minimongo, pues se regresan con un publish(null) 
  for (let cb of cuentasBancarias) { 

    const cuentaBancariaEditada = {}; 

    const simboloMoneda = monedas.find((x) => x._id === cb.moneda).simbolo; 
    const bancoNombreCorto = bancos.find((x) => x._id === cb.banco).abreviatura; 

    cuentaBancariaEditada._id = cb._id; 
    cuentaBancariaEditada.descripcion = `${cb.numero} - ${cb.tipo} - ${simboloMoneda} - ${bancoNombreCorto}`; 

    cuentasBancarias_array.push(cuentaBancariaEditada); 
  }

  return cuentasBancarias_array; 
}





















// const uiSchema = {
//   'ui:field': 'layout_grid',
//   'ui:layout_grid': { 'ui:row': [
//     { 'ui:col': { md: 12, children: [
//       { 'ui:group': 'ABC', 'ui:row': [
//         { 'ui:col': { md: 6, children: ['firstName'] } },
//         { 'ui:col': { md: 6, children: ['lastName'] } },
//       ] },
//       { 'ui:row': [
//         { 'ui:col': { md: 3, children: ['image'] } },
//         { 'ui:col': { md: 9, children: ['user'] } },
//       ] },
//       { 'ui:row': [
//         { 'ui:col': { md: 12, children: ['details'] } },
//       ] },
//       { 'ui:row': [
//         { 'ui:col': { md: 12, children: [
//           { name: 'description', render: (props) => {
//             const { formData, errorSchema } = props
//             const { firstName, lastName } = formData

//             return (
//               <div>
//                 <h3>Hello, {firstName} {lastName}!</h3>
//                 <p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sad</p>
//               </div>
//             )
//           } }
//         ] } },
//       ] },
//       { 'ui:row': [
//         { 'ui:col': { md: 12, children: ['age'] } },
//       ] },
//       { 'ui:row': [
//         { 'ui:col': { md: 12, children: ['bio'] } },
//       ] },
//     ] } },
//   ] },
//   'bio': {
//     'ui:widget': 'textarea'
//   },
//   'image': {
//     'ui:widget': 'ImageUpload'
//   },
//   'user': {
//     'ui:field': 'layout_grid',
//     'ui:layout_grid': { 'ui:row': [
//         { 'ui:col': { md: 6, children: ['username'] } },
//         { 'ui:col': { md: 6, children: ['password'] } },
//     ] },

//   }
// }
