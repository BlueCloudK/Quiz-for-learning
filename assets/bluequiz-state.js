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
