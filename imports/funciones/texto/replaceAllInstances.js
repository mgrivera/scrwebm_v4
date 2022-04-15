
import lodash from 'lodash'; 

function replaceAllInstances(str, oldString, newString) { 
    // use lodash to escape regExp special characters; ex: *, ... 
    const regex = new RegExp(lodash.escapeRegExp(oldString), 'g');
    return str.replace(regex, newString);     
}

export { replaceAllInstances }; 