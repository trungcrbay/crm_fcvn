# No Mistakes - Workflow & Usage Guide

- **Tác giả:** Kun Chen
- **Repository gốc:** [https://github.com/kunchenguid/no-mistakes](https://github.com/kunchenguid/no-mistakes)
- **Tài liệu chính thức:** [https://kunchenguid.github.io/no-mistakes/](https://kunchenguid.github.io/no-mistakes/)

---

## 1. Mục đích

**No Mistakes** là một Git quality gate dành riêng cho quy trình phát triển phần mềm có sự tham gia của AI.

### Mục tiêu chính

- **Review code bằng AI:** Phân tích logic và các thay đổi tiềm ẩn rủi ro.
- **Chạy test:** Đảm bảo test suite luôn vượt qua trước khi code rời máy local.
- **Kiểm tra documentation:** Đảm bảo tài liệu được cập nhật tương ứng với thay đổi.
- **Chạy lint/format:** Chuẩn hóa cú pháp và format code.
- **Tự động sửa lỗi (Auto-fix):** Tự động khắc phục các lỗi mechanical/safe khi có thể.
- **Bảo vệ remote:** Chỉ cho phép đẩy lên remote khi toàn bộ kiểm tra đã PASS.
- **Tích hợp PR & CI:** Hỗ trợ tự động tạo Pull Request và theo dõi trạng thái CI.

### Cơ chế Disposable Worktree

No Mistakes chạy toàn bộ pipeline bên trong một **disposable worktree riêng biệt**. Nhờ đó, source code đang làm việc trên working tree của developer hoàn toàn không bị ảnh hưởng trực tiếp hay xung đột trong quá trình gate kiểm tra.

```text
Review ──> Test ──> Documentation ──> Lint ──> Push ──> Pull Request ──> CI
```

---

## 2. Vai trò trong workflow của project

No Mistakes đóng vai trò là một **quality gate**, hoàn toàn **không thay thế con người (developer)**:

1. **AI Agent** (Antigravity, Claude, Codex...) viết code / sửa code.
2. **Developer** chịu trách nhiệm review, kiểm tra logic và chạy test ban đầu.
3. **No Mistakes** là chốt chặn cuối cùng kiểm tra toàn diện trước khi code được đẩy lên remote.

```text
┌──────────────────────────────┐
│ Antigravity / Claude / Codex │ (Viết code / sửa code)
└──────────────┬───────────────┘
               ↓
        Developer review
               ↓
        git diff / test
               ↓
          git commit
               ↓
        ┌──────────────┐
        │ No Mistakes  │
        └──────┬───────┘
               ↓
       ┌──────────────────┐
       │ AI Review        │
       │ Tests            │
       │ Docs             │
       │ Lint / Format    │
       └────────┬─────────┘
               ↓
       ┌───────┴────────┐
       │                │
     [PASS]         [FINDING]
       │                │
       ↓                ↓
     Push        Developer xử lý
                        ↓
                  Chạy lại gate
```

---

## 3. Cài đặt (Windows)

Cài đặt thông qua PowerShell:

```powershell
irm https://raw.githubusercontent.com/kunchenguid/no-mistakes/main/docs/install.ps1 | iex
```

Kiểm tra sau khi cài đặt:

```powershell
no-mistakes --version
# Output mẫu: no-mistakes version v1.72.0 ...
```

> [!TIP]
> **Khắc phục lỗi command không nhận diện:**
> Nếu terminal hoặc IDE (Antigravity, VS Code...) đang mở trước khi cài đặt mà báo lỗi:
>
> ```text
> no-mistakes is not recognized
> ```
>
> Hãy đóng và mở lại IDE/terminal để tiến trình mới nhận diện biến môi trường `PATH` vừa cập nhật.

---

## 4. Kiểm tra môi trường (Doctor)

Di chuyển vào thư mục project và chạy chẩn đoán:

```powershell
cd C:\Users\Admin\Downloads\fcvietnam-full\crm-test\crm_fcvn
no-mistakes doctor
```

_Nếu lệnh `doctor` báo bất kỳ lỗi nào về cấu hình hoặc công cụ còn thiếu, hãy xử lý triệt để trước khi chuyển sang bước khởi tạo._

---

## 5. Khởi tạo Project (Init)

Chạy lệnh khởi tạo **một lần duy nhất** tại thư mục gốc repository:

```powershell
no-mistakes init
```

Lệnh này sẽ:

1. Thiết lập Git gate cho repository hiện tại.
2. Cài đặt skill `/no-mistakes` ở cấp độ user cho các coding agent.

Sau khi khởi tạo xong, kiểm tra lại cấu hình Git:

```powershell
git remote -v
git status
```

---

## 6. Workflow sử dụng hằng ngày (Từng bước chi tiết)

### Bước 1 — AI coding

Yêu cầu agent (Antigravity, Claude, Codex...) thực hiện tính năng:

> _Ví dụ:_ `"Implement customer credit limit validation."`

### Bước 2 — Developer tự review

Không chạy gate ngay lập tức. Developer cần chủ động kiểm tra lại các thay đổi:

```powershell
git status
git diff
git diff --stat
```

### Bước 3 — Chạy test cơ bản

Thực hiện các lệnh kiểm tra theo chuẩn của project (ví dụ với Node/NestJS):

```powershell
npm test          # hoặc npm run test:e2e
npm run lint      # kiểm tra lint
npm run build     # kiểm tra build/compile
```

_(Lưu ý: Không bắt buộc phải chạy đúng các lệnh trên, hãy dùng lệnh tương ứng được định nghĩa trong project)._

### Bước 4 — Commit code

Khi các thay đổi đã được kiểm tra và đảm bảo hợp lý:

```powershell
git add .
git commit -m "feat: add customer credit limit"
git status
```

---

## 7. Các cách kích hoạt No Mistakes

Có 3 cách chính để trigger No Mistakes:

### Cách 1: Git Push Gate (Khuyến nghị & Git-native)

Đẩy code qua remote gate đã được cấu hình:

```powershell
# Đẩy branch hiện tại
git push no-mistakes

# Hoặc chỉ định rõ tên branch
git push no-mistakes <branch-name>
```

> [!IMPORTANT]
> `git push no-mistakes` **không phải** lệnh chỉ chạy kiểm tra đơn thuần. Khi pipeline PASS hoàn toàn, No Mistakes sẽ tiếp tục chuỗi hành động:
>
> ```text
> Pipeline PASS ──> Forward branch ──> Open Pull Request ──> Watch CI
> ```
>
> Vì vậy, chỉ kích hoạt khi bạn đã sẵn sàng đẩy nhánh và tạo PR.

---

### Cách 2: Giao diện dòng lệnh trực quan (TUI)

Mở giao diện TUI tương tác:

```powershell
no-mistakes
```

TUI cung cấp menu hỗ trợ: tạo branch, commit, push qua gate, theo dõi tiến trình pipeline và duyệt qua các findings.

- **Chế độ tự động hóa (-y):**
  ```powershell
  no-mistakes -y
  ```
  _(Chỉ dùng `-y` khi muốn tự động bỏ qua các bước xác nhận, không khuyến nghị nếu muốn kiểm soát chặt chẽ từng bước)._

---

### Cách 3: Agent Skill (`/no-mistakes`)

Sau khi `no-mistakes init`, agent có thể gọi slash command:

- **Chạy gate cho code sẵn có:**
  ```text
  /no-mistakes
  ```
- **Thực hiện task rồi tự động đưa qua gate:**
  ```text
  /no-mistakes implement customer credit limit validation
  ```

---

## 8. Xử lý kết quả & Findings từ Pipeline

### Phân loại Findings

| Loại Finding          | Ví dụ điển hình                                                       | Cơ chế xử lý                                                                                                 |
| :-------------------- | :-------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Safe / Mechanical** | Format code, lint đơn giản, chỉnh sửa cơ học, lỗi có cách sửa rõ ràng | Pipeline có thể tự sửa. Developer chỉ cần `git diff` kiểm tra lại diff sau khi sửa.                          |
| **Intent-sensitive**  | Logic nghiệp vụ, thay đổi hành vi API, kiến trúc, database behavior   | **Tuyệt đối không để AI tự quyết định**. Developer phải đọc, đánh giá và chủ động: **Approve / Fix / Skip**. |

### Quy trình khi No Mistakes báo FAIL

```text
No Mistakes (FAIL)
        ↓
 Đọc chi tiết finding
        ↓
 Xác định nguyên nhân gốc rễ (Root Cause)
        ↓
 Sửa code & chạy test lại
        ↓
 Commit thay đổi
        ↓
 Chạy lại No Mistakes gate
```

> [!CAUTION]
> Tuyệt đối tránh thói quen: **FAIL ──> Bỏ qua / Force ──> Push**, trừ khi bạn hiểu rõ lý do và chủ động chịu trách nhiệm về quyết định đó.

### Lưu ý quan trọng khi AI tự sửa code

Sau khi No Mistakes hoặc agent tự động sửa lỗi, hãy luôn chạy:

```powershell
git status
git diff
```

Kiểm tra kỹ các khía cạnh: **Logic nghiệp vụ, API payload/response, Database schema/query, Validation, Security, Test coverage, và các thay đổi ngoài ý muốn (unintended changes)**.
_Không bao giờ mặc định rằng: "AI sửa code thì chắc chắn đúng"._

---

## 9. Best Practices & Nguyên tắc cốt lõi

### Luôn làm việc trên Git Branch riêng

Tránh commit trực tiếp trên branch chính:

```powershell
git checkout -b feature/customer-credit-limit
# ... code ...
git status
git diff
git add .
git commit -m "feat: add customer credit limit"
# ... đưa qua No Mistakes ...
```

### No Mistakes không chỉ là Formatter hay Linter

Không đánh đồng `No Mistakes = lint`. No Mistakes bao gồm cả một chuỗi mắt xích:

```text
AI Code + Review + Tests + Docs + Lint + Git Gate + CI
```

### Không chạy gate sau mỗi dòng code nhỏ

Tránh lạm dụng gate cho từng sửa đổi vụn vặt (`edit -> gate -> edit -> gate`). Hãy gom nhóm thành một đơn vị logic hoàn chỉnh (logical change):

```text
Task ──> Code ──> Review ──> Test ──> Commit ──> No Mistakes
```

### Tương thích linh hoạt với nhiều Coding Agent

No Mistakes không phụ thuộc vào bất kỳ AI agent nào. Bạn có thể sử dụng Antigravity, Claude, Codex... Agent đóng vai trò công cụ tạo code, còn No Mistakes là chốt chặn đảm bảo chất lượng.

### No Mistakes không thay thế kiến thức Git cơ bản

Bạn vẫn cần thành thạo các thao tác Git tiêu chuẩn (`status`, `diff`, `log`, `branch`, `checkout`, `add`, `commit`, `push`). No Mistakes chỉ đóng vai trò một remote gate bổ trợ.

### Bảo mật và Độ tin cậy (Security / Trust)

No Mistakes thực thi các lệnh và agent được cấu hình cho repository. File cấu hình `.no-mistakes.yaml` phải được xem là tài nguyên tin cậy của dự án. Luôn review kỹ nội dung cấu hình, không tùy tiện chạy trên các repository không rõ nguồn gốc.

---

## 10. Cheat Sheet (Tra cứu nhanh)

```powershell
# Kiểm tra phiên bản
no-mistakes --version

# Kiểm tra môi trường & công cụ
no-mistakes doctor

# Khởi tạo gate cho repository (chạy 1 lần)
no-mistakes init

# Mở giao diện TUI tương tác
no-mistakes

# Chạy TUI ở chế độ tự động xác nhận
no-mistakes -y

# Đẩy branch hiện tại qua gate
git push no-mistakes

# Đẩy branch cụ thể qua gate
git push no-mistakes feature/my-feature
```

**Slash command cho Agent:**

- `/no-mistakes` : Chạy gate kiểm tra code hiện tại.
- `/no-mistakes <task>` : Yêu cầu agent thực hiện task và đưa qua gate.

---

## 11. Workflow tổng kết (Recommended Daily Cycle)

```text
┌─────────────────────────┐
│ 1. Nhận task            │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ 2. AI viết code         │ (Antigravity / Claude / Codex)
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ 3. Review git diff      │ (Developer chủ động kiểm tra)
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ 4. Chạy test cục bộ     │ (npm test / npm run lint)
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ 5. Commit code          │ (git commit)
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ 6. No Mistakes Gate     │ (git push no-mistakes)
│    Review / Test / Docs │
│    Lint / Auto-fix      │
└────────────┬────────────┘
             ↓
         ┌───┴───┐
         │       │
      [PASS]  [FAIL]
         │       │
         │       ↓
         │    Fix code / Findings
         │       │
         │       ↓
         │    Run gate again
         │
         ↓
┌─────────────────────────┐
│ 7. Push / PR / Watch CI │
└─────────────────────────┘
```

> **Nguyên tắc cốt lõi:**
> _"No Mistakes là lớp kiểm tra chất lượng cuối cùng trước khi code do AI tạo ra được đưa lên remote - không bao giờ thay thế quyền kiểm soát và trách nhiệm review của developer."_
