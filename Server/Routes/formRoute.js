import {Router} from "express"
import { userAuth } from "../middleware/userAuth.js"
import { createRSVP, deleteRSVP, getAllRSVPS, getUserRSVP } from "../Controllers/FormController.js";

const router = Router(); 

router.post('/createRSVP', userAuth, createRSVP)
router.get('/getUserRSVP', userAuth, getUserRSVP)
router.get('/getAllRSVPS', userAuth, getAllRSVPS)
router.delete('/deleteRSVP/:id',userAuth, deleteRSVP)


export default router; 

