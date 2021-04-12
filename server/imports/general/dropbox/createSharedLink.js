
import { Meteor } from 'meteor/meteor'; 

import fetch from 'isomorphic-fetch';
import { Dropbox } from 'dropbox';

// esta función crea un shared download link para un file en dropbox 
const dropBoxCreateSharedLink = async function(filePath) { 

    const dropBoxAccessToken = Meteor.settings.public.dropBox_appToken;      

    // obtenemos el objeto dropbox que nos permitirá acceder al api 
    const dbx = new Dropbox({
        accessToken: dropBoxAccessToken, 
        fetch: fetch
    });

    // 3) obtenemos el link 
    // creamos un sharedLink para que el usuario pueda tener acceso al file que se graba en Dropbox 
    let sharedLinkResponse = null; 

    try {
        // from npm: convert a node stream to a string or buffer; note: returns a promise 
        sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
            path: filePath,
            settings: {
                requested_visibility: 'public',
            }
        });
    } catch (err) {
        // si el shared link ya existe, intentamos recuperarlo desde el error 
        if (err.error && err.error.error && err.error.error['.tag'] && err.error.error['.tag'] === 'shared_link_already_exists') {

            try {
                sharedLinkResponse = await dbx.sharingListSharedLinks({
                    path: filePath,
                    direct_only: true,
                });
            } catch (err) {
                const message = `Error: se ha producido un error al intentar producir un (shared) link
                                    para el archivo ${filePath} desde Dropbox. <br />
                                    El mensaje del error obtenido es: ${err.message}
                                `;
                return {
                    error: true,
                    message: message,
                }
            }

        } else {
            console.log(JSON.stringify(err))
            const message = `Error: se ha producido un error al intentar producir un (shared) link para el archivo ${filePath} desde Dropbox. <br />
                             El mensaje del error obtenido es: ${err}
                            `;
            return {
                error: true,
                message: message,
            }
        }
    }

    let sharedLink = '#'; 

    if (sharedLinkResponse.url) { 
        sharedLink = sharedLinkResponse.url; 
    } else { 
        if (sharedLinkResponse.links && Array.isArray(sharedLinkResponse.links) && sharedLinkResponse.links.length) { 
            sharedLink = sharedLinkResponse.links[0].url; 
        }
    }

    // regresamos el link 
    return { 
        error: false, 
        sharedLink: sharedLink, 
    } 
}

export { dropBoxCreateSharedLink }; 