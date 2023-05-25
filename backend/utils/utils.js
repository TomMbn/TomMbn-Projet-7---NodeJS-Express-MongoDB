const sharp = require ("sharp");
const fs = require("fs");

exports.compress = (imagePath, compressedImagePath, callback) =>{
    return sharp(imagePath)
        .jpeg({ quality: 30 }) // Réglez la qualité de compression (ici, 80% de la qualité d'origine)
        .toFile(compressedImagePath, (err, info) => {
            if (err) {
              console.error(err);
              console.log("coucou")
              // Traitez les erreurs de compression d'image ici
              return false;
            }
    
            // Supprimez l'ancienne image non compressée
            fs.unlinkSync(imagePath);
            callback(err, info);
    
            // Mettez à jour l'URL de l'image avec le chemin vers l'image compressée
    
            // Sauvegardez le livre dans la base de données
            
          });
}