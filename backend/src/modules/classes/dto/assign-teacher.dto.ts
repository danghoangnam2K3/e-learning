import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class AssignTeacherDto {
  @ApiProperty({ example: 2, description: 'Mã giáo viên được phân công phụ trách lớp (MaNguoiDung)' })
  @IsNotEmpty({ message: 'Mã giáo viên không được để trống.' })
  @IsInt()
  maGiaoVienPhuTrach: number;
}
