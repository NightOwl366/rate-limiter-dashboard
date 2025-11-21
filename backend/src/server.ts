import express, { Request, Response } from "express";

const app = express();
app.use(express.json());

app.get('/',(req:Request,res:Response)=>{
    res.send("Hello TypeScript Backend!");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});