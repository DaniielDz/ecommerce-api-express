import { deserializeUser } from "../../../src/middlewares/deserializeUser";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("deserializeUser", () => {
  const mockJwt = jest.mocked(jwt);

  const makeReq = (token?: string) => {
    const cookies = token ? { access_token: token } : {};

    return { cookies, session: {} } as any;
  };
  const res = {} as any;
  const next = jest.fn();

  test("Sin token, no setea usuario", () => {
    const req = makeReq();
    deserializeUser(req, res, next);

    expect(req.session.user).toBe(null);
    expect(next).toHaveBeenCalled();
  });

  test("Con token invalido, user null", () => {
    const req = makeReq("token");
    mockJwt.verify.mockImplementation(() => {
      throw new Error("Token invalido");
    });

    deserializeUser(req, res, next);

    expect(req.session.user).toBe(null);
  });

  test("Con token valido, setea user", () => {
    const req = makeReq("token");
    mockJwt.verify.mockReturnValue({ id: "uuid", username: "username" } as any);

    deserializeUser(req, res, next);

    expect(req.session.user).toEqual({ id: "uuid", username: "username" });
  });
});
