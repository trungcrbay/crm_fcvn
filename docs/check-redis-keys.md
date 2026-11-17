# Hướng dẫn kiểm tra Key trong Redis Cluster

Tài liệu này hướng dẫn cách kiểm tra danh sách key, xem giá trị và TTL đang lưu trong Redis Cluster của dự án.

---

## 1. Lưu ý quan trọng về Redis Cluster

Trong Redis Cluster, dữ liệu được băm (hash slots) và phân bổ trên nhiều node (`redis-node-1:6379`, `redis-node-2:6380`, `redis-node-3:6381`).
Khi dùng `redis-cli`, bạn bắt buộc phải thêm cờ `-c` (cluster mode) để client tự động redirect sang đúng node chứa key.

---

## 2. Kiểm tra danh sách Key

### Cách 1: Quét toàn bộ key trên tất cả các node trong cụm (Khuyên dùng)

Chạy lệnh từ máy host để yêu cầu Redis Cluster gọi lệnh `KEYS` trên mọi node:

```bash
docker compose exec redis-node-1 redis-cli --cluster call redis-node-1:6379 keys "*"
```

### Cách 2: Tìm key theo tiền tố (Prefix / Pattern)

Ví dụ tìm các key liên quan đến roles, tag hoặc idempotency:

```bash
# Tìm key danh sách quyền/vai trò
docker compose exec redis-node-1 redis-cli --cluster call redis-node-1:6379 keys "roles:*"

# Tìm key được gắn tag
docker compose exec redis-node-1 redis-cli --cluster call redis-node-1:6379 keys "tag:*"

# Tìm key khóa idempotency
docker compose exec redis-node-1 redis-cli --cluster call redis-node-1:6379 keys "idempotency:*"
```

---

## 3. Xem chi tiết nội dung và TTL của Key

### Bước 1: Mở giao diện dòng lệnh `redis-cli` với cờ `-c`

```bash
docker compose exec redis-node-1 redis-cli -c -p 6379
```

_(Nhờ có cờ `-c`, nếu key bạn tìm nằm ở node 2 hoặc node 3, terminal sẽ tự động chuyển hướng sang node đó thay vì báo lỗi MOVED)._

### Bước 2: Thực hiện các câu lệnh kiểm tra

```redis
# 1. Kiểm tra kiểu dữ liệu của key (string, set, hash, list...)
TYPE roles:list

# 2. Đọc giá trị của key (đối với kiểu string/JSON)
GET roles:list

# 3. Kiểm tra thời gian sống còn lại của key (TTL - tính theo giây)
# Kết quả: số dương (số giây còn lại), -1 (không bao giờ hết hạn), -2 (key không tồn tại)
TTL roles:list

# 4. Kiểm tra TTL theo mili-giây
PTTL roles:list

# 5. Thoát redis-cli
exit
```

---

## 4. Dùng công cụ trực quan (GUI - Redis Insight)

Nếu muốn xem trực quan trên giao diện:

1. Tải và cài đặt phần mềm miễn phí **Redis Insight** từ trang chủ Redis.
2. Chọn **Add Redis Database** -> chọn chế độ **Cluster**.
3. Nhập Host: `localhost`, Port: `6379`.
4. Redis Insight sẽ tự động quét toàn bộ 3 nodes và hiển thị đầy đủ danh sách key, dung lượng bộ nhớ và TTL theo dạng đồ họa.
