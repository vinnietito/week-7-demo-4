//import
const express = require('express')
const { registerUser, loginUser } = require('../controllers/authController')   
const router = express.Router();

//User Registration
router.post ('/register', registerUser);

//User Login 
router.post('/login', loginUser);

module.exports = router;
