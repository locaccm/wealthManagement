import { checkAccess } from "../middlewares/checkAcces";
import { Request, Response, NextFunction } from "express";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("checkAccess middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    process.env.AUTH_SERVICE_URL = "http://auth-service";
  });

  it("should return 401 if authorization header is missing", async () => {
    const middleware = checkAccess("accommodation:create");
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Authorization token missing or malformed",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if authorization header is malformed", async () => {
    req.headers = { authorization: "TokenWithoutBearer" };
    const middleware = checkAccess("accommodation:create");
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Authorization token missing or malformed",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next() if token is valid and response is 201", async () => {
    req.headers = { authorization: "Bearer validtoken" };
    mockedAxios.post.mockResolvedValueOnce({ status: 201 });

    const middleware = checkAccess("accommodation:create");
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it("should return 403 if token is valid but not authorized", async () => {
    req.headers = { authorization: "Bearer token" };
    mockedAxios.post.mockResolvedValueOnce({ status: 403 });

    const middleware = checkAccess("accommodation:create");
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Access denied" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if the axios call throws an error", async () => {
    req.headers = { authorization: "Bearer token" };
    mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

    const middleware = checkAccess("accommodation:create");
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Authorization failed",
      details: "Network error",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
