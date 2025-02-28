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
exports.authenticateYoutuber = exports.authenticateCompany = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const auth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Please authenticate' });
    }
});
exports.auth = auth;
const authenticateCompany = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        if (decoded.userType.toUpperCase() !== 'COMPANY') {
            return res.status(403).json({ error: 'Company access required' });
        }
        const company = yield database_1.default.company.findFirst({
            where: { userId: decoded.id }
        });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        req.user = Object.assign(Object.assign({}, decoded), { companyId: company.id });
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
    }
});
exports.authenticateCompany = authenticateCompany;
const authenticateYoutuber = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded.userType.toUpperCase() !== 'YOUTUBER') {
            return res.status(403).json({ error: 'Youtuber access required' });
        }
        const youtuber = yield database_1.default.youtuber.findFirst({
            where: { userId: decoded.id }
        });
        if (!youtuber) {
            return res.status(404).json({ error: 'Youtuber not found' });
        }
        req.user = Object.assign(Object.assign({}, decoded), { youtuberId: youtuber.id });
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
    }
});
exports.authenticateYoutuber = authenticateYoutuber;
