import { Router, Request, Response } from 'express';
import prisma from '../prisma/client';

const router = Router();

/**
 * POST /createAccommodations
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

router.post('/', async (req: Request, res: Response) => {
  const {ACCC_NAME, ACCC_TYPE, ACCC_DESC, ACCC_ADDRESS, ACCB_AVAILABLE, USEN_ID } = req.body;

  if (!ACCC_NAME || !ACCC_TYPE || !ACCC_DESC || !ACCC_ADDRESS || ACCB_AVAILABLE === undefined || !USEN_ID) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
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
    res.status(500).json({ error: 'Error creating accommodation' });
  }
});

export default router;