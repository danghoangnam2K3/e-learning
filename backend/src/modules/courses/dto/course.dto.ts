import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'B2', description: 'Mã hạng GPLX (Ví dụ: B11, B2, C)' })
  @IsNotEmpty({ message: 'Mã hạng GPLX không được để trống.' })
  @IsString()
  maHangGPLX: string;

  @ApiProperty({ example: 'Đào tạo Lái xe Hạng B2', description: 'Tên khóa học' })
  @IsNotEmpty({ message: 'Tên khóa học không được để trống.' })
  @IsString()
  tenKhoaHoc: string;

  @ApiPropertyOptional({ example: 'Khóa học lái xe số sàn và tự động...', description: 'Mô tả chi tiết' })
  @IsOptional()
  @IsString()
  moTa?: string;

  @ApiPropertyOptional({ example: 168.0, description: 'Tổng số giờ lý thuyết theo quy định' })
  @IsOptional()
  @IsNumber()
  tongSoGioLyThuyet?: number = 100.0;
}

export class UpdateCourseDto {
  @ApiProperty({ example: 'Đào tạo Lái xe Hạng B2 (Cập nhật)', description: 'Tên khóa học' })
  @IsNotEmpty({ message: 'Tên khóa học không được để trống.' })
  @IsString()
  tenKhoaHoc: string;

  @ApiPropertyOptional({ example: 'Mô tả cập nhật...', description: 'Mô tả chi tiết' })
  @IsOptional()
  @IsString()
  moTa?: string;

  @ApiPropertyOptional({ example: 168.0, description: 'Tổng số giờ lý thuyết theo quy định' })
  @IsOptional()
  @IsNumber()
  tongSoGioLyThuyet?: number;
}
