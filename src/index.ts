import express from "express";
import accommodationRouter from "./routes/accommodation.routes";

const app = express();
const port = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(express.json());
app.use("/Accommodations", accommodationRouter);

app.listen(port, () => {});
