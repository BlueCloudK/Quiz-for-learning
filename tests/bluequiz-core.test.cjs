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
    ${extractFunction('validateQuizData')}
    return { parseQuestions, parseAnswers, validateQuizData };
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

const settingsElements = {
    startQuestionRow: { style: {} },
    shuffleQuestionsGroup: { style: {} },
    timerInputGroup: { style: {} }
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
    let timerInterval = null;
    function stopTimer() {}
    ${extractFunction('toggleStartQuestionInput')}
    ${extractFunction('toggleQuizMode')}
    return {
        toggleStartQuestionInput,
        toggleQuizMode,
        getModeState: () => ({ practiceModeEnabled, examModeEnabled })
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
assert.deepEqual(settingsApi.getModeState(), { practiceModeEnabled: true, examModeEnabled: false });
assert.equal(settingsElements.timerInputGroup.style.display, 'none');
settingsSelection.mode = 'exam';
settingsApi.toggleQuizMode();
assert.deepEqual(settingsApi.getModeState(), { practiceModeEnabled: false, examModeEnabled: true });
assert.equal(settingsElements.timerInputGroup.style.display, 'grid');

assert.doesNotMatch(html, /id="practiceModeCheckbox"|id="examModeCheckbox"/);
assert.equal((html.match(/<input type="radio" name="quizMode"/g) || []).length, 3);
assert.equal((html.match(/<input type="radio" name="questionDisplayMode"/g) || []).length, 5);
assert.match(html, /id="eliminationCheckbox"/);
assert.match(html, /id="fullscreenExamBtn"/);
for (const controlId of [
    'flashcardPanel', 'flashcardRevealBtn', 'masteryPanel', 'masteryCheckBtn',
    'sprintSettingsRow', 'sprintBreakPanel'
]) {
    assert.match(html, new RegExp(`id="${controlId}"`), `Missing study control: ${controlId}`);
}
assert.equal((html.match(/class="eliminate-option-btn"/g) || []).length, 2, 'Both quiz render paths must support answer elimination');

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
    quizNameInput: { value: '' }
};
let pairValidation = null;
let pairAutosaves = 0;
const pairImport = new Function(
    'document', 'readFile', 'translations', 'currentLanguage', 'parseQuestions', 'parseAnswers',
    'validateQuizData', 'renderValidationSummary', 'autoSaveQuestions', 'autoSaveAnswers',
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
    () => { pairAutosaves++; }, () => { pairAutosaves++; }
);

const pairEvent = { target: { files: [
    { name: 'PRN222_MASTER_CAU_HOI.txt', text: questionsText },
    { name: 'PRN222_MASTER_DAP_AN.txt', text: answersText }
], value: 'selected' } };

assert.match(html, /vendor\/xlsx\.full\.min\.js/);
assert.match(html, /vendor\/mammoth\.browser\.min\.js/);

const storageKeys = {
    QUESTIONS: 'quiz_questions',
    ANSWERS: 'quiz_answers',
    SAVED_QUIZZES: 'quiz_saved_sets'
};
const storageValues = new Map([
    ['quiz_questions', JSON.stringify('saved questions')],
    ['quiz_answers', JSON.stringify('saved answers')],
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
    importData({ target: { files: [{ text: JSON.stringify(backup) }], value: 'selected' } })
]).then(() => {
    assert.equal(pairElements.quizNameInput.value, 'PRN222 MASTER');
    assert.equal(pairElements.questionsInput.value, questionsText);
    assert.equal(pairElements.answersInput.value, answersText);
    assert.equal(pairValidation.valid, true);
    assert.equal(pairAutosaves, 2);
    assert.match(pairElements.quizPairStatus.textContent, /Imported 2 — PRN222 MASTER/);
    assert.equal(pairEvent.target.value, '');
    assert.equal(storageValues.get('quiz_questions'), JSON.stringify('restored questions'));
    assert.equal(reloadCalled, true);
    console.log('BlueQuiz core tests passed');
});
