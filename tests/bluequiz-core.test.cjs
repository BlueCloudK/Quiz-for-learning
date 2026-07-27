const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.join(__dirname, '..', 'BlueQuiz.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const inlineScript = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .find(script => script.trim());

assert.ok(inlineScript, 'BlueQuiz must contain an inline application script');
new Function(inlineScript);

function extractFunction(name) {
    let start = inlineScript.indexOf(`async function ${name}`);
    if (start < 0) start = inlineScript.indexOf(`function ${name}`);
    assert.notEqual(start, -1, `Missing function: ${name}`);

    const bodyStart = inlineScript.indexOf('{', start);
    let depth = 0;
    for (let index = bodyStart; index < inlineScript.length; index++) {
        if (inlineScript[index] === '{') depth++;
        if (inlineScript[index] === '}' && --depth === 0) {
            return inlineScript.slice(start, index + 1);
        }
    }
    throw new Error(`Unclosed function: ${name}`);
}

const api = new Function(`
    ${extractFunction('parseQuestions')}
    ${extractFunction('parseAnswers')}
    ${extractFunction('parseKeywordHighlights')}
    ${extractFunction('textContainsKeyword')}
    ${extractFunction('validateQuizData')}
    return { parseQuestions, parseAnswers, parseKeywordHighlights, validateQuizData };
`)();

const questionsText = `
1. First question?
a. One
b. Two

2. Second question?
a. Alpha
b. Beta
c. Gamma
`;
const answersText = `1. b\n2. a`;
const questions = api.parseQuestions(questionsText);
const answers = api.parseAnswers(answersText);

assert.equal(questions.length, 2);
assert.deepEqual(answers, { 1: 'b', 2: 'a' });
assert.equal(api.validateQuizData(questions, answers).valid, true);

const missingAnswer = { 1: 'b' };
assert.match(api.validateQuizData(questions, missingAnswer).errors.join('\n'), /Câu 2: thiếu đáp án/);

const invalidChoice = { 1: 'z', 2: 'a' };
assert.match(api.validateQuizData(questions, invalidChoice).errors.join('\n'), /đáp án Z không tồn tại/);

const orphanAnswer = { 1: 'b', 2: 'a', 3: 'c' };
assert.match(api.validateQuizData(questions, orphanAnswer).errors.join('\n'), /Đáp án câu 3: không có câu hỏi/);

const keywordText = `KEYWORDS\n\`\`\`text\n1.q: First question; First\n1.b: Two\n\`\`\``;
const keywordHighlights = api.parseKeywordHighlights(keywordText);
assert.deepEqual(keywordHighlights, { 1: { q: ['First question', 'First'], b: ['Two'] } });
assert.equal(api.validateQuizData(questions, answers, keywordHighlights).valid, true);
assert.match(
    api.validateQuizData(questions, answers, api.parseKeywordHighlights('1.a: One')).errors.join('\n'),
    /chỉ được tô trong đáp án đúng/
);
assert.match(
    api.validateQuizData(questions, answers, api.parseKeywordHighlights('1.b: Missing phrase')).errors.join('\n'),
    /không tìm thấy/
);
assert.match(
    api.validateQuizData(questions, answers, api.parseKeywordHighlights('1-b: Two')).errors.join('\n'),
    /sai định dạng/
);

const shuffleHighlightApi = new Function('shuffleArray', `
    ${extractFunction('shuffleQuestionChoices')}
    return { shuffleQuestionChoices };
`)(items => [...items].reverse());
const shuffledQuestions = JSON.parse(JSON.stringify([questions[0]]));
const shuffledAnswers = { 1: 'b' };
const shuffledHighlights = { 1: { q: ['First question'], b: ['Two'] } };
shuffleHighlightApi.shuffleQuestionChoices(shuffledQuestions, shuffledAnswers, shuffledHighlights);
assert.equal(shuffledAnswers[1], 'a');
assert.deepEqual(shuffledHighlights[1], { q: ['First question'], a: ['Two'] });

const keywordExportInput = { value: '1.q: First question' };
let keywordExport = null;
let keywordExportAlert = null;
const keywordExportApi = new Function(
    'document', 'alert', 'translations', 'currentLanguage', 'downloadTextFile', 'downloadExcelFile',
    `${extractFunction('exportKeywords')}; return exportKeywords;`
)(
    { getElementById: id => id === 'keywordsInput' ? keywordExportInput : null },
    message => { keywordExportAlert = message; },
    { vi: { alertNoKeywords: 'no keywords' } }, 'vi',
    (text, filename) => { keywordExport = { format: 'txt', text, filename }; },
    (text, filename) => { keywordExport = { format: 'xlsx', text, filename }; }
);
keywordExportApi('txt');
assert.deepEqual(keywordExport, { format: 'txt', text: keywordExportInput.value, filename: 'tu-khoa.txt' });
keywordExportApi('xlsx');
assert.deepEqual(keywordExport, { format: 'xlsx', text: keywordExportInput.value, filename: 'tu-khoa.xlsx' });
keywordExportInput.value = '';
keywordExportApi('txt');
assert.equal(keywordExportAlert, 'no keywords');

const settingsElements = {
    startQuestionRow: { style: {} },
    shuffleQuestionsGroup: { style: {} },
    timerInputGroup: { style: {} },
    displayModeCard: { classList: { hidden: false, toggle(name, active) { if (name === 'hidden') this.hidden = active; } } },
    sprintSettingsRow: { classList: { visible: false, toggle(name, active) { if (name === 'visible') this.visible = active; } } }
};
const settingsSelection = { order: 'sequential', mode: 'standard' };
const settingsDocument = {
    querySelector: selector => {
        if (selector === 'input[name="questionOrder"]:checked') return { value: settingsSelection.order };
        if (selector === 'input[name="quizMode"]:checked') return { value: settingsSelection.mode };
        return null;
    },
    getElementById: id => settingsElements[id]
};
const settingsApi = new Function('document', `
    let practiceModeEnabled = false;
    let examModeEnabled = false;
    let quizSessionMode = 'standard';
    let timerInterval = null;
    function stopTimer() {}
    ${extractFunction('toggleStartQuestionInput')}
    ${extractFunction('toggleQuizMode')}
    return {
        toggleStartQuestionInput,
        toggleQuizMode,
        getModeState: () => ({ practiceModeEnabled, examModeEnabled, quizSessionMode })
    };
`)(settingsDocument);

settingsApi.toggleStartQuestionInput();
assert.equal(settingsElements.startQuestionRow.style.display, 'flex');
assert.equal(settingsElements.shuffleQuestionsGroup.style.display, 'flex');
settingsSelection.order = 'random';
settingsApi.toggleStartQuestionInput();
assert.equal(settingsElements.startQuestionRow.style.display, 'none');
assert.equal(settingsElements.shuffleQuestionsGroup.style.display, 'none');

settingsSelection.mode = 'practice';
settingsApi.toggleQuizMode();
assert.deepEqual(settingsApi.getModeState(), { practiceModeEnabled: true, examModeEnabled: false, quizSessionMode: 'practice' });
assert.equal(settingsElements.timerInputGroup.style.display, 'none');
settingsSelection.mode = 'exam';
settingsApi.toggleQuizMode();
assert.deepEqual(settingsApi.getModeState(), { practiceModeEnabled: false, examModeEnabled: true, quizSessionMode: 'exam' });
assert.equal(settingsElements.timerInputGroup.style.display, 'grid');
settingsSelection.mode = 'flashcard';
settingsApi.toggleQuizMode();
assert.deepEqual(settingsApi.getModeState(), { practiceModeEnabled: false, examModeEnabled: false, quizSessionMode: 'flashcard' });
assert.equal(settingsElements.displayModeCard.classList.hidden, true);

assert.doesNotMatch(html, /id="practiceModeCheckbox"|id="examModeCheckbox"/);
assert.equal((html.match(/<input type="radio" name="quizMode"/g) || []).length, 6);
assert.equal((html.match(/<input type="radio" name="questionDisplayMode"/g) || []).length, 2);

const displaySelection = { session: 'standard', display: 'focus' };
const displaySelectionApi = new Function('document', `
    let quizSessionMode = 'standard';
    ${extractFunction('readQuestionDisplayMode')}
    return { readQuestionDisplayMode };
`)(
    { querySelector: selector => selector === 'input[name="quizMode"]:checked'
        ? { value: displaySelection.session }
        : selector === 'input[name="questionDisplayMode"]:checked' ? { value: displaySelection.display } : null }
);
assert.equal(displaySelectionApi.readQuestionDisplayMode(), 'focus');
displaySelection.session = 'mastery';
assert.equal(displaySelectionApi.readQuestionDisplayMode(), 'mastery');
assert.match(html, /id="eliminationCheckbox"/);
assert.match(html, /id="fullscreenExamBtn"/);
assert.match(html, /id="keywordsInput"/);
assert.match(html, /id="keywordsFileInput"/);
assert.match(html, /id="keywordsFileInfo"/);
assert.match(html, /mark\.keyword-highlight/);
assert.match(html, /mark\.keyword-highlight\s*\{[^}]*background:\s*transparent;[^}]*color:\s*#4056b4;[^}]*font-weight:\s*800;/s);
assert.doesNotMatch(html, /mark\.keyword-highlight\s*\{[^}]*text-decoration/s);
assert.match(html, /body\.dark-mode mark\.keyword-highlight\s*\{[^}]*color:\s*#afc1ff;/s);
assert.match(html, /Trích Từ Khóa Tô Sáng/);
assert.match(html, /name="application-version" content="1\.4\.5"/);
assert.match(extractFunction('submitQuiz'), /applyAllKeywordHighlights\(\)/);
assert.match(extractFunction('checkMasteryAnswer'), /applyQuestionKeywordHighlights\(currentQuestionIndex\)/);
assert.match(extractFunction('restartQuiz'), /clearKeywordHighlightsInCard/);
assert.match(extractFunction('saveQuizSet'), /keywords:\s*keywordsText/);
assert.match(extractFunction('loadQuizSet'), /quiz\.keywords\s*\|\|\s*''/);
for (const controlId of [
    'flashcardPanel', 'flashcardRevealBtn', 'masteryPanel', 'masteryCheckBtn',
    'sprintSettingsRow', 'sprintBreakPanel'
]) {
    assert.match(html, new RegExp(`id="${controlId}"`), `Missing study control: ${controlId}`);
}
assert.equal((html.match(/class="eliminate-option-btn"/g) || []).length, 2, 'Both quiz render paths must support answer elimination');
assert.ok(
    html.indexOf('id="flashcardAnswer"') < html.indexOf('id="flashcardPanel"'),
    'Revealed flashcard answer must render above the rating/navigation buttons'
);
assert.ok(
    html.indexOf('id="flashcardPanel"') < html.indexOf('id="focusCardControls"'),
    'Card navigation must render below the study actions'
);
assert.match(html, /<input type="number" id="sprintSize"[^>]*min="1"/);
assert.doesNotMatch(html, /id="sprintSize"[^>]*max="9999"/);
assert.doesNotMatch(html, /\.flashcard-mode \.question-card\.focus-active \.options\s*\{\s*display:\s*none/);

const displayModeApi = new Function(`
    let questionDisplayMode = 'list';
    ${extractFunction('isSingleCardMode')}
    return { isSingleCardMode, setMode: value => { questionDisplayMode = value; } };
`)();
assert.equal(displayModeApi.isSingleCardMode(), false);
for (const mode of ['focus', 'flashcard', 'mastery', 'sprint']) {
    displayModeApi.setMode(mode);
    assert.equal(displayModeApi.isSingleCardMode(), true, `${mode} must use the single-card layout`);
}

function createClassList(...initialValues) {
    const values = new Set(initialValues);
    return {
        add: value => values.add(value),
        remove: value => values.delete(value),
        contains: value => values.has(value)
    };
}

const staleFlashcardAnswer = { textContent: 'Stale answer', classList: createClassList() };
const staleQuizSection = { classList: createClassList('flashcard-revealed') };
const flashcardResetApi = new Function('document', `
    ${extractFunction('resetFlashcardArtifacts')}
    return { resetFlashcardArtifacts };
`)(
    { getElementById: id => id === 'flashcardAnswer' ? staleFlashcardAnswer : id === 'quizSection' ? staleQuizSection : null }
);
flashcardResetApi.resetFlashcardArtifacts();
assert.equal(staleFlashcardAnswer.textContent, '');
assert.equal(staleFlashcardAnswer.classList.contains('hidden'), true);
assert.equal(staleQuizSection.classList.contains('flashcard-revealed'), false);

const masteryQueueApi = new Function(`
    ${extractFunction('getNextMasteryQueueState')}
    return { getNextMasteryQueueState };
`)();
assert.deepEqual(masteryQueueApi.getNextMasteryQueueState([0, 1, 2], 0), { position: 1, questionIndex: 1 });
assert.deepEqual(masteryQueueApi.getNextMasteryQueueState([0, 1, 0], 1), { position: 2, questionIndex: 0 });
assert.deepEqual(masteryQueueApi.getNextMasteryQueueState([0], 0), { position: 1, questionIndex: null });

const flashcardNavigationApi = new Function(`
    ${extractFunction('getFlashcardNavigationState')}
    ${extractFunction('normalizeSprintSize')}
    return { getFlashcardNavigationState, normalizeSprintSize };
`)();
assert.deepEqual(flashcardNavigationApi.getFlashcardNavigationState([2, 4, 6], 0, 1), { position: 1, questionIndex: 4 });
assert.deepEqual(flashcardNavigationApi.getFlashcardNavigationState([2, 4, 6], 1, -1), { position: 0, questionIndex: 2 });
assert.deepEqual(flashcardNavigationApi.getFlashcardNavigationState([2, 4, 6], 2, 1), { position: 2, questionIndex: 6 });
assert.equal(flashcardNavigationApi.normalizeSprintSize('17', 217), 17);
assert.equal(flashcardNavigationApi.normalizeSprintSize('400', 217), 217);
assert.equal(flashcardNavigationApi.normalizeSprintSize('4.9', 217), 4);
assert.equal(flashcardNavigationApi.normalizeSprintSize('0', 7), 7);

const sprintConfig = { questionCount: '', startQuestion: '2', order: 'sequential' };
const sprintConfigApi = new Function('document', 'parseQuestions', `
    ${extractFunction('getConfiguredQuestionTotal')}
    return { getConfiguredQuestionTotal };
`)(
    {
        getElementById: id => {
            if (id === 'questionsInput') return { value: questionsText };
            if (id === 'questionCount') return { value: sprintConfig.questionCount };
            if (id === 'startQuestion') return { value: sprintConfig.startQuestion };
            return null;
        },
        querySelector: selector => selector === 'input[name="questionOrder"]:checked'
            ? { value: sprintConfig.order }
            : null
    },
    api.parseQuestions
);
assert.equal(sprintConfigApi.getConfiguredQuestionTotal(), 1, 'Sequential limit must respect the start question');
sprintConfig.startQuestion = '1';
sprintConfig.questionCount = '1';
assert.equal(sprintConfigApi.getConfiguredQuestionTotal(), 1, 'Sprint limit must respect selected question count');
sprintConfig.order = 'random';
sprintConfig.questionCount = '';
assert.equal(sprintConfigApi.getConfiguredQuestionTotal(), 2, 'Random mode may use the full question set');

const focusApi = new Function(`
    const quizData = [{ number: 1 }, { number: 2 }, { number: 3 }];
    const questionMapping = { 0: 1, 1: 2, 2: 3 };
    const pinnedQuestions = new Set([2]);
    const incorrectQuestions = new Set([1, 3]);
    let currentFilter = 'all';
    ${extractFunction('questionMatchesCurrentFilter')}
    ${extractFunction('getFocusableQuestionIndices')}
    return {
        getFocusableQuestionIndices,
        setFilter: value => { currentFilter = value; }
    };
`)();

assert.deepEqual(focusApi.getFocusableQuestionIndices(), [0, 1, 2]);
focusApi.setFilter('pinned');
assert.deepEqual(focusApi.getFocusableQuestionIndices(), [1]);
focusApi.setFilter('incorrect');
assert.deepEqual(focusApi.getFocusableQuestionIndices(), [0, 2]);
assert.match(extractFunction('setupAnswerListeners'), /#quizContainer input\[type="radio"\]/);

const timerElements = {
    pauseTimerBtn: { style: {} },
    pauseIcon: { textContent: '' },
    pauseText: { textContent: '' }
};
let nextIntervalId = 0;
const activeIntervals = new Set();
const timerApi = new Function(
    'document', 'translations', 'currentLanguage', 'setInterval', 'clearInterval',
    `
        let timerInterval = null;
        let timeRemaining = 60;
        function updateTimerDisplay() {}
        function alert() {}
        function submitQuiz() {}
        ${extractFunction('updatePauseTimerControl')}
        ${extractFunction('startTimer')}
        ${extractFunction('stopTimer')}
        ${extractFunction('togglePauseTimer')}
        return {
            startTimer,
            stopTimer,
            togglePauseTimer,
            getState: () => ({ timerInterval, timerPaused })
        };
    `
)(
    { getElementById: id => timerElements[id] },
    { vi: { pauseTimer: 'Tạm dừng', resumeTimer: 'Tiếp tục', timeUp: 'Hết giờ' } },
    'vi',
    () => {
        const id = ++nextIntervalId;
        activeIntervals.add(id);
        return id;
    },
    id => activeIntervals.delete(id)
);

timerApi.startTimer();
timerApi.startTimer();
assert.equal(activeIntervals.size, 1, 'Starting a timer twice must keep only one interval');
assert.equal(timerApi.getState().timerPaused, false);
assert.equal(timerElements.pauseText.textContent, 'Tạm dừng');

timerApi.togglePauseTimer();
assert.equal(activeIntervals.size, 0);
assert.equal(timerApi.getState().timerPaused, true);
assert.equal(timerElements.pauseText.textContent, 'Tiếp tục');

timerApi.stopTimer();
assert.equal(timerApi.getState().timerPaused, false, 'Stopping must reset pause state for the next attempt');
assert.equal(timerElements.pauseText.textContent, 'Tạm dừng');
assert.equal(timerElements.pauseTimerBtn.style.display, 'none');

timerApi.startTimer();
timerApi.togglePauseTimer();
assert.equal(activeIntervals.size, 0, 'The first click in a new attempt must pause, not start another interval');

const pairElements = {
    quizPairStatus: { textContent: '', style: {} },
    questionsInput: { value: '' },
    answersInput: { value: '' },
    keywordsInput: { value: 'old keywords' },
    quizNameInput: { value: '' }
};
let pairValidation = null;
let pairAutosaves = 0;
const pairImport = new Function(
    'document', 'readFile', 'translations', 'currentLanguage', 'parseQuestions', 'parseAnswers',
    'validateQuizData', 'renderValidationSummary', 'autoSaveQuestions', 'autoSaveAnswers',
    'autoSaveKeywords',
    `${extractFunction('handleQuizPairUpload')}; return handleQuizPairUpload;`
)(
    { getElementById: id => pairElements[id] },
    async file => file.text,
    { vi: {
        pairImportNeedTwoFiles: 'need two', pairImportReading: 'reading',
        pairImportUnrecognized: 'unrecognized', pairImportInvalid: '{count} invalid',
        pairImportSuccess: 'Imported {count} — {name}'
    } },
    'vi', api.parseQuestions, api.parseAnswers, api.validateQuizData,
    validation => { pairValidation = validation; },
    () => { pairAutosaves++; }, () => { pairAutosaves++; }, () => { pairAutosaves++; }
);

const pairEvent = { target: { files: [
    { name: 'PRN222_MASTER_CAU_HOI.txt', text: questionsText },
    { name: 'PRN222_MASTER_DAP_AN.txt', text: answersText }
], value: 'selected' } };

const keywordImportElements = {
    keywordsInput: { value: '' },
    keywordsFileInfo: { textContent: '', style: {} }
};
let keywordImportSaved = false;
let keywordValidationCleared = false;
const keywordImport = new Function(
    'document', 'readFile', 'clearValidationSummary', 'autoSaveKeywords',
    `${extractFunction('handleKeywordsFileUpload')}; return handleKeywordsFileUpload;`
)(
    { getElementById: id => keywordImportElements[id] },
    async file => file.text,
    () => { keywordValidationCleared = true; },
    () => { keywordImportSaved = true; }
);
const keywordImportEvent = {
    target: { files: [{ name: 'keywords.txt', text: '1.q: First question' }], value: 'selected' }
};

assert.match(html, /vendor\/xlsx\.full\.min\.js/);
assert.match(html, /vendor\/mammoth\.browser\.min\.js/);

const storageKeys = {
    QUESTIONS: 'quiz_questions',
    ANSWERS: 'quiz_answers',
    KEYWORDS: 'quiz_keywords',
    SAVED_QUIZZES: 'quiz_saved_sets'
};
const storageValues = new Map([
    ['quiz_questions', JSON.stringify('saved questions')],
    ['quiz_answers', JSON.stringify('saved answers')],
    ['quiz_keywords', JSON.stringify('1.q: saved')],
    ['quiz_saved_sets', JSON.stringify([{ id: 1, name: 'Sample' }])]
]);
const localStorage = {
    getItem: key => storageValues.has(key) ? storageValues.get(key) : null,
    setItem: (key, value) => storageValues.set(key, value),
    removeItem: key => storageValues.delete(key)
};
let downloadedBackup = null;
const exportData = new Function('STORAGE_KEYS', 'localStorage', 'downloadTextFile', `
    ${extractFunction('exportBlueQuizData')}
    return exportBlueQuizData;
`)(storageKeys, localStorage, (text, filename) => { downloadedBackup = { text, filename }; });

exportData();
assert.ok(downloadedBackup.filename.startsWith('bluequiz-backup-'));
const backup = JSON.parse(downloadedBackup.text);
assert.equal(backup.app, 'BlueQuiz');
assert.equal(backup.data.quiz_questions, JSON.stringify('saved questions'));
assert.equal(backup.data.quiz_keywords, JSON.stringify('1.q: saved'));

let reloadCalled = false;
const importData = new Function(
    'STORAGE_KEYS', 'localStorage', 'readTextFile', 'translations', 'currentLanguage', 'confirm', 'alert', 'window',
    `${extractFunction('importBlueQuizData')}; return importBlueQuizData;`
)(storageKeys, localStorage, async file => file.text, {
    vi: {
        invalidBackupFile: 'invalid',
        confirmRestoreData: 'confirm',
        restoreSuccess: 'success',
        restoreFailed: 'failed'
    }
}, 'vi', () => true, () => {}, { location: { reload: () => { reloadCalled = true; } } });

backup.data.quiz_questions = JSON.stringify('restored questions');
Promise.all([
    pairImport(pairEvent),
    keywordImport(keywordImportEvent),
    importData({ target: { files: [{ text: JSON.stringify(backup) }], value: 'selected' } })
]).then(() => {
    assert.equal(pairElements.quizNameInput.value, 'PRN222 MASTER');
    assert.equal(pairElements.questionsInput.value, questionsText);
    assert.equal(pairElements.answersInput.value, answersText);
    assert.equal(pairElements.keywordsInput.value, '');
    assert.equal(pairValidation.valid, true);
    assert.equal(pairAutosaves, 3);
    assert.match(pairElements.quizPairStatus.textContent, /Imported 2 — PRN222 MASTER/);
    assert.equal(pairEvent.target.value, '');
    assert.equal(keywordImportElements.keywordsInput.value, '1.q: First question');
    assert.match(keywordImportElements.keywordsFileInfo.textContent, /keywords\.txt/);
    assert.equal(keywordImportSaved, true);
    assert.equal(keywordValidationCleared, true);
    assert.equal(keywordImportEvent.target.value, '');
    assert.equal(storageValues.get('quiz_questions'), JSON.stringify('restored questions'));
    assert.equal(reloadCalled, true);
    console.log('BlueQuiz core tests passed');
});
