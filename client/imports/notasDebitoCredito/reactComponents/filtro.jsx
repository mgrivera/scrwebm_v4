
import React, { Component } from "react";
import lodash from 'lodash'; 
import { Grid } from 'semantic-ui-react'; 

import Form from "react-jsonschema-form";
import LayoutGridField from "react-jsonschema-form-layout-grid"; 

import FilterPageButtons from '../../reactComponents/filterPageButtons'; 

import { Filtros } from '/imports/collections/otros/filtros'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

// definimos el schema para el filtro y luego la forma 
const json_schema = {

    title: "Notas de débito / crédito",
    description: "Indique un filtro para seleccionar las notas de débito / crédito",
    type: "object",
    required: [],

    properties: {

        tipo: {
            title: "Tipo", type: "string",
            enum: ['ND', 'NC', '', ],
            enumNames: ['nd', 'nc', 'todas', ], 
            default: "", 
        },

        ano: { title: "Año", type: "integer", },
        numero1: { title: "Número (desde)", type: "integer", },
        numero2: { title: "Número (hasta)", type: "integer", },

        compania: { title: "Compañía", type: "string", },
        moneda: { title: "Moneda", type: "string", },

        fecha1: { title: "Fecha (desde)", type: "string", format: "date", },
        fecha2: { title: "Fecha (hasta)", type: "string", format: "date", },

        tipoNegocio: { title: "Tipo de negocio", type: "string", },
        miSu: {
            title: "Mi/Su", type: "string",
            enum: ['MI', 'SU', '', ], 
            enumNames: ['mi', 'su', 'todas', ], 
            default: "", 
        },

        cuentaBancaria: { title: "Cuenta bancaria", type: "string", },

        monto1: { title: "Monto (desde)", type: "number" },
        monto2: { title: "Monto (hasta)", type: "number" },
    },
}

const fields = {
    layout_grid: LayoutGridField
} 

const ui_schema = {
    'ui:field': 'layout_grid',
    'ui:layout_grid': {
        'ui:row': [
            {
                'ui:col': {
                    md: 12, children: [
                        {
                            'ui:row': [
                                { 'ui:col': { md: 2, children: [ { name: 'filler', render: (props) => { return null; }} ] } },
                                { 'ui:col': { md: 2, children: ['tipo'] } },
                                { 'ui:col': { md: 2, children: ['ano'] } },
                                { 'ui:col': { md: 2, children: ['numero1'] } },
                                { 'ui:col': { md: 2, children: ['numero2'] } },
                            ]
                        },
                        {
                            'ui:row': [
                                { 'ui:col': { md: 2, children: [ { name: 'filler', render: (props) => { return null; }} ] } },
                                { 'ui:col': { md: 2, children: ['compania'] } },
                                { 'ui:col': { md: 2, children: ['moneda'] } },
                                { 'ui:col': { md: 2, children: ['fecha1'] } },
                                { 'ui:col': { md: 2, children: ['fecha2'] } },
                            ]
                        },
                        {
                            'ui:row': [
                                { 'ui:col': { md: 2, children: [ { name: 'filler', render: (props) => { return null; }} ] } },
                                { 'ui:col': { md: 2, children: ['tipoNegocio'] } },
                                { 'ui:col': { md: 2, children: ['miSu'] } },
                                { 'ui:col': { md: 2, children: ['cuentaBancaria'] } },
                            ]
                        },
                        {
                            'ui:row': [
                                { 'ui:col': { md: 2, children: [ { name: 'filler', render: (props) => { return null; }} ] } },
                                { 'ui:col': { md: 2, children: ['monto1'] } }, 
                                { 'ui:col': { md: 2, children: ['monto2'] } }
                            ]
                        },
                        // { 'ui:row': [
                        //     { 'ui:col': { md: 12, children: [
                        //       { name: 'description', render: (props) => {
                        //             const { formData, errorSchema } = props; 
                        //             const { cuentaBancaria, monto } = formData; 

                        //             if (cuentaBancaria && monto) { 
                        //                 return (
                        //                     <div>
                        //                     <h3>Hello, {cuentaBancaria} {monto}!</h3>
                        //                     <p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sad</p>
                        //                     </div>
                        //                 )
                        //             } else { 
                        //                 return null; 
                        //             }
                        //       } }
                        //     ] } },
                        //   ] },
                    ]
                }
            },
        ],
    },
    'tipo': {
        'ui:widget': 'radio', 
        "ui:options": {
            inline: true, 
        }, 
        "ui:autofocus": true, 
    },
    'miSu': {
        'ui:widget': 'radio', 
        "ui:options": {
            inline: true, 
        }, 
    },
}

export default class Filtro extends React.Component {

    constructor(props) { 
        super(props); 

        this.reactForm_onSubmit = this.reactForm_onSubmit.bind(this); 
        this.reactForm_onBlur = this.reactForm_onBlur.bind(this); 

        this.limpiarFiltro = this.limpiarFiltro.bind(this); 
        this.nuevo = this.nuevo.bind(this); 
        this.aplicarFiltro = this.aplicarFiltro.bind(this); 

        this.myForm = {}; 

        this.state = {
            formData: { ano: 1960, }
        };

        // ------------------------------------------------------------------------------------------------------
        // si hay un filtro anterior, lo usamos; los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
        const filtroAnterior = Filtros.findOne({ nombre: 'notasDebitoCredito', userId: Meteor.userId() });

        // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
        if (filtroAnterior && filtroAnterior.filtro && !lodash.isEmpty(filtroAnterior.filtro)) { 
            this.state.formData = lodash.clone(filtroAnterior.filtro);
        }

        // leemos la compañía seleccionada
        this.companiaSeleccionadaID = CompaniaSeleccionada.findOne({ userID: Meteor.userId() }, { fields: { companiaID: 1, }});
    }

    reactForm_onSubmit({formData}) {
        console.log("Data submitted: ",  formData);
        const form = this.myForm; 
    }

    reactForm_onBlur(id, value) {
        const state = this.state.formData; 
    }

    reactForm_onChange({ formData }) {
        this.setState({ formData });
    }

    limpiarFiltro = (e) => { 
        this.setState({ formData: {}, });
    }

    nuevo = (e) => { 
        const a = 1; 
    }

    aplicarFiltro = (e) => { 

        // $scope.showProgress = true;
        Meteor.call('notasDebitoCredito.leerDesdeMongo', JSON.stringify(this.state.formData), this.companiaSeleccionadaID.companiaID, (err, result) => {

            if (err) {
                // let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                // $scope.alerts.length = 0;
                // $scope.alerts.push({
                //     type: 'danger',
                //     msg: errorMessage
                // });

                // $scope.showProgress = false;
                // $scope.$apply();

                return;
            }

            // guardamos el filtro indicado por el usuario
            if (Filtros.findOne({ nombre: 'notasDebitoCredito', userId: Meteor.userId() })) { 
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'notasDebitoCredito', userId: Meteor.userId() })._id,
                                { $set: { filtro: this.state.formData } }, { validate: false });
            }
            else { 
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'notasDebitoCredito',
                    filtro: this.state.formData
                });
            }
                
            // $scope.showProgress = false;

            // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
            // $state.go('riesgosLista', { origen: $scope.origen, limit: 50 });

            // cambiamos el Tab a #1, para pasar desde el filtro al list 
            this.props.changeTabIndex(1); 
        })
    }

    render() {

        const formStyle = { textAlign: 'left', }; 

        return (
            <div>
                <Grid>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <div style={formStyle}>
                                <Form schema={json_schema}
                                    uiSchema={ui_schema}
                                    formData={this.state.formData}
                                    fields={fields}
                                    onSubmit={this.reactForm_onSubmit} ref={(form) => { this.myForm = form; }}
                                    onChange={args => this.reactForm_onChange(args)}
                                    noHtml5Validate={false} />
                            </div>
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <FilterPageButtons limpiarFiltro={this.limpiarFiltro}
                                               nuevo={this.nuevo}
                                               aplicarFiltro={this.aplicarFiltro} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
  }
}