import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoute from './Routes/userRoute.js'
import PlaygroundRoute from './Routes/PlaygroundRoute.js'
import formRoute from './Routes/formRoute.js'
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use('/api/v1', userRoute);
app.use('/api/v1/App', PlaygroundRoute);
app.use('/api/v1/RSVP', formRoute);


app.listen(process.env.PORT || 8080); 

