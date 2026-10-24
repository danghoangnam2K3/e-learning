import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Admin@123456', description: 'Mật khẩu hiện tại' })
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống.' })
  @IsString()
  matKhauCu: string;

  @ApiProperty({ example: 'MatKhauMoi@2026', description: 'Mật khẩu mới' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống.' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải từ 6 ký tự trở lên.' })
  matKhauMoi: string;
}
