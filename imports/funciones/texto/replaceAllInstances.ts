
import * as lodash from 'lodash'; 

function replaceAllInstances(str, oldString, newString) { 
    // use lodash to escape regExp special characters; ex: *, ... 
    let regex = new RegExp(lodash.escapeRegExp(oldString), 'g');
    return str.replace(regex, newString);     
}

export { replaceAllInstances }; 