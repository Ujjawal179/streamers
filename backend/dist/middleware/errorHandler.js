"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const ApiError_1 = require("../utils/ApiError");
const errorHandler = (err, req, res, next) => {
    if (err instanceof ApiError_1.ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
};
exports.errorHandler = errorHandler;
