const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.join(__dirname, '..', 'BlueQuiz.html');
const appScriptFiles = [
    'bluequiz-state.js',
    'bluequiz-i18n.js',
    'bluequiz-quiz.js',
    'bluequiz-files.js'
];
const html = fs.readFileSync(htmlPath, 'utf8');
const appScript = appScriptFiles
    .map(file => fs.readFileSync(path.join(__dirname, '..', 'assets', file), 'utf8'))
    .join('\n');

assert.match(html, /<link rel="stylesheet" href="assets\/bluequiz\.css">/);
for (const file of appScriptFiles) {
    assert.match(html, new RegExp(`<script src="assets/${file.replace('.', '\\.')}"></script>`));
}
new Function(appScript);

function extractFunction(name) {
    let start = appScript.indexOf(`async function ${name}`);
    if (start < 0) start = appScript.indexOf(`function ${name}`);
    assert.notEqual(start, -1, `Missing function: ${name}`);

    const bodyStart = appScript.indexOf('{', start);
    let depth = 0;
    for (let index = bodyStart; index < appScript.length; index++) {
        if (appScript[index] === '{') depth++;
        if (appScript[index] === '}' && --depth === 0) {
            return appScript.slice(start, index + 1);
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
