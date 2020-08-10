
import fs from 'fs';
import path from 'path';

// para agregar los directorios desde node en forma recursiva antes de intentar grabar el archivo 
const  myMkdirSync = function (dir) {
    if (fs.existsSync(dir)) {
        return
    }

    try {
        fs.mkdirSync(dir)
    } catch (err) {
        if (err.code == 'ENOENT') {
            myMkdirSync(path.dirname(dir)) //create parent dir
            myMkdirSync(dir) //create dir
        }
    }
}

export { myMkdirSync }; 