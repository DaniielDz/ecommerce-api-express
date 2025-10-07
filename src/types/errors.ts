export type DomainError = "EMAIL_IN_USE" | "INVALID_INPUT" | "INVALID_CREDENTIALS" | "PRODUCT_NOT_FOUND";
export type InfraError = "IO_ERROR" | "DB_ERROR";
export type AppError = DomainError | InfraError;