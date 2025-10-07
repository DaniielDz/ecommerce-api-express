import { $Enums } from "@prisma/client";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: $Enums.Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: $Enums.Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRegister {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export type UserDTO = Partial<UserRegister & UserLogin>;