### Lỗi khi set key:

## Lỗi 1: Rò rỉ dữ liệu (Data Leakage) - Cực kỳ nguy hiểm

```ts
const cacheKey = `${CACHE_KEY_CUSTOMERS_LIST}-${query.page}-${query.limit}`;
```

# Kịch bản

- User A (là nhân viên sale, chỉ có 10 khách) gọi API: GET /customers?page=1&limit=10. Hệ thống lưu cache key customers-list-1-10.
- User B (là Manager, có 1000 khách) gọi API: GET /customers?page=1&limit=10.
- Hệ thống thấy key customers-list-1-10 đã có sẵn trong Redis (do User A vừa lưu), nó trả ngay dữ liệu của User A cho User B.
  -> ➡️ Hậu quả: Manager đăng nhập lại chỉ thấy đúng 10 khách hàng (của User A) và không thể quản lý được ai khác. Tương tự, nếu User A tìm kiếm theo tên "Nam" và lưu cache, User B tìm kiếm tên "Bắc" cũng sẽ nhận được kết quả tên "Nam".

## Lỗi 2: Gọi tagKey bừa bãi làm hỏng logic xóa cache

Đang gọi tagKey trước cả khi kiểm tra xem dữ liệu đã có trong cache hay chưa:

```ts
await this.cacheService.tagKey(cacheKey, ['customers-list']);
```

# Kịch bản

- Mỗi khi có 1 request GET /customers gọi đến, code của bạn lại thực hiện một lệnh GET (để đọc danh sách tag) và một lệnh SET (để ghi đè danh sách tag vào Redis). Dù request đó lấy dữ liệu từ Cache (Cache Hit) hay từ DB (Cache Miss), nó đều ghi lại tag. Việc này vô tình tạo ra hàng ngàn thao tác ghi (Write) vô ích vào Redis, làm tăng nguy cơ Race Condition (như đã phân tích ở các câu trước).

## Best Practice

- Cache Key phải bao gồm TẤT CẢ các biến ảnh hưởng đến kết quả (bao gồm cả ID của user đang đăng nhập và các filter).
- Chỉ gọi tagKey khi dữ liệu thực sự được lưu vào cache (Cache Miss).

### Cache stampede

## Khái niệm

Cache stampede (còn gọi là thundering herd problem hoặc hiệu ứng bầy đàn/dẫm đạp) là hiện tượng xảy ra khi một key phổ biến (hot key) trong bộ nhớ đệm (như Redis, Memcached) hết hạn (expired) hoặc bị xoá đúng lúc hệ thống đang có lượng truy cập lớn.

Khi đó, hàng loạt request đồng thời gửi đến cùng lúc đều nhận kết quả cache miss và cùng lập tức truy vấn trực tiếp xuống database (Cơ sở dữ liệu) hoặc API gốc để lấy dữ liệu rồi ghi đè lại cache. Hành động dồn dập này khiến database bị quá tải, tăng đột biến CPU, cạn kiệt kết nối (connection pool) và có thể làm sập hệ thống.

## Nguyên nhân chính

- Key hết hạn đồng loạt: Đặt thời gian sống (TTL) của một hot key quá ngắn hoặc cố định cho nhiều dữ liệu được khởi tạo cùng lúc
- Lưu lượng truy cập cao (Traffic peak): Hàng nghìn hoặc hàng triệu người dùng cùng gửi request (ví dụ: giờ cao điểm, flash sale, thông báo mới) vào đúng mili-giây mà cache vừa biến mất.
- Độ trễ tính toán/truy vấn: Câu lệnh SQL hoặc logic tính toán dữ liệu dưới DB quá nặng, khiến request đầu tiên chưa kịp ghi ngược lại vào cache thì hàng trăm request tiếp theo đã ùa xuống.

## Cách phòng chống và khắc phục phổ biến

- Sử dụng Distributed Lock (Khóa phân tán / Mutex): Dùng lệnh khóa (như SETNX trong Redis) để chỉ cho phép duy nhất 1 request được quyền xuống database tính toán/lấy dữ liệu, các request còn lại phải đứng chờ hoặc đọc lại từ cache sau khi request đầu tiên hoàn tất
- Jitter TTL: thêm chút ngẫu nhiên vào TTL (300 + random(0..60)) để các key không hết hạn đồng loạt.
- Lock/single-flight: chỉ cho một request đi nạp DB, các request khác chờ kết quả. Có thể làm bằng SET NX trên Redis.

### Hiểu lầm thường gặp

❌ “Cache càng lâu càng tốt, TTL để 1 tuần cho chắc.”
✅ TTL dài = dữ liệu cũ lâu. TTL phải khớp tần suất thay đổi của dữ liệu: giá sản phẩm đổi theo giờ thì TTL theo phút.

❌ “Cứ KEYS product:* rồi xóa là xong, tiện mà.”
✅ KEYS block cả Redis và quét toàn bộ keyspace. Dùng SCAN hoặc tag-based. KEYS chỉ nên xuất hiện trong lúc debug thủ công.

❌ “Xóa cache trước cho chắc, rồi mới ghi DB.”
✅ Ghi DB trước, xóa cache sau. Ngược lại thì request chen giữa sẽ nạp lại dữ liệu cũ vào cache.

❌ “Redis cluster chạy MGET nhiều key thoải mái như Redis thường.”
✅ Multi-key chỉ chạy khi các key cùng slot. Dùng hash tag {...} nếu cần, không thì nhận CROSSSLOT.

❌ “Cache là nguồn sự thật, lấy từ cache ra là chuẩn.”
✅ Database mới là nguồn sự thật. Cache chỉ là bản sao có thể cũ và có thể bị xóa bất cứ lúc nào.
