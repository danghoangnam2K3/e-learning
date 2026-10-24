import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';

@ApiTags('7. Báo cáo & Thống kê (REPORT_MOD)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TEACHER)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('courses-overview')
  @ApiOperation({
    summary: 'fn_course_overview_report - Báo cáo tổng quan khóa học, lớp học và tỷ lệ hoàn thành',
  })
  @ApiQuery({ name: 'courseId', required: false, description: 'Lọc theo mã khóa học', type: Number })
  @ApiQuery({ name: 'classId', required: false, description: 'Lọc theo mã lớp học', type: Number })
  @ApiResponse({ status: 200, description: 'Báo cáo tổng quan khóa học.' })
  async getCourseOverview(
    @Query('courseId') courseId?: number,
    @Query('classId') classId?: number,
  ) {
    const data = await this.reportsService.getCourseOverviewReport(
      courseId ? Number(courseId) : undefined,
      classId ? Number(classId) : undefined,
    );
    return {
      message: 'Xuất báo cáo tổng quan thành công.',
      data,
    };
  }

  @Get('students/:studentId')
  @ApiOperation({
    summary: 'fn_detailed_student_report - Báo cáo chi tiết tiến trình học tập của một học viên',
  })
  @ApiParam({ name: 'studentId', description: 'Mã học viên (MaNguoiDung)' })
  @ApiResponse({ status: 200, description: 'Báo cáo chi tiết các bài học và tổng giờ tích lũy của học viên.' })
  async getStudentReport(@Param('studentId', ParseIntPipe) studentId: number) {
    const data = await this.reportsService.getStudentDetailedReport(studentId);
    return {
      message: 'Xuất báo cáo chi tiết học viên thành công.',
      data,
    };
  }
}
