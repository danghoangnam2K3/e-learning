import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const dataSource = app.get(DataSource);
  
  console.log('1. Đang tạo Covering Index cho bảng NguoiDung...');
  await dataSource.query(`
    SET QUOTED_IDENTIFIER ON;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_NguoiDung_PhanTrang_Covering' AND object_id = OBJECT_ID('dbo.NguoiDung'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_NguoiDung_PhanTrang_Covering 
        ON dbo.NguoiDung (MaVaiTro, TrangThai, NgayTao DESC)
        INCLUDE (TenDangNhap, HoVaTen, SoCCCD, SoDienThoai, Email)
        WHERE DaXoa = 0;
    END
  `);
  console.log('   ✓ Đã tạo IX_NguoiDung_PhanTrang_Covering thành công.');

  console.log('2. Đang tạo Covering Index cho bảng LopHoc...');
  await dataSource.query(`
    SET QUOTED_IDENTIFIER ON;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LopHoc_Covering' AND object_id = OBJECT_ID('dbo.LopHoc'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_LopHoc_Covering 
        ON dbo.LopHoc (MaKhoaHoc, MaGiaoVienPhuTrach, NgayKhaiGiang)
        INCLUDE (MaLopHocCode, TenLopHoc, NgayBeGiang, TrangThai)
        WHERE DaXoa = 0;
    END
  `);
  console.log('   ✓ Đã tạo IX_LopHoc_Covering thành công.');

  console.log('3. Đang tạo Composite Index cho bảng TienDoHocTap...');
  await dataSource.query(`
    SET QUOTED_IDENTIFIER ON;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TienDoHocTap_Lookup' AND object_id = OBJECT_ID('dbo.TienDoHocTap'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_TienDoHocTap_Lookup 
        ON dbo.TienDoHocTap (MaHocVien, MaBaiGiang)
        INCLUDE (ThoiGianHocGiay, DaHoanThanh, LanHocCuoi);
    END
  `);
  console.log('   ✓ Đã tạo IX_TienDoHocTap_Lookup thành công.');

  console.log('4. Kiểm tra trạng thái RCSI (Read Committed Snapshot Isolation)...');
  const rcsiStatus = await dataSource.query(`
    SELECT is_read_committed_snapshot_on 
    FROM sys.databases 
    WHERE name = DB_NAME();
  `);
  console.log('   ✓ RCSI Status:', rcsiStatus[0]?.is_read_committed_snapshot_on ? 'ĐÃ BẬT (1)' : 'CHƯA BẬT (0)');

  await app.close();
  console.log('>>> TOÀN BỘ INDEXES GIAI ĐOẠN 2 ĐÃ ĐƯỢC TỐI ƯU THÀNH CÔNG! <<<');
  process.exit(0);
}

run().catch((err) => {
  console.error('Lỗi khi tối ưu DB:', err);
  process.exit(1);
});
