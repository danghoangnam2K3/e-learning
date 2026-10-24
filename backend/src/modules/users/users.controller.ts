import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('3. Quản lý Người dùng & Nhân sự (USER_MOD)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'fn_manage_users_crud - Lấy danh sách người dùng có phân trang, lọc theo vai trò/trạng thái, tìm kiếm và sắp xếp',
  })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng và metadata phân trang.' })
  async getUsers(@Query() query: QueryUserDto) {
    const result = await this.usersService.getUsersPaged(query);
    return {
      message: 'Lấy danh sách người dùng thành công.',
      data: result,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Thêm mới người dùng (Giáo viên, Nhân sự hoặc Học viên)' })
  @ApiResponse({ status: 201, description: 'Tạo tài khoản thành công.' })
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.usersService.createUser(dto, executorId);
    return {
      message: 'Thêm mới tài khoản người dùng thành công.',
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiParam({ name: 'id', description: 'Mã người dùng (MaNguoiDung)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công.' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.usersService.updateUser(id, dto, executorId);
    return {
      message: 'Cập nhật thông tin người dùng thành công.',
      data,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Khóa hoặc Kích hoạt trạng thái tài khoản người dùng' })
  @ApiParam({ name: 'id', description: 'Mã người dùng (MaNguoiDung)' })
  @ApiResponse({ status: 200, description: 'Chuyển đổi trạng thái thành công.' })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatusDto,
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.usersService.changeStatus(id, dto.trangThaiMoi, executorId);
    return {
      message: dto.trangThaiMoi
        ? 'Mở khóa tài khoản thành công.'
        : 'Khóa tài khoản thành công.',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm người dùng (Soft Delete)' })
  @ApiParam({ name: 'id', description: 'Mã người dùng (MaNguoiDung)' })
  @ApiResponse({ status: 200, description: 'Xóa mềm người dùng thành công.' })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.usersService.deleteUser(id, executorId);
    return {
      message: 'Xóa người dùng thành công.',
      data,
    };
  }

  @Post('me/avatar')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 2 * 1024 * 1024 }, // Tối đa 2MB theo skill
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/i)) {
          return cb(
            new BadRequestException('Chỉ cho phép tải lên hình ảnh định dạng JPEG, PNG hoặc WEBP.'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({
    summary: 'fn_upload_avatar - Tải lên hoặc thay đổi ảnh đại diện cá nhân cho tài khoản (Admin, Teacher, Student)',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật ảnh đại diện thành công.' })
  async uploadMyAvatar(
    @CurrentUser('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.usersService.updateAvatar(userId, file);
    return {
      message: 'Cập nhật ảnh đại diện thành công.',
      data,
    };
  }

  @Post(':id/avatar')
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/i)) {
          return cb(
            new BadRequestException('Chỉ cho phép tải lên hình ảnh định dạng JPEG, PNG hoặc WEBP.'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Quản trị viên cập nhật ảnh đại diện cho tài khoản bất kỳ' })
  @ApiParam({ name: 'id', description: 'Mã người dùng (MaNguoiDung)' })
  @ApiResponse({ status: 200, description: 'Cập nhật ảnh đại diện người dùng thành công.' })
  async uploadUserAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.usersService.updateAvatar(id, file);
    return {
      message: 'Cập nhật ảnh đại diện người dùng thành công.',
      data,
    };
  }

  @Get('me/teacher-assignments')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách các lớp học và học viên do chính giáo viên đăng nhập phụ trách' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách phân công cá nhân thành công.' })
  async getMyTeacherAssignments(@CurrentUser('userId') teacherId: number) {
    const data = await this.usersService.getTeacherAssignments(teacherId);
    return {
      message: 'Lấy danh sách phân công của giáo viên thành công.',
      data,
    };
  }

  @Get(':id/teacher-assignments')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Lấy danh sách các lớp học và học viên do giáo viên phụ trách' })
  @ApiParam({ name: 'id', description: 'Mã giáo viên (MaNguoiDung)' })
  @ApiResponse({ status: 200, description: 'Danh sách lớp và học viên phụ trách thành công.' })
  async getTeacherAssignments(@Param('id', ParseIntPipe) id: number) {
    const data = await this.usersService.getTeacherAssignments(id);
    return {
      message: 'Lấy danh sách phân công của giáo viên thành công.',
      data,
    };
  }
}
