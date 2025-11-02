// server/controllers/chatbotController.js
import fetch from "node-fetch";

export async function getChatbotResponse(message) {
  const url = "https://alzeenia.app.n8n.cloud/webhook/2b1031d0-6f5d-4f65-b4f1-d08c212b731f";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error contacting chatbot:", error);
    return { error: error.message };
  }
}
