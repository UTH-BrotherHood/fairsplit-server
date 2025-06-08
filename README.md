# FairSplit - Shared Shopping List Application

Ứng dụng quản lý và chia sẻ danh sách mua sắm.

## Yêu cầu hệ thống

- Node.js (phiên bản 18 trở lên)
- pnpm
- Docker và Docker Compose
- MongoDB

## Hướng dẫn cài đặt

### 1. Clone dự án

```bash
git clone <repository-url>
cd sharing-shopping-list
```

### 2. Cài đặt dependencies

```bash
# Cài đặt các package dependencies bằng pnpm
pnpm install
```

### 3. Cấu hình môi trường

Tạo file `.env` trong thư mục gốc của dự án với các biến môi trường sau:

```env
# MongoDB
MONGODB_URI=mongodb://your-mongodb-uri

# Redis
REDIS_PASSWORD=FairSplit123

# Server
PORT=8080
NODE_ENV=development

# Các biến môi trường khác nếu cần
```

### 4. Khởi động dự án với Docker

```bash
# Build và khởi động các container
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f

# Dừng các container
docker-compose down
```

Sau khi khởi động thành công:
- Backend API sẽ chạy tại: http://localhost:8080
- Redis sẽ chạy tại port: 6379

### 5. Khởi động dự án trong môi trường development (không dùng Docker)

```bash
# Chạy ở chế độ development
pnpm run dev

# Hoặc build và chạy ở chế độ production
pnpm run build
pnpm run start
```

## Cấu trúc Docker

Dự án sử dụng hai container chính:
1. **Backend (Node.js)**: Chạy server API
2. **Redis**: Sử dụng làm cache và quản lý phiên

## Kiểm tra trạng thái

- API Health Check: http://localhost:8080/api/v1/health
- Redis Health Check: Tự động kiểm tra mỗi 30 giây

## Lưu ý

- Đảm bảo các port 8080 và 6379 không bị sử dụng bởi ứng dụng khác
- Trong môi trường development, source code được mount vào container để hỗ trợ hot-reload
- Redis data được persist thông qua volume `redis-data`

## Troubleshooting

Nếu gặp vấn đề, bạn có thể thử các bước sau:

1. Kiểm tra logs:
```bash
docker-compose logs -f
```

2. Restart các services:
```bash
docker-compose restart
```

3. Rebuild và khởi động lại:
```bash
docker-compose down
docker-compose up -d --build
``` 