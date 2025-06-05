import { Router, Request, Response } from "express";
import prisma from "../prisma/client";
import { validateOwnerAccommodation } from "../utils/validateOwnerAccommodation";
import { checkAccess } from "../middlewares/checkAcces";

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
 * Token must be in Authorization header.
 */

router.post(
  "/create",
  checkAccess("setHouse"),
  async (req: Request, res: Response) => {
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
  },
);

/**
 * GET /read
 * Query Parameters:
 * - userId: ID of the user (owner) to filter accommodations
 * - available: (optional) filter by availability (true/false)
 */

router.get(
  "/read",
  checkAccess("getHouse"),
  async (req: Request, res: Response) => {
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
  },
);

/**
 * DELETE /accommodations/delete/:id
 * Path Parameters:
 * - id: ID of the accommodation to delete
 * Headers:
 * - user-id: ID of the user requesting deletion
 */

router.delete(
  "/delete/:id",
  checkAccess("deleteHouse"),
  async (req: Request, res: Response) => {
    const accommodationId = Number(req.params.id);
    const userId = Number(req.header("user-id"));

    try {
      const validation = await validateOwnerAccommodation(
        userId,
        accommodationId,
      );
      if (!validation.success) {
        return res.status(validation.status).json({ error: validation.error });
      }

      const { accommodation } = validation;

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

      await prisma.event.deleteMany({ where: { ACCN_ID: accommodationId } });
      await prisma.lease.deleteMany({ where: { ACCN_ID: accommodationId } });
      await prisma.accommodation.delete({
        where: { ACCN_ID: accommodationId },
      });

      return res.status(200).json({
        message: "Accommodation and related data deleted successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * PUT /accommodations/update/:id
 * Path Parameters:
 * - id: ID of the accommodation to update
 * Headers:
 * - user-id: ID of the user requesting the update
 * Body:
 * - ACCC_NAME: "New Name" (optional)
 * - ACCC_TYPE: "New Type" (optional)
 * - ACCC_ADDRESS: "New Address" (optional)
 * - ACCC_DESC: "New Description" (optional)
 * - ACCB_AVAILABLE: true (optional)
 */

router.put(
  "/update/:id",
  checkAccess("updateHouse"),
  async (req: Request, res: Response) => {
    const accommodationId = Number(req.params.id);
    const userId = Number(req.header("user-id"));

    if (!userId || isNaN(accommodationId)) {
      return res
        .status(400)
        .json({ error: "Missing or invalid userId/accommodationId" });
    }

    try {
      const validationResult = await validateOwnerAccommodation(
        userId,
        accommodationId,
      );

      if (!validationResult.success) {
        return res
          .status(validationResult.status)
          .json({ error: validationResult.error });
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
  },
);

export default router;
