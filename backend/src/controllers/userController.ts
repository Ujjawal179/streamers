import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../db/db'; // assuming you have prismaClient set up
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Define the Zod schema for input validation
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';


// Register route
 export const register= async (req: Request, res: Response): Promise<Response> => {
  // Parse and validate the request body using Zod
  const parseResult = registerSchema.safeParse(req.body);

  // Handle validation errors
  if (!parseResult.success) {
    const errors = parseResult.error.issues.map((issue) => ({
      path: issue.path[0],
      message: issue.message,
    }));
    return res.status(400).json({ errors });
  }

  const { name, email, password } = parseResult.data;

  try {

    // Check if the user already exists
    const existingUser = await prisma.youtuber.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await prisma.youtuber.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({ message: 'User registration successful', user: newUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
}

export const login=async (req: Request, res: Response): Promise<Response> => {
  // Parse and validate the request body
  const parseResult = loginSchema.safeParse(req.body);

  if (!parseResult.success) {
    const errors = parseResult.error.issues.map((issue) => ({
      path: issue.path[0],
      message: issue.message,
    }));
    return res.status(400).json({ errors });
  }

  const { email, password } = parseResult.data;

  try {
    // Check if user exists
    const user = await prisma.youtuber.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
}
