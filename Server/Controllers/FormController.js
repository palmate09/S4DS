import client from "../config/database.js"
import { sendMail } from '../config/mail.js'

// Create a new form it is like RSVP
export const createRSVP = async (req, res) => {
    try {
        const { description, name, linkdin, github } = req.body;
        const userId = req.user.id;
        
        if (!description|| !name|| !linkdin||!github) {
            return res.status(400).json({ message: 'descriptin or name or linkdin or github not provide'});
        }

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const newForm = await client.form.create({
            data: {
                description,
                name, 
                linkdin, 
                github, 
                user:{
                    connect: {
                        id: userId
                    }
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                }
            }
        });

        // Send email notification to user
        try {
            const emailSubject = `Thank you for your response! We’ve successfully recorded your RSVP for [Event Name].`;
            const emailText = `Hello ${newForm.user.name || newForm.user.username},\n\nYour form has been created successfully!\n\nForm Details:\n- Form ID: ${newForm.id}\n- Description: ${newForm.description}\n- Created At: ${newForm.created_at}\n\nYou can view and manage your forms through your dashboard.\n\nBest regards,\nYour App Team`;

            await sendMail(
                newForm.user.email,
                emailSubject,
                emailText
            );

        } catch (emailError) {
            console.log('Email sending failed:', emailError.message);
        }

        return res.status(201).json({
            message: 'Form created successfully and notification email sent',
            form: newForm
        });

    } catch (e) {
        return res.status(500).json({ error: e.message, message: 'Internal server Error' });
    }
};

// Get all forms for the authenticated user
export const getUserRSVP = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const forms = await client.form.findMany({
            where: {
                user_id: userId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        name: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return res.status(200).json({
            message: 'Forms retrieved successfully',
            forms: forms,
            count: forms.length
        });

    } catch (e) {
        return res.status(500).json({ error: e.message, message: 'Internal server Error' });
    }
};


// Delete a form
export const deleteRSVP = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Check if form exists and belongs to the user
        const existingForm = await client.form.findFirst({
            where: {
                id: id,
                user_id: userId
            }
        });

        if (!existingForm) {
            return res.status(404).json({ message: 'Form not found' });
        }

        await client.form.delete({
            where: {
                id: id
            }
        });

        return res.status(200).json({
            message: 'Form deleted successfully'
        });

    } catch (e) {
        return res.status(500).json({ error: e.message, message: 'Internal server Error' });
    }
};

// Get all forms (admin function - optional)
export const getAllRSVPS = async (req, res) => {
    try {
        const forms = await client.form.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        name: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return res.status(200).json({
            message: 'All forms retrieved successfully',
            forms: forms,
            count: forms.length
        });

    } catch (e) {
        return res.status(500).json({ error: e.message, message: 'Internal server Error' });
    }
};

