const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = "NOTESAPI";
const SibApiV3Sdk = require('sib-api-v3-sdk');
const { v4: uuidv4 } = require('uuid');

//create the model 
const User = db.users
const ForgotPassword = db.forgotpassword


//signup
const addUser = async (req, res) => {
    const {name, email, password} = req.body;
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

    try{
        const existingUser = await User.findOne({ where: { email: email } });
        
        if(existingUser){
            return res.status(400).json({
                error: {
                    code: 'USER_ALREADY_EXISTS',
                    status : 400,
                    message: 'User already exists with the provided email',
                }
            });    
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await User.create({
            name : name,
            email : email,
            password: hashedPassword
        });

        const token = jwt.sign({email:user.email, id:user.id}, SECRET_KEY);

        res.status(201).json({
            success : {
                Id : user.id,
                status : 201,
                message : "User Register successfully!!"
            }
        });

    }catch(error){
        res.status(500).json({
            error : {
                status : 500,
                message : "Something went wrong"
            }    
        });
    }    
}


//token genaration
function generateToken(email, id){
    return jwt.sign({email:email, userId:id}, SECRET_KEY);
}


//signIn
const existingUser = async (req, res) => {
    const {email, password} = req.body;
    const fields = { email, password };
    const emptyFields = Object.keys(fields).filter(key => !fields[key]);

    if (emptyFields.length > 0) {
        return res.status(400).json({
            error: {
                status: 400,
                message: `${emptyFields.join(', ').toUpperCase()} fields are required`
            }
        });
    }
    try{   
        const existingUser = await User.findOne({ where: { email: email } });
        if(!existingUser){
            return res.status(400).json({
                error: {
                    code: 'USER_NOT_FOUND',
                    status : 400,
                    message: 'User not found',
                }
            }); 
        }

        const matchPassword = await bcrypt.compare(password, existingUser.password);
        if(!matchPassword){
            return res.status(400).json({ 
                error : {
                    status : 400,
                    message : "Invalid Credenials"
                }
            });
        }
         
        return res.status(200).json({
            success : {
                id : existingUser.id, 
                token: generateToken(existingUser.email,existingUser.id),
                status : 201,
                message : "Logged in successfully!."
            }
        });

    }catch(error){
        res.status(500).json({
            message : "Something went wrong"
        });
    }
}

//reset request mail content method
const sendResetPasswordEmail = async (toEmail, resetLink) => {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.MAIL_SENT;
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { name: 'Expense Tracker', email: 'akashmadali2001@gmail.com' };
    sendSmtpEmail.to = [{ email: toEmail }];
    sendSmtpEmail.subject = "Reset Password Link";
    sendSmtpEmail.htmlContent = `
        <html>
        <body>
          <h1>Password Reset</h1>
          <p>To reset your password, please click the link below:</p>
          <a href="${resetLink}">Reset Password</a>
        </body>
        </html>
    `;

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
        throw error;
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
        const user = await User.findOne({ where: { email: email } });

        if (!user) {
            return res.status(400).json({
                error: {
                    status: 400,
                    message: "Registered email does not exist."
                }
            });
        }

        const myUUID = uuidv4();

        const response = await ForgotPassword.create({
            id: myUUID,
            userId: user.id,
            isactive: true
        });
        
        const resetLink = `http://localhost:5050/changePassword.html?id=${response.id}`;
        await sendResetPasswordEmail(email, resetLink);

        res.status(200).json({
            success : {
                message: 'Password reset email sent.',
            }
        });
    } catch (error) {
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
        const forgotPasswordRecord = await ForgotPassword.findOne({ where: { id: id, isactive: true } });
       
        if (!forgotPasswordRecord) {
            return res.status(400).json({
                error: {
                    status: 400,
                    message: "Invalid or expired password reset link"
                }
            });
        }

        const user = await User.findOne({ where: { id: forgotPasswordRecord.userId } });
       
        if (!user) {
            return res.status(400).json({
                error: {
                    status: 400,
                    message: "User not found"
                }
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await user.update({ password: hashedPassword });

        await forgotPasswordRecord.update({ isactive: false });

        return res.status(200).json({
            success :{
                message: "Password changed successfully."
            }
        });
    } catch (error) {
        return res.status(500).json({
            error: {
                status: 500,
                message: "Internal Server Error"
            }
        });
    }
};



module.exports = {
    addUser ,
    existingUser,
    requestResetPassword,
    changePassword
}