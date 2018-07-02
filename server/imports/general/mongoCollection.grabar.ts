

export function mongoCollection_array_grabar(mongoCollectionArray, mongoCollection) { 

    // recibimos un array que representa items para un mongo collection; intentamos grabar al collection ... 

    let inserts = mongoCollectionArray.filter((x) => { return x.docState && x.docState == 1; })
                                      .map((x) => { delete x.docState; return x; });

    inserts.forEach(function (item) {
        mongoCollection.insert(item);
    })


    let updates = mongoCollectionArray.filter((item) => { return item.docState && item.docState == 2; })
                                      .map((item) => { delete item.docState; return item; })                // eliminamos docState del objeto 
                                      .map((item) => { return { _id: item._id, object: item }; })           // separamos el _id del objeto 
                                      .map((item) => { delete item.object._id; return item; })              // eliminamos _id del objeto (arriba lo separamos) 


    updates.forEach(function (item) {
        mongoCollection.update({ _id: item._id }, { $set: item.object });
    })

    let removes = mongoCollectionArray.filter((x) => { return x.docState && x.docState == 3; });

    removes.forEach(function (item) {
        mongoCollection.remove({ _id: item._id });
    })
}