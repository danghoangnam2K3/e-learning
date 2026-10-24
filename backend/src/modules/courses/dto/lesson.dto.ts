import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ example: 1, description: 'Mã khóa học (MaKhoaHoc)' })
  @IsNotEmpty()
  @IsInt()
  maKhoaHoc: number;

  @ApiProperty({ example: 'Bài 1: Khái niệm và quy tắc giao thông cơ bản', description: 'Tên bài giảng' })
  @IsNotEmpty({ message: 'Tên bài giảng không được để trống.' })
  @IsString()
  tenBaiGiang: string;

  @ApiProperty({ example: 'Pháp luật giao thông đường bộ', description: 'Môn học' })
  @IsNotEmpty({ message: 'Tên môn học không được để trống.' })
  @IsString()
  monHoc: string;

  @ApiPropertyOptional({ example: 1, description: 'Số thứ tự bài giảng trong môn' })
  @IsOptional()
  @IsInt()
  soThuTu?: number = 1;

  @ApiPropertyOptional({ example: '/videos/b2_phapluat_bai1.mp4', description: 'Đường dẫn video bài giảng' })
  @IsOptional()
  @IsString()
  duongDanVideo?: string;

  @ApiPropertyOptional({ example: 45, description: 'Thời lượng yêu cầu (phút)' })
  @IsOptional()
  @IsInt()
  thoiLuongPhut?: number = 45;

  @ApiPropertyOptional({ example: '/docs/b2_bai1.pdf', description: 'Đường dẫn tài liệu đính kèm' })
  @IsOptional()
  @IsString()
  taiLieuDinhKem?: string;
}

export class UpdateLessonDto {
  @ApiPropertyOptional({ example: 1, description: 'Mã khóa học (MaKhoaHoc)' })
  @IsOptional()
  @IsInt()
  maKhoaHoc?: number;

  @ApiProperty({ example: 'Bài 1: Khái niệm và quy tắc giao thông (sửa)', description: 'Tên bài giảng' })
  @IsNotEmpty({ message: 'Tên bài giảng không được để trống.' })
  @IsString()
  tenBaiGiang: string;

  @ApiProperty({ example: 'Pháp luật giao thông đường bộ', description: 'Môn học' })
  @IsNotEmpty({ message: 'Tên môn học không được để trống.' })
  @IsString()
  monHoc: string;

  @ApiPropertyOptional({ example: 1, description: 'Số thứ tự bài giảng' })
  @IsOptional()
  @IsInt()
  soThuTu?: number = 1;

  @ApiPropertyOptional({ example: '/videos/b2_phapluat_bai1.mp4', description: 'Đường dẫn video' })
  @IsOptional()
  @IsString()
  duongDanVideo?: string;

  @ApiPropertyOptional({ example: 45, description: 'Thời lượng yêu cầu (phút)' })
  @IsOptional()
  @IsInt()
  thoiLuongPhut?: number = 45;

  @ApiPropertyOptional({ example: '/docs/b2_bai1.pdf', description: 'Tài liệu đính kèm' })
  @IsOptional()
  @IsString()
  taiLieuDinhKem?: string;
}
