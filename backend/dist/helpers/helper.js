"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueCode = exports.generateCloudinarySignature = void 0;
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jwt_secret = process.env.JWT_SECRET || "2344";
const generateCloudinarySignature = (paramsToSign) => {
    return crypto_1.default
        .createHash('sha256')
        .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
        .digest('hex');
};
exports.generateCloudinarySignature = generateCloudinarySignature;
const generateUniqueCode = () => Math.floor(1000 + Math.random() * 9000);
exports.generateUniqueCode = generateUniqueCode;
