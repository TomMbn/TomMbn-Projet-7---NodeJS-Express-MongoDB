const User = require("../models/User");
const bcrypt = require ("bcrypt");
const jwt = require ("jsonwebtoken");
const crypto = require ("crypto");

const secretKey = crypto.randomBytes(32).toString("hex");

module.exports.secretKey = secretKey;

exports.signUp = (req, res, next) =>{
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash
            });
            user.save()
                .then(()=> res.status(200).json({message : "Utilisateur crée !"}))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
}

exports.logIn = (req, res, next) =>{
    User.findOne({ email: req.body.email })
        .then(user =>{
            if (!user){
                return res.status(401).json({ message: "Paire login/mot de passe incorrecte" });
            }
            bcrypt.compare(req.body.password, user.password)
                .then(valid =>{
                    if(!valid){
                        return res.status(401).json({ message: "Paire login/mot de passe incorrecte" }); 
                    }
                    res.status(200).json({
                        userId : user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            "secretKey",
                            { expiresIn: 300000 }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
}

