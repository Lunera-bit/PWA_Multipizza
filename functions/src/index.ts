import {onRequest} from "firebase-functions/v2/https";
import axios from "axios";

const OLLAMA_URL = "http://localhost:11434/api/generate";

export const chatbot = onRequest(async (req, res) => {
  // Permitir CORS desde tu app
  res.set("Access-Control-Allow-Origin", "http://localhost:8100");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Responder a preflight requests
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const message = req.body?.message;
    if (!message) {
      res.status(400).json({error: "Missing message"});
      return;
    }

    const response = await axios.post(OLLAMA_URL, {
      model: "llama3",
      prompt: message,
      stream: false,
    });

    const reply = response.data?.response || "No response";
    res.json({reply});
  } catch (error) {
    console.error("Ollama Error:", error);
    res.status(500).json({error: "Failed to connect to Ollama"});
  }
});
