export type DomainError = "USERNAME_TAKEN" | "INVALID_INPUT";
export type InfraError = "IO_ERROR";
export type AppError = DomainError | InfraError;