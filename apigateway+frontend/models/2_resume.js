const OpenAI = require('openai');

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Missing OPENAI_API_KEY env var.');
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

const EXISTING_FILE_ID = 'file-9r5EUELuPwH3CL5kTYy93L';

async function main() {
  if (EXISTING_FILE_ID.includes('XXX')) {
    console.error('Помилка: Ти не вставив ID файлу у скрипт!');
    return;
  }

  try {
    console.log(`Resuming training with existing file: ${EXISTING_FILE_ID}...`);

    const job = await openai.fineTuning.jobs.create({
      training_file: EXISTING_FILE_ID,
      model: 'gpt-4o-2024-08-06',
    });

    console.log(`SUCCESS! Job ID: ${job.id}`);
    console.log(`Track status: https://platform.openai.com/finetune/${job.id}`);
  } catch (error) {
    console.error('ERROR:', error.message);
  }
}

main();
