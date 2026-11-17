# Hướng dẫn khởi chạy và kích hoạt Redis Cluster

## Bước 1: Khởi động các container

```bash
docker compose up -d
```

## Bước 2: Kích hoạt liên kết các node thành Cluster (Chỉ cần chạy 1 lần)

Mặc định khi bật cờ `--cluster-enabled yes`, các node chỉ mới sẵn sàng ở chế độ cluster nhưng chưa được ghép nối với nhau. Bạn hãy chạy lệnh sau để tự động phân chia 16384 hash slots và tạo cụm:

```bash
docker compose exec redis-node-1 redis-cli --cluster create redis-node-1:6379 redis-node-2:6380 redis-node-3:6381 --cluster-replicas 0 --cluster-yes
```

## Bước 3: Kiểm tra trạng thái Cluster

Chạy lệnh sau để kiểm tra trạng thái cụm:

```bash
docker compose exec redis-node-1 redis-cli -p 6379 cluster info
```

> **Lưu ý:** Nếu thấy `cluster_state:ok` và `cluster_slots_assigned:16384` nghĩa là cụm 3 node đã hoạt động thành công.
