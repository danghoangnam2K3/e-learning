# TÀI LIỆU ĐẶC TẢ KỸ THUẬT: CẤU TRÚC MODULE VÀ CHỨC NĂNG HỆ THỐNG
> **Dự án:** Hệ thống Quản lý và Học trực tuyến tự động hóa cho Trung tâm Đào tạo Lái xe  
> **Mục đích tài liệu:** Cung cấp chi tiết các Module, Chức năng, Phân quyền (RBAC) và Luồng xử lý nghiệp vụ làm cơ sở cho đội ngũ lập trình viên thiết kế Database, API và Frontend.

---

## I. TỔNG QUAN CẤU TRÚC HỆ THỐNG MODULE

| STT | Tên Module | Mã Module | Mô tả tổng quan | Các Actor sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Xác thực & Phân quyền | `AUTH_MOD` | Quản lý định danh người dùng, đăng nhập, bảo mật phiên làm việc và phân quyền truy cập theo vai trò. | Admin, Giáo viên, Học viên |
| **2** | Tự động hóa Dữ liệu | `AUTO_MOD` | Xử lý tải lên và bóc tách tự động tệp báo cáo chuẩn (XML/Excel), tự động tạo tài khoản hàng loạt, khởi tạo khóa học và gán lộ trình. | Admin |
| **3** | Quản lý Người dùng | `USER_MOD` | Quản lý toàn diện hồ sơ, tài khoản nhân sự, giáo viên với các thao tác thêm, sửa, xóa, khóa trạng thái và phân quyền nội bộ. | Admin |
| **4** | Quản lý Đào tạo | `COURSE_MOD` | Định nghĩa cấu trúc chương trình đào tạo (danh mục khóa học theo hạng GPLX và bài giảng mẫu) làm cơ sở cho module tự động hóa. | Admin |
| **5** | Quản lý Lớp học & Học viên | `CLASS_MOD` | Quản lý danh sách lớp học, phân công giáo viên và quản lý danh sách học viên thuộc phạm vi phụ trách. | Admin, Giáo viên |
| **6** | Học tập trực tuyến & Quản lý cá nhân | `LMS_MOD` | Không gian học tập trực tuyến (xem bài giảng, theo dõi tiến độ cá nhân, quản lý hồ sơ, đổi mật khẩu) và theo dõi tiến độ học viên. | Admin, Giáo viên, Học viên |
| **7** | Báo cáo & Thống kê | `REPORT_MOD` | Truy xuất báo cáo tổng quan toàn hệ thống, báo cáo khóa học và báo cáo chi tiết từng học viên. | Admin |

---

## II. MÔ TẢ CHI TIẾT TỪNG MODULE VÀ CHỨC NĂNG

### 1. Module Xác thực & Phân quyền (`AUTH_MOD`)
* **Mô tả chung:** Xử lý toàn bộ yêu cầu bảo mật, định danh người dùng và kiểm soát phiên làm việc.
* **Danh sách Chức năng:**
  * **`fn_login` (Đăng nhập hệ thống):**
    * *Mô tả:* Nhận thông tin định danh (Username/Email, Password), xác thực với cơ sở dữ liệu SQL Server, trả về mã định danh phiên làm việc bảo mật (JWT Token) tương ứng với vai trò (Admin, Teacher, Student).
    * *Actor:* Admin, Giáo viên, Học viên.
  * **`fn_logout` (Đăng xuất an toàn):**
    * *Mô tả:* Hủy bỏ phiên làm việc, thu hồi token, xóa dữ liệu tạm trên client.
    * *Actor:* Admin, Giáo viên, Học viên.

### 2. Module Tự động hóa Dữ liệu (`AUTO_MOD`)
* **Mô tả chung:** Tiếp nhận file báo cáo cứng (XML/Excel) từ cơ quan quản lý/trung tâm để tự động hóa toàn bộ khâu khởi tạo dữ liệu.
* **Danh sách Chức năng:**
  * **`fn_upload_and_parse_report` (Tải lên & Bóc tách tệp tự động):**
    * *Mô tả:* Cho phép Admin upload file XML/Excel, tiến hành phân tích cú pháp ngầm, tự động tạo tài khoản hàng loạt cho học viên, đối chiếu với danh mục bài giảng tại `COURSE_MOD` để thiết lập khóa học và gán toàn bộ lộ trình học tập vào CSDL.
    * *Actor:* Admin.

### 3. Module Quản lý Người dùng (`USER_MOD`)
* **Mô tả chung:** Quản lý nhân sự nội bộ và giáo viên của trung tâm đào tạo.
* **Danh sách Chức năng:**
  * **`fn_manage_users_crud` (Quản lý nhân sự & giáo viên):**
    * *Mô tả:* Thực hiện các thao tác CRUD toàn diện: Thêm mới tài khoản kèm phân quyền, chỉnh sửa/cập nhật thông tin, khóa trạng thái tài khoản (vô hiệu hóa quyền đăng nhập) hoặc xóa vĩnh viễn tài khoản nhân sự/giáo viên không còn làm việc.
    * *Actor:* Admin.

### 4. Module Quản lý Đào tạo (`COURSE_MOD`)
* **Mô tả chung:** Xây dựng và duy trì khung chương trình học chuẩn.
* **Danh sách Chức năng:**
  * **`fn_manage_categories_and_curriculum` (Quản lý danh mục khóa học & bài giảng mẫu):**
    * *Mô tả:* Thêm, sửa, xóa hoặc cập nhật các hạng khóa học lái xe (B1, B2, C...) và cấu trúc bài giảng tiêu chuẩn. Đóng vai trò là "khung chương trình gốc" để hệ thống tự động áp vào học viên khi xử lý file báo cáo ở `AUTO_MOD`.
    * *Actor:* Admin.

### 5. Module Quản lý Lớp học & Học viên (`CLASS_MOD`)
* **Mô tả chung:** Tổ chức quản lý quy mô lớp học và phân công giảng dạy.
* **Danh sách Chức năng:**
  * **`fn_manage_classes_and_students` (Quản lý lớp học và danh sách học viên):**
    * *Mô tả:* Tra cứu danh sách các lớp học, xem thông tin chi tiết và danh sách học viên thuộc phạm vi lớp học do giáo viên phụ trách hoặc quản lý toàn cục bởi hệ thống.
    * *Actor:* Admin, Giáo viên.

### 6. Module Học tập trực tuyến & Quản lý cá nhân (`LMS_MOD`)
* **Mô tả chung:** Cung cấp nền tảng E-Learning cho học viên và công cụ giám sát học tập cho giảng viên/quản trị viên.
* **Danh sách Chức năng:**
  * **`fn_access_lms_lessons` (Học tập trực tuyến):**
    * *Mô tả:* Truy cập vào lộ trình khóa học đã được gán sẵn để xem danh mục bài giảng, video và tài liệu lý thuyết.
    * *Actor:* Học viên.
  * **`fn_track_personal_progress` (Theo dõi tiến độ học tập cá nhân):**
    * *Mô tả:* Xem tỷ lệ hoàn thành khóa học, thời gian học tích lũy và danh sách các bài học đã qua của bản thân.
    * *Actor:* Học viên.
  * **`fn_manage_profile_and_password` (Quản lý thông tin tài khoản và đổi mật khẩu):**
    * *Mô tả:* Xem thông tin hồ sơ cá nhân và thực hiện quy trình đổi mật khẩu tài khoản an toàn.
    * *Actor:* Học viên.
  * **`fn_track_all_students_progress_by_admin` (Theo dõi tiến độ học tập toàn cục của Admin):**
    * *Mô tả:* Kiểm tra tiến độ học tập, thời gian học lý thuyết và kết quả của **toàn bộ học viên** trên hệ thống.
    * *Actor:* Admin.
  * **`fn_track_assigned_students_progress_by_teacher` (Theo dõi tiến độ học viên phụ trách của Giáo viên):**
    * *Mô tả:* Kiểm tra thời gian học, kết quả học tập và tiến trình của **những học viên thuộc các lớp do mình trực tiếp phụ trách**.
    * *Actor:* Giáo viên.

### 7. Module Báo cáo & Thống kê (`REPORT_MOD`)
* **Mô tả chung:** Tổng hợp dữ liệu phục vụ công tác quản trị, ra quyết định và cấp chứng nhận.
* **Danh sách Chức năng:**
  * **`fn_course_overview_report` (Báo cáo tổng quan khóa học):**
    * *Mô tả:* Truy xuất báo cáo tổng quan về khóa học, bao gồm danh sách học viên, quá trình học và kết quả đạt được của từng khóa.
    * *Actor:* Admin.
  * **`fn_detailed_student_report` (Báo cáo chi tiết học viên):**
    * *Mô tả:* Trích xuất bảng kê chi tiết tiến trình của một học viên cụ thể (các bài đã học, tổng thời gian học tính bằng giờ, kết quả đạt được).
    * *Actor:* Admin.