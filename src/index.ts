import express from "express";
import accommodationRouter from "./routes/accommodation.routes";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;
const swaggerDocument = YAML.load("src/docs/swagger.yaml");

app.disable("x-powered-by");
app.use(express.json());
app.use(cors()); //NOSONAR
app.use("/accommodations", accommodationRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {});
