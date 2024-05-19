const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

const homeController = require('../controllers/homeController');
const expenseController = require('../controllers/expenseController');

router.post('/signup',homeController.addUser);

router.post('/signin', homeController.existingUser);

router.post('/request-reset-password', homeController.requestResetPassword);

router.post('/reset-password', homeController.changePassword);

router.post('/expense/addexpense', auth, expenseController.addExpense);

router.get('/expense/getexpense', auth, expenseController.getExpense);

router.post('/expense/deleteexpense', auth, expenseController.deleteExpense)

router.post('/purchase/premiummembership', auth, expenseController.purcahsePremium)

router.post('/purchase/updatetransactionsstatus', auth, expenseController.updateTranscationdetails)

router.get('/purchase/userpremiumornot',auth, expenseController.userpremium);

router.get('/getalluserexpenses', auth, expenseController.getAllUserExpenses);

router.get('/download',auth, expenseController.downloadExpenses);

router.get('/getalls3buckets', auth, expenseController.getAllS3BucketLinks);

module.exports = router;
