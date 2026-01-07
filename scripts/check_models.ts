
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No GEMINI_API_KEY found");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("API Error:", response.status, response.statusText);
            const text = await response.text();
            console.error(text);
            return;
        }
        const data = await response.json();
        console.log("Found models:");
        (data.models || []).forEach((m: any) => {
            console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
        });
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

listModels();
