import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsBoolean } from 'class-validator';

export class ChangeStatusDto {
  @ApiProperty({ example: false, description: 'Trạng thái mới: true (Hoạt động), false (Khóa tài khoản)' })
  @IsNotEmpty({ message: 'Trạng thái mới không được để trống.' })
  @IsBoolean({ message: 'Trạng thái mới phải là giá trị boolean (true/false).' })
  trangThaiMoi: boolean;
}
