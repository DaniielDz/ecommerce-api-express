export interface User {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface PublicUser {
  id: string;
  username: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserDTO {
  username: string;
  password: string;
}
