import prisma from "../prisma/client";

export async function validateOwnerAccommodation(
  userId: number,
  accommodationId: number,
): Promise<
  | { success: true; user: any; accommodation: any }
  | { success: false; status: number; error: string }
> {
  if (!userId || isNaN(accommodationId)) {
    return {
      success: false,
      status: 400,
      error: "Missing or invalid userId/accommodationId",
    };
  }

  const user = await prisma.user.findUnique({
    where: { USEN_ID: userId },
  });

  if (!user || user.USEC_TYPE !== "OWNER") {
    return {
      success: false,
      status: 403,
      error: "Forbidden: Not an OWNER or user not found",
    };
  }

  const accommodation = await prisma.accommodation.findUnique({
    where: { ACCN_ID: accommodationId },
  });

  if (!accommodation) {
    return {
      success: false,
      status: 404,
      error: "Accommodation not found",
    };
  }

  if (accommodation.USEN_ID !== userId) {
    return {
      success: false,
      status: 403,
      error: "Forbidden: You do not own this accommodation",
    };
  }

  return { success: true, user, accommodation };
}
