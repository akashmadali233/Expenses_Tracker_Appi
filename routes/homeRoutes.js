const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

const homeController = require('../controllers/homeController');
const expenseController = require('../controllers/expenseController');

//authentication routes
router.post('/signup',homeController.addUser);
router.post('/signin', homeController.existingUser);
router.post('/request-reset-password', homeController.requestResetPassword);
router.post('/reset-password', homeController.changePassword);


//expenses routes
router.post('/expense/addexpense', auth, expenseController.addExpense);
router.get('/expense/getexpense', auth, expenseController.getExpense);
router.post('/expense/deleteexpense', auth, expenseController.deleteExpense)
router.get('/getalluserexpenses', auth, expenseController.getAllUserExpenses);

//premium member
router.post('/purchase/premiummembership', auth, expenseController.purchasePremium)
router.post('/purchase/updatetransactionsstatus', auth, expenseController.updateTransactionDetails)
router.get('/purchase/userpremiumornot',auth, expenseController.userpremium);

// //download xlsx file
router.get('/download',auth, expenseController.downloadExpenses);

// //s3 storing file
// router.get('/getalls3buckets', auth, expenseController.getAllS3BucketLinks);

module.exports = router;
