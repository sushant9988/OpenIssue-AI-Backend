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
        if (!issueText) return res.status(400).json({ error: "No text provided" });

        const prompt = `
You are an AI assistant for GitHub maintainers.

Past issues: ${JSON.stringify(database.slice(-3))}

Analyze: "${issueText}"

Return strict JSON:
{
  "type": "Bug|Feature|Question",
  "priority": "High|Medium|Low",
  "root_cause": "Short technical explanation",
  "suggested_reply": "Professional, empathetic response",
  "is_duplicate": true/false,
  "user_mood": "Polite|Neutral|Frustrated|Toxic",
  "code_snippet": "3-4 line code fix or N/A"
}`;

        const response = await openai.chat.completions.create({
            model: "openai/gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
        });

        let cleanText = response.choices[0].message.content
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const aiResult = JSON.parse(cleanText);

        if (!aiResult.is_duplicate) {
            database.push(issueText);
        }

        res.json({ status: "success", analysis: aiResult });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Analysis failed" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✨ OpenIssue Shield running on port ${PORT}`);
});
