const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Adjust the path as necessary
const SECRET_KEY = "NOTESAPI";

// Checking if the user is authorized or not
const auth = async (req, res, next) => {
    try {
        let token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized user"
            });
        }

        // The token typically comes as "Bearer <token>", so we split and get the second part
        token = token.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized user"
            });
        }

        // Verify the token using the SECRET_KEY
        const decoded = jwt.verify(token, SECRET_KEY);

        // Find the user by ID from the token
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized user"
            });
        }

        // Attach the user and userId information to the request object
        req.user = user;
        req.userId = user._id.toString(); // Convert ObjectId to string


        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        // Catch any error (like an invalid token) and return an unauthorized response
        return res.status(401).json({
            message: "Unauthorized user",
            error: error.message // Include the error message for better debugging
        });
    }
};

module.exports = auth;
