import axios from "axios";
import { Request, Response, NextFunction } from "express";

export const checkAccess = (rightName: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const authServiceUrl = process.env.AUTH_SERVICE_URL;

    if (!authServiceUrl) {
      return next();
    }
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ error: "Authorization token missing or malformed" });
      return;
    }

    const token = authHeader.split(" ")[1];

    try {
      const response = await axios.post(
        `${process.env.AUTH_SERVICE_URL}/access/check`,
        {
          token,
          rightName,
        },
      );

      if (response.status === 200) {
        next();
      } else {
        res.status(403).json({ error: "Access denied" });
      }
    } catch (err) {
      const error = err as Error;
      res.status(401).json({
        error: "Authorization failed",
        details: error.message,
      });
    }
  };
};
