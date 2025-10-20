import request from "supertest";
import app from "../../src/app";
import { RegisterParams, User } from "../../src/types";

const makeUser = (data: RegisterParams): User => ({
  id: "UUID",
  email: data.email,
  passwordHash: data.passwordHash || "pwd",
  firstName: data.firstName,
  lastName: data.lastName,
  role: "CUSTOMER",
  createdAt: new Date(),
  updatedAt: new Date(),
});

let users: User[] = [];

jest.mock("../../src/utils/prismaClient", () => {
  return {
    prisma: {
      user: {
        create: jest.fn(async ({ data }: { data: RegisterParams }) => {
          const u = makeUser(data);
          users.push(u);
          return u;
        }),
        findUnique: jest.fn(
          async ({ where: { email } }: { where: { email: string } }) => {
            return users.find((u) => u.email === email) ?? null;
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
      .send({
        email: "john@gmail.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      email: "john@gmail.com",
    });
    expect(res.body).not.toHaveProperty("password_hash");
  });

  test("login -> 200 y setea cookie", async () => {
    await request(app)
      .post("/auth/register")
      .send({
        email: "john@gmail.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      })
      .expect(201);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "john@gmail.com", password: "password123" })
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
    await request(app).post("/auth/register").send({
      email: "john@gmail.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
    });
    const cookie = (
      await request(app)
        .post("/auth/login")
        .send({ email: "john@gmail.com", password: "password123" })
    ).headers["set-cookie"];

    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", cookie)
      .expect(200);

    expect(res.body).toEqual({ message: "Logout exitoso" });
  });
});
