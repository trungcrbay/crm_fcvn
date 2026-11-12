# TỔNG KẾT KAFKA TRONG NESTJS

- **Tư duy thiết kế:** Giao tiếp bất đồng bộ tách rời các service (A phát sự kiện rồi đi tiếp, B sập không kéo A theo), đổi lại hệ thống phải chấp nhận **Eventual Consistency** (nhất quán cuối cùng) và độ trễ nghiệp vụ.
- **Bộ tứ cốt lõi:** Nắm vững Topic, Partition, Consumer Group và Offset; luôn nhớ thứ tự chỉ được đảm bảo trong một Partition, nên bắt buộc phải dùng key hợp lý (vd: `orderId`) để gom các message liên quan vào chung một Partition.
- **Cấu hình NestJS:** Dùng `ClientsModule` + `emit()` cho Producer (bên gửi), dùng `createMicroservice` + `@EventPattern` cho Consumer (bên nhận); nhớ `connect()` trong `onModuleInit`, bật `ValidationPipe` và tuyệt đối không gọi `subscribeToResponseOf()` cho luồng emit một chiều.
- **Vận hành Production:** Để sống chung với cơ chế "at-least-once delivery" (giao ít nhất 1 lần, có thể trùng), bắt buộc phải có **Retry + Backoff** (thử lại có giãn cách), **DLQ** (hàng đợi chứa message lỗi) và **Idempotency** (xử lý trùng không gây hậu quả).
