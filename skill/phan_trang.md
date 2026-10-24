# Tài liệu Quy chuẩn Giao diện Danh sách: Sắp xếp, Lọc và Phân trang (UI/UX & Technical Specification)

Tài liệu này định nghĩa tiêu chuẩn chung cho **mọi trang danh sách (List Pages)** trong hệ thống, đảm bảo tính đồng bộ, chuyên nghiệp và trải nghiệm người dùng tối ưu.

---

## 1. Mục tiêu Yêu cầu
Mỗi trang danh sách trong ứng dụng (Quản lý học viên, Quản lý giáo viên, Quản lý khóa học, Hóa đơn, v.v.) bắt buộc phải có đầy đủ 3 thành phần cốt lõi:
1. **Thanh công cụ lọc và tìm kiếm** (Search & Filter Toolbar).
2. **Bảng dữ liệu thông minh với tính năng sắp xếp tại cột** (Interactive Sortable Data Table).
3. **Thanh phân trang chuyên nghiệp** (Pagination Footer).

---

## 2. Chi tiết Thành phần & Hành vi (Behavior)

### 2.1. Tiêu đề Cột & Tính năng Sắp xếp (Column Sorting)
* **Biểu tượng (Icons):** Các tiêu đề cột có hỗ trợ sắp xếp phải hiển thị biểu tượng trạng thái trực quan bên cạnh tên cột (Ví dụ: mặc định hiển thị biểu tượng hai chiều `↕`, khi sắp xếp hiển thị mũi tên lên `🔼` hoặc xuống `🔽`).
* **Hành vi khi người dùng click vào tiêu đề cột:**
  * **Click lần 1:** Sắp xếp dữ liệu theo chiều **tăng dần** (Ascending: A-Z, Số nhỏ đến lớn, Ngày cũ đến mới). Biểu tượng chuyển thành `🔼`.
  * **Click lần 2:** Sắp xếp dữ liệu theo chiều **giảm dần** (Descending: Z-A, Số lớn đến nhỏ, Ngày mới đến cũ). Biểu tượng chuyển thành `🔽`.
  * **Click lần 3:** Hủy sắp xếp, đưa bảng về **trạng thái mặc định ban đầu** (Default order).

### 2.2. Thanh công cụ Lọc và Tìm kiếm (Filter & Search)
* **Ô tìm kiếm toàn cục (Global Search):** Cho phép gõ từ khóa tìm kiếm nhanh với độ trễ (Debounce ~300ms) để không gây quá tải cho server.
* **Bộ lọc nâng cao (Dropdown Filters):** Các dropdown chọn trạng thái, nhóm dữ liệu hoặc khoảng thời gian đặc thù của bảng đó.
* **Nút chức năng:** Nút "Lọc", nút "Làm mới" (Reset bộ lọc về mặc định) và nút thêm mới dữ liệu.

### 2.3. Khu vực Phân trang (Pagination Footer)
Phải được bố trí ở góc dưới cùng của bảng, chia làm 2 phần cân đối:
* **Bên trái:** 
  * Hiển thị thông tin trực quan: *"Hiển thị [X] đến [Y] của tổng số [Z] bản ghi"*.
  * Dropdown cho phép người dùng chủ động thay đổi số dòng hiển thị trên một trang (Tùy chọn: `10`, `20`, `50`, `100` dòng/trang).
* **Bên phải:** Hệ thống nút chuyển trang gồm:
  * Nút về trang đầu (`<<`) và trang trước (`<`).
  * Các nút số trang rút gọn (Ví dụ: `1`, `2`, `3`, `...`, `10`).
  * Nút trang sau (`>`) và trang cuối (`>>`).
  * Nút chuyển trang bị mờ (Disabled) khi đang ở trang đầu tiên hoặc trang cuối cùng.

---

## 3. Yêu cầu Kỹ thuật (Backend & Frontend Implementation)

### A. Phía Backend (API chuẩn hóa)
API trả về danh sách phải chấp nhận các Query Parameters chuẩn sau:
* `page`: Số trang hiện tại (Mặc định: `1`).
* `limit`: Số bản ghi trên 1 trang (Mặc định: `10`).
* `sortBy`: Tên trường cần sắp xếp (Ví dụ: `fullName`, `createdAt`, `status`).
* `sortOrder`: Chiều sắp xếp (`asc` hoặc `desc`).
* `search`: Từ khóa tìm kiếm.
* Các tham số lọc phụ khác (Ví dụ: `status=active`).

**Cấu trúc dữ liệu JSON trả về chuẩn:**
```json
{
  "data": [
    /* Mảng danh sách bản ghi */
  ],
  "meta": {
    "total": 120,          // Tổng số bản ghi thực tế trong Database
    "page": 1,             // Trang hiện tại
    "limit": 10,           // Số bản ghi mỗi trang
    "totalPages": 12       // Tổng số trang
  }
}