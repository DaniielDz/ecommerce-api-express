declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    SECRET_JWT_KEY: string;
    NODE_ENV: "development" | "production" | "test";
  }
}
