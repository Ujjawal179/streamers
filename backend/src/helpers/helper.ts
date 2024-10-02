import jwt from "jsonwebtoken";

import dotenv from 'dotenv';
import { Response } from 'express';

dotenv.config();

const jwt_secret= process.env.JWT_SECRET ||"2344";
