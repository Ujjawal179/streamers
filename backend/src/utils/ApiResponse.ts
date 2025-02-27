/**
 * ApiResponse class for formatting consistent API responses
 */
export class ApiResponse<T = any> {
  readonly statusCode: number;
  readonly data: T;
  readonly message: string;
  readonly success: boolean;

  constructor(statusCode: number, data: T, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
