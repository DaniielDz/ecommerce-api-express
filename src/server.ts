import app from "./app";
import { ENV } from "./config/env";

const PORT = Number(ENV.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});