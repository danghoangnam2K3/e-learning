import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Tên đăng nhập của tài khoản' })
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống.' })
  @IsString({ message: 'Tên đăng nhập phải là chuỗi ký tự.' })
  username: string;

  @ApiProperty({ example: 'Admin@123456', description: 'Mật khẩu tài khoản' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự.' })
  @MinLength(6, { message: 'Mật khẩu tối thiểu phải từ 6 ký tự.' })
  password: string;
}
