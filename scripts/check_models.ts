
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No GEMINI_API_KEY found in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using the model manager (if available via SDK) or just try generic approach if SDK differs.
    // Actually the SDK doesn't expose listModels directly on genAI instance in all versions.
    // We can try a fetch if the SDK is limited, but let's try the SDK method first if it exists.
    // checking documentation memory: genAI.getGenerativeModel is main entry.
    // We can use the REST API manually if needed.

    // Let's use a raw fetch to be sure.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Available Models:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
