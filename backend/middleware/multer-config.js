const multer = require ("multer");


const storage = multer.diskStorage({
    destination: (req, file, callback) =>{
        callback(null, "images")
    },
    filename: (req, file, callback) =>{
        const name = file.originalname.split(' ').join('_').split(".")[0];
        const extension = file.originalname.split(".")[1];
        callback(null, name + Date.now() + "." + extension);
    }
})

module.exports = multer({ storage }).single("image");