const translations = {
    vi: {
        title: '📝 BlueQuiz',
        subtitle: 'Tạo bộ câu hỏi, xáo trộn và chấm điểm tự động',
        step1: 'Bước 1: Nhập Dữ Liệu',
        step2: 'Bước 2: Làm Bài Quiz',
        questionsLabel: 'Câu hỏi và đáp án:',
        questionsPlaceholder: 'Nhập câu hỏi theo định dạng:\n\n1. Câu hỏi thứ nhất?\na. Đáp án A\nb. Đáp án B\nc. Đáp án C\nd. Đáp án D\n\n2. Câu hỏi thứ hai?\na. Đáp án A\nb. Đáp án B\nc. Đáp án C\nd. Đáp án D',
        questionsHint: 'Mỗi câu hỏi bắt đầu bằng số thứ tự, các đáp án bắt đầu bằng a, b, c, d...',
        importFileBtn: 'Import từ file',
        addImageBtn: 'Thêm ảnh',
        exportTxtBtn: 'Export TXT',
        exportExcelBtn: 'Export Excel',
        uploadHint: 'Hỗ trợ: Excel (.xlsx, .xls), Word (.docx), Text (.txt)',
        imageHint: 'Thêm ảnh: Chọn ảnh từ máy tính, tag [IMG:...] sẽ được thêm vào vị trí con trỏ',
        answersLabel: 'Đáp án đúng:',
        answersPlaceholder: 'Nhập đáp án theo định dạng:\n\n1. a\n2. b\n3. c\n4. d\n\nNhiều đáp án đúng:\n5. a,b,c\n6. abc',
        answersHint: 'Nhập đáp án đúng cho mỗi câu. Nhiều đáp án: dùng dấu phẩy (a,b,c) hoặc viết liền (abc)',
        questionCountLabel: 'Số câu hỏi:',
        questionCountHint: '(Để trống = tất cả)',
        startQuestionLabel: 'Bắt đầu từ câu:',
        startQuestionHint: '(Chỉ với Trình tự)',
        questionOrderLabel: 'Thứ tự câu hỏi:',
        orderSequential: 'Trình tự',
        orderRandom: 'Ngẫu nhiên',
        shuffleLabel: 'Xáo trộn câu hỏi',
        shuffleChoicesLabel: 'Xáo trộn đáp án (a,b,c,d)',
        practiceModeLabel: '🎯 Chế độ ôn tập (Hiện đáp án ngay)',
        createQuizBtn: 'Tạo Quiz',
        continueQuizBtn: '⏩ Tiếp tục Quiz đã lưu',
        filterLabel: 'Lọc câu hỏi:',
        filterAll: 'Tất cả',
        filterPinned: 'Câu đã pin',
        filterIncorrect: 'Câu sai',
        progressLabel: 'Tiến độ:',
        submitBtn: 'Chấm Điểm',
        backToEditBtn: '⬅️ Quay Lại',
        restartBtn: '🔄 Làm Lại',
        retryAllBtn: '🔄 Làm Lại Tất Cả',
        retryIncorrectBtn: 'Làm Lại Câu Sai',
        retryPinnedBtn: 'Làm Lại Câu Đã Pin',
        questionNavigator: 'Danh Sách Câu Hỏi',
        timeRemaining: 'Thời gian còn lại:',
        pauseTimer: 'Tạm dừng',
        resumeTimer: 'Tiếp tục',
        confirmBackToEdit: 'Bạn có chắc muốn quay lại? Tiến trình làm bài sẽ KHÔNG được lưu.',
        confirmRestart: 'Bạn có chắc muốn làm lại? Bài làm hiện tại sẽ bị xóa.',
        question: 'Câu',
        pinQuestion: 'Pin câu hỏi',
        unpinQuestion: 'Bỏ pin',
        correct: '✓ Chính xác!',
        incorrect: '✗ Sai - Đáp án đúng:',
        unanswered: 'Chưa trả lời - Đáp án đúng:',
        resultTitle: '🎉 Kết Quả Của Bạn',
        totalQuestions: 'Tổng câu',
        correctAnswers: 'Đúng',
        incorrectAnswers: 'Sai',
        unansweredQuestions: 'Chưa trả lời',
        alertNoData: 'Vui lòng nhập đầy đủ câu hỏi và đáp án!',
        alertNoQuestions: 'Không tìm thấy câu hỏi hợp lệ! Vui lòng kiểm tra định dạng.',
        alertNoIncorrect: 'Không có câu sai nào để làm lại!',
        alertNoPinned: 'Chưa có câu hỏi nào được pin!',
        alertNoRetry: 'Không có câu hỏi nào để làm lại!',
        aiPromptsTitle: 'Hướng Dẫn Tạo Câu Hỏi Với AI Chatbot',
        aiPromptsDesc: 'Chọn một trong 3 prompt dưới đây. Mỗi prompt đều yêu cầu AI xuất sẵn hai phần CÂU HỎI và ĐÁP ÁN để nhập thẳng vào BlueQuiz.',
        quickTemplatesTitle: '📋 Hoặc Copy Template Mẫu Để Paste Trực Tiếp:',
        templateQuestionsLabel: 'Mẫu Câu Hỏi:',
        templateAnswersLabel: 'Mẫu Đáp Án:',
        templateListItemsLabel: 'Mẫu List Items:',
        copyBtn: 'Copy',
        copiedBtn: '✓ Đã copy!',
        examMode: 'Chế độ thi',
        enableExamMode: 'Bật chế độ thi',
        hours: 'Giờ:',
        minutes: 'Phút:',
        timerPanelHeader: '⏱️ Thời Gian',
        controlPanelHeader: '🎮 Điều Khiển',
        timeUp: 'Hết giờ! Tự động nộp bài...',
        examModeActive: 'Chế độ thi đang bật. Bạn không thể xem đáp án cho đến khi hết giờ hoặc nộp bài.',
        quizManagement: 'Quản Lý Bộ Quiz',
        quizNamePlaceholder: 'Nhập tên bộ quiz (VD: Lịch Sử Việt Nam, JavaScript Basics...)',
        saveQuizBtn: '💾 Lưu Bộ Quiz',
        pairImportBtn: '📂 Nhập cặp Q&A',
        pairImportNeedTwoFiles: '✗ Hãy chọn đúng 2 file: câu hỏi và đáp án.',
        pairImportReading: 'Đang đọc và kiểm tra hai file...',
        pairImportUnrecognized: 'Không nhận diện được file câu hỏi và file đáp án.',
        pairImportInvalid: 'Hai file có {count} lỗi dữ liệu. Xem bảng kiểm tra bên dưới.',
        pairImportSuccess: '✓ Đã nhập {count} câu — {name}',
        backupDataBtn: '⬇️ Sao lưu dữ liệu',
        restoreDataBtn: '⬆️ Khôi phục dữ liệu',
        confirmRestoreData: 'Khôi phục sẽ thay thế dữ liệu BlueQuiz hiện tại bằng dữ liệu trong file. Tiếp tục?',
        invalidBackupFile: 'File sao lưu BlueQuiz không hợp lệ.',
        restoreSuccess: 'Khôi phục dữ liệu thành công. BlueQuiz sẽ tải lại.',
        restoreFailed: 'Không thể khôi phục:',
        loadBtn: 'Tải',
        deleteBtn: 'Xóa',
        questions: 'câu hỏi',
        savedOn: 'Lưu lúc:',
        confirmDelete: 'Bạn có chắc muốn xóa bộ quiz này?',
        alertNoQuizName: 'Vui lòng nhập tên bộ quiz!',
        alertNoData: 'Vui lòng nhập câu hỏi và đáp án trước khi lưu!',
        alertQuizSaved: 'Đã lưu bộ quiz thành công!',
        noSavedQuizzes: 'Chưa có bộ quiz nào được lưu',
        viewStatistics: 'Xem Thống Kê',
        hideStatistics: 'Ẩn Thống Kê',
        statisticsTitle: 'Thống Kê & Lịch Sử',
        recentHistory: 'Lịch Sử Gần Đây',
        clearHistory: 'Xóa Lịch Sử',
        confirmClearHistory: 'Bạn có chắc muốn xóa toàn bộ lịch sử?',
        totalAttempts: 'Tổng lượt thi',
        averageScore: 'Điểm TB',
        highestScore: 'Điểm cao nhất',
        lowestScore: 'Điểm thấp nhất',
        date: 'Ngày giờ',
        score: 'Điểm',
        noHistory: 'Chưa có lịch sử làm bài nào'
    },
    en: {
        title: '📝 BlueQuiz',
        subtitle: 'Create quizzes, shuffle questions, and auto-grade',
        step1: 'Step 1: Input Data',
        step2: 'Step 2: Take the Quiz',
        questionsLabel: 'Questions and Answers:',
        questionsPlaceholder: 'Enter questions in this format:\n\n1. First question?\na. Answer A\nb. Answer B\nc. Answer C\nd. Answer D\n\n2. Second question?\na. Answer A\nb. Answer B\nc. Answer C\nd. Answer D',
        questionsHint: 'Each question starts with a number, answers start with a, b, c, d...',
        importFileBtn: 'Import from file',
        addImageBtn: 'Add image',
        exportTxtBtn: 'Export TXT',
        exportExcelBtn: 'Export Excel',
        uploadHint: 'Supported: Excel (.xlsx, .xls), Word (.docx), Text (.txt)',
        imageHint: 'Add image: Select image from computer, [IMG:...] tag will be inserted at cursor position',
        answersLabel: 'Correct Answers:',
        answersPlaceholder: 'Enter answers in this format:\n\n1. a\n2. b\n3. c\n4. d\n\nMultiple correct answers:\n5. a,b,c\n6. abc',
        answersHint: 'Enter correct answers for each question. Multiple answers: use comma (a,b,c) or write together (abc)',
        questionCountLabel: 'Number of questions:',
        questionCountHint: '(Leave empty = all)',
        startQuestionLabel: 'Start from question:',
        startQuestionHint: '(Sequential only)',
        questionOrderLabel: 'Question order:',
        orderSequential: 'Sequential',
        orderRandom: 'Random',
        shuffleLabel: 'Shuffle questions',
        shuffleChoicesLabel: 'Shuffle answer choices (a,b,c,d)',
        practiceModeLabel: '🎯 Practice Mode (Instant feedback)',
        createQuizBtn: 'Create Quiz',
        continueQuizBtn: '⏩ Continue Saved Quiz',
        filterLabel: 'Filter questions:',
        filterAll: 'All',
        filterPinned: 'Pinned',
        filterIncorrect: 'Incorrect',
        progressLabel: 'Progress:',
        submitBtn: 'Submit & Grade',
        backToEditBtn: '⬅️ Back',
        restartBtn: '🔄 Restart',
        retryAllBtn: '🔄 Retry All Questions',
        retryIncorrectBtn: 'Retry Incorrect',
        retryPinnedBtn: 'Retry Pinned',
        questionNavigator: 'Question List',
        timeRemaining: 'Time Remaining:',
        pauseTimer: 'Pause',
        resumeTimer: 'Resume',
        confirmBackToEdit: 'Are you sure you want to go back? Your progress will NOT be saved.',
        confirmRestart: 'Are you sure you want to restart? Your current answers will be cleared.',
        question: 'Question',
        pinQuestion: 'Pin question',
        unpinQuestion: 'Unpin',
        correct: '✓ Correct!',
        incorrect: '✗ Incorrect - Correct answer:',
        unanswered: 'Not answered - Correct answer:',
        resultTitle: '🎉 Your Results',
        totalQuestions: 'Total',
        correctAnswers: 'Correct',
        incorrectAnswers: 'Incorrect',
        unansweredQuestions: 'Not Answered',
        alertNoData: 'Please enter both questions and answers!',
        alertNoQuestions: 'No valid questions found! Please check the format.',
        alertNoIncorrect: 'No incorrect questions to retry!',
        alertNoPinned: 'No questions have been pinned yet!',
        alertNoRetry: 'No questions to retry!',
        aiPromptsTitle: 'Generate Questions With AI Chatbot',
        aiPromptsDesc: 'Choose one of the 3 prompts below. Each prompt asks the AI to produce separate QUESTIONS and ANSWERS sections ready for BlueQuiz.',
        quickTemplatesTitle: '📋 Or Copy Sample Templates to Paste Directly:',
        templateQuestionsLabel: 'Questions Template:',
        templateAnswersLabel: 'Answers Template:',
        templateListItemsLabel: 'List Items Template:',
        copyBtn: 'Copy',
        copiedBtn: '✓ Copied!',
        examMode: 'Exam Mode',
        enableExamMode: 'Enable exam mode',
        hours: 'Hours:',
        minutes: 'Minutes:',
        timerPanelHeader: '⏱️ Timer',
        controlPanelHeader: '🎮 Controls',
        timeUp: 'Time\'s up! Auto-submitting...',
        examModeActive: 'Exam mode is active. You cannot see answers until time expires or you submit.',
        quizManagement: 'Quiz Management',
        quizNamePlaceholder: 'Enter quiz name (e.g., World History, JavaScript Basics...)',
        saveQuizBtn: '💾 Save Quiz Set',
        pairImportBtn: '📂 Import Q&A pair',
        pairImportNeedTwoFiles: '✗ Select exactly 2 files: questions and answers.',
        pairImportReading: 'Reading and validating both files...',
        pairImportUnrecognized: 'Could not identify the questions and answers files.',
        pairImportInvalid: 'The files contain {count} data errors. See the validation report below.',
        pairImportSuccess: '✓ Imported {count} questions — {name}',
        backupDataBtn: '⬇️ Back up data',
        restoreDataBtn: '⬆️ Restore data',
        confirmRestoreData: 'Restoring will replace current BlueQuiz data with the data in this file. Continue?',
        invalidBackupFile: 'Invalid BlueQuiz backup file.',
        restoreSuccess: 'Data restored successfully. BlueQuiz will reload.',
        restoreFailed: 'Unable to restore:',
        loadBtn: 'Load',
        deleteBtn: 'Delete',
        questions: 'questions',
        savedOn: 'Saved on:',
        confirmDelete: 'Are you sure you want to delete this quiz set?',
        alertNoQuizName: 'Please enter a quiz name!',
        alertNoData: 'Please enter questions and answers before saving!',
        alertQuizSaved: 'Quiz set saved successfully!',
        noSavedQuizzes: 'No saved quiz sets yet',
        viewStatistics: 'View Statistics',
        hideStatistics: 'Hide Statistics',
        statisticsTitle: 'Statistics & History',
        recentHistory: 'Recent History',
        clearHistory: 'Clear History',
        confirmClearHistory: 'Are you sure you want to clear all history?',
        totalAttempts: 'Total Attempts',
        averageScore: 'Avg Score',
        highestScore: 'Highest Score',
        lowestScore: 'Lowest Score',
        date: 'Date & Time',
        score: 'Score',
        noHistory: 'No quiz history yet'
    }
};

// Three general-purpose prompts keep the AI workflow simple.
const aiPrompts = {
    vi: [
    {
        title: '✨ Tạo Bộ Câu Hỏi Mới',
        description: 'Tạo câu hỏi từ chủ đề, giáo trình hoặc nội dung bạn cung cấp',
        prompt: `Bạn là người biên soạn câu hỏi trắc nghiệm. Hãy tạo [SỐ CÂU] câu hỏi từ chủ đề hoặc tài liệu tôi cung cấp bên dưới.

Yêu cầu:
- Bám sát nội dung nguồn, không tự bịa kiến thức.
- Mỗi câu có 4 lựa chọn a, b, c, d và chỉ 1 đáp án đúng, trừ khi nguồn yêu cầu nhiều đáp án.
- Phân bố độ khó: 30% dễ, 50% trung bình, 20% khó.
- Đáp án sai phải hợp lý; tránh câu mơ hồ, trùng ý hoặc lộ đáp án.
- Nếu có nhiều đáp án đúng, ghi đáp án dạng a,c,d.
- Không giải thích xen giữa các câu.

Chỉ xuất đúng 2 khối sau:

CÂU HỎI
1. [Nội dung câu hỏi]
a. [Lựa chọn A]
b. [Lựa chọn B]
c. [Lựa chọn C]
d. [Lựa chọn D]

ĐÁP ÁN
1. a

CHỦ ĐỀ / TÀI LIỆU NGUỒN:
[DÁN NỘI DUNG VÀO ĐÂY]`
    },
    {
        title: '🧾 Chuyển Đề Có Sẵn Sang BlueQuiz',
        description: 'Chuẩn hóa đề từ ảnh, OCR, PDF hoặc văn bản đã chép',
        prompt: `Hãy chuyển đề trắc nghiệm tôi cung cấp sang định dạng nhập của BlueQuiz.

Quy tắc:
- Giữ nguyên nội dung, thứ tự câu và thứ tự lựa chọn.
- Không tự sửa kiến thức hoặc đoán phần chữ bị thiếu.
- Đánh số câu liên tục từ 1; lựa chọn dùng a, b, c, d... viết thường.
- Nếu câu có nhiều đáp án đúng, ghi dạng a,c,e.
- Nếu đáp án có sẵn, kiểm tra lại bằng kiến thức chuyên môn; nếu đáp án cũ có vẻ sai, dùng đáp án đúng và ghi ngắn gọn mục đã sửa ở cuối.
- Phần nào không đọc rõ thì giữ chỗ [CẦN KIỂM TRA], không tự bịa.

Chỉ xuất đúng 2 khối để tôi copy riêng:

CÂU HỎI
1. [Nội dung câu hỏi]
a. [Lựa chọn A]
b. [Lựa chọn B]
c. [Lựa chọn C]
d. [Lựa chọn D]

ĐÁP ÁN
1. a

ĐỀ VÀ ĐÁP ÁN GỐC:
[DÁN NỘI DUNG VÀO ĐÂY]`
    },
    {
        title: '🔎 Rà Soát Và Sửa Bộ Câu Hỏi',
        description: 'Kiểm tra nội dung, đáp án và định dạng trước khi nhập',
        prompt: `Hãy rà soát bộ CÂU HỎI và ĐÁP ÁN BlueQuiz tôi cung cấp.

Kiểm tra toàn bộ:
- Số thứ tự liên tục và mỗi câu đều có đáp án.
- Đáp án chỉ tham chiếu tới lựa chọn tồn tại.
- Kiến thức và đáp án đúng; không có câu trùng ý, mơ hồ hoặc nhiều đáp án ngoài dự kiến.
- Sửa lỗi OCR, chính tả và định dạng nhưng không làm đổi ý câu hỏi.
- Giữ lựa chọn dạng a, b, c, d...; nhiều đáp án ghi dạng a,c,e.

Sau khi kiểm tra, chỉ xuất lại 2 khối hoàn chỉnh đã sửa để tôi thay thế trực tiếp:

CÂU HỎI
[TOÀN BỘ CÂU HỎI ĐÃ SỬA]

ĐÁP ÁN
[TOÀN BỘ ĐÁP ÁN ĐÃ SỬA]

Cuối cùng thêm tối đa 5 dòng "ĐÃ SỬA" nêu các lỗi quan trọng. Nếu không có lỗi, ghi "ĐÃ SỬA: Không có".

DỮ LIỆU CẦN RÀ SOÁT:
[DÁN CÂU HỎI VÀ ĐÁP ÁN VÀO ĐÂY]`
    }
    ],

    en: [
    {
        title: '✨ Create a New Quiz',
        description: 'Generate questions from a topic, notes, or source material',
        prompt: `Act as a multiple-choice question writer. Create [NUMBER] questions from the topic or source material below.

Requirements:
- Stay faithful to the source and do not invent facts.
- Give each question 4 options: a, b, c, d, with exactly one correct answer unless the source requires multiple answers.
- Use a balanced difficulty mix: 30% easy, 50% medium, 20% hard.
- Make distractors plausible; avoid ambiguity, duplicates, and clues to the answer.
- For multiple correct answers, use the format a,c,d.
- Do not place explanations between questions.

Output exactly these 2 sections:

QUESTIONS
1. [Question]
a. [Option A]
b. [Option B]
c. [Option C]
d. [Option D]

ANSWERS
1. a

TOPIC / SOURCE MATERIAL:
[PASTE CONTENT HERE]`
    },
    {
        title: '🧾 Convert an Existing Exam',
        description: 'Normalize questions from images, OCR, PDFs, or copied text',
        prompt: `Convert the exam below into the BlueQuiz import format.

Rules:
- Preserve the wording, question order, and option order.
- Do not invent missing text or silently change factual content.
- Number questions continuously from 1 and use lowercase option labels a, b, c, d...
- For multiple correct answers, use the format a,c,e.
- If an answer key is provided, verify it; use the correct answer when the original appears wrong and briefly list that correction at the end.
- Mark unreadable content as [CHECK NEEDED] instead of guessing.

Output exactly these 2 separately copyable sections:

QUESTIONS
1. [Question]
a. [Option A]
b. [Option B]
c. [Option C]
d. [Option D]

ANSWERS
1. a

ORIGINAL EXAM AND ANSWER KEY:
[PASTE CONTENT HERE]`
    },
    {
        title: '🔎 Review and Repair a Quiz',
        description: 'Check content, answers, and formatting before import',
        prompt: `Review the BlueQuiz QUESTIONS and ANSWERS provided below.

Check everything:
- Continuous numbering and an answer for every question.
- Every answer refers to an existing option.
- Factual correctness; no duplicates, ambiguity, or unintended multiple answers.
- Repair OCR, spelling, and formatting errors without changing the intended meaning.
- Keep option labels as a, b, c, d... and multiple answers as a,c,e.

After reviewing, output only these 2 complete corrected sections so I can replace the originals directly:

QUESTIONS
[ALL CORRECTED QUESTIONS]

ANSWERS
[ALL CORRECTED ANSWERS]

Finally, add at most 5 short "CHANGES" lines for important corrections. If none were needed, write "CHANGES: None".

DATA TO REVIEW:
[PASTE QUESTIONS AND ANSWERS HERE]`
    }
    ]
};

function changeLanguage(lang) {
    currentLanguage = lang;
    saveLanguage(lang); // Save language preference

    // Update language button active state
    document.querySelectorAll('.language-button').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeButton = lang === 'vi' ? document.getElementById('langVi') : document.getElementById('langEn');
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });

    // Update pin button titles if quiz is displayed
    if (!document.getElementById('quizSection').classList.contains('hidden')) {
        quizData.forEach((q, index) => {
            const originalNumber = questionMapping[index];
            const isPinned = pinnedQuestions.has(originalNumber);
            const pinButton = document.getElementById(`pin${index}`);
            if (pinButton) {
                pinButton.title = isPinned ? translations[lang].unpinQuestion : translations[lang].pinQuestion;
            }
        });
    }

    // Update result section if it exists
    if (isGraded && !document.getElementById('resultSection').classList.contains('hidden')) {
        // Re-display results with new language
        const resultDiv = document.getElementById('resultSection');
        if (resultDiv.innerHTML) {
            // Results will be updated on next submit
        }
    }

    // Re-render AI prompts with new language
    renderAIPrompts();

    // Update saved quizzes display
    displaySavedQuizzes();
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData(); // Load saved data from localStorage
    changeLanguage(currentLanguage); // Use saved language or default
    renderAIPrompts();
    displaySavedQuizzes(); // Display saved quiz sets

    // Check if there's saved progress and show continue button
    checkAndShowContinueButton();

    // Add auto-save event listeners
    const questionsInput = document.getElementById('questionsInput');
    const answersInput = document.getElementById('answersInput');

    // Auto-save on input with debounce
    let questionsSaveTimer;
    let answersSaveTimer;

    questionsInput.addEventListener('input', function() {
        clearValidationSummary();
        clearTimeout(questionsSaveTimer);
        questionsSaveTimer = setTimeout(autoSaveQuestions, 1000);
    });

    answersInput.addEventListener('input', function() {
        clearValidationSummary();
        clearTimeout(answersSaveTimer);
        answersSaveTimer = setTimeout(autoSaveAnswers, 1000);
    });

    // Also save on blur (when user clicks away)
    questionsInput.addEventListener('blur', autoSaveQuestions);
    answersInput.addEventListener('blur', autoSaveAnswers);
});

function toggleAIPrompts() {
    const content = document.getElementById('aiPromptsContent');
    const icon = document.getElementById('toggleIcon');

    content.classList.toggle('expanded');
    icon.classList.toggle('rotated');
}

function renderAIPrompts() {
    const container = document.getElementById('promptsContainer');
    const prompts = aiPrompts[currentLanguage];

    container.innerHTML = prompts.map((prompt, index) => `
        <div class="prompt-card">
            <h4>${prompt.title}</h4>
            <p>${prompt.description}</p>
            <div class="prompt-text" id="prompt${index}">${prompt.prompt}</div>
            <button class="copy-btn" onclick="copyPrompt(${index})" id="copyBtn${index}">
                <span>${translations[currentLanguage].copyBtn}</span>
            </button>
        </div>
    `).join('');
}

function copyPrompt(index) {
    const promptText = aiPrompts[currentLanguage][index].prompt;
    const button = document.getElementById(`copyBtn${index}`);

    navigator.clipboard.writeText(promptText).then(() => {
        button.classList.add('copied');
        button.innerHTML = `<span>${translations[currentLanguage].copiedBtn}</span>`;

        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = `<span>${translations[currentLanguage].copyBtn}</span>`;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Không thể copy. Vui lòng copy thủ công.');
    });
}
