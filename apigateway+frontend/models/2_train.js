const fs = require('fs');
const OpenAI = require('openai');

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error('Missing OPENAI_API_KEY env var.');
    process.exit(1);
}

const openai = new OpenAI({ apiKey });

async function main() {
    try {
        console.log("Uploading training_data.jsonl...");
        
        const file = await openai.files.create({
            file: fs.createReadStream("training_data_hankins.jsonl"),
            purpose: "fine-tune",
        });

        console.log(`File Uploaded. ID: ${file.id}`); 
        console.log("Waiting for processing...");
        await new Promise(r => setTimeout(r, 3000));

        console.log("Starting Fine-Tuning (GPT-4o)...");
        
        const job = await openai.fineTuning.jobs.create({
            training_file: file.id,
            model: "gpt-4o-2024-08-06"
        });

        console.log(`SUCCESS! Job ID: ${job.id}`);
        console.log(`Track status: https://platform.openai.com/finetune/${job.id}`);
        
    } catch (error) {
        console.error("ERROR:", error.message);
    }
}

main();