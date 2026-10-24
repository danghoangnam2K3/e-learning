import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, Min } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({ example: 1, description: 'Mã bài giảng đang học' })
  @IsNotEmpty({ message: 'Mã bài giảng không được để trống.' })
  @IsInt()
  maBaiGiang: number;

  @ApiProperty({ example: 30, description: 'Thời gian học tích lũy cộng thêm tính bằng giây (thường gửi mỗi 30 hoặc 60 giây)' })
  @IsNotEmpty({ message: 'Thời gian cộng thêm không được để trống.' })
  @IsInt()
  @Min(1, { message: 'Thời gian cộng thêm tối thiểu là 1 giây.' })
  thoiGianCongThemGiay: number;
}
