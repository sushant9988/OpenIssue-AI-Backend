const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});

const database = [];

app.post('/api/analyze', async (req, res) => {
    try {
        const { issueText } = req.body;
        if (!issueText) return res.status(400).json({ error: "No text provided!" });

        // 🔥 ORIGINALITY STROKE: Mood Detection & Code Generation 🔥
        const prompt = `
        You are an advanced AI assistant for GitHub maintainers.
        Past issues: ${JSON.stringify(database)}.
        
        Analyze this user issue: "${issueText}"
        
        Return ONLY a strict JSON object with these exact keys:
        "type": (Bug/Feature/Question),
        "priority": (High/Medium/Low),
        "root_cause": (1 short technical sentence),
        "suggested_reply": (A polite reply. If user is frustrated, make it highly empathetic to de-escalate),
        "is_duplicate": (true/false),
        "user_mood": (Polite / Neutral / Frustrated / Toxic),
        "code_snippet": (Provide a 3-4 line code snippet showing the potential fix. If no code is needed, return "N/A")
        `;

        const response = await openai.chat.completions.create({
            model: "google/gemini-pro",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2, 
        });

        let cleanText = response.choices[0].message.content;
        cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();

        const aiResult = JSON.parse(cleanText);

        if (!aiResult.is_duplicate) {
            database.push(issueText);
        }

        res.json({ status: "success", analysis: aiResult });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "AI fail ho gaya!" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 AI Server (WITH SHIELD) udne ke liye taiyar hai: http://localhost:${PORT}`));
