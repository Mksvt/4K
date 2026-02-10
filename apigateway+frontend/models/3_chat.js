const OpenAI = require('openai');
const readline = require('readline');

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error('Missing OPENAI_API_KEY env var.');
    process.exit(1);
}

const openai = new OpenAI({ apiKey });

const FINE_TUNED_MODEL = process.env.OPENAI_FINE_TUNED_MODEL || "ft:YOUR_FINE_TUNED_MODEL";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function startChat() {
    const history = [
        { 
            role: "system", 
            content: "You are a fine-tuned clone. You must answer ONLY using the knowledge, style, vocabulary, and identity of the author found in your training data. Always speak in the first person." 
        }
    ];

    console.log("Chat started. Type 'exit' to quit.");
    console.log("------------------------------------------------");

    while (true) {
        const userInput = await ask("User: ");
        
        if (["exit", "quit", "q"].includes(userInput.toLowerCase())) {
            rl.close();
            break;
        }

        history.push({ role: "user", content: userInput });

        try {
            const completion = await openai.chat.completions.create({
                messages: history,
                model: FINE_TUNED_MODEL,
                temperature: 0.7,
                presence_penalty: 0.3
            });

            const answer = completion.choices[0].message.content;
            console.log(`Author: ${answer}`);
            console.log("------------------------------------------------");

            history.push({ role: "assistant", content: answer });

        } catch (error) {
            console.error("Error:", error.message);
        }
    }
}

startChat();