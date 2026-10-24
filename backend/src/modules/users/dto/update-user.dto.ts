import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsIn,
  IsBoolean,
  ValidateIf,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'Lê Thị Cẩm Vân', description: 'Họ và tên cập nhật' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống.' })
  @IsString({ message: 'Họ và tên phải là chuỗi.' })
  hoVaTen: string;

  @ApiPropertyOptional({ example: 'hv_lethicamvan', description: 'Tên đăng nhập mới (nếu muốn đổi)' })
  @IsOptional()
  @IsString()
  tenDangNhap?: string;

  @ApiPropertyOptional({ example: '123456', description: 'Mật khẩu mới (nếu muốn đặt lại/đổi mật khẩu)' })
  @IsOptional()
  @IsString()
  matKhau?: string;

  @ApiPropertyOptional({ example: '001095012345', description: 'Số CCCD/CMND' })
  @IsOptional()
  @IsString()
  soCCCD?: string;

  @ApiPropertyOptional({ example: '0912345678', description: 'Số điện thoại' })
  @IsOptional()
  @IsString()
  soDienThoai?: string;

  @ApiPropertyOptional({ example: 'lethicamvan@laixepro.edu.vn', description: 'Địa chỉ Email' })
  @IsOptional()
  @ValidateIf((o) => o.email && typeof o.email === 'string' && o.email.trim().length > 0)
  @IsEmail({}, { message: 'Định dạng email không hợp lệ.' })
  email?: string;

  @ApiProperty({ example: 'STUDENT', enum: ['ADMIN', 'TEACHER', 'STUDENT'], description: 'Mã vai trò' })
  @IsNotEmpty({ message: 'Mã vai trò không được để trống.' })
  @IsIn(['ADMIN', 'TEACHER', 'STUDENT'], { message: 'Vai trò chỉ được là ADMIN, TEACHER hoặc STUDENT.' })
  maVaiTro: string;

  @ApiPropertyOptional({ example: true, description: 'Trạng thái hoạt động (true: Đang học/Hoạt động, false: Tạm khóa)' })
  @IsOptional()
  @IsBoolean()
  trangThai?: boolean;
}
