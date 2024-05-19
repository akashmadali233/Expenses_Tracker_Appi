const jwt = require('jsonwebtoken');
const SECRET_KEY = "NOTESAPI";

const auth = (req, res, next) => {
    try {
        let token = req.headers.authorization;
        if(token){
            token = token.split(" ")[1];
            let user = jwt.verify(token, SECRET_KEY);
            req.user = user;
            req.userId = user.userId;
        }else{
            return res.status(401).json({
                message : "Unauthorized user"
            })
        }
        next();
    } catch (error) {
        return res.status(401).json({
            message : "Unauthorized user"
        })
    }
}

module.exports = auth;