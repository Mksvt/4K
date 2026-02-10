const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error('Missing OPENAI_API_KEY env var.');
    process.exit(1);
}

const openai = new OpenAI({ apiKey });

const SOURCES_DIR = './sources'; 
const OUTPUT_FILE = 'training_data_hankins.jsonl';
const EXAMPLES_PER_FILE = 4; 

const JH_CORE_INSTRUCTIONS = `
### TARGET PERSONA: Professor James Hankins (JH)
You are simulating James Hankins, Harvard Renaissance historian (retiring 2025). 
Use the provided text to generate Fine-Tuning examples that adhere to these specific modes:

1. **EMAIL MODE (Private Correspondence)**:
   - Markers: "raptim" (hastily), "Non fate complimenti", "JH" or "Jim" sign-off.
   - Structure: Warm opening -> Substantive praise -> Honest criticism -> Resources -> Sign-off.
   - Tone: Professional, warm, demanding but collegial.

2. **CONVERSATIONAL MODE (Spoken/Chat)**:
   - Markers: "Well, uh...", "So, um...", "I-- I think" (self-interruption), [chuckles].
   - Style: Thinking out loud, not polished. Incremental building of arguments.
   - Phrases: "Old Sparky" (computer), "Hahvad Pahty" (mock accent).

3. **PUBLIC/QUESTION MODE (Essays/Op-Eds)**:
   - Markers: Historical parallels (Renaissance vs Now), "In my 40 years...", "Virtue Politics".
   - Tone: Scholarly without jargon, polemical without partisanship.
   - Concepts: Merit vs. Desert, critique of "Civic Humanism" (Baron).

### CRITICAL RULES:
- If the text is an email, generate an EMAIL format response.
- If the text is a transcript, generate a CONVERSATIONAL response with "uh/um".
- Always include specific "Easter Eggs" if relevant: Barolo/Barbaresco wine, manuscript details, specific colleagues (Mark Kishlansky, Kristeller).
- NEVER sound generic. Use JH's specific vocabulary ("rudis indigestaque moles", "smelly little orthodoxies").
`;

async function extractTextFromFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    try {
        if (ext === '.pdf') {
            const data = await pdf(fs.readFileSync(filePath));
            return data.text;
        } else if (ext === '.docx') {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        } else if (['.txt', '.md', '.csv', '.json', '.xml'].includes(ext)) {
            return fs.readFileSync(filePath, 'utf8');
        } else { return null; }
    } catch (err) { return null; }
}

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(file => {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });
    return arrayOfFiles;
}

async function processContent(content, fileName) {
    const truncatedContent = content.substring(0, 20000);

    const prompt = `
    I am building a digital twin of Professor James Hankins (Harvard).
    Attached is a raw text file from his archives ("${fileName}").

    SOURCE TEXT START:
    "${truncatedContent}"
    SOURCE TEXT END.

    ${JH_CORE_INSTRUCTIONS}

    ### TASK:
    Generate ${EXAMPLES_PER_FILE} independent training examples (Conversations) based on this text.
    
    For each conversation:
    1. **Analyze the source text**: Is it an email? A lecture? An article?
    2. **Select the Mode**: Apply Email Mode, Conversational Mode, or Public Mode based on the analysis.
    3. **Draft the System Message**: It should be: "You are Professor James Hankins, a Renaissance historian at Harvard. You answer with scholarly rigor, specific historical parallels, and characteristic wit."
    4. **Draft the User Message**: A plausible question or student inquiry that would prompt the information in the text.
    5. **Draft the Assistant Message (JH)**: 
       - MUST include specific facts from the Source Text.
       - MUST use the voice markers (fillers, Latin, specific phrases) defined in the Instructions.
       - If it's an email, sign off correctly ("raptim", "JH").
       - If it's speech, use "Well, uh..." and [chuckles].

    ### OUTPUT JSON FORMAT (Array of objects):
    {
      "conversations": [
        {
          "messages": [
            {"role": "system", "content": "You are Professor James Hankins..."},
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "..."} 
          ]
        }
      ]
    }
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are the 'Machina Hankinsiana' Persona Architect. You strictly enforce the voice and style of James Hankins." },
                { role: "user", content: prompt }
            ],
            model: "gpt-4o", 
            response_format: { type: "json_object" },
            temperature: 0.7 
        });

        const parsed = JSON.parse(completion.choices[0].message.content);
        return parsed.conversations || [];
    } catch (e) {
        console.error(`Error processing ${fileName}: ${e.message}`);
        return [];
    }
}

async function main() {
    if (!fs.existsSync(SOURCES_DIR)) {
        console.error(`Folder '${SOURCES_DIR}' not found.`);
        return;
    }

    fs.writeFileSync(OUTPUT_FILE, ''); 

    const allFiles = getAllFiles(SOURCES_DIR);
    console.log(`Found ${allFiles.length} files. Engaging Machina Hankinsiana protocols...`);

    let totalDialogues = 0;
    let processedFiles = 0;

    for (const filePath of allFiles) {
        const fileName = path.basename(filePath);
        if (fileName.startsWith('.') || fileName === OUTPUT_FILE) continue;

        const text = await extractTextFromFile(filePath);
        
        if (text && text.trim().length > 300) {
            process.stdout.write(`[${processedFiles + 1}/${allFiles.length}] Processing ${fileName} as JH context... `);

            const conversations = await processContent(text, fileName);
            
            if (conversations && conversations.length > 0) {
                conversations.forEach(conv => {
                    if(conv.messages && Array.isArray(conv.messages)) {
                         const entry = { messages: conv.messages };
                         fs.appendFileSync(OUTPUT_FILE, JSON.stringify(entry) + '\n');
                    }
                });
                
                totalDialogues += conversations.length;
                console.log(`SAVED (+${conversations.length} interactions)`);
            } else {
                console.log(`No valid dialogues generated.`);
            }
        } else {
            console.log(`Skipped (too short or empty)`);
        }
        processedFiles++;
    }

    console.log(`DONE. Total JH training examples: ${totalDialogues}`);
}

main();