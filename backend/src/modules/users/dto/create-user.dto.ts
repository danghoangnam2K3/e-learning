import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEmail,
  IsIn,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'gv_lethic', description: 'Tên đăng nhập mới' })
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống.' })
  @IsString({ message: 'Tên đăng nhập phải là chuỗi.' })
  tenDangNhap: string;

  @ApiProperty({ example: 'MatKhau@123', description: 'Mật khẩu tài khoản' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  @IsString({ message: 'Mật khẩu phải là chuỗi.' })
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự trở lên.' })
  matKhau: string;

  @ApiProperty({ example: 'Lê Thị Cẩm', description: 'Họ và tên đầy đủ' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống.' })
  @IsString({ message: 'Họ và tên phải là chuỗi.' })
  hoVaTen: string;

  @ApiProperty({ example: '001095012345', required: false, description: 'Số CCCD/CMND' })
  @IsOptional()
  @IsString()
  soCCCD?: string;

  @ApiProperty({ example: '0912345678', required: false, description: 'Số điện thoại' })
  @IsOptional()
  @IsString()
  soDienThoai?: string;

  @ApiProperty({ example: 'lethicam@laixepro.edu.vn', required: false, description: 'Địa chỉ Email' })
  @IsOptional()
  @IsEmail({}, { message: 'Định dạng email không hợp lệ.' })
  email?: string;

  @ApiProperty({ example: 'TEACHER', enum: ['ADMIN', 'TEACHER', 'STUDENT'], description: 'Mã vai trò' })
  @IsNotEmpty({ message: 'Mã vai trò không được để trống.' })
  @IsIn(['ADMIN', 'TEACHER', 'STUDENT'], { message: 'Vai trò chỉ được là ADMIN, TEACHER hoặc STUDENT.' })
  maVaiTro: string;
}
