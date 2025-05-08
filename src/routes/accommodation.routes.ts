import { Router, Request, Response } from "express";
import prisma from "../prisma/client";

const router = Router();

/**
 * POST /create
 * Expected Body :
 * {
 *  ACCC_NAME       = "Accommodation Name"          ex: "My House",
 *  ACCC_TYPE       = "Accommodation Type"          ex: "House" / "Apartment",
 *  ACCC_DESC       = "Accommodation Description"   ex: "My House is a nice place",
 *  ACCC_ADDRESS    = "Accommodation Address"       ex: "123 Main St, City, Country",
 *  ACCB_AVAILABLE  = "Accommodation Availability"  ex: true / false,
 *  USEN_ID         = "Accommodation Owner ID"      ex: 1,
 * }
 */

router.post("/create", async (req: Request, res: Response) => {
  const {
    ACCC_NAME,
    ACCC_TYPE,
    ACCC_DESC,
    ACCC_ADDRESS,
    ACCB_AVAILABLE,
    USEN_ID,
  } = req.body;

  if (
    !ACCC_NAME ||
    !ACCC_TYPE ||
    !ACCC_DESC ||
    !ACCC_ADDRESS ||
    ACCB_AVAILABLE === undefined ||
    !USEN_ID
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { USEN_ID },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.USEC_TYPE !== "OWNER") {
      return res
        .status(403)
        .json({ error: "Only owners can create accommodations" });
    }

    const accommodation = await prisma.accommodation.create({
      data: {
        ACCC_NAME: ACCC_NAME,
        ACCC_TYPE: ACCC_TYPE,
        ACCC_DESC: ACCC_DESC,
        ACCC_ADDRESS: ACCC_ADDRESS,
        ACCB_AVAILABLE: ACCB_AVAILABLE,
        USEN_ID: USEN_ID,
      },
    });

    res.status(201).json(accommodation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating accommodation" });
  }
});

/**
 * GET /read
 * Query Parameters:
 * - userId: ID of the user (owner) to filter accommodations
 * - available: (optional) filter by availability (true/false)
 */

router.get("/read", async (req: Request, res: Response) => {
  const { userId, available } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  if (
    available !== undefined &&
    available !== "true" &&
    available !== "false"
  ) {
    return res
      .status(400)
      .json({ error: "Invalid value for available. Must be true or false." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { USEN_ID: Number(userId) },
    });

    if (!user) {
      return res.status(403).json({ error: "Forbidden: User not found" });
    }

    if (user.USEC_TYPE !== "OWNER") {
      return res.status(403).json({ error: "Forbidden: Not an OWNER" });
    }

    const filters: any = { USEN_ID: Number(userId) };

    if (available !== undefined) {
      filters.ACCB_AVAILABLE = available === "true";
    }

    const accommodations = await prisma.accommodation.findMany({
      where: filters,
    });

    res.status(200).json(accommodations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
