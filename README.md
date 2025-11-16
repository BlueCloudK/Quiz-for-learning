# 📝 Quiz Application for Learning | Ứng Dụng Quiz Học Tập

**[English](#english)** | **[Tiếng Việt](#tiếng-việt)**

---

## English

A powerful, interactive quiz application that helps you create, manage, and practice with custom quizzes. Built with HTML, CSS, and JavaScript - no installation required!

## ✨ Features

### Core Features
- **Easy Quiz Creation**: Copy-paste questions and answers in simple text format
- **Flexible Question Format**: Support for unlimited multiple choice options (a, b, c, d, e, f, ...)
- **Multiple Correct Answers**: Create questions with one or more correct answers
- **Auto-Grading**: Instant feedback with detailed results
- **Customizable Quiz**: Choose number of questions and order (sequential or random)

### Advanced Features
- **📌 Pin Questions**: Bookmark important questions for quick access
- **🔄 Retry Incorrect**: Create new quiz with only the questions you got wrong
- **🔄 Retry Pinned**: Practice your bookmarked questions
- **🔍 Filter Questions**: View all, pinned, or incorrect questions
- **🌐 Bilingual**: Switch between Vietnamese and English
- **🤖 AI Prompt Templates**: Ready-to-use prompts for ChatGPT, Claude, and other AI chatbots to generate questions automatically
- **💾 LocalStorage Auto-Save**: Automatically saves your questions, answers, language preference, and pinned questions
- **🌙 Dark Mode**: Toggle between light and dark themes with persistent preference
- **⏱️ Exam Mode**: Timed quiz mode with countdown timer and auto-submit when time expires
- **📚 Quiz Management**: Save and load multiple quiz sets with custom names
- **📊 Statistics Dashboard**: Track your quiz history with detailed statistics and performance analytics
- **📁 Import/Export**: Import questions and answers from Excel (.xlsx, .xls), Word (.docx), or Text (.txt) files, and export to Excel or Text format

### User Interface
- Beautiful gradient design
- Responsive layout (mobile-friendly)
- Real-time visual feedback
- Smooth animations and transitions

## 🚀 Getting Started

1. Open `index.html` in your web browser
2. That's it! No installation needed.

## 📖 How to Use

### Quick Start with AI (Recommended for Beginners)

**NEW!** Don't want to write questions manually? Use our AI prompt templates:

1. Click on "🤖 Generate Questions With AI Chatbot" section at the top
2. Choose a template that matches your needs:
   - 📚 General Topic Quiz
   - 🎓 Exam Review
   - 💡 Multiple Correct Answers
   - 🌍 Language Learning
   - 🧪 Science & Technology
3. Click "Copy" button
4. Open ChatGPT, Claude, or any AI chatbot
5. Paste the prompt and replace [TOPIC] with your subject
6. Copy the AI's response back into the quiz app
7. Done! Your quiz is ready

### Manual Input Method

**Quick Copy Templates** - Copy these ready-to-use templates:

<details>
<summary><b>📋 Click to expand: Questions Template (Copy & Paste Ready)</b></summary>

```
1. Câu hỏi thứ nhất?
a. Đáp án A
b. Đáp án B
c. Đáp án C
d. Đáp án D

2. Câu hỏi thứ hai?
a. Đáp án A
b. Đáp án B
c. Đáp án C
d. Đáp án D

3. Câu hỏi thứ ba (nhiều đáp án đúng)?
a. Lựa chọn A
b. Lựa chọn B
c. Lựa chọn C
d. Lựa chọn D
e. Lựa chọn E
```
</details>

<details>
<summary><b>📋 Click to expand: Answers Template (Copy & Paste Ready)</b></summary>

```
1. a
2. b
3. a,c,e
```
</details>

---

### Step 1: Input Questions and Answers

**Question Format 1 (Standard):**
```
1. What is the capital of France?
a. London
b. Paris
c. Berlin
d. Madrid

2. Which programming languages are object-oriented? (multiple answers)
a. Python
b. JavaScript
c. Assembly
d. Java
e. C
f. Ruby
```

**Question Format 2 (With List Items):**
```
Which of the following are correct?
- 1. First item description
- 2. Second item description
- 3. Third item description
- 4. Fourth item description

A. 1, 2, 4
B. 2, 3, 4
C. 1, 3
D. All of the above
```
*Use uppercase (A, B, C, D) when referencing list items*

**Answer Format (Single Answer):**
```
1. b
```

**Answer Format (Multiple Answers):**
```
2. a,b,d,f
or
2. abdf
```

### Step 2: Create Quiz
- **Number of questions**: Enter a number to limit quiz length (leave empty for all questions)
- **Question order**: Choose "Sequential" (original order) or "Random" (shuffled order)
- Check "Shuffle questions" if you want random order (legacy option, same as Random order)
- Click "Create Quiz" button

### Step 3: Take the Quiz
- **Single answer questions**: Use radio buttons (○)
- **Multiple answer questions**: Use checkboxes (☑)
- Click 📍 to pin important questions

### Step 4: Submit and Review
- Click "Submit & Grade" to see your results
- Green = Correct ✓
- Red = Incorrect ✗
- View your score percentage and breakdown

### Step 5: Practice More
- **Retry Incorrect**: Practice only the questions you got wrong
- **Retry Pinned**: Review your bookmarked questions
- **Filter**: View specific question types
- **Reset**: Start fresh with new questions

### Step 6: Import/Export Files 📁

**NEW!** You can now import questions and answers from existing files or export them for backup/sharing.

#### Import from Files
1. Click "📁 Import from file" button next to Questions or Answers textarea
2. Select a file from your computer:
   - **Excel files** (.xlsx, .xls): First sheet will be imported
   - **Word files** (.docx): Text content will be extracted
   - **Text files** (.txt): Direct import
3. The content will automatically appear in the textarea
4. Review and edit if needed before creating quiz

#### Export to Files
1. After entering your questions or answers, click on export buttons:
   - **💾 Export TXT**: Download as plain text file
   - **💾 Export Excel**: Download as Excel spreadsheet
2. Files are saved to your Downloads folder
3. Use exported files to:
   - Backup your quiz sets
   - Share with others
   - Edit in Excel/Word for easier formatting
   - Reuse in other applications

**Supported Formats:**
- Import: Excel (.xlsx, .xls), Word (.docx), Text (.txt)
- Export: Excel (.xlsx), Text (.txt)

### Step 7: Use Other Advanced Features

#### Dark Mode 🌙
- Click the moon/sun icon (🌙/☀️) in the top-right corner to toggle dark mode
- Your preference is automatically saved

#### Save & Load Quiz Sets 💾
1. Enter a name for your quiz in "Quiz Management" section
2. Click "💾 Save Quiz Set" to save the current questions and answers
3. Click "Load" on any saved quiz to restore it
4. Click "Delete" to remove a saved quiz set

#### Exam Mode ⏱️
1. Create your quiz as normal
2. Check "Enable exam mode" checkbox
3. Set the duration in minutes (default: 30 minutes)
4. Timer starts automatically when you enable exam mode
5. Quiz auto-submits when time expires
- Timer shows warning (yellow) when ≤5 minutes remain
- Timer shows danger (red) when ≤1 minute remains

#### View Statistics 📊
1. Click "📊 View Statistics" button
2. See your performance metrics:
   - Total quiz attempts
   - Average score
   - Highest and lowest scores
   - Detailed history table
3. Click "🗑️ Clear History" to delete all quiz history

## 🎯 Use Cases

- **Students**: Practice for exams with custom question sets
- **Teachers**: Create quick assessment tools
- **Self-learners**: Test your knowledge on any subject
- **Interview Prep**: Practice technical questions
- **Language Learning**: Vocabulary and grammar practice

## 🛠️ Technical Details

- Pure HTML/CSS/JavaScript (no dependencies)
- Client-side only (no server required)
- Responsive design using CSS Grid and Flexbox
- Progressive enhancement approach
- Cross-browser compatible

## 📝 Example

**Input Questions:**
```
1. Which of these are planets?
a. Earth
b. Sun
c. Mars
d. Moon
e. Venus

2. What is 2 + 2?
a. 3
b. 4
c. 5
```

**Input Answers:**
```
1. ace
2. b
```

The app will:
- Show question 1 with checkboxes (multiple answers)
- Show question 2 with radio buttons (single answer)
- Grade automatically when you submit
- Let you retry incorrect answers

## 🌟 Tips

1. **Format matters**: Start questions with numbers, options with letters
2. **Multiple answers**: Use comma (a,b,c) or write together (abc)
3. **Pin wisely**: Use 📌 for questions you want to review later
4. **Filter feature**: Appears after first grading
5. **Shuffle**: Great for testing true knowledge vs. memorization

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to fork, modify, and use this project for your learning needs!

---

**Happy Learning! 📚**

---
---

## Tiếng Việt

Ứng dụng quiz tương tác mạnh mẽ giúp bạn tạo, quản lý và luyện tập với các bộ câu hỏi tùy chỉnh. Được xây dựng bằng HTML, CSS và JavaScript - không cần cài đặt!

## ✨ Tính Năng

### Tính Năng Cơ Bản
- **Tạo Quiz Dễ Dàng**: Copy-paste câu hỏi và đáp án ở định dạng văn bản đơn giản
- **Format Câu Hỏi Linh Hoạt**: Hỗ trợ không giới hạn số lựa chọn (a, b, c, d, e, f, ...)
- **Nhiều Đáp Án Đúng**: Tạo câu hỏi với một hoặc nhiều đáp án đúng
- **Chấm Điểm Tự Động**: Phản hồi ngay lập tức với kết quả chi tiết
- **Tùy Chỉnh Quiz**: Chọn số lượng câu hỏi và thứ tự (trình tự hoặc ngẫu nhiên)

### Tính Năng Nâng Cao
- **📌 Pin Câu Hỏi**: Đánh dấu câu hỏi quan trọng để truy cập nhanh
- **🔄 Làm Lại Câu Sai**: Tạo quiz mới chỉ với những câu bạn làm sai
- **🔄 Làm Lại Câu Đã Pin**: Luyện tập các câu hỏi đã đánh dấu
- **🔍 Lọc Câu Hỏi**: Xem tất cả, câu đã pin, hoặc câu sai
- **🌐 Song Ngữ**: Chuyển đổi giữa tiếng Việt và tiếng Anh
- **🤖 AI Prompt Templates**: Các prompt có sẵn cho ChatGPT, Claude và các AI chatbot khác để tự động tạo câu hỏi
- **💾 Tự Động Lưu**: Tự động lưu câu hỏi, đáp án, ngôn ngữ và các câu đã pin vào bộ nhớ trình duyệt
- **🌙 Chế Độ Tối**: Chuyển đổi giữa giao diện sáng/tối với tùy chọn được lưu tự động
- **⏱️ Chế Độ Thi**: Chế độ làm bài có hẹn giờ với đồng hồ đếm ngược và tự động nộp bài
- **📚 Quản Lý Quiz**: Lưu và tải nhiều bộ quiz với tên tùy chỉnh
- **📊 Bảng Thống Kê**: Theo dõi lịch sử làm bài với thống kê chi tiết và phân tích hiệu suất
- **📁 Import/Export**: Import câu hỏi và đáp án từ file Excel (.xlsx, .xls), Word (.docx), hoặc Text (.txt), và export ra định dạng Excel hoặc Text

### Giao Diện Người Dùng
- Thiết kế gradient đẹp mắt
- Responsive (thân thiện với mobile)
- Phản hồi trực quan real-time
- Animation và transition mượt mà

## 🚀 Bắt Đầu

1. Mở `index.html` trong trình duyệt web
2. Vậy là xong! Không cần cài đặt gì cả.

## 📖 Hướng Dẫn Sử Dụng

### Bắt Đầu Nhanh Với AI (Khuyến Nghị Cho Người Mới)

**MỚI!** Không muốn tự viết câu hỏi? Dùng AI prompt templates của chúng tôi:

1. Click vào phần "🤖 Hướng Dẫn Tạo Câu Hỏi Với AI Chatbot" ở đầu trang
2. Chọn template phù hợp với nhu cầu:
   - 📚 Tạo Quiz Chủ Đề Bất Kỳ
   - 🎓 Ôn Tập Kỳ Thi
   - 💡 Nhiều Đáp Án Đúng
   - 🌍 Học Ngoại Ngữ
   - 🧪 Khoa Học & Công Nghệ
3. Click nút "Copy"
4. Mở ChatGPT, Claude, hoặc bất kỳ AI chatbot nào
5. Paste prompt và thay [TOPIC] bằng chủ đề của bạn
6. Copy câu trả lời của AI vào ứng dụng quiz
7. Xong! Quiz của bạn đã sẵn sàng

### Phương Pháp Nhập Thủ Công

**Template Copy Nhanh** - Copy các template có sẵn:

<details>
<summary><b>📋 Click để mở: Template Câu Hỏi (Sẵn Sàng Copy & Paste)</b></summary>

```
1. Câu hỏi thứ nhất?
a. Đáp án A
b. Đáp án B
c. Đáp án C
d. Đáp án D

2. Câu hỏi thứ hai?
a. Đáp án A
b. Đáp án B
c. Đáp án C
d. Đáp án D

3. Câu hỏi thứ ba (nhiều đáp án đúng)?
a. Lựa chọn A
b. Lựa chọn B
c. Lựa chọn C
d. Lựa chọn D
e. Lựa chọn E
```
</details>

<details>
<summary><b>📋 Click để mở: Template Đáp Án (Sẵn Sàng Copy & Paste)</b></summary>

```
1. a
2. b
3. a,c,e
```
</details>

---

### Bước 1: Nhập Câu Hỏi và Đáp Án

**Format Câu Hỏi:**
```
1. Thủ đô của Pháp là gì?
a. London
b. Paris
c. Berlin
d. Madrid

2. Ngôn ngữ lập trình nào hỗ trợ hướng đối tượng? (nhiều đáp án)
a. Python
b. JavaScript
c. Assembly
d. Java
e. C
f. Ruby
```

**Format Đáp Án (Đáp Án Đơn):**
```
1. b
```

**Format Đáp Án (Nhiều Đáp Án):**
```
2. a,b,d,f
hoặc
2. abdf
```

### Bước 2: Tạo Quiz
- **Số câu hỏi**: Nhập số để giới hạn số lượng câu hỏi (để trống = tất cả câu hỏi)
- **Thứ tự câu hỏi**: Chọn "Trình tự" (thứ tự gốc) hoặc "Ngẫu nhiên" (xáo trộn)
- Tick "Xáo trộn câu hỏi" nếu muốn thứ tự ngẫu nhiên (tùy chọn cũ, giống với Ngẫu nhiên)
- Click nút "Tạo Quiz"

### Bước 3: Làm Bài Quiz
- **Câu hỏi đáp án đơn**: Dùng radio buttons (○)
- **Câu hỏi nhiều đáp án**: Dùng checkboxes (☑)
- Click 📍 để pin câu hỏi quan trọng

### Bước 4: Nộp Bài và Xem Kết Quả
- Click "Chấm Điểm" để xem kết quả
- Màu xanh = Đúng ✓
- Màu đỏ = Sai ✗
- Xem phần trăm điểm và thống kê chi tiết

### Bước 5: Luyện Tập Thêm
- **Làm Lại Câu Sai**: Chỉ luyện những câu làm sai
- **Làm Lại Câu Đã Pin**: Ôn lại các câu đã đánh dấu
- **Lọc**: Xem các loại câu hỏi cụ thể
- **Làm Lại**: Bắt đầu mới với câu hỏi khác

### Bước 6: Import/Export File 📁

**MỚI!** Bạn có thể import câu hỏi và đáp án từ file có sẵn hoặc export để sao lưu/chia sẻ.

#### Import từ File
1. Click nút "📁 Import từ file" bên cạnh ô nhập Câu hỏi hoặc Đáp án
2. Chọn file từ máy tính:
   - **File Excel** (.xlsx, .xls): Sheet đầu tiên sẽ được import
   - **File Word** (.docx): Nội dung văn bản sẽ được trích xuất
   - **File Text** (.txt): Import trực tiếp
3. Nội dung sẽ tự động hiển thị trong ô nhập
4. Xem lại và chỉnh sửa nếu cần trước khi tạo quiz

#### Export ra File
1. Sau khi nhập câu hỏi hoặc đáp án, click vào nút export:
   - **💾 Export TXT**: Tải xuống dưới dạng file text
   - **💾 Export Excel**: Tải xuống dưới dạng file Excel
2. File sẽ được lưu vào thư mục Downloads
3. Sử dụng file đã export để:
   - Sao lưu bộ quiz
   - Chia sẻ với người khác
   - Chỉnh sửa trong Excel/Word để format dễ hơn
   - Tái sử dụng trong ứng dụng khác

**Định Dạng Được Hỗ Trợ:**
- Import: Excel (.xlsx, .xls), Word (.docx), Text (.txt)
- Export: Excel (.xlsx), Text (.txt)

### Bước 7: Sử Dụng Các Tính Năng Nâng Cao Khác

#### Chế Độ Tối 🌙
- Click vào biểu tượng mặt trăng/mặt trời (🌙/☀️) ở góc trên bên phải để bật/tắt chế độ tối
- Tùy chọn của bạn sẽ được lưu tự động

#### Lưu & Tải Bộ Quiz 💾
1. Nhập tên cho bộ quiz trong phần "Quản Lý Bộ Quiz"
2. Click "💾 Lưu Bộ Quiz" để lưu câu hỏi và đáp án hiện tại
3. Click "Tải" trên bất kỳ quiz đã lưu nào để khôi phục
4. Click "Xóa" để xóa bộ quiz đã lưu

#### Chế Độ Thi ⏱️
1. Tạo quiz như bình thường
2. Tick vào ô "Bật chế độ thi"
3. Đặt thời gian tính bằng phút (mặc định: 30 phút)
4. Đồng hồ đếm ngược tự động bắt đầu khi bạn bật chế độ thi
5. Quiz tự động nộp khi hết giờ
- Đồng hồ chuyển màu vàng cảnh báo khi còn ≤5 phút
- Đồng hồ chuyển màu đỏ nguy hiểm khi còn ≤1 phút

#### Xem Thống Kê 📊
1. Click nút "📊 Xem Thống Kê"
2. Xem các chỉ số hiệu suất:
   - Tổng số lượt thi
   - Điểm trung bình
   - Điểm cao nhất và thấp nhất
   - Bảng lịch sử chi tiết
3. Click "🗑️ Xóa Lịch Sử" để xóa toàn bộ lịch sử làm bài

## 🎯 Trường Hợp Sử Dụng

- **Học Sinh**: Luyện tập cho kỳ thi với bộ câu hỏi tùy chỉnh
- **Giáo Viên**: Tạo công cụ đánh giá nhanh
- **Tự Học**: Kiểm tra kiến thức về bất kỳ chủ đề nào
- **Chuẩn Bị Phỏng Vấn**: Luyện tập câu hỏi kỹ thuật
- **Học Ngoại Ngữ**: Luyện tập từ vựng và ngữ pháp

## 🛠️ Chi Tiết Kỹ Thuật

- HTML/CSS/JavaScript thuần túy (không phụ thuộc)
- Chỉ client-side (không cần server)
- Responsive design dùng CSS Grid và Flexbox
- Progressive enhancement
- Tương thích đa trình duyệt

## 📝 Ví Dụ

**Nhập Câu Hỏi:**
```
1. Hành tinh nào sau đây là hành tinh?
a. Trái Đất
b. Mặt Trời
c. Sao Hỏa
d. Mặt Trăng
e. Sao Kim

2. 2 + 2 bằng bao nhiêu?
a. 3
b. 4
c. 5
```

**Nhập Đáp Án:**
```
1. ace
2. b
```

Ứng dụng sẽ:
- Hiển thị câu 1 với checkboxes (nhiều đáp án)
- Hiển thị câu 2 với radio buttons (đáp án đơn)
- Chấm điểm tự động khi bạn nộp bài
- Cho phép làm lại các câu sai

## 🌟 Mẹo

1. **Format quan trọng**: Câu hỏi bắt đầu bằng số, lựa chọn bắt đầu bằng chữ cái
2. **Nhiều đáp án**: Dùng dấu phẩy (a,b,c) hoặc viết liền (abc)
3. **Pin khôn ngoan**: Dùng 📌 cho câu muốn ôn lại sau
4. **Tính năng lọc**: Xuất hiện sau lần chấm điểm đầu tiên
5. **Xáo trộn**: Tuyệt vời để test kiến thức thực sự thay vì ghi nhớ

## 📄 Giấy Phép

Dự án này là mã nguồn mở và có sẵn theo Giấy Phép MIT.

## 🤝 Đóng Góp

Tự do fork, chỉnh sửa và sử dụng dự án này cho nhu cầu học tập của bạn!

---

**Chúc Học Tốt! 📚**
