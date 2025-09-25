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

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
