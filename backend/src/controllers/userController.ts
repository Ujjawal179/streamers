import { Request,Response } from "express";
export const testUser= async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).json({ message: 'User test successful' });
}