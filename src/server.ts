import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from 'cors';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get('/hello', async (req: Request, res: Response)=>{
    res.status(200).send({message : "hello world !"})
})

const identifyRoute = require("../app/routes/identify-route.ts");
app.use("/identify", identifyRoute);

app.listen(port, () => console.log(`ts-node research server : started at http://localhost:${port}`));