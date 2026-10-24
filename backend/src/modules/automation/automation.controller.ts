import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { AutomationService } from './automation.service';
import { ImportStudentsDto } from './dto/import-students.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('2. Tự động hóa Dữ liệu (AUTO_MOD)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('import-students')
  @ApiOperation({
    summary: 'Nhập danh sách học viên hàng loạt từ JSON, tự động tạo tài khoản và gán toàn bộ lộ trình bài giảng',
  })
  @ApiResponse({ status: 201, description: 'Nhập học viên và khởi tạo lộ trình học tập thành công.' })
  async importStudentsFromJson(
    @Body() dto: ImportStudentsDto,
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.automationService.importStudentsFromJson(dto, executorId);
    return {
      message: 'Nhập dữ liệu học viên hàng loạt thành công.',
      data,
    };
  }

  @Post('upload-report')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'fn_upload_and_parse_report - Tải lên tệp báo cáo chuẩn XML / Excel để tự động phân tích và import',
  })
  @ApiQuery({ name: 'classId', description: 'Mã lớp học (không bắt buộc đối với Báo cáo 1 XML)', required: false, type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Tệp báo cáo chuẩn dạng .xlsx, .xls hoặc .xml',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Bóc tách tệp thành công, tài khoản và lộ trình học đã được gán.' })
  async uploadReport(
    @UploadedFile() file: Express.Multer.File,
    @Query('classId') classIdStr: string | undefined,
    @CurrentUser('userId') executorId: number,
  ) {
    const classId = classIdStr ? parseInt(classIdStr, 10) : undefined;
    const data = await this.automationService.importStudentsFromFile(file, classId, executorId);
    return {
      message: 'Tải lên và xử lý tệp báo cáo tự động thành công.',
      data,
    };
  }

  @Post('preview-teacher-assign')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Xem trước và kiểm tra đối soát danh sách phân công giáo viên từ tệp Excel',
  })
  @ApiQuery({ name: 'classId', description: 'Mã lớp học cần phân công', required: true, type: Number })
  async previewTeacherAssign(
    @UploadedFile() file: Express.Multer.File,
    @Query('classId', ParseIntPipe) classId: number,
  ) {
    const data = await this.automationService.previewTeacherAssignment(file, classId);
    return {
      message: 'Đối soát file phân công giáo viên thành công.',
      data,
    };
  }

  @Post('assign-teachers-excel')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Thực thi tự động phân công giáo viên từ tệp Excel và lưu vào CSDL',
  })
  @ApiQuery({ name: 'classId', description: 'Mã lớp học cần phân công', required: true, type: Number })
  async assignTeachersExcel(
    @UploadedFile() file: Express.Multer.File,
    @Query('classId', ParseIntPipe) classId: number,
    @CurrentUser('userId') executorId: number,
  ) {
    const data = await this.automationService.assignTeachersFromExcel(file, classId, executorId);
    return {
      message: 'Tự động phân công giáo viên theo Excel thành công.',
      data,
    };
  }
}

