import request from "supertest";
import app from "../../src/app";
import { User } from "../../src/types";

const makeUser = (
  data: Partial<User> & { username: string; password_hash: string }
): User => ({
  id: "UUID",
  username: data.username,
  password_hash: data.password_hash,
  created_at: new Date(),
  updated_at: new Date(),
});

let users: User[] = [];

jest.mock("../../src/utils/prismaClient", () => {
  return {
    prisma: {
      user: {
        create: jest.fn(
          async ({
            data,
          }: {
            data: { username: string; password_hash: string };
          }) => {
            const u = makeUser(data);
            users.push(u);
            // El modelo devuelve `PublicUser` (sin password_hash), pero
            // aquí devolvemos el registro completo y el modelo ya hace el strip.
            return u;
          }
        ),
        findUnique: jest.fn(
          async ({ where: { username } }: { where: { username: string } }) => {
            return users.find((u) => u.username === username) ?? null;
          }
        ),
        findMany: jest.fn(async () => users),
      },
    },
  };
});

beforeEach(() => {
  users = [];
});

describe("Auth routes", () => {
  test("register -> 201", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: "john", password: "pwd" })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      username: "john",
    });
    expect(res.body).not.toHaveProperty("password_hash");
  });

  test("login -> 200 y setea cookie", async () => {
    await request(app)
      .post("/auth/register")
      .send({ username: "doe", password: "pwd" });
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "doe", password: "pwd" })
      .expect(200);

    expect(res.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("access_token=")])
    );
    expect(res.body).toEqual({ message: "Login exitoso" });
  });

  test("logout sin cookie -> 401", async () => {
    await request(app).post("/auth/logout").expect(401);
  });

  test("logout con cookie -> 200", async () => {
    await request(app)
      .post("/auth/register")
      .send({ username: "mike", password: "pwd" });
    const cookie = (
      await request(app)
        .post("/auth/login")
        .send({ username: "mike", password: "pwd" })
    ).headers["set-cookie"];

    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", cookie)
      .expect(200);

    expect(res.body).toEqual({ message: "Logout exitoso" });
  });
});
