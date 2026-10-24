import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, IsDateString } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: 'K45-B2-02', description: 'Mã lớp học / khóa học duy nhất' })
  @IsNotEmpty({ message: 'Mã khóa học không được để trống.' })
  @IsString()
  maLopHocCode: string;

  @ApiProperty({ example: 'B số sàn KHÓA 02/2026', description: 'Tên khóa học đào tạo' })
  @IsNotEmpty({ message: 'Tên khóa học không được để trống.' })
  @IsString()
  tenLopHoc: string;

  @ApiProperty({ example: 1, description: 'Mã khung bài giảng mẫu (MaKhoaHoc)' })
  @IsNotEmpty({ message: 'Vui lòng chọn khung bài giảng mẫu liên kết.' })
  @IsInt()
  maKhoaHoc: number;

  @ApiPropertyOptional({ example: 2, description: 'Mã giáo viên phụ trách' })
  @IsOptional()
  @IsInt()
  maGiaoVienPhuTrach?: number;

  @ApiProperty({ example: '2026-03-01', description: 'Ngày khai giảng (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Ngày khai giảng không được để trống.' })
  @IsDateString()
  ngayKhaiGiang: string;

  @ApiProperty({ example: '2026-06-30', description: 'Ngày bế giảng (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Ngày bế giảng không được để trống.' })
  @IsDateString()
  ngayBeGiang: string;

  @ApiPropertyOptional({ example: 'Đang đào tạo', description: 'Trạng thái lớp: Đang đào tạo, Sắp khai giảng, Đã hoàn thành' })
  @IsOptional()
  @IsString()
  trangThai?: string = 'Đang đào tạo';
}

export class UpdateClassDto {
  @ApiPropertyOptional({ example: 'K45-B2-02', description: 'Mã lớp học / khóa học' })
  @IsOptional()
  @IsString()
  maLopHocCode?: string;

  @ApiProperty({ example: 'B số sàn KHÓA 02/2026 (Cập nhật)', description: 'Tên khóa học' })
  @IsNotEmpty({ message: 'Tên khóa học không được để trống.' })
  @IsString()
  tenLopHoc: string;

  @ApiProperty({ example: 1, description: 'Mã khung bài giảng mẫu (MaKhoaHoc)' })
  @IsNotEmpty({ message: 'Vui lòng chọn khung bài giảng mẫu liên kết.' })
  @IsInt()
  maKhoaHoc: number;

  @ApiPropertyOptional({ example: 2, description: 'Mã giáo viên phụ trách' })
  @IsOptional()
  @IsInt()
  maGiaoVienPhuTrach?: number;

  @ApiProperty({ example: '2026-03-01', description: 'Ngày khai giảng' })
  @IsNotEmpty()
  @IsDateString()
  ngayKhaiGiang: string;

  @ApiProperty({ example: '2026-06-30', description: 'Ngày bế giảng' })
  @IsNotEmpty()
  @IsDateString()
  ngayBeGiang: string;

  @ApiPropertyOptional({ example: 'Đang đào tạo', description: 'Trạng thái lớp' })
  @IsOptional()
  @IsString()
  trangThai?: string;
}
