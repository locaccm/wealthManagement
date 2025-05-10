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

    const filters: { USEN_ID: number; ACCB_AVAILABLE?: boolean } = {
      USEN_ID: Number(userId),
    };

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

/**
 * DELETE /accommodations/delete/:id
 * Headers:
 * - user-id: ID of the user requesting deletion
 */

router.delete("/delete/:id", async (req: Request, res: Response) => {
  const accommodationId = Number(req.params.id);
  const userId = Number(req.header("user-id"));

  if (!userId || isNaN(accommodationId)) {
    return res
      .status(400)
      .json({ error: "Missing or invalid userId/accommodationId" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { USEN_ID: userId },
    });

    if (!user || user.USEC_TYPE !== "OWNER") {
      return res
        .status(403)
        .json({ error: "Forbidden: Not an OWNER or user not found" });
    }

    const accommodation = await prisma.accommodation.findUnique({
      where: { ACCN_ID: accommodationId },
    });

    if (!accommodation) {
      return res.status(404).json({ error: "Accommodation not found" });
    }

    if (accommodation.USEN_ID !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: You do not own this accommodation" });
    }

    if (!accommodation.ACCB_AVAILABLE) {
      return res.status(400).json({
        error: "Accommodation is not available and cannot be deleted",
      });
    }

    const activeLease = await prisma.lease.findFirst({
      where: {
        ACCN_ID: accommodationId,
        LEAB_ACTIVE: true,
      },
    });

    if (activeLease) {
      return res
        .status(400)
        .json({ error: "Cannot delete accommodation with active lease" });
    }

    await prisma.event.deleteMany({
      where: { ACCN_ID: accommodationId },
    });

    await prisma.lease.deleteMany({
      where: { ACCN_ID: accommodationId },
    });

    await prisma.accommodation.delete({
      where: { ACCN_ID: accommodationId },
    });

    res
      .status(200)
      .json({ message: "Accommodation and related data deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * PUT /accommodations/update/:id
 * Headers:
 * - user-id: ID of the user requesting the update
 * Body:
 * - ACCC_NAME: "New Name" (optional)
 * - ACCC_TYPE: "New Type" (optional)
 * - ACCC_ADDRESS: "New Address" (optional)
 * - ACCC_DESC: "New Description" (optional)
 * - ACCB_AVAILABLE: true (optional)
 */

router.put("/update/:id", async (req: Request, res: Response) => {
  const accommodationId = Number(req.params.id);
  const userId = Number(req.header("user-id"));

  if (!userId || isNaN(accommodationId)) {
    return res
      .status(400)
      .json({ error: "Missing or invalid userId/accommodationId" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { USEN_ID: userId },
    });

    if (!user || user.USEC_TYPE !== "OWNER") {
      return res
        .status(403)
        .json({ error: "Forbidden: Not an OWNER or user not found" });
    }

    const accommodation = await prisma.accommodation.findUnique({
      where: { ACCN_ID: accommodationId },
    });

    if (!accommodation) {
      return res.status(404).json({ error: "Accommodation not found" });
    }

    if (accommodation.USEN_ID !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: You do not own this accommodation" });
    }

    if (!accommodation.ACCB_AVAILABLE) {
      return res.status(400).json({
        error: "Accommodation is not available and cannot be updated",
      });
    }

    const activeLease = await prisma.lease.findFirst({
      where: {
        ACCN_ID: accommodationId,
        LEAB_ACTIVE: true,
      },
    });

    if (activeLease) {
      return res
        .status(400)
        .json({ error: "Cannot update accommodation with active lease" });
    }

    const { ACCC_NAME, ACCC_TYPE, ACCC_ADDRESS, ACCC_DESC, ACCB_AVAILABLE } =
      req.body;
    const updateData: any = {};

    if (ACCC_NAME !== undefined) updateData.ACCC_NAME = ACCC_NAME;
    if (ACCC_TYPE !== undefined) updateData.ACCC_TYPE = ACCC_TYPE;
    if (ACCC_ADDRESS !== undefined) updateData.ACCC_ADDRESS = ACCC_ADDRESS;
    if (ACCC_DESC !== undefined) updateData.ACCC_DESC = ACCC_DESC;
    if (ACCB_AVAILABLE !== undefined)
      updateData.ACCB_AVAILABLE = ACCB_AVAILABLE;

    const updatedAccommodation = await prisma.accommodation.update({
      where: { ACCN_ID: accommodationId },
      data: updateData,
    });

    res.status(200).json({
      message: "Accommodation updated successfully",
      updatedAccommodation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
