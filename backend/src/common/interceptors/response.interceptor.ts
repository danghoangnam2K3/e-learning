import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((result) => {
        let message = 'Thao tác thành công.';
        let data = result;

        if (result && typeof result === 'object' && 'message' in result && 'data' in result) {
          message = result.message;
          data = result.data;
        }

        return {
          success: true,
          statusCode,
          message,
          data: data ?? null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
