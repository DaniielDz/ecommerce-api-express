import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PublicUser, User } from "../types";

const url = path.resolve(__dirname, "../data/db.json");
export class AuthModel {
  static async register(user: User) {
    const users = await this.getUsers();

    const newUsers = [...users, user];

    try {
      await writeFile(url, JSON.stringify(newUsers, null, 2));
    } catch {
      throw new Error("IO_ERROR");
    }

    const { password, ...publicUser } = user;

    return publicUser as PublicUser;
  }

  static async getUsers() {
    let readResponse;

    try {
      readResponse = await readFile(url, { encoding: "utf-8" });
    } catch {
      throw new Error("IO_ERROR");
    }

    const users: User[] = JSON.parse(readResponse);

    return users;
  }

  static async getUserByUsername(username: string) {
    const users = await this.getUsers();

    const existUser = users.find((u) => u.username === username);

    return existUser ?? null;
  }
}
