import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('5. Quản lý Khóa học & Lớp học thực tế (CLASS_MOD)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'Lấy danh sách khóa học thực tế (Admin xem tất cả, Giáo viên xem lớp được phân công)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách lớp học và sĩ số học viên.' })
  async getClasses(
    @CurrentUser('userId') userId: number,
    @CurrentUser('role') role: string,
  ) {
    const data = await this.classesService.getClasses(userId, role);
    return {
      message: 'Lấy danh sách khóa học thành công.',
      data,
    };
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Thêm mới khóa học thực tế (Chỉ Admin)' })
  @ApiResponse({ status: 201, description: 'Tạo khóa học thành công.' })
  async createClass(@Body() dto: CreateClassDto) {
    const data = await this.classesService.createClass(dto);
    return {
      message: 'Tạo khóa học thành công.',
      data,
    };
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cập nhật thông tin khóa học (Chỉ Admin)' })
  @ApiParam({ name: 'id', description: 'Mã lớp / khóa học (MaLopHoc)' })
  async updateClass(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClassDto,
  ) {
    const data = await this.classesService.updateClass(id, dto);
    return {
      message: 'Cập nhật thông tin khóa học thành công.',
      data,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Xóa khóa học (Chỉ Admin)' })
  @ApiParam({ name: 'id', description: 'Mã lớp / khóa học (MaLopHoc)' })
  async deleteClass(@Param('id', ParseIntPipe) id: number) {
    const data = await this.classesService.deleteClass(id);
    return {
      message: 'Xóa khóa học thành công.',
      data,
    };
  }

  @Patch(':id/assign-teacher')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Phân công giáo viên phụ trách lớp học' })
  @ApiParam({ name: 'id', description: 'Mã lớp học (MaLopHoc)' })
  async assignTeacher(
    @Param('id', ParseIntPipe) classId: number,
    @Body() dto: AssignTeacherDto,
  ) {
    const data = await this.classesService.assignTeacher(classId, dto.maGiaoVienPhuTrach);
    return {
      message: 'Phân công giáo viên phụ trách thành công.',
      data,
    };
  }

  @Get(':id/students')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Xem danh sách học viên của một lớp học' })
  @ApiParam({ name: 'id', description: 'Mã lớp học (MaLopHoc)' })
  async getClassStudents(@Param('id', ParseIntPipe) classId: number) {
    const data = await this.classesService.getClassStudents(classId);
    return {
      message: 'Lấy danh sách học viên của lớp thành công.',
      data,
    };
  }
}
