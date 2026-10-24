import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('1. Xác thực & Phân quyền (AUTH_MOD)')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'fn_login - Đăng nhập tài khoản hệ thống (Admin, Teacher, Student)' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công, trả về JWT Token và thông tin người dùng.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ hoặc tài khoản bị khóa.' })
  @ApiResponse({ status: 401, description: 'Sai tài khoản hoặc mật khẩu.' })
  async login(@Body() loginDto: LoginDto) {
    const data = await this.authService.login(loginDto);
    return {
      message: 'Đăng nhập hệ thống thành công.',
      data,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xem thông tin người dùng hiện tại đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Thông tin tài khoản hiện tại.' })
  async getProfile(@CurrentUser('userId') userId: number) {
    const profile = await this.authService.getProfile(userId);
    return {
      message: 'Lấy thông tin tài khoản thành công.',
      data: profile,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'fn_logout - Đăng xuất khỏi hệ thống' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công.' })
  async logout() {
    return {
      message: 'Đăng xuất an toàn thành công.',
      data: null,
    };
  }
}
