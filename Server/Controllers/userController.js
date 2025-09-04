import client from "../config/database.js"
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { sendMail, EmailVerifier } from '../config/mail.js'
import { randomBytes } from "crypto"
import { Role } from "../generated/prisma/index.js"

export const signup = async(req, res) => {

    try {

        const { username, email, password, name, role } = req.body;

        if(!username || !email || !password || !name){
            return res.status(400).json({message: 'these fields are required to fill'})
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&_])[A-Za-z\d@$!%*?#&_]{8,}$/;

        // Basic email format validation
        if(!passwordRegex.test(password)){
            return res.status(400).json({message: 'email and password are not in the correct format'})
        }

        if(!Object.values(Role).includes(role)){
            return res.status(400).json({message: "Invalid user Role provided"})
        }

        // Verify email using EmailVerifier for additional validation
        try {
            const isEmailValid = await EmailVerifier(email);
            
            if (!isEmailValid) {
                return res.status(400).json({message: 'Invalid email format or email does not exist'})
            }
        } catch (verificationError) {
            console.log('Email verification error:', verificationError.message);
            // Continue with the process even if email verification fails
        }

        const hashPassword = await bcrypt.hash(password, 8); 
        
        const existingUser = await client.user.findFirst({
            where: {
                email: email
            }
        })

        if(existingUser){
            return res.status(400).json({message: 'user already exists, please login'})
        }

        await client.user.create({
            data: {
                email, 
                password: hashPassword, 
                username, 
                role,
                name 
            }
        })

        return res.status(201).json({
            message: 'signup has been successfully done, please login'
        })
    }
    catch(e){
        return res.status(500).json({error: e.message, message: "Internal server Error"})
    }
}

export const login = async(req, res) => {

    try {

        const { identifier , password } = req.body; 

        if(!identifier || !password ){
            return res.status(400).json({message: 'fill the email or username and password first'})
        }


        const user = await client.user.findFirst({
            where: {
                OR: [
                    {email: identifier}, 
                    {username: identifier}
                ]
            }, 
            select: {
                password: true, 
                email: true, 
                id: true,
                username: true
            }
        })


        if (!user) {
            return res.status(400).json({message: 'Invalid user or user not found'})
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if(!isPasswordValid){
            return res.status(400).json({message: 'Invalid password'})
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                username: user.username 
            }, 
            process.env.JWT_SECRET
        ) 

        return res.status(200).json({token, message: 'user has been logged in'})
    }
    catch(e){
        return res.status(500).json({error: e.message, message: "Internal server Error"})
    }
}


export const profile = async(req, res) => {

    try{

        const userId = req.user.id;

        
        if(!userId){
            return res.status(404).json({message: "user id not found"})
        }
        
        const user = await client.user.findUnique({
            where: { 
                id: userId 
            }
        });

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return
        }

        return res.status(200).json({ user , message: 'user found successfully'}); 

    }
    catch(e){
        res.status(500).json({error: e.message, message: "Internal server Error"});
        return
    }
}

export const updateProfile = async(req, res) => {
    try {

        const userId = req.user.id; 
        const updates = req.body;
        
        // Filter out only provided fields
        const allowedFields = ["name" , "email", "username", "role", "password"]; 
        const data = {}


        for(let key of allowedFields){
            if(updates[key] !== undefined){
                data[key] = updates[key];
            }
        }

        if(Object.keys(data).length === 0){
            return res.status(400).json({message: "No valid fields to update"})
        }


        const updateUser = await client.user.update({
            where: {
                id: userId
            }, 
            data
        })
        
        return res.status(200).json({updateUser, message: 'user data has been successfully updated'})

    }
    catch(e){
        res.status(500).json({error: e.message, message: "Internal server Error"})
        return
    }
}

export const forgotPassRequest = async(req, res) => {

    const {email} = req.body; 

    if(!email){
        return res.status(400).json({message: 'fill the email first'})
    }

    try{

        // Verify email format and validity using EmailVerifier
        try {
            const isEmailValid = await EmailVerifier(email);
            
            if (!isEmailValid) {
                return res.status(400).json({message: 'Invalid email format or email does not exist'})
            }
        } catch (verificationError) {
            console.log('Email verification error:', verificationError.message);
            // Continue with the process even if email verification fails
        }

        const user = await client.user.findFirst({
            where: {
                email
            }
        });

        if(!user){
            return res.status(400).json({message: "user not found"})
        }

        const token = randomBytes(15).toString('base64url'); 

        await client.passwordResetToken.deleteMany({
            where: {
                userId: user.id, 
                expireAt: {
                    gt: new Date()
                }
            }
        })

        const expiry = new Date(Date.now() + 3600000)

        const tokenCreate = await client.passwordResetToken.create({
            data: {
                token: token, 
                expireAt: expiry, 
                userId: user.id
            }
        })

        const resetUrl = `http://localhost:${process.env.PORT}/api/v1/users/forgot-password?token=${token}`

        const emailSubject = 'Password Reset Request';
        const emailText = `Hello ${user.username || user.email},\n\nYou have requested to reset your password.\n\nYour reset token is: ${tokenCreate.token}\n\nReset URL: ${resetUrl}\n\nThis token will expire in 1 hour.\n\nIf you didn't request this password reset, please ignore this email.\n\nBest regards,\nYour App Team`;

        const info = await sendMail(
            user.email,
            emailSubject,
            emailText
        );

        return res.status(200).json({ 
            message: 'Password reset email sent successfully',
            token: tokenCreate.token 
        });

    }
    catch(e){
        return res.status(400).json({error: e.message, message: 'Internal server Error'}); 
    }
}

export const forgotPassword = async(req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        // Find the reset token
        const resetToken = await client.passwordResetToken.findUnique({
            where: {
                token: token
            },
            include: {
                user: true
            }
        });

        if (!resetToken) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Check if token is expired
        if (resetToken.expireAt < new Date()) {
            // Delete expired token
            await client.passwordResetToken.delete({
                where: {
                    id: resetToken.id
                }
            });
            return res.status(400).json({ message: 'Reset token has expired' });
        }

        // Validate new password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&_])[A-Za-z\d@$!%*?#&_]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 8);

        // Update user password
        await client.user.update({
            where: {
                id: resetToken.userId
            },
            data: {
                password: hashedPassword
            }
        });

        // Delete the used reset token
        await client.passwordResetToken.delete({
            where: {
                id: resetToken.id
            }
        });

        return res.status(200).json({ message: 'Password reset successfully' });

    } catch (e) {
        return res.status(500).json({ error: e.message, message: 'Internal server Error' });
    }
}

