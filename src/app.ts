import express from "express";
import routes from "./routes";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middlewares/auth";

const app = express();

app.disable("x-powered-by");
app.use(express.json());
app.use(cookieParser());
app.use(authMiddleware);
app.use("/", routes);

export default app;
