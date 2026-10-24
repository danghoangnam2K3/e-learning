import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  userId: number;
  username: string;
  role: string;
  fullName: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
