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
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    lease: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
    },
    event: {
      deleteMany: jest.fn(),
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

describe("DELETE /accommodations/delete/:id", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if no user-id header is provided", async () => {
    const res = await request(app).delete("/accommodations/delete/1");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Missing or invalid userId/accommodationId",
    });
  });

  it("should return 403 if user is not found or not an OWNER", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    let res = await request(app)
      .delete("/accommodations/delete/1")
      .set("user-id", "1");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: "Forbidden: Not an OWNER or user not found",
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "TENANT",
    });

    res = await request(app)
      .delete("/accommodations/delete/1")
      .set("user-id", "1");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: "Forbidden: Not an OWNER or user not found",
    });
  });

  it("should return 404 if accommodation does not exist", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .delete("/accommodations/delete/1")
      .set("user-id", "1");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Accommodation not found" });
  });

  it("should return 403 if user is not the owner", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue({
      ACCN_ID: 1,
      USEN_ID: 2,
      ACCB_AVAILABLE: true,
    });

    const res = await request(app)
      .delete("/accommodations/delete/1")
      .set("user-id", "1");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: "Forbidden: You do not own this accommodation",
    });
  });

  it("should return 400 if accommodation is not available", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue({
      ACCN_ID: 1,
      USEN_ID: 1,
      ACCB_AVAILABLE: false,
    });

    const res = await request(app)
      .delete("/accommodations/delete/1")
      .set("user-id", "1");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Accommodation is not available and cannot be deleted",
    });
  });

  it("should return 400 if an active lease exists", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue({
      ACCN_ID: 1,
      USEN_ID: 1,
      ACCB_AVAILABLE: true,
    });
    (prisma.lease.findFirst as jest.Mock).mockResolvedValue([
      { LEAN_ID: 1, LEAB_ACTIVE: true },
    ]);

    const res = await request(app)
      .delete("/accommodations/delete/1")
      .set("user-id", "1");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Cannot delete accommodation with active lease",
    });
  });

  it("should delete accommodation and related data", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue({
      ACCN_ID: 1,
      USEN_ID: 1,
      ACCB_AVAILABLE: true,
    });
    (prisma.lease.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.event.deleteMany as jest.Mock).mockResolvedValue({});
    (prisma.lease.deleteMany as jest.Mock).mockResolvedValue({});
    (prisma.accommodation.delete as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .delete("/accommodations/delete/1")
      .set("user-id", "1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Accommodation and related data deleted successfully",
    });
  });

  it("should handle internal server error if an unexpected error occurs", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });
    (prisma.accommodation.findUnique as jest.Mock).mockImplementation(() => {
      throw new Error("Unexpected DB error");
    });

    const res = await request(app)
      .delete("/accommodations/delete/1")
      .set("user-id", "1");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal Server Error" });
  });
});

describe("PUT /accommodations/update/:id", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if user-id or accommodationId is missing or invalid", async () => {
    const res = await request(app).put("/accommodations/update/abc");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Missing or invalid userId/accommodationId",
    });
  });

  it("should return 403 if user not found or not an OWNER", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .put("/accommodations/update/1")
      .set("user-id", "1");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: "Forbidden: Not an OWNER or user not found",
    });
  });

  it("should return 404 if accommodation not found", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .put("/accommodations/update/1")
      .set("user-id", "1");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Accommodation not found" });
  });

  it("should return 403 if accommodation does not belong to user", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue({
      ACCN_ID: 1,
      USEN_ID: 2,
    });

    const res = await request(app)
      .put("/accommodations/update/1")
      .set("user-id", "1");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: "Forbidden: You do not own this accommodation",
    });
  });

  it("should return 400 if accommodation is not available", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue({
      ACCN_ID: 1,
      USEN_ID: 1,
      ACCB_AVAILABLE: false,
    });

    const res = await request(app)
      .put("/accommodations/update/1")
      .set("user-id", "1");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Accommodation is not available and cannot be updated",
    });
  });

  it("should return 400 if active lease exists", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue({
      ACCN_ID: 1,
      USEN_ID: 1,
      ACCB_AVAILABLE: true,
    });
    (prisma.lease.findFirst as jest.Mock).mockResolvedValue({
      LEAB_ACTIVE: true,
    });

    const res = await request(app)
      .put("/accommodations/update/1")
      .set("user-id", "1");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Cannot update accommodation with active lease",
    });
  });

  it("should update all allowed fields of the accommodation", async () => {
    const mockAccommodation = {
      ACCN_ID: 1,
      USEN_ID: 1,
      ACCB_AVAILABLE: true,
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });

    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue(
      mockAccommodation,
    );
    (prisma.lease.findFirst as jest.Mock).mockResolvedValue(null);

    const updatedFields = {
      ACCC_NAME: "New Name",
      ACCC_TYPE: "New Type",
      ACCC_ADDRESS: "New Address",
      ACCC_DESC: "New Description",
      ACCB_AVAILABLE: false,
    };

    (prisma.accommodation.update as jest.Mock).mockResolvedValue({
      ...mockAccommodation,
      ...updatedFields,
    });

    const res = await request(app)
      .put("/accommodations/update/1")
      .set("user-id", "1")
      .send(updatedFields);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Accommodation updated successfully",
      updatedAccommodation: {
        ...mockAccommodation,
        ...updatedFields,
      },
    });
  });

  it("should return 200 when accommodation is successfully updated", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: "OWNER",
    });
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue({
      ACCN_ID: 1,
      USEN_ID: 1,
      ACCB_AVAILABLE: true,
    });
    (prisma.lease.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.accommodation.update as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .put("/accommodations/update/1")
      .set("user-id", "1")
      .send({ ACCC_NAME: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Accommodation updated successfully",
      updatedAccommodation: {},
    });
    expect(res.status).toBe(200);
  });

  it("should return 500 if an unexpected error occurs", async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(
      new Error("Unexpected error"),
    );

    const res = await request(app)
      .put("/accommodations/update/1")
      .set("user-id", "1");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal Server Error" });
  });
});
