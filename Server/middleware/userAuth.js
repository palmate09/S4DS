import jwt from 'jsonwebtoken'

export const userAuth = async(req, res, next) => {

    try{

        // console.log('Headers:', req.headers);
        // console.log('Authorization header:', req.headers['authorization']);
        
        const token = req.headers['authorization']?.split(' ')[1]; 
        
        // console.log('Extracted token:', token);

        if(!token){
            return res.status(400).json({message: 'token not found'})   
        }

        const encoded = jwt.verify(token, process.env.JWT_SECRET)
        
        if(!encoded){
            return res.status(400).json({message: 'user not found or token invalid'})
        }

        req.user = encoded

        // console.log(req.user)
        next(); 
    }
    catch(e){
        return res.status(500).json({error: e.message, message: 'Internal server Error'})
    }
}