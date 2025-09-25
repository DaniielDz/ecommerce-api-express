import dotenv from 'dotenv';

dotenv.config()

export const ENV = {
  PORT: process.env.PORT || 3000,
  SECRET_JWT_KEY: process.env.SECRET_JWT_KEY
}