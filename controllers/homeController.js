const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = "NOTESAPI";
const SibApiV3Sdk = require('sib-api-v3-sdk');
const { v4: uuidv4 } = require('uuid');


const User = require('../models/userModel'); // Import your User model
const ForgotPassword = require('../models/forgotPasswordModel'); // Import your ForgotPassword model

//signu
const addUser = async (req, res) => {
    const { name, email, password } = req.body;
    const fields = { name, email, password };
    const emptyFields = Object.keys(fields).filter(key => !fields[key]);

    if (emptyFields.length > 0) {
        return res.status(400).json({
            error: {
                status: 400,
                message: `${emptyFields.join(',')} fields are required`
            }
        });
    }

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return res.status(400).json({
                error: {
                    code: 'USER_ALREADY_EXISTS',
                    status: 400,
                    message: 'User already exists with the provided email',
                }
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = await User.create({
            name: name,
            email: email,
            password: hashedPassword
        });

        // Generate JWT token
        const token = jwt.sign({ email: user.email, id: user._id }, SECRET_KEY);

        // Respond with success
        res.status(201).json({
            success: {
                Id: user._id,
                status: 201,
                message: "User registered successfully!",
                token: token
            }
        });

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: "Something went wrong"
            }
        });
    }
}


// Function to generate JWT token
function generateToken(email, userId) {
    return jwt.sign({ email: email, userId: userId }, SECRET_KEY, { expiresIn: '1h' }); // Set token expiration as needed
}

// Sign-In Function
const existingUser = async (req, res) => {
    const { email, password } = req.body;
    const fields = { email, password };
    const emptyFields = Object.keys(fields).filter(key => !fields[key]);

    if (emptyFields.length > 0) {
        return res.status(400).json({
            error: {
                status: 400,
                message: `${emptyFields.join(', ').toLowerCase()} fields are required`
            }
        });
    }

    try {
        // Find the user by email
        const existingUser = await User.findOne({ email: email });

        if (!existingUser) {
            return res.status(400).json({
                error: {
                    code: 'USER_NOT_FOUND',
                    status: 400,
                    message: 'User not found',
                }
            });
        }

        // Check if the password matches
        const matchPassword = await bcrypt.compare(password, existingUser.password);

        if (!matchPassword) {
            return res.status(400).json({
                error: {
                    status: 400,
                    message: 'Invalid Credentials'
                }
            });
        }

        // Respond with success
        return res.status(200).json({
            success: {
                id: existingUser._id, // Use _id for MongoDB
                token: generateToken(existingUser.email, existingUser._id),
                status: 200,
                message: 'Logged in successfully!'
            }
        });

    } catch (error) {
        console.error('Error during sign-in:', error); // Added error logging
        res.status(500).json({
            error: {
                status: 500,
                message: 'Something went wrong'
            }
        });
    }
}


//reset request mail content method
const sendResetPasswordEmail = async (toEmail, resetLink) => {
    // Initialize the Sendinblue API client
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.MAIL_SENT; // Your Sendinblue API key from environment variables

    // Create an instance of the TransactionalEmailsApi
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    // Set up the email content
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { name: 'Expense Tracker', email: 'akashmadali2001@gmail.com' }; // Sender's email and name
    sendSmtpEmail.to = [{ email: toEmail }]; // Recipient's email
    sendSmtpEmail.subject = "Reset Password Link"; // Email subject
    sendSmtpEmail.htmlContent = `
        <html>
        <body>
          <h1>Password Reset</h1>
          <p>To reset your password, please click the link below:</p>
          <a href="${resetLink}">Reset Password</a>
        </body>
        </html>
    `; // Email body in HTML format

    try {
        // Send the email
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully:', data);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error; // Rethrow error for further handling
    }
};


//reset request password
const requestResetPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            error: {
                status: 400,
                message: "Email is required"
            }
        });
    }

    try {
        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                error: {
                    status: 400,
                    message: "Registered email does not exist."
                }
            });
        }

        // Generate a UUID for the reset request
        const myUUID = uuidv4();

        // Create a new ForgotPassword document with user reference
        const forgotPasswordRecord = new ForgotPassword({
            id: myUUID,
            user: user._id,
            isActive: true
        });

        await forgotPasswordRecord.save(); // Save to the database

        // Generate the reset password link
        const resetLink = `http://localhost:5050/changePassword.html?id=${forgotPasswordRecord.id}`;

        // Send the reset password email
        await sendResetPasswordEmail(email, resetLink);

        res.status(200).json({
            success: {
                message: 'Password reset email sent.',
            }
        });
    } catch (error) {
        console.error('Error requesting password reset:', error);
        return res.status(500).json({
            error: {
                status: 500,
                message: "Internal Server Error"
            }
        });
    }
};


//password change
const changePassword = async (req, res) => {
    const { id, password, confirmpassword } = req.body;

    if (!id || !password || !confirmpassword) {
        return res.status(400).json({
            error: {
                status: 400,
                message: "ID, password, and confirm password are required"
            }
        });
    }

    if (password !== confirmpassword) {
        return res.status(400).json({
            error: {
                status: 400,
                message: "Passwords do not match"
            }
        });
    }

    try {
        // Find the ForgotPassword record and check if active
        const forgotPasswordRecord = await ForgotPassword.findOne({ id, isActive: true });

        if (!forgotPasswordRecord) {
            return res.status(400).json({
                error: {
                    status: 400,
                    message: "Invalid or expired password reset link"
                }
            });
        }

        // Find the user associated with the reset request
        const user = await User.findById(forgotPasswordRecord.user);

        if (!user) {
            return res.status(400).json({
                error: {
                    status: 400,
                    message: "User not found"
                }
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password
        user.password = hashedPassword;
        await user.save(); // Save changes to the user document

        // Deactivate the reset request
        forgotPasswordRecord.isActive = false;
        await forgotPasswordRecord.save(); // Save changes to the forgot password document

        return res.status(200).json({
            success: {
                message: "Password changed successfully."
            }
        });
    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({
            error: {
                status: 500,
                message: "Internal Server Error"
            }
        });
    }
};

module.exports = {
    addUser,
    existingUser,
    requestResetPassword,
    changePassword
}