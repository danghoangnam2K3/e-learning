import {
  Controller,
  Get,
  Query,
  Param,
  Res,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
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

  @Get('course-detail/:classId')
  @ApiOperation({
    summary: 'fn_course_class_report - Báo cáo chi tiết từng học viên trong lớp theo 8 môn học chuẩn',
  })
  @ApiParam({ name: 'classId', description: 'Mã lớp học (MaLopHoc)' })
  @ApiResponse({ status: 200, description: 'Chi tiết toàn bộ học viên theo 8 môn học.' })
  async getCourseClassDetail(@Param('classId', ParseIntPipe) classId: number) {
    const data = await this.reportsService.getCourseClassReport(classId);
    return {
      message: 'Lấy báo cáo chi tiết khóa học thành công.',
      data,
    };
  }

  @Get('export-course-excel/:classId')
  @ApiOperation({
    summary: 'fn_export_course_excel - Xuất file Excel Báo cáo khóa học (.xlsx) chuẩn Sở GTVT',
  })
  @ApiParam({ name: 'classId', description: 'Mã lớp học (MaLopHoc)' })
  async exportCourseExcel(
    @Param('classId', ParseIntPipe) classId: number,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportCourseReportExcel(classId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Bao_cao_khoa_hoc_lop_${classId}.xlsx"`,
    );
    res.send(buffer);
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

  @Get('export-student-doc/:studentId')
  @ApiOperation({
    summary: 'fn_export_student_doc - Xuất file Word Báo cáo quá trình đào tạo học viên (.docx) chuẩn',
  })
  @ApiParam({ name: 'studentId', description: 'Mã học viên (MaNguoiDung)' })
  async exportStudentDocx(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportStudentReportDocx(studentId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Bao_cao_chi_tiet_hoc_vien_${studentId}.docx"`,
    );
    res.send(buffer);
  }
}
