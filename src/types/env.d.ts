declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    SECRET_JWT_KEY: string;
    NODE_ENV: "development" | "production" | "test";
    MP_ACCESS_TOKEN: string;
    API_URL: string;
    MP_WEBHOOK_SECRET: string;
  }
}
