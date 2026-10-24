# BACKEND ARCHITECTURE & TECHNICAL SPECIFICATION
# Dự án: Hệ thống Quản lý Đào tạo Lái xe & E-Learning (LMS)

---

## 1. MÔ HÌNH KIẾN TRÚC TỔNG QUAN (MVC & CLEAN ARCHITECTURE)
Dự án áp dụng mô hình phân tầng mở rộng từ mô hình **MVC (Model - View - Controller)** kết hợp **Modular Monolith / Clean Architecture** nhằm đảm bảo nguyên tắc tách bạch trách nhiệm (Separation of Concerns):
* **Model (Tầng dữ liệu / Ánh xạ):** Quản lý cấu trúc dữ liệu, ánh xạ các bảng trong cơ sở dữ liệu sang các đối tượng lập trình thông qua ORM (Sequelize). Model không chứa logic nghiệp vụ.
* **View (Tầng giao diện):** Trong kiến trúc RESTful API, tầng View được tách biệt hoàn toàn ở Frontend (React/Vite) hoặc các công cụ kiểm thử API (Postman, Swagger). Backend chỉ giao tiếp bằng định dạng dữ liệu thuần **JSON**.
* **Controller (Tầng điều phối):** Tiếp nhận HTTP Request từ Route, điều phối dữ liệu sang Service, chờ kết quả bất đồng bộ (`async/await`) và trả về HTTP Response kèm Status Code chuẩn.

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT STRUCTURE)
```text
backend-project/
├── src/
│   ├── config/          # Cấu hình kết nối cơ sở dữ liệu (Database instance)
│   ├── models/          # Ánh xạ cấu trúc bảng SQL Server sang Object (Sequelize Model)
│   ├── services/        # Chứa toàn bộ logic nghiệp vụ (Business Logic)
│   ├── controllers/     # Nhận HTTP Request, gọi Service, trả HTTP Response
│   ├── routes/          # Định nghĩa Route (HTTP Method + Path + Middleware + Controller)
│   ├── middlewares/     # Trạm kiểm soát trung gian (Authentication, Authorization, Validation, File Upload)
│   ├── validations/     # Định nghĩa Schema kiểm tra dữ liệu đầu vào (Zod / Joi)
│   └── server.ts        # Điểm khởi chạy ứng dụng (kiểm tra DB authenticate trước khi Express listen)
├── sql/                 # Các script tạo Database, Table Schema và Seed dữ liệu
├── .env                 # Biến môi trường (DB password, JWT secret)
└── openapi.yaml         # Tài liệu đặc tả API (Swagger)