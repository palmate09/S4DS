import { login, signup, profile, updateProfile, forgotPassRequest, forgotPassword } from "../Controllers/userController.js";
import { Router } from "express";
import { userAuth } from "../middleware/userAuth.js";

const router = Router(); 


router.post('/signup', signup);
router.post('/login', login); 
router.get('/getProfile', userAuth, profile); 
router.put('/updateProfile', userAuth, updateProfile)
router.post('/forgot_pass_request', forgotPassRequest)
router.post('/forgot_pass', forgotPassword)


export default router; 

