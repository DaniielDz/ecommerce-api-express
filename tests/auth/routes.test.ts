// tests/auth.routes.test.ts
import request from "supertest";
import app from "../../src/app";

// Mock de fs para modelo
jest.mock("node:fs/promises", () => {
  let content = JSON.stringify([]);
  return {
    readFile: jest.fn(async () => content),
    writeFile: jest.fn(async (_path: string, data: string) => {
      content = data;
    }),
  };
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
  });

  test("logout sin cookie -> 401", async () => {
    await request(app).post("/auth/logout").expect(401);
  });

  test("logout con cookie -> 200", async () => {
    const login = await request(app)
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
