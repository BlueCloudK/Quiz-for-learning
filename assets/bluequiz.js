let quizData = [];
let correctAnswers = {};
let questionMapping = {}; // Lưu mapping giữa vị trí hiện tại và số thứ tự gốc
let pinnedQuestions = new Set(); // Lưu index các câu được pin
let incorrectQuestions = new Set(); // Lưu index các câu sai
let answeredQuestions = new Set(); // Track câu đã trả lời (cho progress bar)
let isGraded = false; // Track xem đã chấm điểm chưa
let originalQuestionsText = ''; // Lưu câu hỏi gốc
let originalAnswersText = ''; // Lưu đáp án gốc
let currentFilter = 'all'; // Bộ lọc hiện tại
let currentLanguage = 'vi'; // Ngôn ngữ hiện tại
let quizHistory = []; // Lưu lịch sử làm bài
let practiceModeEnabled = false; // Practice mode with instant feedback

// Exam Mode variables
let examModeEnabled = false;
let timerInterval = null;
let timeRemaining = 0; // in seconds

// LocalStorage keys
const STORAGE_KEYS = {
    QUESTIONS: 'quiz_questions',
    ANSWERS: 'quiz_answers',
    PINNED: 'quiz_pinned',
    LANGUAGE: 'quiz_language',
    HISTORY: 'quiz_history',
    THEME: 'quiz_theme',
    SAVED_QUIZZES: 'quiz_saved_sets',
    QUIZ_PROGRESS: 'quiz_progress', // Auto-save progress
    QUIZ_STATE: 'quiz_state' // Save quiz state for restoration
};

// LocalStorage helper functions
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
        return defaultValue;
    }
}

function clearStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error('Failed to clear from localStorage:', e);
    }
}

function exportBlueQuizData() {
    const data = {};
    Object.values(STORAGE_KEYS).forEach(storageKey => {
        data[storageKey] = localStorage.getItem(storageKey);
    });

    const backup = {
        app: 'BlueQuiz',
        version: 1,
        exportedAt: new Date().toISOString(),
        data
    };
    const date = new Date().toISOString().slice(0, 10);
    downloadTextFile(JSON.stringify(backup, null, 2), `bluequiz-backup-${date}.json`);
}

async function importBlueQuizData(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        const text = await readTextFile(file);
        const backup = JSON.parse(text);
        if (backup.app !== 'BlueQuiz' || backup.version !== 1 || !backup.data || typeof backup.data !== 'object') {
            throw new Error(translations[currentLanguage].invalidBackupFile);
        }

        if (!confirm(translations[currentLanguage].confirmRestoreData)) {
            event.target.value = '';
            return;
        }

        Object.values(STORAGE_KEYS).forEach(storageKey => {
            if (!Object.prototype.hasOwnProperty.call(backup.data, storageKey)) return;
            const value = backup.data[storageKey];
            if (value === null) localStorage.removeItem(storageKey);
            else localStorage.setItem(storageKey, value);
        });

        alert(translations[currentLanguage].restoreSuccess);
        window.location.reload();
    } catch (error) {
        alert(`${translations[currentLanguage].restoreFailed} ${error.message}`);
    } finally {
        event.target.value = '';
    }
}

// Auto-save functions
function autoSaveQuestions() {
    const questionsText = document.getElementById('questionsInput').value;
    if (questionsText.trim()) {
        saveToStorage(STORAGE_KEYS.QUESTIONS, questionsText);
    }
}

function autoSaveAnswers() {
    const answersText = document.getElementById('answersInput').value;
    if (answersText.trim()) {
        saveToStorage(STORAGE_KEYS.ANSWERS, answersText);
    }
}

function savePinnedQuestions() {
    saveToStorage(STORAGE_KEYS.PINNED, Array.from(pinnedQuestions));
}

function saveLanguage(lang) {
    saveToStorage(STORAGE_KEYS.LANGUAGE, lang);
}

function saveQuizHistory(score, total, correct, incorrect, unanswered) {
    const historyEntry = {
        date: new Date().toISOString(),
        score: score,
        total: total,
        correct: correct,
        incorrect: incorrect,
        unanswered: unanswered,
        questionsCount: total
    };

    quizHistory.unshift(historyEntry); // Add to beginning
    if (quizHistory.length > 50) { // Keep last 50 attempts
        quizHistory = quizHistory.slice(0, 50);
    }

    saveToStorage(STORAGE_KEYS.HISTORY, quizHistory);
}

// Load data from localStorage
function loadSavedData() {
    // Load language preference
    const savedLanguage = loadFromStorage(STORAGE_KEYS.LANGUAGE, 'vi');
    currentLanguage = savedLanguage;

    // Load questions and answers
    const savedQuestions = loadFromStorage(STORAGE_KEYS.QUESTIONS, '');
    const savedAnswers = loadFromStorage(STORAGE_KEYS.ANSWERS, '');

    if (savedQuestions) {
        document.getElementById('questionsInput').value = savedQuestions;
    }

    if (savedAnswers) {
        document.getElementById('answersInput').value = savedAnswers;
    }

    // Load pinned questions
    const savedPinned = loadFromStorage(STORAGE_KEYS.PINNED, []);
    pinnedQuestions = new Set(savedPinned);

    // Load quiz history
    quizHistory = loadFromStorage(STORAGE_KEYS.HISTORY, []);

    // Load theme
    const savedTheme = loadFromStorage(STORAGE_KEYS.THEME, 'light');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeToggleIcon();
    }
}

// Dark Mode functions
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    saveToStorage(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
    const themeToggle = document.getElementById('themeToggle');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    themeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
}

// Exam Mode functions
function toggleExamMode() {
    examModeEnabled = document.getElementById('examModeCheckbox').checked;
    const timerInputGroup = document.getElementById('timerInputGroup');

    if (examModeEnabled) {
        // Show timer input fields
        timerInputGroup.style.display = 'flex';
    } else {
        // Hide timer input fields and stop timer if running
        timerInputGroup.style.display = 'none';
        if (timerInterval) {
            stopTimer();
        }
    }
}

function toggleStartQuestionInput() {
    const questionOrder = document.querySelector('input[name="questionOrder"]:checked')?.value;
    const startQuestionRow = document.getElementById('startQuestionRow');

    if (questionOrder === 'sequential') {
        // Show start question input for sequential mode
        startQuestionRow.style.display = 'flex';
    } else {
        // Hide for random mode
        startQuestionRow.style.display = 'none';
    }
}

function startTimer() {
    updateTimerDisplay();
    // Show pause button when timer starts
    document.getElementById('pauseTimerBtn').style.display = 'block';
    timerInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            stopTimer();
            alert(translations[currentLanguage].timeUp);
            submitQuiz();
            return;
        }

        timeRemaining--;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    // Hide pause button when timer stops
    document.getElementById('pauseTimerBtn').style.display = 'none';
}

// Pause/Resume timer functionality
let timerPaused = false;

function togglePauseTimer() {
    const pauseIcon = document.getElementById('pauseIcon');
    const pauseText = document.getElementById('pauseText');

    if (timerPaused) {
        // Resume timer
        startTimer();
        timerPaused = false;
        pauseIcon.textContent = '⏸️';
        pauseText.textContent = translations[currentLanguage].pauseTimer || 'Tạm dừng';
    } else {
        // Pause timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerPaused = true;
        pauseIcon.textContent = '▶️';
        pauseText.textContent = translations[currentLanguage].resumeTimer || 'Tiếp tục';
    }
}

function updateTimerDisplay() {
    const fixedTimerText = document.getElementById('fixedTimerText');
    const formattedTime = formatTime(timeRemaining);

    fixedTimerText.textContent = formattedTime;

    // Add warning/danger classes
    fixedTimerText.classList.remove('warning', 'danger');

    if (timeRemaining <= 60) {
        fixedTimerText.classList.add('danger');
    } else if (timeRemaining <= 300) {
        fixedTimerText.classList.add('warning');
    }
}

function formatTime(seconds) {
    // Ensure non-negative time display
    const time = Math.max(0, seconds);
    const hours = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = time % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Quiz Management functions
function saveQuizSet() {
    const quizName = document.getElementById('quizNameInput').value.trim();
    const questionsText = document.getElementById('questionsInput').value.trim();
    const answersText = document.getElementById('answersInput').value.trim();

    if (!quizName) {
        alert(translations[currentLanguage].alertNoQuizName);
        return;
    }

    if (!questionsText || !answersText) {
        alert(translations[currentLanguage].alertNoData);
        return;
    }

    const validation = validateQuizData(parseQuestions(questionsText), parseAnswers(answersText));
    renderValidationSummary(validation);
    if (!validation.valid) {
        document.getElementById('validationSummary')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // Get existing saved quizzes
    const savedQuizzes = loadFromStorage(STORAGE_KEYS.SAVED_QUIZZES, []);

    // Create new quiz object
    const newQuiz = {
        id: Date.now(),
        name: quizName,
        questions: questionsText,
        answers: answersText,
        questionCount: parseQuestions(questionsText).length,
        savedDate: new Date().toISOString()
    };

    // Add to saved quizzes
    savedQuizzes.unshift(newQuiz);

    // Save to storage
    saveToStorage(STORAGE_KEYS.SAVED_QUIZZES, savedQuizzes);

    // Clear quiz name input
    document.getElementById('quizNameInput').value = '';

    // Refresh display
    displaySavedQuizzes();

    alert(translations[currentLanguage].alertQuizSaved);
}

function loadQuizSet(quizId) {
    const savedQuizzes = loadFromStorage(STORAGE_KEYS.SAVED_QUIZZES, []);
    const quiz = savedQuizzes.find(q => q.id === quizId);

    if (quiz) {
        document.getElementById('questionsInput').value = quiz.questions;
        document.getElementById('answersInput').value = quiz.answers;

        // Auto-save to current storage
        autoSaveQuestions();
        autoSaveAnswers();

        // Scroll to input section
        document.getElementById('inputSection').scrollIntoView({ behavior: 'smooth' });
    }
}

function deleteQuizSet(quizId) {
    if (confirm(translations[currentLanguage].confirmDelete)) {
        let savedQuizzes = loadFromStorage(STORAGE_KEYS.SAVED_QUIZZES, []);
        savedQuizzes = savedQuizzes.filter(q => q.id !== quizId);
        saveToStorage(STORAGE_KEYS.SAVED_QUIZZES, savedQuizzes);
        displaySavedQuizzes();
    }
}

function displaySavedQuizzes() {
    const container = document.getElementById('savedQuizzesList');
    const savedQuizzes = loadFromStorage(STORAGE_KEYS.SAVED_QUIZZES, []);

    if (savedQuizzes.length === 0) {
        container.innerHTML = `<p style="color: white; text-align: center; padding: 20px;">${translations[currentLanguage].noSavedQuizzes}</p>`;
        return;
    }

    container.innerHTML = savedQuizzes.map(quiz => {
        const date = new Date(quiz.savedDate);
        const dateStr = date.toLocaleString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="saved-quiz-item">
                <div class="saved-quiz-info">
                    <div class="saved-quiz-name">${quiz.name}</div>
                    <div class="saved-quiz-meta">${quiz.questionCount} ${translations[currentLanguage].questions} • ${translations[currentLanguage].savedOn} ${dateStr}</div>
                </div>
                <div class="saved-quiz-actions">
                    <button class="btn-load" onclick="loadQuizSet(${quiz.id})">${translations[currentLanguage].loadBtn}</button>
                    <button class="btn-delete" onclick="deleteQuizSet(${quiz.id})">${translations[currentLanguage].deleteBtn}</button>
                </div>
            </div>
        `;
    }).join('');
}

// Statistics functions
function toggleStatistics() {
    const statsSection = document.getElementById('statisticsSection');
    const statsBtn = document.getElementById('statsToggleBtn');
    const isHidden = statsSection.classList.contains('hidden');

    if (isHidden) {
        statsSection.classList.remove('hidden');
        statsBtn.innerHTML = `📊 <span data-i18n="hideStatistics">${translations[currentLanguage].hideStatistics}</span>`;
        displayStatistics();
        statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        statsSection.classList.add('hidden');
        statsBtn.innerHTML = `📊 <span data-i18n="viewStatistics">${translations[currentLanguage].viewStatistics}</span>`;
    }
}

function displayStatistics() {
    const history = quizHistory;

    if (history.length === 0) {
        document.getElementById('statsGrid').innerHTML = `
            <p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
                ${translations[currentLanguage].noHistory}
            </p>
        `;
        document.getElementById('historyTableContainer').innerHTML = '';
        return;
    }

    // Calculate statistics
    const totalAttempts = history.length;
    const scores = history.map(h => parseFloat(h.score));
    const averageScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    const highestScore = Math.max(...scores).toFixed(1);
    const lowestScore = Math.min(...scores).toFixed(1);

    // Display stat cards
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">${translations[currentLanguage].totalAttempts}</div>
            <div class="stat-value">${totalAttempts}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">${translations[currentLanguage].averageScore}</div>
            <div class="stat-value">${averageScore}%</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">${translations[currentLanguage].highestScore}</div>
            <div class="stat-value">${highestScore}%</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">${translations[currentLanguage].lowestScore}</div>
            <div class="stat-value">${lowestScore}%</div>
        </div>
    `;

    // Display history table
    const historyTableContainer = document.getElementById('historyTableContainer');
    historyTableContainer.innerHTML = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>${translations[currentLanguage].date}</th>
                    <th>${translations[currentLanguage].score}</th>
                    <th>${translations[currentLanguage].totalQuestions}</th>
                    <th>${translations[currentLanguage].correctAnswers}</th>
                    <th>${translations[currentLanguage].incorrectAnswers}</th>
                </tr>
            </thead>
            <tbody>
                ${history.map(entry => {
                    const date = new Date(entry.date);
                    const dateStr = date.toLocaleString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    const scoreBadgeClass = getScoreBadgeClass(entry.score);

                    return `
                        <tr>
                            <td>${dateStr}</td>
                            <td><span class="score-badge ${scoreBadgeClass}">${entry.score}%</span></td>
                            <td>${entry.total}</td>
                            <td style="color: #4caf50; font-weight: 600;">${entry.correct}</td>
                            <td style="color: #ff5722; font-weight: 600;">${entry.incorrect}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function getScoreBadgeClass(score) {
    const s = parseFloat(score);
    if (s >= 90) return 'score-excellent';
    if (s >= 70) return 'score-good';
    if (s >= 50) return 'score-average';
    return 'score-poor';
}

function clearHistory() {
    if (confirm(translations[currentLanguage].confirmClearHistory)) {
        quizHistory = [];
        saveToStorage(STORAGE_KEYS.HISTORY, []);
        displayStatistics();
    }
}

// Translations
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

function parseQuestions(text) {
    const questions = [];
    const lines = text.trim().split('\n');
    let currentQuestion = null;
    let questionNumber = 0;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Format 1: Câu hỏi bắt đầu bằng số (1. 2. 3.)
        const numberedQuestionMatch = line.match(/^(\d+)\.\s*(.+)/);
        if (numberedQuestionMatch) {
            if (currentQuestion) {
                questions.push(currentQuestion);
            }
            questionNumber = parseInt(numberedQuestionMatch[1]);
            currentQuestion = {
                number: questionNumber,
                question: numberedQuestionMatch[2],
                options: []
            };
            continue;
        }

        // Kiểm tra dòng đáp án (a. b. c. hoặc A. B. C.)
        const optionMatch = line.match(/^([a-zA-Z])\.\s*(.+)/);
        if (optionMatch && currentQuestion) {
            currentQuestion.options.push({
                letter: optionMatch[1].toLowerCase(),
                text: optionMatch[2]
            });
            continue;
        }

        // Format 2: Câu hỏi không có số (dòng text, thường kết thúc bằng ?)
        // Chỉ coi là câu hỏi mới nếu chưa có currentQuestion hoặc đã có đáp án
        if (line.includes('?') && (!currentQuestion || currentQuestion.options.length > 0)) {
            if (currentQuestion && currentQuestion.options.length > 0) {
                questions.push(currentQuestion);
            }
            questionNumber++;
            currentQuestion = {
                number: questionNumber,
                question: line,
                options: []
            };
            continue;
        }

        // Các dòng khác (list items: - 1., - I., etc) -> append vào câu hỏi
        if (currentQuestion && currentQuestion.options.length === 0) {
            currentQuestion.question += '\n' + line;
        }
    }

    if (currentQuestion && currentQuestion.options.length > 0) {
        questions.push(currentQuestion);
    }

    return questions;
}

function parseAnswers(text) {
    const answers = {};
    const lines = text.trim().split(/[\n]+/);

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Match pattern: 1. a hoặc 1. a,b,c hoặc 1. abc hoặc 1.a 1.b 1.c
        const match = line.match(/^(\d+)\.\s*(.+)/);
        if (match) {
            const questionNum = parseInt(match[1]);
            let answerPart = match[2].trim();

            // Xử lý các format: "a,b,c" hoặc "abc" hoặc "a b c"
            answerPart = answerPart.replace(/\s+/g, ''); // Remove spaces

            // Nếu có dấu phẩy, split by comma
            if (answerPart.includes(',')) {
                answers[questionNum] = answerPart.split(',').map(a => a.toLowerCase().trim());
            } else if (answerPart.length > 1 && /^[a-z]+$/i.test(answerPart)) {
                // Nếu là chuỗi nhiều chữ cái liên tiếp (abc)
                answers[questionNum] = answerPart.toLowerCase().split('');
            } else {
                // Đáp án đơn
                answers[questionNum] = answerPart.toLowerCase();
            }
        }
    }

    return answers;
}

function validateQuizData(questions, answers) {
    const errors = [];
    const questionNumbers = new Set();

    questions.forEach(question => {
        if (questionNumbers.has(question.number)) {
            errors.push(`Câu ${question.number}: số thứ tự bị trùng.`);
        }
        questionNumbers.add(question.number);

        if (!question.options || question.options.length < 2) {
            errors.push(`Câu ${question.number}: cần ít nhất 2 lựa chọn.`);
            return;
        }

        const optionLetters = question.options.map(option => option.letter);
        const uniqueLetters = new Set(optionLetters);
        if (uniqueLetters.size !== optionLetters.length) {
            errors.push(`Câu ${question.number}: ký tự lựa chọn bị trùng.`);
        }

        const answer = answers[question.number];
        if (!answer) {
            errors.push(`Câu ${question.number}: thiếu đáp án.`);
            return;
        }

        const answerLetters = Array.isArray(answer) ? answer : [answer];
        const invalidLetters = answerLetters.filter(letter => !uniqueLetters.has(letter));
        if (invalidLetters.length > 0) {
            errors.push(`Câu ${question.number}: đáp án ${invalidLetters.join(', ').toUpperCase()} không tồn tại trong các lựa chọn.`);
        }
    });

    Object.keys(answers).forEach(number => {
        const questionNumber = parseInt(number);
        if (!questionNumbers.has(questionNumber)) {
            errors.push(`Đáp án câu ${questionNumber}: không có câu hỏi tương ứng.`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
        questionCount: questions.length,
        answerCount: Object.keys(answers).length
    };
}

function renderValidationSummary(validation) {
    const container = document.getElementById('validationSummary');
    if (!container) return;

    container.className = `validation-summary visible ${validation.valid ? 'success' : 'error'}`;
    if (validation.valid) {
        container.innerHTML = `<strong>✓ Dữ liệu hợp lệ</strong><span>${validation.questionCount} câu hỏi và ${validation.answerCount} đáp án đã khớp.</span>`;
        return;
    }

    const visibleErrors = validation.errors.slice(0, 8);
    const remaining = validation.errors.length - visibleErrors.length;
    container.innerHTML = `
        <strong>✗ Chưa thể tạo quiz — phát hiện ${validation.errors.length} lỗi</strong>
        <ul>${visibleErrors.map(error => `<li>${error}</li>`).join('')}</ul>
        ${remaining > 0 ? `<div>… và ${remaining} lỗi khác.</div>` : ''}
    `;
}

function clearValidationSummary() {
    const container = document.getElementById('validationSummary');
    if (!container) return;
    container.className = 'validation-summary';
    container.innerHTML = '';
}

function isMultipleAnswer(questionNumber) {
    const answer = correctAnswers[questionNumber];
    return Array.isArray(answer);
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function shuffleQuestionChoices(questions, answers) {
    // Shuffle choices for each question and update correct answers
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    questions.forEach(q => {
        if (q.options && q.options.length > 0) {
            // Create mapping of old letter to new letter
            const oldLetters = q.options.map(opt => opt.letter);

            // Shuffle options
            const shuffledOptions = shuffleArray([...q.options]);

            // Create letter mapping
            const letterMapping = {};
            shuffledOptions.forEach((opt, index) => {
                letterMapping[opt.letter] = letters[index];
                opt.letter = letters[index]; // Update letter in option
            });

            // Update question options
            q.options = shuffledOptions;

            // Update correct answer for this question
            const correctAnswer = answers[q.number];
            if (correctAnswer) {
                if (Array.isArray(correctAnswer)) {
                    // Multiple answers
                    answers[q.number] = correctAnswer.map(letter => letterMapping[letter] || letter);
                } else {
                    // Single answer
                    answers[q.number] = letterMapping[correctAnswer] || correctAnswer;
                }
            }
        }
    });
}

function generateQuiz(specificQuestions = null) {
    let questionsText, answersText;

    if (specificQuestions) {
        // Tạo quiz từ câu hỏi cụ thể (pin hoặc sai)
        questionsText = originalQuestionsText;
        answersText = originalAnswersText;
    } else {
        // Tạo quiz mới từ input
        questionsText = document.getElementById('questionsInput').value;
        answersText = document.getElementById('answersInput').value;
        originalQuestionsText = questionsText;
        originalAnswersText = answersText;
        pinnedQuestions.clear();
        incorrectQuestions.clear();
        isGraded = false;
        clearQuizProgress(); // Clear saved progress when starting new quiz
    }

    const shouldShuffle = document.getElementById('shuffleCheckbox').checked;

    if (!questionsText.trim() || !answersText.trim()) {
        alert(translations[currentLanguage].alertNoData);
        return;
    }

    // Parse dữ liệu
    let allQuestions = parseQuestions(questionsText);
    correctAnswers = parseAnswers(answersText);

    if (allQuestions.length === 0) {
        alert(translations[currentLanguage].alertNoQuestions);
        return;
    }

    const validation = validateQuizData(allQuestions, correctAnswers);
    renderValidationSummary(validation);
    if (!validation.valid) {
        document.getElementById('validationSummary')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // Lọc câu hỏi nếu có specificQuestions
    if (specificQuestions) {
        quizData = allQuestions.filter(q => specificQuestions.has(q.number));
        if (quizData.length === 0) {
            alert(translations[currentLanguage].alertNoRetry);
            return;
        }
    } else {
        quizData = allQuestions;

        const questionOrder = document.querySelector('input[name="questionOrder"]:checked')?.value || 'sequential';

        if (questionOrder === 'random') {
            // Chọn NGẪU NHIÊN: xáo toàn bộ trước, sau đó lấy N câu
            quizData = shuffleArray([...quizData]);

            // Áp dụng số lượng câu hỏi
            const questionCountInput = document.getElementById('questionCount');
            const questionCount = parseInt(questionCountInput?.value);
            if (questionCount && questionCount > 0 && questionCount < quizData.length) {
                quizData = quizData.slice(0, questionCount);
            }
        } else {
            // Chọn TRÌNH TỰ: lấy từ câu bắt đầu
            const startQuestionInput = document.getElementById('startQuestion');
            const startQuestion = parseInt(startQuestionInput?.value) || 1;
            const startIndex = Math.max(0, startQuestion - 1); // Convert to 0-based index

            const questionCountInput = document.getElementById('questionCount');
            const questionCount = parseInt(questionCountInput?.value);

            // Bắt đầu từ câu startQuestion
            if (startIndex > 0 || questionCount) {
                const endIndex = questionCount && questionCount > 0
                    ? Math.min(startIndex + questionCount, quizData.length)
                    : quizData.length;
                quizData = quizData.slice(startIndex, endIndex);
            }

            // Sau đó nếu có checkbox "Xáo trộn đề" thì mới xáo
            if (shouldShuffle) {
                quizData = shuffleArray([...quizData]);
            }
        }
    }

    // Check if quizData is empty after slicing/filtering
    if (quizData.length === 0) {
        alert(translations[currentLanguage].alertNoQuestions || 'Không có câu hỏi nào để hiển thị. Vui lòng kiểm tra lại số câu bắt đầu hoặc số lượng câu hỏi.');
        return;
    }

    // Shuffle choices if enabled
    const shouldShuffleChoices = document.getElementById('shuffleChoicesCheckbox').checked;
    if (shouldShuffleChoices) {
        shuffleQuestionChoices(quizData, correctAnswers);
    }

    // Tạo mapping
    questionMapping = {};
    quizData.forEach((q, index) => {
        questionMapping[index] = q.number;
    });

    // Reset trạng thái
    isGraded = false;
    document.getElementById('retryIncorrectBtn').classList.add('hidden');
    document.getElementById('retryPinnedBtn').classList.add('hidden');
    document.getElementById('filterSection').style.display = 'none';

    // Start timer if exam mode is enabled
    if (examModeEnabled) {
        // Stop any existing timer first to prevent multiple intervals
        stopTimer();
        const hours = parseInt(document.getElementById('timerHours').value) || 0;
        const minutes = parseInt(document.getElementById('timerMinutes').value) || 30;
        timeRemaining = (hours * 3600) + (minutes * 60);
        startTimer();
    }

    // Hiển thị quiz
    try {
        console.log('Starting displayQuiz with quizData:', quizData);
        displayQuiz();
        document.getElementById('inputSection').classList.add('hidden');
        document.getElementById('quizSection').classList.remove('hidden');
        document.getElementById('resultSection').classList.add('hidden');

        // Show and reset progress bar
        document.getElementById('progressContainer').style.display = 'block';
        resetProgressBar();

        // Check if practice mode is enabled
        practiceModeEnabled = document.getElementById('practiceModeCheckbox').checked;

        // Ẩn AI prompts section khi vào quiz mode
        const aiPromptsSection = document.querySelector('.ai-prompts-section');
        if (aiPromptsSection) {
            aiPromptsSection.style.display = 'none';
        }

        // Scroll to top of page
        window.scrollTo(0, 0);
        console.log('Quiz displayed successfully');

        // Save quiz state for restoration (only if not specificQuestions - i.e., not retry/filter)
        if (!specificQuestions) {
            saveQuizState();
        }
    } catch (error) {
        console.error('Error displaying quiz:', error);
        alert('Lỗi khi hiển thị quiz: ' + error.message + '\nVui lòng mở Console (F12) để xem chi tiết.');
    }
}

// Parse [IMG:...] tags and convert to HTML <img> tags
function parseQuestionImages(questionText) {
    // Replace [IMGx:filename] placeholders with actual images from storage
    let result = questionText.replace(/\[(IMG\d+):[^\]]+\]/g, (match, imageId) => {
        const base64 = imageStorage[imageId];
        if (base64) {
            return `<img src="${base64}" class="question-image" alt="Question image" onclick="openImageModal(this.src)" />`;
        }
        return match; // Keep original if not found
    });

    // Also support old format [IMG:data:image...] for backward compatibility
    result = result.replace(/\[IMG:(data:image[^\]]+)\]/g, (match, src) => {
        return `<img src="${src}" class="question-image" alt="Question image" onclick="openImageModal(this.src)" />`;
    });

    return result;
}

// Open image in modal for full-size viewing
function openImageModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modal.style.display = 'flex';
    modalImg.src = imageSrc;
    document.body.style.overflow = 'hidden'; // Prevent background scroll
}

// Close image modal
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function displayQuiz() {
    const container = document.getElementById('quizContainer');
    if (!container) {
        console.error('quizContainer element not found');
        alert('Lỗi: Không tìm thấy container để hiển thị quiz');
        return;
    }

    if (!quizData || quizData.length === 0) {
        console.error('quizData is empty or undefined');
        alert('Lỗi: Không có dữ liệu câu hỏi');
        return;
    }

    container.innerHTML = '';
    console.log('Displaying quiz with', quizData.length, 'questions');

    quizData.forEach((q, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        questionCard.id = `card${index}`;

        // Check nếu câu này đã được pin
        const originalNumber = q.number;
        const isPinned = pinnedQuestions.has(originalNumber);
        const isIncorrect = incorrectQuestions.has(originalNumber);

        if (isPinned) {
            questionCard.classList.add('pinned');
        }

        // Parse images in question text
        const questionWithImages = parseQuestionImages(q.question);

        let html = `
            <div class="question-header-container">
                <div class="question-header">${translations[currentLanguage].question} ${index + 1}</div>
                <button class="pin-button ${isPinned ? 'pinned' : 'unpinned'}"
                        onclick="togglePin(${index})"
                        id="pin${index}"
                        title="${isPinned ? translations[currentLanguage].unpinQuestion : translations[currentLanguage].pinQuestion}">
                    ${isPinned ? '📌' : '📍'}
                </button>
            </div>
            <div class="question-text">${questionWithImages}</div>
            <div class="options">
        `;

        const isMultiple = isMultipleAnswer(originalNumber);
        const inputType = isMultiple ? 'checkbox' : 'radio';

        q.options.forEach(option => {
            html += `
                <div class="option">
                    <input type="${inputType}"
                           name="question${index}"
                           value="${option.letter}"
                           id="q${index}_${option.letter}">
                    <label for="q${index}_${option.letter}">
                        ${option.letter.toUpperCase()}. ${option.text}
                    </label>
                </div>
            `;
        });

        html += `
            </div>
            <div class="question-result hidden" id="result${index}"></div>
        `;

        questionCard.innerHTML = html;
        container.appendChild(questionCard);
    });

    // Generate question navigator
    generateQuestionNavigator();

    // Setup answer change listeners
    setupAnswerListeners();

    // Restore saved progress
    restoreQuizProgress();

    // Enable inputs when displaying quiz (in case coming from retry)
    enableQuizInputs();

    // Scroll to top of quiz section
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function togglePin(index) {
    const originalNumber = questionMapping[index];
    const pinButton = document.getElementById(`pin${index}`);
    const card = document.getElementById(`card${index}`);

    if (pinnedQuestions.has(originalNumber)) {
        pinnedQuestions.delete(originalNumber);
        pinButton.classList.remove('pinned');
        pinButton.classList.add('unpinned');
        pinButton.textContent = '📍';
        pinButton.title = translations[currentLanguage].pinQuestion;
        card.classList.remove('pinned');
    } else {
        pinnedQuestions.add(originalNumber);
        pinButton.classList.remove('unpinned');
        pinButton.classList.add('pinned');
        pinButton.textContent = '📌';
        pinButton.title = translations[currentLanguage].unpinQuestion;
        card.classList.add('pinned');
    }

    // Save pinned questions to localStorage
    savePinnedQuestions();

    // Update navigator to show pinned status
    updateQuestionNavigator();

    // Update button visibility
    updateRetryButtons();
}

function submitQuiz() {
    // Stop timer if exam mode is active but keep exam mode enabled for restart
    if (examModeEnabled) {
        stopTimer();
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unanswered = 0;

    // Clear previous incorrect questions
    incorrectQuestions.clear();

    quizData.forEach((q, index) => {
        const originalNumber = questionMapping[index];
        const resultDiv = document.getElementById(`result${index}`);
        resultDiv.classList.remove('hidden');

        const isMultiple = isMultipleAnswer(originalNumber);
        let userAnswer;
        let isCorrect = false;

        if (isMultiple) {
            // Checkbox - multiple answers
            const selectedOptions = document.querySelectorAll(`input[name="question${index}"]:checked`);
            if (selectedOptions.length === 0) {
                userAnswer = null;
            } else {
                userAnswer = Array.from(selectedOptions).map(opt => opt.value).sort();
                const correctAnswer = correctAnswers[originalNumber].slice().sort();

                // So sánh arrays
                isCorrect = userAnswer.length === correctAnswer.length &&
                           userAnswer.every((val, idx) => val === correctAnswer[idx]);
            }
        } else {
            // Radio - single answer
            const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
            if (!selectedOption) {
                userAnswer = null;
            } else {
                userAnswer = selectedOption.value;
                isCorrect = userAnswer === correctAnswers[originalNumber];
            }
        }

        // Display result
        if (userAnswer === null) {
            const correctAnswerDisplay = Array.isArray(correctAnswers[originalNumber])
                ? correctAnswers[originalNumber].map(a => a.toUpperCase()).join(', ')
                : correctAnswers[originalNumber].toUpperCase();
            resultDiv.className = 'question-result incorrect';
            resultDiv.textContent = `${translations[currentLanguage].unanswered} ${correctAnswerDisplay}`;
            unanswered++;
            incorrectCount++;
            incorrectQuestions.add(originalNumber);
        } else if (isCorrect) {
            resultDiv.className = 'question-result correct';
            resultDiv.textContent = translations[currentLanguage].correct;
            correctCount++;
        } else {
            const correctAnswerDisplay = Array.isArray(correctAnswers[originalNumber])
                ? correctAnswers[originalNumber].map(a => a.toUpperCase()).join(', ')
                : correctAnswers[originalNumber].toUpperCase();
            resultDiv.className = 'question-result incorrect';
            resultDiv.textContent = `${translations[currentLanguage].incorrect} ${correctAnswerDisplay}`;
            incorrectCount++;
            incorrectQuestions.add(originalNumber);
        }
    });

    isGraded = true;
    displayResults(correctCount, incorrectCount, unanswered);
    updateRetryButtons();
    updateQuestionNavigator(); // Update navigator with results

    // Disable all inputs after grading
    disableQuizInputs();

    // Show filter section after grading
    if (isGraded) {
        document.getElementById('filterSection').style.display = 'block';

        // Reset filter to 'all' and set active button
        currentFilter = 'all';
        document.querySelectorAll('.filter-button').forEach(btn => {
            btn.classList.remove('active');
        });
        // Set first button (All) as active
        const allButton = document.querySelector('.filter-button[onclick*="all"]');
        if (allButton) {
            allButton.classList.add('active');
        }

        // Show all questions
        quizData.forEach((q, index) => {
            const card = document.getElementById(`card${index}`);
            if (card) {
                card.style.display = 'block';
            }
        });
    }

    // Clear auto-saved progress after submitting
    clearQuizProgress();

    // Scroll to top of page
    window.scrollTo(0, 0);
}

function disableQuizInputs() {
    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.disabled = true;
    });
}

function enableQuizInputs() {
    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.disabled = false;
    });
}

function updateRetryButtons() {
    const retryAllBtn = document.getElementById('retryAllBtn');
    const retryIncorrectBtn = document.getElementById('retryIncorrectBtn');
    const retryPinnedBtn = document.getElementById('retryPinnedBtn');

    // Only show retry buttons after quiz is graded
    if (isGraded) {
        retryAllBtn.classList.remove('hidden');
    } else {
        retryAllBtn.classList.add('hidden');
    }

    if (isGraded && incorrectQuestions.size > 0) {
        retryIncorrectBtn.classList.remove('hidden');
    } else {
        retryIncorrectBtn.classList.add('hidden');
    }

    if (isGraded && pinnedQuestions.size > 0) {
        retryPinnedBtn.classList.remove('hidden');
    } else {
        retryPinnedBtn.classList.add('hidden');
    }
}

function displayResults(correct, incorrect, unanswered) {
    const total = quizData.length;
    const percentage = ((correct / total) * 100).toFixed(1);

    // Save to quiz history
    saveQuizHistory(percentage, total, correct, incorrect, unanswered);

    const resultSection = document.getElementById('resultSection');
    resultSection.innerHTML = `
        <h2>${translations[currentLanguage].resultTitle}</h2>
        <div class="score-display">${percentage}%</div>
        <div class="result-details">
            <div class="result-item">
                <h3>${translations[currentLanguage].totalQuestions}</h3>
                <p>${total}</p>
            </div>
            <div class="result-item">
                <h3>${translations[currentLanguage].correctAnswers}</h3>
                <p style="color: #38ef7d;">${correct}</p>
            </div>
            <div class="result-item">
                <h3>${translations[currentLanguage].incorrectAnswers}</h3>
                <p style="color: #ff6b6b;">${incorrect}</p>
            </div>
            ${unanswered > 0 ? `
            <div class="result-item">
                <h3>${translations[currentLanguage].unansweredQuestions}</h3>
                <p style="color: #ffd93d;">${unanswered}</p>
            </div>
            ` : ''}
        </div>
    `;
    resultSection.classList.remove('hidden');

    // Move result section to top of quiz (after progress bar)
    const progressContainer = document.getElementById('progressContainer');
    if (progressContainer && progressContainer.parentNode) {
        // Insert result section right after progress bar
        progressContainer.parentNode.insertBefore(resultSection, progressContainer.nextSibling);
    }

    // Scroll to top to see results
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToEdit() {
    // Confirm before going back (will NOT save progress)
    if (!confirm(translations[currentLanguage].confirmBackToEdit)) {
        return;
    }

    // Stop timer if running
    if (examModeEnabled) {
        stopTimer();
        examModeEnabled = false;
        document.getElementById('examModeCheckbox').checked = false;
        document.getElementById('fixedRightTimer').classList.remove('active');
        document.getElementById('timerHours').disabled = false;
        document.getElementById('timerMinutes').disabled = false;
    }

    // Hide all quiz panels
    const navigator = document.getElementById('questionNavigator');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const fixedControlPanel = document.getElementById('fixedControlPanel');

    navigator.classList.remove('active');
    navigator.classList.remove('open');
    sidebarToggleBtn.classList.remove('active');
    fixedControlPanel.classList.remove('active');

    // Ensure fixedControlPanel is completely hidden
    if (fixedControlPanel) {
        fixedControlPanel.style.display = 'none';
    }

    // Show input section, hide quiz and result sections
    document.getElementById('inputSection').classList.remove('hidden');
    document.getElementById('quizSection').classList.add('hidden');
    document.getElementById('resultSection').classList.add('hidden');

    // Enable all checkboxes in setup section (exam mode, practice mode, shuffle, etc.)
    const setupCheckboxes = document.querySelectorAll('#inputSection input[type="checkbox"]');
    setupCheckboxes.forEach(checkbox => {
        checkbox.disabled = false;
    });

    // Also enable radio buttons for question order
    const setupRadios = document.querySelectorAll('#inputSection input[type="radio"]');
    setupRadios.forEach(radio => {
        radio.disabled = false;
    });

    // Hiện lại AI prompts section khi quay về edit mode
    const aiPromptsSection = document.querySelector('.ai-prompts-section');
    if (aiPromptsSection) {
        aiPromptsSection.style.display = 'block';
    }

    // Scroll to input section
    document.getElementById('inputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function restartQuiz() {
    // Confirm before restarting
    if (!confirm(translations[currentLanguage].confirmRestart)) {
        return;
    }

    // Reset timer to original time if exam mode is enabled
    if (examModeEnabled) {
        stopTimer();
        const hours = parseInt(document.getElementById('timerHours').value) || 0;
        const minutes = parseInt(document.getElementById('timerMinutes').value) || 30;
        timeRemaining = (hours * 3600) + (minutes * 60);
        startTimer();
    }

    // Clear answers but keep questions
    isGraded = false;
    incorrectQuestions.clear();

    // Clear all answer selections and enable inputs
    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.checked = false;
    });
    enableQuizInputs();

    // Clear result displays
    document.querySelectorAll('.question-result').forEach(result => {
        result.classList.add('hidden');
    });

    // Hide result section and retry buttons
    document.getElementById('resultSection').classList.add('hidden');
    document.getElementById('retryIncorrectBtn').classList.add('hidden');
    document.getElementById('filterSection').style.display = 'none';

    // Update navigator
    updateQuestionNavigator();

    // Scroll to top of quiz
    document.getElementById('quizSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Question Navigator functions
function generateQuestionNavigator() {
    const navList = document.getElementById('questionNavList');
    navList.innerHTML = '';

    quizData.forEach((q, index) => {
        const navItem = document.createElement('div');
        navItem.className = 'question-nav-item';
        navItem.id = `nav-q${index}`;
        navItem.textContent = index + 1;
        navItem.onclick = () => navigateToQuestion(index);
        navList.appendChild(navItem);
    });

    // Show navigator and toggle button
    document.getElementById('questionNavigator').classList.add('active');
    document.getElementById('sidebarToggleBtn').classList.add('active');

    // Show fixed right timer and control panel if exam mode enabled
    if (examModeEnabled) {
        document.getElementById('fixedRightTimer').classList.add('active');
    }

    // Always show control panel when quiz is displayed
    const controlPanel = document.getElementById('fixedControlPanel');
    controlPanel.classList.add('active');
    controlPanel.style.display = ''; // Clear inline style

    // Initial update to show pinned status
    updateQuestionNavigator();
}

function toggleSidebar() {
    const sidebar = document.getElementById('questionNavigator');
    sidebar.classList.toggle('open');
}


function updateQuestionNavigator() {
    quizData.forEach((q, index) => {
        const navItem = document.getElementById(`nav-q${index}`);
        if (!navItem) return;

        // Reset classes
        navItem.className = 'question-nav-item';

        // Check if answered
        const originalNumber = questionMapping[index];
        const isPinned = pinnedQuestions.has(originalNumber);
        const isMultiple = isMultipleAnswer(originalNumber);
        let isAnswered = false;

        if (isMultiple) {
            const selectedOptions = document.querySelectorAll(`input[name="question${index}"]:checked`);
            isAnswered = selectedOptions.length > 0;
        } else {
            const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
            isAnswered = selectedOption !== null;
        }

        // Add pinned class if this question is pinned
        if (isPinned) {
            navItem.classList.add('pinned');
        }

        if (isAnswered) {
            navItem.classList.add('answered');
        }

        // If graded, show correct/incorrect
        if (isGraded) {
            if (incorrectQuestions.has(originalNumber)) {
                navItem.classList.remove('answered');
                navItem.classList.add('incorrect');
            } else {
                navItem.classList.remove('answered');
                navItem.classList.add('correct');
            }
        }
    });
}

function navigateToQuestion(index) {
    const questionCard = document.getElementById(`card${index}`);
    if (questionCard) {
        // Remove current highlight from all nav items
        document.querySelectorAll('.question-nav-item').forEach(item => {
            item.classList.remove('current');
        });

        // Add current highlight
        const navItem = document.getElementById(`nav-q${index}`);
        if (navItem) {
            navItem.classList.add('current');
        }

        // Scroll to question
        questionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Remove highlight after 2 seconds
        setTimeout(() => {
            if (navItem) {
                navItem.classList.remove('current');
            }
        }, 2000);
    }
}

// Setup answer change listeners
function setupAnswerListeners() {
    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', (e) => {
            updateQuestionNavigator();
            updateProgressBar(e);

            // Practice mode: show instant feedback
            if (practiceModeEnabled) {
                showInstantFeedback(e);
            }

            // Auto-save progress
            saveQuizProgress();
        });
    });
}

function saveQuizProgress() {
    const progress = {};
    quizData.forEach((q, index) => {
        const inputs = document.querySelectorAll(`input[name="question${index}"]:checked`);
        if (inputs.length > 0) {
            progress[index] = Array.from(inputs).map(input => input.value);
        }
    });
    saveToStorage(STORAGE_KEYS.QUIZ_PROGRESS, progress);
}

function restoreQuizProgress() {
    const progress = loadFromStorage(STORAGE_KEYS.QUIZ_PROGRESS);
    if (!progress) return;

    Object.keys(progress).forEach(questionIndex => {
        const answers = progress[questionIndex];
        answers.forEach(answer => {
            const input = document.getElementById(`q${questionIndex}_${answer}`);
            if (input) {
                input.checked = true;
                // Trigger change event to update progress bar
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    });
}

function clearQuizProgress() {
    localStorage.removeItem(STORAGE_KEYS.QUIZ_PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.QUIZ_STATE);
    // Hide continue button when progress is cleared
    const continueBtn = document.getElementById('continueQuizBtn');
    if (continueBtn) {
        continueBtn.style.display = 'none';
    }
}

function checkAndShowContinueButton() {
    const savedProgress = loadFromStorage(STORAGE_KEYS.QUIZ_PROGRESS);
    const savedState = loadFromStorage(STORAGE_KEYS.QUIZ_STATE);
    const continueBtn = document.getElementById('continueQuizBtn');
    const continueInfo = document.getElementById('continueQuizInfo');

    if (savedProgress && Object.keys(savedProgress).length > 0 && savedState) {
        // Show continue button
        continueBtn.style.display = 'block';

        // Show info about saved progress
        const answeredCount = Object.keys(savedProgress).filter(key => savedProgress[key].length > 0).length;

        if (currentLanguage === 'vi') {
            continueInfo.textContent = `Đã làm ${answeredCount} câu`;
        } else {
            continueInfo.textContent = `${answeredCount} questions answered`;
        }

        return;
    }

    // Hide continue button if no saved progress
    continueBtn.style.display = 'none';
}

function saveQuizState() {
    const state = {
        quizData: quizData,
        questionMapping: questionMapping,
        correctAnswers: correctAnswers,
        originalQuestionsText: originalQuestionsText,
        originalAnswersText: originalAnswersText,
        examModeEnabled: examModeEnabled,
        practiceModeEnabled: practiceModeEnabled,
        timeRemaining: timeRemaining
    };
    saveToStorage(STORAGE_KEYS.QUIZ_STATE, state);
}

function continueQuiz() {
    // Load saved quiz state
    const savedState = loadFromStorage(STORAGE_KEYS.QUIZ_STATE);
    if (!savedState) {
        // Fallback to generating new quiz if no saved state
        generateQuiz();
        return;
    }

    // Restore quiz state
    quizData = savedState.quizData;
    questionMapping = savedState.questionMapping;
    correctAnswers = savedState.correctAnswers;
    originalQuestionsText = savedState.originalQuestionsText;
    originalAnswersText = savedState.originalAnswersText;
    examModeEnabled = savedState.examModeEnabled;
    practiceModeEnabled = savedState.practiceModeEnabled;
    timeRemaining = savedState.timeRemaining;

    // Show quiz section, hide input section
    const inputSection = document.getElementById('inputSection');
    const quizSection = document.getElementById('quizSection');

    if (!inputSection) {
        console.error('inputSection not found!');
    } else {
        inputSection.classList.add('hidden');
        console.log('inputSection hidden');
    }

    if (!quizSection) {
        console.error('quizSection not found!');
    } else {
        quizSection.classList.remove('hidden');
        console.log('quizSection shown');
    }

    // Also hide result section
    const resultSection = document.getElementById('resultSection');
    if (resultSection) {
        resultSection.classList.add('hidden');
    }

    // Hide AI prompts section
    const aiPromptsSection = document.querySelector('.ai-prompts-section');
    if (aiPromptsSection) {
        aiPromptsSection.style.display = 'none';
        console.log('AI prompts section hidden');
    }

    // Hide statistics section
    const statisticsSection = document.getElementById('statisticsSection');
    if (statisticsSection) {
        statisticsSection.classList.add('hidden');
        console.log('Statistics section hidden');
    }

    // Build quiz HTML
    const container = document.getElementById('quizContainer');
    if (!container) {
        console.error('quizContainer not found!');
        alert('Lỗi: Không tìm thấy container để hiển thị quiz');
        return;
    }

    container.innerHTML = '';

    quizData.forEach((q, index) => {
        const originalNumber = questionMapping[index];
        const isPinned = pinnedQuestions.has(originalNumber);
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        questionCard.id = `card${index}`;
        if (isPinned) questionCard.classList.add('pinned');

        // Handle images in question text
        const questionWithImages = parseQuestionImages(q.question);

        let html = `
            <div class="question-header-container">
                <div class="question-header">${translations[currentLanguage].question} ${index + 1}</div>
                <button class="pin-button ${isPinned ? 'pinned' : 'unpinned'}"
                        onclick="togglePin(${index})"
                        id="pin${index}"
                        title="${isPinned ? translations[currentLanguage].unpinQuestion : translations[currentLanguage].pinQuestion}">
                    ${isPinned ? '📌' : '📍'}
                </button>
            </div>
            <div class="question-text">${questionWithImages}</div>
            <div class="options">
        `;

        const isMultiple = isMultipleAnswer(originalNumber);
        const inputType = isMultiple ? 'checkbox' : 'radio';

        q.options.forEach(option => {
            html += `
                <div class="option">
                    <input type="${inputType}"
                           name="question${index}"
                           value="${option.letter}"
                           id="q${index}_${option.letter}">
                    <label for="q${index}_${option.letter}">
                        ${option.letter.toUpperCase()}. ${option.text}
                    </label>
                </div>
            `;
        });

        html += `
            </div>
            <div class="question-result hidden" id="result${index}"></div>
        `;

        questionCard.innerHTML = html;
        container.appendChild(questionCard);
    });

    // Start exam timer if needed
    if (examModeEnabled && timeRemaining > 0) {
        startTimer();
    }

    // Show navigator and toggle button
    const questionNavigator = document.getElementById('questionNavigator');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    if (questionNavigator) questionNavigator.classList.add('active');
    if (sidebarToggleBtn) sidebarToggleBtn.classList.add('active');

    // Show fixed right timer and control panel if exam mode enabled
    if (examModeEnabled) {
        const fixedRightTimer = document.getElementById('fixedRightTimer');
        if (fixedRightTimer) fixedRightTimer.classList.add('active');
    }

    // Always show control panel when quiz is displayed
    const controlPanel = document.getElementById('fixedControlPanel');
    if (controlPanel) {
        controlPanel.classList.add('active');
        controlPanel.style.display = ''; // Clear inline style
    }

    // Show and reset progress bar
    const progressContainer = document.getElementById('progressContainer');
    if (progressContainer) {
        progressContainer.style.display = 'block';
    }

    // Generate question navigator
    generateQuestionNavigator();

    // Setup answer change listeners
    setupAnswerListeners();

    // Restore saved progress (this will update progress bar)
    restoreQuizProgress();

    // Enable inputs when displaying quiz
    enableQuizInputs();

    // Scroll to quiz section
    const quizSectionElement = document.getElementById('quizSection');
    if (quizSectionElement) {
        quizSectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showInstantFeedback(event) {
    // Extract question index from input name
    const questionIndex = parseInt(event.target.name.replace('question', ''));
    const originalNumber = questionMapping[questionIndex];
    const resultDiv = document.getElementById(`result${questionIndex}`);

    // Get user's answer
    const isMultiple = isMultipleAnswer(originalNumber);
    let userAnswer;
    let isCorrect = false;

    if (isMultiple) {
        const selectedOptions = document.querySelectorAll(`input[name="question${questionIndex}"]:checked`);
        if (selectedOptions.length === 0) {
            resultDiv.classList.add('hidden');
            return;
        }
        userAnswer = Array.from(selectedOptions).map(opt => opt.value).sort();
        const correctAnswer = correctAnswers[originalNumber].slice().sort();
        isCorrect = userAnswer.length === correctAnswer.length &&
                   userAnswer.every((val, idx) => val === correctAnswer[idx]);
    } else {
        const selectedOption = document.querySelector(`input[name="question${questionIndex}"]:checked`);
        if (!selectedOption) {
            resultDiv.classList.add('hidden');
            return;
        }
        userAnswer = selectedOption.value;
        isCorrect = userAnswer === correctAnswers[originalNumber];
    }

    // Show result
    resultDiv.classList.remove('hidden');
    if (isCorrect) {
        resultDiv.className = 'question-result correct';
        resultDiv.textContent = translations[currentLanguage].correct;
    } else {
        const correctAnswerDisplay = Array.isArray(correctAnswers[originalNumber])
            ? correctAnswers[originalNumber].map(a => a.toUpperCase()).join(', ')
            : correctAnswers[originalNumber].toUpperCase();
        resultDiv.className = 'question-result incorrect';
        resultDiv.textContent = `${translations[currentLanguage].incorrect} ${correctAnswerDisplay}`;
    }
}

function updateProgressBar(event) {
    // Extract question index from input name (e.g., "question0" -> 0)
    const questionIndex = parseInt(event.target.name.replace('question', ''));

    // Check if this question has any answer selected
    const inputType = event.target.type;
    let hasAnswer = false;

    if (inputType === 'radio') {
        // For radio, check if any radio is selected
        const selectedRadio = document.querySelector(`input[name="question${questionIndex}"]:checked`);
        hasAnswer = selectedRadio !== null;
    } else if (inputType === 'checkbox') {
        // For checkbox, check if any checkbox is checked
        const checkedBoxes = document.querySelectorAll(`input[name="question${questionIndex}"]:checked`);
        hasAnswer = checkedBoxes.length > 0;
    }

    // Update answeredQuestions set
    if (hasAnswer) {
        answeredQuestions.add(questionIndex);
    } else {
        answeredQuestions.delete(questionIndex);
    }

    // Update progress bar display
    const total = quizData ? quizData.length : 0;
    const answered = answeredQuestions.size;
    const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressBarFill = document.getElementById('progressBarFill');

    if (progressText && progressPercent && progressBarFill) {
        progressText.textContent = `${answered}/${total} câu`;
        progressPercent.textContent = `${percentage}%`;
        progressBarFill.style.width = `${percentage}%`;
    }
}

function resetProgressBar() {
    answeredQuestions.clear();
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressBarFill = document.getElementById('progressBarFill');

    if (progressText && progressPercent && progressBarFill && quizData) {
        progressText.textContent = `0/${quizData.length} câu`;
        progressPercent.textContent = '0%';
        progressBarFill.style.width = '0%';
    }
}

function retryAllQuestions() {
    // Retry all original questions
    generateQuiz();
}

function retryIncorrectQuestions() {
    if (incorrectQuestions.size === 0) {
        alert(translations[currentLanguage].alertNoIncorrect);
        return;
    }
    generateQuiz(incorrectQuestions);
}

function retryPinnedQuestions() {
    if (pinnedQuestions.size === 0) {
        alert(translations[currentLanguage].alertNoPinned);
        return;
    }
    generateQuiz(pinnedQuestions);
}

function filterQuestions(filterType) {
    currentFilter = filterType;

    // Update active filter button
    document.querySelectorAll('.filter-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filter question cards
    quizData.forEach((q, index) => {
        const card = document.getElementById(`card${index}`);
        const originalNumber = questionMapping[index];
        let shouldShow = false;

        switch(filterType) {
            case 'all':
                shouldShow = true;
                break;
            case 'pinned':
                shouldShow = pinnedQuestions.has(originalNumber);
                break;
            case 'incorrect':
                shouldShow = incorrectQuestions.has(originalNumber);
                break;
        }

        if (shouldShow) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// File import functions
async function handleQuizPairUpload(event) {
    const files = Array.from(event.target.files || []);
    const status = document.getElementById('quizPairStatus');
    const setStatus = (message, isError = false) => {
        status.textContent = message;
        status.style.color = isError ? '#ffe0e0' : 'white';
    };

    if (files.length !== 2) {
        setStatus(translations[currentLanguage].pairImportNeedTwoFiles, true);
        event.target.value = '';
        return;
    }

    setStatus(translations[currentLanguage].pairImportReading);

    try {
        const loaded = await Promise.all(files.map(async file => ({
            file,
            text: await readFile(file),
            normalizedName: file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        })));

        let questionFile = loaded.find(item => /(cau[\s_-]*hoi|questions?)/.test(item.normalizedName));
        let answerFile = loaded.find(item => /(dap[\s_-]*an|answers?)/.test(item.normalizedName));

        if (!questionFile || !answerFile || questionFile === answerFile) {
            const classified = loaded.map(item => ({
                ...item,
                parsedQuestions: parseQuestions(item.text),
                parsedAnswers: parseAnswers(item.text)
            }));
            questionFile = classified.find(item => item.parsedQuestions.length > 0);
            answerFile = classified.find(item => item !== questionFile && Object.keys(item.parsedAnswers).length > 0);
        }

        if (!questionFile || !answerFile) {
            throw new Error(translations[currentLanguage].pairImportUnrecognized);
        }

        const questions = parseQuestions(questionFile.text);
        const answers = parseAnswers(answerFile.text);
        const validation = validateQuizData(questions, answers);
        if (!validation.valid) {
            renderValidationSummary(validation);
            throw new Error(translations[currentLanguage].pairImportInvalid.replace('{count}', validation.errors.length));
        }

        document.getElementById('questionsInput').value = questionFile.text;
        document.getElementById('answersInput').value = answerFile.text;
        const quizName = questionFile.file.name
            .replace(/\.[^.]+$/, '')
            .replace(/[\s_-]*(c[aâ]u[\s_-]*h[oỏ]i|questions?)$/iu, '')
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        document.getElementById('quizNameInput').value = quizName;

        autoSaveQuestions();
        autoSaveAnswers();
        renderValidationSummary(validation);
        setStatus(translations[currentLanguage].pairImportSuccess
            .replace('{count}', questions.length)
            .replace('{name}', quizName || questionFile.file.name));
    } catch (error) {
        setStatus(`✗ ${error.message}`, true);
    } finally {
        event.target.value = '';
    }
}

async function handleQuestionsFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileInfo = document.getElementById('questionsFileInfo');
    fileInfo.textContent = `Đang xử lý: ${file.name}...`;

    try {
        const text = await readFile(file);
        document.getElementById('questionsInput').value = text;
        fileInfo.textContent = `✓ Đã import: ${file.name}`;
        fileInfo.style.color = '#28a745';

        // Auto-save
        autoSaveQuestions();
    } catch (error) {
        fileInfo.textContent = `✗ Lỗi: ${error.message}`;
        fileInfo.style.color = '#dc3545';
    }

    // Reset file input
    event.target.value = '';
}

async function handleAnswersFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileInfo = document.getElementById('answersFileInfo');
    fileInfo.textContent = `Đang xử lý: ${file.name}...`;

    try {
        const text = await readFile(file);
        document.getElementById('answersInput').value = text;
        fileInfo.textContent = `✓ Đã import: ${file.name}`;
        fileInfo.style.color = '#28a745';

        // Auto-save
        autoSaveAnswers();
    } catch (error) {
        fileInfo.textContent = `✗ Lỗi: ${error.message}`;
        fileInfo.style.color = '#dc3545';
    }

    // Reset file input
    event.target.value = '';
}

// Global image storage for base64 mapping
let imageStorage = {};
let imageCounter = 0;

// Handle image upload and convert to base64
async function handleImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const textarea = document.getElementById('questionsInput');
    const fileInfo = document.getElementById('questionsFileInfo');

    try {
        fileInfo.textContent = `Đang xử lý ${files.length} ảnh...`;
        fileInfo.style.color = '#667eea';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                throw new Error(`${file.name} không phải là file ảnh hợp lệ`);
            }

            // Convert image to base64
            const base64 = await imageToBase64(file);

            // Generate unique image ID
            imageCounter++;
            const imageId = `IMG${imageCounter}`;
            imageStorage[imageId] = base64;

            // Insert short placeholder tag instead of full base64
            const cursorPos = textarea.selectionStart;
            const textBefore = textarea.value.substring(0, cursorPos);
            const textAfter = textarea.value.substring(cursorPos);
            const imageTag = `[${imageId}:${file.name}]\n`;

            textarea.value = textBefore + imageTag + textAfter;

            // Move cursor after inserted tag
            const newPos = cursorPos + imageTag.length;
            textarea.selectionStart = newPos;
            textarea.selectionEnd = newPos;
            textarea.focus();
        }

        fileInfo.textContent = `✓ Đã thêm ${files.length} ảnh`;
        fileInfo.style.color = '#28a745';

        // Auto-save
        autoSaveQuestions();

        setTimeout(() => {
            fileInfo.textContent = '';
        }, 3000);
    } catch (error) {
        fileInfo.textContent = `✗ Lỗi: ${error.message}`;
        fileInfo.style.color = '#dc3545';
    }

    // Reset file input
    event.target.value = '';
}

// Convert image file to base64
function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        reader.onerror = () => {
            reject(new Error(`Không thể đọc file: ${file.name}`));
        };
        reader.readAsDataURL(file);
    });
}

async function readFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'txt') {
        return await readTextFile(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
        return await readExcelFile(file);
    } else if (extension === 'docx') {
        return await readWordFile(file);
    } else {
        throw new Error('Định dạng file không được hỗ trợ');
    }
}

function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Không thể đọc file text'));
        reader.readAsText(file);
    });
}

function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to CSV then process (better encoding handling)
                const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t', RS: '\n' });

                // Remove BOM (Byte Order Mark) if present
                let text = csv.replace(/^\uFEFF/, ''); // UTF-8 BOM
                text = text.replace(/^ÿþ/, '');        // UTF-16 LE BOM
                text = text.replace(/^\xEF\xBB\xBF/, ''); // UTF-8 BOM (another form)

                // Clean up: remove extra tabs and spaces
                const cleaned = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .join('\n');

                resolve(cleaned);
            } catch (error) {
                reject(new Error('Không thể đọc file Excel: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('Không thể đọc file Excel'));
        reader.readAsArrayBuffer(file);
    });
}

function readWordFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            mammoth.extractRawText({ arrayBuffer: e.target.result })
                .then(result => {
                    // Clean up the text
                    const cleaned = result.value
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0)
                        .join('\n');
                    resolve(cleaned);
                })
                .catch(error => reject(new Error('Không thể đọc file Word: ' + error.message)));
        };
        reader.onerror = () => reject(new Error('Không thể đọc file Word'));
        reader.readAsArrayBuffer(file);
    });
}

// Export functions
function exportQuestions(format) {
    const text = document.getElementById('questionsInput').value;
    if (!text.trim()) {
        alert('Không có dữ liệu câu hỏi để export!');
        return;
    }

    if (format === 'txt') {
        downloadTextFile(text, 'cau-hoi.txt');
    } else if (format === 'xlsx') {
        downloadExcelFile(text, 'cau-hoi.xlsx');
    }
}

function exportAnswers(format) {
    const text = document.getElementById('answersInput').value;
    if (!text.trim()) {
        alert('Không có dữ liệu đáp án để export!');
        return;
    }

    if (format === 'txt') {
        downloadTextFile(text, 'dap-an.txt');
    } else if (format === 'xlsx') {
        downloadExcelFile(text, 'dap-an.xlsx');
    }
}

function downloadTextFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadExcelFile(text, filename) {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Split text into lines and convert to array of arrays
    const lines = text.split('\n').map(line => [line]);

    // Create worksheet from the data
    const ws = XLSX.utils.aoa_to_sheet(lines);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, filename);
}

// Scroll to Top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button based on scroll position
window.addEventListener('scroll', function() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('show');
    } else {
        scrollToTopBtn.classList.remove('show');
    }

    // Fixed progress bar on scroll
    const progressContainer = document.getElementById('progressContainer');
    const quizMainContent = document.querySelector('.quiz-main-content');

    if (progressContainer && progressContainer.style.display !== 'none') {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > 100) {
            // Save original dimensions before making it fixed (only once)
            if (!progressContainer.classList.contains('fixed')) {
                const rect = progressContainer.getBoundingClientRect();

                // Store original width
                progressContainer.setAttribute('data-original-width', rect.width);
            }

            progressContainer.classList.add('fixed');

            // Apply original width and center it
            const originalWidth = progressContainer.getAttribute('data-original-width');

            if (originalWidth) {
                progressContainer.style.width = originalWidth + 'px';
                // Center horizontally
                progressContainer.style.left = '50%';
                progressContainer.style.transform = 'translateX(-50%)';
            }

            if (quizMainContent) {
                quizMainContent.classList.add('has-fixed-progress');
            }
        } else {
            progressContainer.classList.remove('fixed');
            // Clear inline styles
            progressContainer.style.width = '';
            progressContainer.style.left = '';
            progressContainer.style.transform = '';

            if (quizMainContent) {
                quizMainContent.classList.remove('has-fixed-progress');
            }
        }
    }
});
