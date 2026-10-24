import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUserDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm theo tên, tài khoản, CCCD, điện thoại, email' })
  @IsOptional()
  @IsString()
  tuKhoa?: string;

  @ApiPropertyOptional({ enum: ['ADMIN', 'TEACHER', 'STUDENT'], description: 'Lọc theo vai trò' })
  @IsOptional()
  @IsString()
  maVaiTro?: string;

  @ApiPropertyOptional({ description: 'Lọc theo trạng thái tài khoản: 1 (Hoạt động), 0 (Bị khóa)' })
  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  trangThai?: number;

  @ApiPropertyOptional({ default: 1, description: 'Trang hiện tại' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  trangHienTai?: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Số bản ghi trên mỗi trang (10, 20, 50 hoặc -1 để lấy tất cả)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  soBanGhiMoiTrang?: number = 10;

  @ApiPropertyOptional({ default: 'NgayTao', enum: ['NgayTao', 'HoVaTen', 'TenDangNhap'], description: 'Cột sắp xếp' })
  @IsOptional()
  @IsString()
  sapXepTheo?: string = 'NgayTao';

  @ApiPropertyOptional({ default: 'DESC', enum: ['ASC', 'DESC'], description: 'Hướng sắp xếp' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  huongSapXep?: string = 'DESC';
}
