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
