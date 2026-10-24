# Hướng dẫn tối ưu hóa tốc độ truy cập Cơ Sở Dữ Liệu (CSDL) qua Frontend và Backend

Tài liệu này tổng hợp các kỹ năng, kỹ thuật và best practices ở cả tầng **Backend** và **Frontend** nhằm giảm thiểu độ trễ (latency), tiết kiệm tài nguyên hệ thống và tối ưu hóa trải nghiệm người dùng khi tương tác với CSDL.

---

## 1. Tối ưu hóa từ phía Backend (Core & Database Layer)
Backend là cầu nối trực tiếp và chịu trách nhiệm xử lý logic, truy vấn CSDL. Tối ưu ở đây giải quyết đến 80% vấn đề hiệu năng gốc.

### A. Tối ưu hóa CSDL (Database Optimization)
- **Đánh chỉ mục (Database Indexing):** 
  - Tạo `Index` trên các cột thường xuyên xuất hiện trong mệnh đề `WHERE`, `JOIN`, hoặc `ORDER BY`.
  - *Lợi ích:* Giúp CSDL tìm kiếm dữ liệu qua cấu trúc cây (B-Tree) thay vì quét toàn bộ bảng (`Table Scan`).
- **Tối ưu câu lệnh truy vấn (Query Optimization):**
  - Tránh sử dụng `SELECT *`; chỉ lấy các cột thực sự cần thiết.
  - Hạn chế các câu lệnh `JOIN` quá phức tạp hoặc lồng nhau quá nhiều cấp.
  - Sử dụng `EXPLAIN` / `ANALYZE` để kiểm tra execution plan và tìm điểm nghẽn (bottleneck).
- **Phân trang dữ liệu (Pagination):**
  - Tránh trả về hàng nghìn bản ghi trong một request.
  - Sử dụng **Cursor-based Pagination** thay cho Offset-based Pagination đối với các bảng dữ liệu lớn để tránh hiệu suất suy giảm ở các trang sâu.

### B. Kiến trúc và Xử lý dữ liệu (Application Layer)
- **Hệ thống Cache (Caching Layer):**
  - Sử dụng **Redis** hoặc **Memcached** để lưu trữ các dữ liệu ít thay đổi (danh mục sản phẩm, cấu hình, token, profile user phổ biến).
  - Truy vấn dữ liệu từ RAM (Cache) trước khi chạm tới CSDL.
- **Connection Pooling:**
  - Duy trì một pool các kết nối mở sẵn đến CSDL thay vì mở/đóng kết nối mới cho mỗi HTTP request, giúp loại bỏ độ trễ do TCP handshake.
- **Batched Queries & Bulk Operations:**
  - Gộp nhiều câu lệnh insert/update thành một transaction hoặc batch duy nhất thay vì thực hiện đơn lẻ từng câu lệnh.

---

## 2. Tối ưu hóa từ phía Frontend (Client Layer & API Strategy)
Frontend không trực tiếp kết nối CSDL nhưng kiểm soát **tần suất**, **thời điểm** và **cách thức** dữ liệu được gọi qua API.

### A. Quản lý trạng thái và Cache phía Client
- **Client-side Caching:**
  - Sử dụng các thư viện quản lý server state như **React Query**, **SWR**, hoặc **RTK Query**.
  - Dữ liệu đã fetch sẽ được cache lại; khi người dùng chuyển trang qua lại, dữ liệu được lấy từ bộ nhớ tạm thay vì gọi lại API xuống CSDL.
- **Prefetching (Tải trước dữ liệu):**
  - Tải ngầm dữ liệu trước khi người dùng thực sự click vào (ví dụ: prefetch data của trang chi tiết khi user rê chuột vào card sản phẩm).

### B. Tối ưu hóa tương tác người dùng (UX & Request Control)
- **Debounce & Throttle:**
  - Áp dụng cho các ô tìm kiếm (Search bar) hoặc bộ lọc (Filters) để trì hoãn việc gọi API đến khi người dùng dừng gõ, tránh spam request xuống CSDL theo từng ký tự.
- **Optimistic Updates (Cập nhật lạc quan):**
  - Khi thực hiện thao tác ghi (như like bài viết, đổi trạng thái task), cập nhật giao diện ngay lập tức trước khi server xử lý xong CSDL, tạo cảm giác mượt mà tức thì.
- **Lazy Loading / Infinite Scroll:**
  - Chỉ tải dữ liệu khi phần tử hiển thị trong khung nhìn (Viewport) hoặc khi người dùng cuộn đến cuối trang.

---

## 3. Quy trình chẩn đoán điểm nghẽn (Debugging & Profiling)
Khi gặp sự cố chậm truy cập CSDL, quy trình chuẩn bao gồm:
1. **Kiểm tra APM (Application Performance Monitoring):** Xem API nào mất nhiều thời gian nhất.
2. **Database Profiling:** Kiểm tra các câu lệnh truy vấn chậm (Slow Query Log).
3. **Network Tab (Frontend):** Kiểm tra số lượng request thừa, kích thước payload và thời gian phản hồi (TTFB).