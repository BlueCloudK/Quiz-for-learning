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
