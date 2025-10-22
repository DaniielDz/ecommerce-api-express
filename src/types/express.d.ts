import { ProductsFilters } from "../schemas/products";
import { PublicUser } from "./user";

declare global {
  namespace Express {
    interface Request {
      session?: {
        user: PublicUser | null;
      };
      params: { id?: number | string };
      validatedData?: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
    }
  }
}

export {};
