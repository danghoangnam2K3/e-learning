import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsArray, ValidateNested, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentRecordDto {
  @ApiProperty({ example: 'Nguyễn Văn C', description: 'Họ và tên học viên' })
  @IsNotEmpty()
  @IsString()
  HoVaTen: string;

  @ApiProperty({ example: '001099012345', description: 'Số CCCD' })
  @IsNotEmpty()
  @IsString()
  SoCCCD: string;

  @ApiPropertyOptional({ example: '0988776655', description: 'Số điện thoại' })
  @IsOptional()
  @IsString()
  SoDienThoai?: string;

  @ApiPropertyOptional({ example: 'nguyenvanc@gmail.com', description: 'Email' })
  @IsOptional()
  @IsString()
  Email?: string;

  @ApiPropertyOptional({ example: 'hv_001099012345', description: 'Tên đăng nhập (tự động lấy CCCD nếu bỏ trống)' })
  @IsOptional()
  @IsString()
  TenDangNhap?: string;
}

export class ImportStudentsDto {
  @ApiProperty({ example: 1, description: 'Mã lớp học cần gán danh sách học viên' })
  @IsNotEmpty()
  @IsInt()
  maLopHoc: number;

  @ApiProperty({ type: [StudentRecordDto], description: 'Danh sách đối tượng học viên cần nhập' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentRecordDto)
  danhSachHocVien: StudentRecordDto[];
}
