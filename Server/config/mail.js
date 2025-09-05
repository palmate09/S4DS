import nodemailer from 'nodemailer';
import axios from 'axios';

export const sendMail = async (to, subject, text, html = null) => {
  const transporter = nodemailer.createTransport({
    host:'sandbox.smtp.mailtrap.io',
    port: 587, // or use another service like Outlook, Yahoo
    auth: {
      user: process.env.EMAIL, // Replace with your email
      pass: process.env.PASS_KEY // Replace with your email password or app-specific password
    },
  });

  // Email options
  const mailOptions = {
    from: process.env.EMAIL, // Sender's email
    to: to, // Recipient's email
    subject: subject,
    text: text,
    ...(html && { html: html })
  };

  // Send the email
  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent: ', info.response);
  return info;
};

export const EmailVerifier = async (Email) => {
  try {
    const API_KEY = process.env.EMAIL_API_KEY;
    
    // If no API key is provided, skip verification and return true
    if (!API_KEY) {
      console.log('EMAIL_API_KEY not found, skipping email verification');
      return true;
    }
    
    const api_url = `https://emailvalidation.abstractapi.com/v1/?api_key=${API_KEY}&email=${Email}`;
    const result = await axios.get(api_url);
    
    if (
      result.data.is_valid_format.value === true && 
      result.data.is_mx_found.value === true && 
      result.data.is_smtp_valid.value === true 
    ) {
      return true;
    }
    
    return false;
  }
  catch(e){
    console.log('Email verification failed:', e.message);
    // Return true to allow the process to continue even if verification fails
    return true;
  }
};