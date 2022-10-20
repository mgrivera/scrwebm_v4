
import React, { Component } from "react";

export default class Lista extends React.Component {

    _limit = 50;            // cant de registros a leer cada vez desde el servidor  
    _totalRecCount = 0;     // cant de registros en la tabla que satisfacen el filtro indicado  

    constructor(props) { 
        super(props); 

        const result = leerCantRecsSatisfacenFiltroAsync();     // para saber la cant de recs que satisfacen el filtro  
        // this._leerRegistrosDesdeServer(this._limit);         // para leer los primeros 50 recs 

        if (!result.error) { 
            this._totalRecCount = result.cantRecs; 
        } else { 
        }

    }

    _leerRegistrosDesdeServer(limit) { 
        leerRegistrosDesdeServer(limit); 
    }

    render() {

        return (
            <div>
                <p>Ok, aquí se debería mostrar la lista de items seleccionados.</p>
            </div>
        );
  }
}

async function leerCantRecsSatisfacenFiltroAsync() {
    try { 
        const cantRecsSatisfacenFiltro = await leerCantRecsSatisfacenFiltro(); 
        return {
            error: false, 
            cantRecs: cantRecsSatisfacenFiltro, 
        }

    } catch(err) { 
        return {
            error: true, 
            err: err, 
        }
    }
}

function leerCantRecsSatisfacenFiltro() { 
    return new Promise((resolve, reject) => {
        Meteor.call('getCollectionCount', 'temp_consulta_notasDebitoCredito', (err, result) => {
    
            if (err) {
                reject(err);
            }
    
            // el método regresa la cantidad de items en el collection (siempre para el usuario)
            const recordCount = result;
            resolve(recordCount); 
        })
    })
} 

// let subscriptionHandle = {};
function leerRegistrosDesdeServer(limit) {
    // la idea es 'paginar' los registros que se suscriben, de 50 en 50
    // el usuario puede indicar 'mas', para leer 50 más; o todos, para leer todos los registros ...
    // $scope.showProgress = true;

    // lamentablemente, tenemos que hacer un stop al subscription cada vez que hacemos una nueva,
    // pues el handle para cada una es diferente; si no vamos deteniendo cada una, las anteriores
    // permanecen pues solo detenemos la última al destruir el stop (cuando el usaurio sale de
    // la página). Los documents de subscriptions anteriores permanecen en minimongo y el reactivity
    // de los subscriptions también ...
    if (subscriptionHandle && subscriptionHandle.stop) {
        subscriptionHandle.stop();
    }

    subscriptionHandle =
    Meteor.subscribe('notasDebitoCredito.leerSeleccionDesdeTablaTemp', limit, () => {

        $scope.helpers({
            temp_consulta_cierreRegistro: () => {
                return Temp_consulta_cierreRegistro.find({ user: Meteor.userId }, 
                                                            { sort: 
                                                            { 
                                                                'moneda.simbolo': 1, 
                                                                'compania.abreviatura': 1, 
                                                                referencia: 1, 
                                                                orden: 1, fecha: 1,  
                                                                serie: 1, 
                                                            }});
            }
        });

        // scope.consulta_ui_grid.data = $scope.temp_consulta_cierreRegistro;

        // $scope.alerts.length = 0;
        // $scope.alerts.push({
        //     type: 'info',
        //     msg: `${numeral($scope.temp_consulta_cierreRegistro.length).format('0,0')} registros
        //         (<b>de ${numeral(recordCount).format('0,0')}</b>) han sido seleccionados ...`
        // });

        // $scope.showProgress = false;
        // $scope.$apply();
    });
}

function leerMasRegistros (limit) {
    limit += 50;    // la próxima vez, se leerán 50 más ...
    leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
}

function leerTodosLosRegistros (recordCount) {
    // simplemente, leemos la cantidad total de registros en el collection (en el server y para el user)
    limit = recordCount;
    leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
}