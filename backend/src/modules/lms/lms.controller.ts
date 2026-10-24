import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LmsService } from './lms.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('6. Học tập Trực tuyến & Quản lý Cá nhân (LMS_MOD)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lms')
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Post('heartbeat-progress')
  @Roles(Role.STUDENT)
  @ApiOperation({
    summary: 'fn_access_lms_lessons - Ghi nhận thời gian học tích lũy (Heartbeat mỗi 30-60s khi xem video lý thuyết)',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật tiến độ học tập thành công.' })
  async updateProgress(
    @CurrentUser('userId') studentId: number,
    @Body() dto: UpdateProgressDto,
  ) {
    const data = await this.lmsService.updateProgress(studentId, dto);
    return {
      message: 'Cập nhật tiến độ học tập thành công.',
      data,
    };
  }

  @Get('progress')
  @ApiOperation({
    summary: 'fn_track_personal_progress / fn_track_all_students_progress - Xem tiến độ học tập theo vai trò',
  })
  @ApiQuery({ name: 'classId', required: false, description: 'Lọc theo mã lớp (Dành cho Giáo viên & Admin)', type: Number })
  async getProgress(
    @CurrentUser('userId') userId: number,
    @CurrentUser('role') role: string,
    @Query('classId') classId?: number,
  ) {
    const data = await this.lmsService.getProgress(userId, role, classId ? Number(classId) : undefined);
    return {
      message: 'Lấy thông tin tiến độ học tập thành công.',
      data,
    };
  }
  @Get('my-courses')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách khóa học và tiến độ tổng thể của học viên' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách khóa học thành công.' })
  async getMyCourses(@CurrentUser('userId') studentId: number) {
    const data = await this.lmsService.getMyCourses(studentId);
    return {
      message: 'Lấy danh sách khóa học thành công.',
      data,
    };
  }

  @Get('courses/:classId/curriculum')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiOperation({ summary: 'Lấy cây cấu trúc bài học (chương, bài, tiến độ, bài kiểm tra) cho lớp học' })
  @ApiResponse({ status: 200, description: 'Lấy cây bài giảng thành công.' })
  async getCourseCurriculum(
    @CurrentUser('userId') studentId: number,
    @Param('classId') classId: number,
  ) {
    const data = await this.lmsService.getCourseCurriculum(studentId, Number(classId));
    return {
      message: 'Lấy cây bài giảng thành công.',
      data,
    };
  }

  @Get('student-profile')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiOperation({ summary: 'Lấy hồ sơ cá nhân và danh sách lớp học của học viên (Read-Only)' })
  @ApiResponse({ status: 200, description: 'Lấy hồ sơ học viên thành công.' })
  async getStudentProfile(@CurrentUser('userId') studentId: number) {
    const data = await this.lmsService.getStudentProfile(studentId);
    return {
      message: 'Lấy thông tin hồ sơ học viên thành công.',
      data,
    };
  }
  @Post('change-password')
  @ApiOperation({ summary: 'fn_manage_profile_and_password - Đổi mật khẩu tài khoản' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công.' })
  async changePassword(
    @CurrentUser('userId') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.lmsService.changePassword(userId, dto);
    return {
      message: 'Đổi mật khẩu thành công.',
      data: null,
    };
  }
}
