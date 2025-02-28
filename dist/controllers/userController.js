"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCloudinarySignature = exports.verifyEmail = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../db/db"));
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const helper_1 = require("../helpers/helper");
const email_1 = require("../helpers/email");
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
// Add to your existing schemas
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    userType: zod_1.z.enum(['company', 'youtuber']),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    userType: zod_1.z.enum(['company', 'youtuber']),
});
// Updated register controller
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, userType } = req.body;
        console.log({ name, email, password, userType });
        // if (!parseResult.success) {
        //   return res.status(400).json({
        //     success: false,
        //     errors: parseResult.error.issues.map(issue => ({
        //       path: issue.path[0],
        //       message: issue.message,
        //     }))
        //   });
        // }
        // const { name, email, password, userType } = parseResult.data;
        // Check if email already exists before doing anything else
        const existingUser = yield db_1.default.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        // Continue with registration if email doesn't exist
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        // Use transaction to ensure data consistency
        if (userType === 'company') {
            yield db_1.default.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
                const user = yield prisma.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                        name,
                        role: 'COMPANY',
                        verificationToken,
                        isVerified: false
                    }
                });
                yield prisma.company.create({
                    data: {
                        name,
                        userId: user.id,
                        isVerified: false
                    }
                });
            }));
            yield (0, email_1.sendVerificationEmail)(email, verificationToken);
            return res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email to verify your account.'
            });
        }
        // YouTuber registration
        yield db_1.default.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: 'YOUTUBER',
                    verificationToken,
                    isVerified: false
                }
            });
            yield prisma.youtuber.create({
                data: {
                    userId: user.id,
                    alertBoxUrl: `${process.env.FRONTEND_URL}/alert-box/${crypto_1.default.randomUUID()}`,
                    MagicNumber: (0, helper_1.generateUniqueCode)(),
                    isVerified: false
                }
            });
        }));
        yield (0, email_1.sendVerificationEmail)(email, verificationToken);
        return res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email to verify your account.'
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
});
exports.register = register;
// Updated login controller
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parseResult = loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                errors: parseResult.error.issues.map(issue => ({
                    path: issue.path[0],
                    message: issue.message,
                }))
            });
        }
        const { email, password, userType } = parseResult.data;
        if (userType === 'company') {
            const companyUser = yield db_1.default.user.findUnique({
                where: { email },
                include: { company: true }
            });
            if (!(companyUser === null || companyUser === void 0 ? void 0 : companyUser.company) || !(yield bcrypt_1.default.compare(password, companyUser.password))) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            if (!companyUser.isVerified) {
                return res.status(401).json({
                    success: false,
                    message: 'Email not verified. Please check your email.'
                });
            }
            const token = jsonwebtoken_1.default.sign({ id: companyUser.id, userType }, JWT_SECRET, { expiresIn: '24h' });
            return res.status(200).json({
                success: true,
                user: Object.assign(Object.assign({}, companyUser === null || companyUser === void 0 ? void 0 : companyUser.company), { password: undefined }),
                userType,
                token
            });
        }
        // Updated login for Youtuber
        const youtuberUser = yield db_1.default.user.findUnique({
            where: { email },
            include: { youtuber: true }
        });
        if (!(youtuberUser === null || youtuberUser === void 0 ? void 0 : youtuberUser.youtuber) || !(yield bcrypt_1.default.compare(password, youtuberUser.password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        if (!youtuberUser.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Email not verified. Please check your email.'
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: youtuberUser.id, userType }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(200).json({
            success: true,
            user: Object.assign(Object.assign({}, youtuberUser.youtuber), { password: undefined }),
            userType,
            token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.login = login;
// Add new verification controller
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.params; // Changed from req.query to req.params
        // Find user by verification token
        const user = yield db_1.default.user.findFirst({
            where: { verificationToken: token }
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }
        // Update user verification status
        yield db_1.default.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
            // Update user
            yield prisma.user.update({
                where: { id: user.id },
                data: {
                    isVerified: true,
                    verificationToken: null // Clear the token after verification
                }
            });
            // Update associated company or youtuber based on role
            if (user.role === 'COMPANY') {
                yield prisma.company.update({
                    where: { userId: user.id },
                    data: { isVerified: true }
                });
            }
            else if (user.role === 'YOUTUBER') {
                yield prisma.youtuber.update({
                    where: { userId: user.id },
                    data: { isVerified: true }
                });
            }
        }));
        // Redirect to frontend with success message
        return res.redirect(`${process.env.FRONTEND_URL}/verification-success`);
    }
    catch (error) {
        console.error('Verification error:', error);
        // Redirect to frontend with error message
        return res.redirect(`${process.env.FRONTEND_URL}/verification-error`);
    }
});
exports.verifyEmail = verifyEmail;
// Keep existing getCloudinarySignature function
const getCloudinarySignature = (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'uploads';
        const uploadPreset = 'ml_default'; // Include the upload preset
        // Include all parameters that need to be signed
        const paramsToSign = `folder=${folder}&timestamp=${timestamp}&upload_preset=${uploadPreset}`;
        const signature = (0, helper_1.generateCloudinarySignature)(paramsToSign);
        res.json({
            signature,
            timestamp,
            folder,
            uploadPreset,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY
        });
    }
    catch (error) {
        console.error('Error generating signature:', error);
        res.status(500).json({ error: 'Failed to generate signature' });
    }
};
exports.getCloudinarySignature = getCloudinarySignature;
