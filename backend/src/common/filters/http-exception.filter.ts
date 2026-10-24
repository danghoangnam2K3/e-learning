import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Đã xảy ra lỗi trên hệ thống máy chủ.';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object') {
        message = res.message || message;
        if (Array.isArray(res.message)) {
          message = res.message.join('; ');
          errors = res.message;
        }
      }
    } else {
      // Bắt lỗi từ Microsoft SQL Server Stored Procedure (RAISERROR)
      const rawMessage: string =
        exception?.originalError?.message ||
        exception?.message ||
        String(exception);

      this.logger.error(`Database Exception: ${rawMessage}`, exception?.stack);

      // Phân loại các thông điệp lỗi nghiệp vụ tiếng Việt từ Stored Procedure
      if (
        rawMessage.includes('không tồn tại') ||
        rawMessage.includes('đã tồn tại') ||
        rawMessage.includes('trùng') ||
        rawMessage.includes('không hợp lệ') ||
        rawMessage.includes('bị tạm khóa') ||
        rawMessage.includes('chưa đạt')
      ) {
        status = HttpStatus.BAD_REQUEST;
        message = this.cleanSqlErrorMessage(rawMessage);
      } else {
        message = 'Lỗi truy vấn cơ sở dữ liệu: ' + this.cleanSqlErrorMessage(rawMessage);
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private cleanSqlErrorMessage(msg: string): string {
    if (!msg) return 'Lỗi cơ sở dữ liệu không xác định.';
    // Loại bỏ tiền tố mã lỗi của driver nếu có
    return msg.replace(/^.*?Error:\s*/, '').trim();
  }
}
