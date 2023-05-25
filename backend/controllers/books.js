const Book = require("../models/Book");
const sharp = require("sharp");
const fs = require("fs");
const { compress } = require("../utils/utils");

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
  });

  // Compression de l'image avant la sauvegarde
  const imagePath = `${req.file.destination}/${req.file.filename}`;
  const compressedImagePath = `${req.file.destination}/compressed_${req.file.filename}`;
  console.log(compressedImagePath);

  compress(imagePath, compressedImagePath, (err, info) => {
    book.imageUrl = `${req.protocol}://${req.get("host")}/images/compressed_${
      req.file.filename
    }`;

    // Sauvegardez le livre dans la base de données
    book
      .save()
      .then(() => res.status(201).json({ message: "Livre créé" }))
      .catch((error) => res.status(400).json({ error }));
  });

  // Utilisez sharp pour compresser l'image
  /*sharp(imagePath)
        .jpeg({ quality: 80 }) // Réglez la qualité de compression (ici, 80% de la qualité d'origine)
        .toFile(compressedImagePath, (err, info) => {
          if (err) {
            console.error(err);
            // Traitez les erreurs de compression d'image ici
            return res.status(500).json({ error: 'Erreur lors de la compression de l\'image.' });
          }
  
          // Supprimez l'ancienne image non compressée
          fs.unlinkSync(imagePath);
  
          // Mettez à jour l'URL de l'image avec le chemin vers l'image compressée
          book.imageUrl = `${req.protocol}://${req.get("host")}/images/compressed_${req.file.filename}`;
  
          // Sauvegardez le livre dans la base de données
          book.save()
            .then(() => res.status(201).json({ message: "Livre créé" }))
            .catch(error => res.status(400).json({ error }));
        });*/
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete bookObject._userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (req.file) {
        const imagePath = `${req.file.destination}/${req.file.filename}`;
        const compressedImagePath = `${req.file.destination}/compressed_${req.file.filename}`;
        const filename = book.imageUrl.split("/images/")[1];

        compress(imagePath, compressedImagePath, (err, info) => {
          bookObject.imageUrl = `${req.protocol}://${req.get(
            "host"
          )}/images/compressed_${req.file.filename}`;
          fs.unlink(`images/${filename}`, (error) => {
            if (error) {
              console.log(
                "Une erreur s'est produite lors de la suppression du fichier :",
                error
              );
            } else {
              console.log("Le fichier a été supprimé avec succès.");
            }
          });
          Book.updateOne(
            { _id: req.params.id },
            { ...bookObject, _id: req.params.id }
          )
            .then(() => res.status(200).json({ message: "Objet modifié!" }))
            .catch((error) => res.status(401).json({ error }));
          console.log(bookObject);
        });
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Objet modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      const filename = book.imageUrl.split("/images/")[1];
      fs.unlink(`images/${filename}`, () => {
        Book.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Livre supprimé" }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getBestRating = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.giveRate = (req, res, next) => {
  const ratingObject = { userId: req.auth.userId, grade: req.body.rating };

  Book.findOneAndUpdate(
    { _id: req.params.id, "ratings.userId": { $ne: req.auth.userId } },
    { $push: { ratings: ratingObject } },
    { new: true }
  )
    .then((book) => {
      if (book) {
        // Calculer la nouvelle moyenne des notes
        const totalRatings = book.ratings.length;
        const totalGrade = book.ratings.reduce(
          (sum, rating) => sum + rating.grade,
          0
        );
        const averageRating = totalGrade / totalRatings;
        book.averageRating = averageRating;

        return book.save();
      } else {
        throw new Error(
          "Impossible d'ajouter la note. Le livre n'existe pas ou vous avez déjà donné une note pour ce livre."
        );
      }
    })
    .then((savedBook) => {
      res.status(200).json({ book: savedBook });
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};
