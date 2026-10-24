import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('4. Quản lý Đào tạo & Khung Bài giảng (COURSE_MOD)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('curriculum/summary')
  @ApiOperation({ summary: 'Lấy bảng tổng hợp chương trình đào tạo theo từng Khóa: Khóa | Chương | Bài giảng | Giờ' })
  async getCurriculumSummary() {
    const data = await this.coursesService.getCurriculumSummary();
    return {
      message: 'Lấy bảng tổng hợp bài giảng thành công.',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'fn_manage_categories_and_curriculum - Lấy danh sách khóa học và số lượng bài giảng' })
  @ApiResponse({ status: 200, description: 'Danh sách các khóa đào tạo GPLX.' })
  async getCourses() {
    const data = await this.coursesService.getCourses();
    return {
      message: 'Lấy danh sách khóa học thành công.',
      data,
    };
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Thêm mới hạng khóa học lái xe (Chỉ dành cho Admin)' })
  @ApiResponse({ status: 201, description: 'Tạo khóa học thành công.' })
  async createCourse(
    @Body() dto: CreateCourseDto,
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.coursesService.createCourse(dto, executorId);
    return {
      message: 'Thêm mới khóa học thành công.',
      data,
    };
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cập nhật thông tin khóa học' })
  @ApiParam({ name: 'id', description: 'Mã khóa học (MaKhoaHoc)' })
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseDto,
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.coursesService.updateCourse(id, dto, executorId);
    return {
      message: 'Cập nhật khóa học thành công.',
      data,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Xóa mềm khóa học' })
  @ApiParam({ name: 'id', description: 'Mã khóa học' })
  async deleteCourse(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.coursesService.deleteCourse(id, executorId);
    return {
      message: 'Xóa khóa học thành công.',
      data,
    };
  }

  @Get(':id/lessons')
  @ApiOperation({ summary: 'Lấy danh sách bài giảng mẫu của khóa học' })
  @ApiParam({ name: 'id', description: 'Mã khóa học (MaKhoaHoc)' })
  async getLessons(@Param('id', ParseIntPipe) courseId: number) {
    const data = await this.coursesService.getLessons(courseId);
    return {
      message: 'Lấy danh sách bài giảng thành công.',
      data,
    };
  }

  @Post('lessons')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Thêm bài giảng mới vào khung chương trình đào tạo' })
  async createLesson(
    @Body() dto: CreateLessonDto,
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.coursesService.createLesson(dto, executorId);
    return {
      message: 'Thêm bài giảng thành công.',
      data,
    };
  }

  @Put('lessons/:lessonId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cập nhật bài giảng' })
  async updateLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: UpdateLessonDto,
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.coursesService.updateLesson(lessonId, dto, executorId);
    return {
      message: 'Cập nhật bài giảng thành công.',
      data,
    };
  }

  @Delete('lessons/:lessonId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Xóa bài giảng' })
  async deleteLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.coursesService.deleteLesson(lessonId, executorId);
    return {
      message: 'Xóa bài giảng thành công.',
      data,
    };
  }

  // =========================================================================
  // CHI TIẾT CHƯƠNG TRÌNH, CHƯƠNG & BÀI GIẢNG VÀ YÊU CẦU KHÓA HỌC
  // =========================================================================

  @Get(':id/curriculum/detail')
  @ApiOperation({ summary: 'Lấy chi tiết khóa học, toàn bộ chương và bài giảng từng chương' })
  @ApiParam({ name: 'id', description: 'Mã khóa học' })
  async getCurriculumDetail(@Param('id', ParseIntPipe) courseId: number) {
    const data = await this.coursesService.getCurriculumDetail(courseId);
    return {
      message: 'Lấy chi tiết chương trình đào tạo thành công.',
      data,
    };
  }

  @Post(':id/chapters')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Thêm mới chương cho khóa học' })
  async createChapter(
    @Param('id', ParseIntPipe) courseId: number,
    @Body() body: { tenChuong: string; soThuTu?: number; soGioChuan?: number; phanTramYeuCau?: number },
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.coursesService.createChapter(courseId, body, executorId);
    return {
      message: 'Thêm chương mới thành công.',
      data,
    };
  }

  @Put('chapters/:chapterId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Chỉnh sửa chương' })
  async updateChapter(
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Body() body: { tenChuong: string; soThuTu?: number; soGioChuan?: number; phanTramYeuCau?: number },
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.coursesService.updateChapter(chapterId, body, executorId);
    return {
      message: 'Cập nhật chương thành công.',
      data,
    };
  }

  @Delete('chapters/:chapterId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Xóa chương' })
  async deleteChapter(
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.coursesService.deleteChapter(chapterId, executorId);
    return {
      message: 'Xóa chương thành công.',
      data,
    };
  }

  @Post(':id/chapters/:chapterId/lessons')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Thêm bài giảng vào một chương cụ thể' })
  async createLessonInChapter(
    @Param('id', ParseIntPipe) courseId: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Body() body: { tenBaiGiang: string; soThuTu?: number; thoiLuongPhut?: number; duongDanVideo?: string; taiLieuDinhKem?: string },
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.coursesService.createLessonInChapter(chapterId, courseId, body, executorId);
    return {
      message: 'Thêm bài giảng vào chương thành công.',
      data,
    };
  }

  @Put(':id/requirement')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cập nhật yêu cầu đào tạo của khóa học (tổng số giờ, mô tả...)' })
  async updateCourseRequirement(
    @Param('id', ParseIntPipe) courseId: number,
    @Body() body: { tongSoGioLyThuyet?: number; moTa?: string },
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.coursesService.updateCourseRequirement(courseId, body, executorId);
    return {
      message: 'Cập nhật yêu cầu khóa học thành công.',
      data,
    };
  }
}
