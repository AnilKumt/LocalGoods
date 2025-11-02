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

    
    const responseText = await response.text();
    console.log("Response text:", responseText);

    
    if (!response.ok) {
     
      let errorMessage = "Sorry, I'm having trouble processing your request. Please try again later!";
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage = errorData.message;
          console.warn(`[n8n webhook] Error ${response.status}:`, errorData.message);
        } else {
          console.warn(`[n8n webhook] Received error status ${response.status}:`, responseText.substring(0, 200));
        }
      } catch {
        console.warn(`[n8n webhook] Received error status ${response.status}:`, responseText.substring(0, 200));
      }
      
      return {
        error: `Webhook error: ${response.status} ${response.statusText}`,
        response: errorMessage
      };
    }

   
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
     
      console.log("Response is not JSON, using as plain text");
      return {
        response: responseText || "I received your message, but couldn't process the response properly."
      };
    }

    return data;
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
    
   
    if (chatbotResponse.error) {
    
      return res.status(200).json({
        response: chatbotResponse.response || chatbotResponse.error,
        message: chatbotResponse.response || chatbotResponse.error,
        error: chatbotResponse.error
      });
    }

    // Handle different response formats from n8n webhook
    // n8n can return responses in various formats:
    // - { response: "..." }
    // - { message: "..." }
    // - { text: "..." }
    // - Array format
    // - Direct string
    let responseText: string;

    if (typeof chatbotResponse === 'string') {
      responseText = chatbotResponse;
    } else if (Array.isArray(chatbotResponse) && chatbotResponse.length > 0) {
      // If array, take first item
      const firstItem = chatbotResponse[0];
      responseText = typeof firstItem === 'string' 
        ? firstItem 
        : firstItem?.response || firstItem?.message || firstItem?.text || JSON.stringify(firstItem);
    } else if (chatbotResponse && typeof chatbotResponse === 'object') {
     
      responseText = chatbotResponse.response || 
                    chatbotResponse.message || 
                    chatbotResponse.text ||
                    chatbotResponse.data ||
                    chatbotResponse.output ||
                    (chatbotResponse.body && (typeof chatbotResponse.body === 'string' ? chatbotResponse.body : JSON.stringify(chatbotResponse.body))) ||
                    JSON.stringify(chatbotResponse);
    } else {
      responseText = "I received your message, but couldn't process the response.";
    }

    
    responseText = responseText.trim();

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


