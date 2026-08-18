### Vấn đề

Hiện tại Zod đang gánh luôn vai trò domain validation, trong khi đúng DDD thì Zod chỉ nên validate input shape ở boundary (transport concern), còn business invariant (email hợp lệ, phone hợp lệ, code không rỗng) phải nằm trong Value Object ở domain — để domain tự bảo vệ chính nó bất kể được gọi từ đâu.
