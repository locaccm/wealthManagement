import request from "supertest";
import express from "express";
import accommodationRouter from "../routes/accommodation.routes";
import prisma from "../prisma/client";

jest.mock("../prisma/client", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    accommodation: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const app = express();
app.use(express.json());
app.use("/accommodations", accommodationRouter);

describe("POST /accommodations/create", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create an accommodation for a valid OWNER", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });

    (prisma.accommodation.create as jest.Mock).mockResolvedValue({
      ACCN_ID: 1,
      ACCC_NAME: "Test House",
      ACCC_TYPE: "House",
      ACCC_DESC: "A test house",
      ACCC_ADDRESS: "123 Main St",
      ACCB_AVAILABLE: true,
      USEN_ID: 1,
    });

    const response = await request(app).post("/accommodations/create").send({
      ACCC_NAME: "Test House",
      ACCC_TYPE: "House",
      ACCC_DESC: "A test house",
      ACCC_ADDRESS: "123 Main St",
      ACCB_AVAILABLE: true,
      USEN_ID: 1,
    });

    expect(response.status).toBe(201);
    expect(response.body.ACCN_ID).toBeDefined();
  });

  it("should return 404 if user is not found", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await request(app).post("/accommodations/create").send({
      ACCC_NAME: "Test House",
      ACCC_TYPE: "House",
      ACCC_DESC: "A test house",
      ACCC_ADDRESS: "123 Main St",
      ACCB_AVAILABLE: true,
      USEN_ID: 999,
    });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("User not found");
  });

  it("should return 403 if user is not an OWNER", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 2,
      USEC_TYPE: "TENANT",
    });

    const response = await request(app).post("/accommodations/create").send({
      ACCC_NAME: "Test House",
      ACCC_TYPE: "House",
      ACCC_DESC: "A test house",
      ACCC_ADDRESS: "123 Main St",
      ACCB_AVAILABLE: true,
      USEN_ID: 2,
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Only owners can create accommodations");
  });

  it("should return 400 if required fields are missing", async () => {
    const response = await request(app).post("/accommodations/create").send({
      ACCC_TYPE: "House",
      ACCC_DESC: "A test house",
      ACCC_ADDRESS: "123 Main St",
      ACCB_AVAILABLE: true,
      USEN_ID: 1,
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Missing required fields");
  });

  it("should handle internal server error", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });

    (prisma.accommodation.create as jest.Mock).mockRejectedValue(
      new Error("DB Error"),
    );

    const response = await request(app).post("/accommodations/create").send({
      ACCC_NAME: "Test House",
      ACCC_TYPE: "House",
      ACCC_DESC: "A test house",
      ACCC_ADDRESS: "123 Main St",
      ACCB_AVAILABLE: true,
      USEN_ID: 1,
    });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Error creating accommodation");
  });
});

describe("GET /accommodations/read", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if userId is missing", async () => {
    const res = await request(app).get("/accommodations/read");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Missing userId" });
  });

  it("should return 400 if available is invalid", async () => {
    const res = await request(app)
      .get("/accommodations/read")
      .query({ userId: 1, available: "maybe" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Invalid value for available. Must be true or false.",
    });
  });

  it("should return 403 if user is not found", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get("/accommodations/read")
      .query({ userId: 999 });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden: User not found" });
  });

  it("should return 403 if user is not an OWNER", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "TENANT",
    });

    const res = await request(app)
      .get("/accommodations/read")
      .query({ userId: 1 });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden: Not an OWNER" });
  });

  it("should return accommodations with no availability filter", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });

    (prisma.accommodation.findMany as jest.Mock).mockResolvedValue([
      { ACCN_ID: 1, ACCB_AVAILABLE: true, USEN_ID: 1 },
      { ACCN_ID: 2, ACCB_AVAILABLE: false, USEN_ID: 1 },
    ]);

    const res = await request(app)
      .get("/accommodations/read")
      .query({ userId: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("should return accommodations filtered by availability = true", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });

    (prisma.accommodation.findMany as jest.Mock).mockResolvedValue([
      { ACCN_ID: 1, ACCB_AVAILABLE: true, USEN_ID: 1 },
    ]);

    const res = await request(app)
      .get("/accommodations/read")
      .query({ userId: 1, available: "true" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].ACCB_AVAILABLE).toBe(true);
  });

  it("should return accommodations filtered by availability = false", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });

    (prisma.accommodation.findMany as jest.Mock).mockResolvedValue([
      { ACCN_ID: 1, ACCB_AVAILABLE: false, USEN_ID: 1 },
    ]);

    const res = await request(app)
      .get("/accommodations/read")
      .query({ userId: 1, available: "false" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].ACCB_AVAILABLE).toBe(false);
  });

  it("should handle internal server error if an unexpected error occurs", async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(
      new Error("DB Error"),
    );

    const res = await request(app)
      .get("/accommodations/read")
      .query({ userId: 1 });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal Server Error" });
  });
});
