
import {runPython, healthCheck, getSupportedLanguages, runJavascript} from '../Controllers/PlaygroundController.js'
import { Router } from 'express'
const router = Router(); 

router.post('/RunPython', runPython)
router.post('/RunJavascript', runJavascript)
// router.post('/RunAIML', runAIML)
// router.post('/RunAIDS', runAIDS)

router.get('/health', healthCheck)
router.get('/languages', getSupportedLanguages)


export default router; 


