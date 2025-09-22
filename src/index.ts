import express from "express";
import type { Response } from "express";

const app = express();

app.get("/", (_, res: Response) => {
  res.send("Hello World!");
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
