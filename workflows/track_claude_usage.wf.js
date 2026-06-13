// -*- mode: javascript; -*-
export const meta = {
  name: 'track-claude-usage',
  description: 'Определяет модель из .env, считает токены и логирует информацию о usage',
  phases: [
    {title: 'Init',        detail: 'Инициализация: чтение .env и подготовка логов'},
    {title: 'DetectModel', detail: 'Определение модели согласно иерархии в .env'},
    {title: 'TrackUsage',  detail: 'Получение spent/remaining из бюджета'},
    {title: 'BuildLog',    detail: 'Формирование JSON‑записи лога'},
    {title: 'WriteLog',    detail: 'Добавление записи в logs/claude_usage.log'},
    {title: 'Finish',      detail: 'Возврат собранных данных'}
  ],
};

/* ---------- Init ---------- */
phase('Init');
log('🔹 Init phase started');
let envRaw;
if (typeof args !== 'undefined' && args && args.envRaw) {
  envRaw = args.envRaw;
} else {
  envRaw = await agent(
    `Читаю файл .env и возвращаю его содержимое как строку`,
    {phase: 'Init'}
  );
}
log('🔹 .env read, length: ' + envRaw.length);
const envVars = {};
for (const line of envRaw.split('\n')) {
    const [key, ...valueParts] = line.trim().split('=');
    if (!key) continue;
    const value = valueParts.join('=').trim();
    envVars[key] = value.replace(/^"(.*)"$/, '$1'); // убираем окружающие кавычки, если есть
}
log('🔹 Parsed env vars keys: ' + Object.keys(envVars).join(', '));
// Ensure logs directory exists
const logsDir = 'F:/claude/free-claude-code/logs';
await agent(
    `Убедись, что папка ${logsDir} существует, создай её при необходимости`,
    {phase: 'Init'}
);
log('🔹 Init phase completed');

/* ---------- DetectModel ---------- */
phase('DetectModel');
log('🔹 DetectModel phase started');
const modelPriority = ['MODEL_OPUS', 'MODEL_SONNET', 'MODEL_HAIKU', 'MODEL'];
let selectedModel = 'unknown';
for (const key of modelPriority) {
    const val = envVars[key];
    if (val && val.length > 0) {
        selectedModel = val;
        break;
    }
}
log('🔹 Selected model (raw): ' + selectedModel);
/* (опционально) проверяем, что выбранная модель действительно известна */
const knownModels = await agent(
    `Запрашиваю справочник моделей через claude-api skill`,
    {skill: 'claude-api', phase: 'DetectModel'}
);
log('🔹 Known models received: ' + JSON.stringify(knownModels));
let isKnown = false;
if (Array.isArray(knownModels)) {
    isKnown = knownModels.some(m => m.id === selectedModel.toLowerCase().replace(/.*\//, ''));
}
if (!isKnown) {
    // Если не нашли – оставляем как есть, но можно залогировать предупреждение
    await agent(`log('⚠️ Выбранная модель "${selectedModel}" не найдена в справочнике claude-api')`, {phase:'DetectModel'});
}
log('🔹 DetectModel phase completed, final model: ' + selectedModel);

/* ---------- TrackUsage ---------- */
phase('TrackUsage');
log('🔹 TrackUsage phase started');
const budgetInfo = await agent(
    `Возвращаю объект {spent: budget.spent(), remaining: budget.remaining()}`,
    {phase: 'TrackUsage'}
);
const spentTok = budgetInfo.spent;
const remTok = budgetInfo.remaining;
log('🔹 Tokens spent: ' + spentTok + ', remaining: ' + remTok);

/* ---------- BuildLog ---------- */
phase('BuildLog');
log('🔹 BuildLog phase started');
// Get timestamp via Bash to avoid Date.now()
const tsResult = await agent(
    `Получаю текущий timestamp в ISO format через Bash`,
    {
        phase: 'BuildLog'
    },
    {
        // Use bash date -u +"%Y-%m-%dT%H:%M:%S.%3NZ" for ms precision
        command: `date -u +"%Y-%m-%dT%H:%M:%S.%3NZ"`,
        description: 'Get ISO timestamp with milliseconds'
    }
);
const timestamp = tsResult.trim(); // e.g., 2026-06-13T18:45:12.345Z
const logEntry = {
    timestamp: timestamp,
    model: selectedModel,
    tokensSpent: Number(spentTok),
    tokensRemaining: Number(remTok)
};
log('🔹 Log entry built: ' + JSON.stringify(logEntry));

/* ---------- WriteLog ---------- */
phase('WriteLog');
log('🔹 WriteLog phase started');
await agent(
    `Добавляю JSON‑строку в файл logs/claude_usage.log`,
    {
        schema: {
            type: 'object',
            properties: {
                file_path: {type: 'string'},
                content:   {type: 'string'}
            },
            required: ['file_path','content']
        },
        phase: 'WriteLog'
    },
    {
        file_path: 'F:/claude/free-claude-code/logs/claude_usage.log',
        content: JSON.stringify(logEntry) + '\n'
    }
);
log('🔹 WriteLog phase completed');

/* ---------- Finish ---------- */
phase('Finish');
log('🔹 Workflow finished');
return logEntry;   // workflow вернёт объект лога, его можно использовать дальше