import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // 1. Gọi Stored Procedure xác thực tên đăng nhập
    const queryResult = await this.dataSource.query(
      'EXEC dbo.sp_KiemTraDangNhap @TenDangNhap = @0',
      [username.trim()],
    );

    const user = Array.isArray(queryResult) ? queryResult[0] : null;

    if (!user) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác.');
    }

    // 2. So sánh mật khẩu băm với bcrypt
    const isPasswordValid = bcrypt.compareSync(password, user.MatKhauHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu không chính xác. Vui lòng thử lại.');
    }

    // 3. Tạo Payload và ký JWT Token
    const payload = {
      sub: user.MaNguoiDung,
      username: user.TenDangNhap,
      role: user.MaVaiTro,
      fullName: user.HoVaTen,
    };

    const accessToken = this.jwtService.sign(payload);

    let avatarUrl = user.AvatarUrl;
    if (avatarUrl === undefined) {
      try {
        const u = await this.dataSource.query(
          `SELECT AvatarUrl FROM dbo.NguoiDung WHERE MaNguoiDung = @0`,
          [user.MaNguoiDung],
        );
        avatarUrl = u?.[0]?.AvatarUrl || null;
      } catch {
        avatarUrl = null;
      }
    }

    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        maNguoiDung: user.MaNguoiDung,
        tenDangNhap: user.TenDangNhap,
        hoVaTen: user.HoVaTen,
        maVaiTro: user.MaVaiTro,
        tenVaiTro: user.TenVaiTro,
        soCCCD: user.SoCCCD,
        soDienThoai: user.SoDienThoai,
        email: user.Email,
        avatarUrl: avatarUrl || null,
        trangThai: user.TrangThai,
      },
    };
  }

  async getProfile(userId: number) {
    const result = await this.dataSource.query(
      `SELECT u.MaNguoiDung, u.TenDangNhap, u.HoVaTen, u.SoCCCD, u.SoDienThoai, u.Email, u.AvatarUrl, u.MaVaiTro, r.TenVaiTro, u.TrangThai, u.NgayTao
       FROM dbo.NguoiDung u
       INNER JOIN dbo.VaiTro r ON u.MaVaiTro = r.MaVaiTro
       WHERE u.MaNguoiDung = @0 AND u.DaXoa = 0`,
      [userId],
    );

    if (!result || result.length === 0) {
      throw new UnauthorizedException('Không tìm thấy thông tin tài khoản người dùng.');
    }

    return result[0];
  }
}
