import express from "express";
import routes from "./routes";
import cookieParser from "cookie-parser";
import { deserializeUser } from "./middlewares/deserializeUser";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.disable("x-powered-by");
app.use(express.json());
app.use(cookieParser());
app.use(deserializeUser);
app.use("/", routes);
app.use(errorHandler);

export default app;
