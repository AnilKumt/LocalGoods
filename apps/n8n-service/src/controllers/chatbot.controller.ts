import { Request, Response, NextFunction } from "express";
import fetch from "node-fetch";

export async function getChatbotResponse(message: string) {
  const url = process.env.N8N_WEBHOOK_URL || "https://alzeenia.app.n8n.cloud/webhook/2b1031d0-6f5d-4f65-b4f1-d08c212b731f";

  try {
    console.log("Calling n8n webhook:", url);
    console.log("Sending message:", message);
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    console.log("Response status:", response.status, response.statusText);

    // Get response as text (n8n returns text, not JSON)
    const responseText = await response.text();
    console.log("Response text:", responseText);

    // If status is not ok, handle error
    if (!response.ok) {
      let errorMessage = "Sorry, I'm having trouble processing your request. Please try again later!";
      
      // Try to extract error message if it's JSON (for error responses)
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage = errorData.message;
          console.warn(`[n8n webhook] Error ${response.status}:`, errorData.message);
        } else {
          console.warn(`[n8n webhook] Received error status ${response.status}:`, responseText.substring(0, 200));
        }
      } catch {
        // If not JSON, use the text as error message
        console.warn(`[n8n webhook] Received error status ${response.status}:`, responseText.substring(0, 200));
        if (responseText) {
          errorMessage = responseText.substring(0, 500); // Limit error message length
        }
      }
      
      return {
        error: `Webhook error: ${response.status} ${response.statusText}`,
        response: errorMessage
      };
    }

    // n8n returns plain text, so return it directly
    return {
      response: responseText.trim() || "I received your message, but couldn't process the response properly."
    };
  } catch (error: any) {
    
    if (error.message && !error.message.includes('HTTP error')) {
      console.error("Error contacting chatbot:", error);
    }
    return { 
      error: error.message || "Failed to get chatbot response",
      response: "Sorry, I'm having trouble connecting right now. Please try again later or browse our products directly!"
    };
  }
}

export async function chatWithBot(req: Request, res: Response, next: NextFunction) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Message is required and must be a non-empty string'
      });
    }

    const chatbotResponse = await getChatbotResponse(message.trim());
    
    // Handle error responses from n8n or fetch errors
    if (chatbotResponse.error) {
      return res.status(200).json({
        response: chatbotResponse.response || chatbotResponse.error,
        message: chatbotResponse.response || chatbotResponse.error,
        error: chatbotResponse.error
      });
    }

    // n8n returns plain text, extract the response string
    const responseText = chatbotResponse.response?.trim() || 
                        "I received your message, but couldn't process the response.";

    return res.status(200).json({
      response: responseText,
      message: responseText
    });
  } catch (error: any) {
    console.error("Chatbot controller error:", error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while processing your message.',
      response: 'Sorry, I encountered an error. Please try again later!'
    });
  }
}


