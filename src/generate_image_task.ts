import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateIPOImage() {
  const prompt = `
    A professional, high-quality technical diagram of an IPO (Input-Process-Output) model for a "Columbarium Information System".
    
    The diagram should be divided into three clear vertical sections:
    
    1. INPUT SECTION (Left):
       - Title: "INPUT"
       - Items: "Admin Credentials, Deceased Records, Niche Details, Search Queries, Reservation Data"
       - Tech Stack: "HTML5, Tailwind CSS, Vanilla JavaScript (ES6+)"
    
    2. PROCESS SECTION (Middle):
       - Title: "PROCESS"
       - Items: "Authentication Logic, CRUD Operations, SQL Query Execution, Data Filtering, State Management"
       - Tech Stack: "PHP 8.x (API), MySQL (Database), AJAX/Fetch API"
    
    3. OUTPUT SECTION (Right):
       - Title: "OUTPUT"
       - Items: "Interactive Niche Map, Digital Registry, Analytics Dashboard, Search Results, Status Notifications"
       - Tech Stack: "Chart.js, Lucide Icons, JSON Responses"
    
    Include a "FEEDBACK" arrow at the bottom connecting Output to Input.
    Design Style: Modern, clean, professional blue and gold color scheme (church/sacred theme). 
    Text must be crisp and easy to read. Flat design with subtle shadows.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        console.log("IMAGE_GENERATED_SUCCESSFULLY");
        // In a real app, we'd save this or display it.
      }
    }
  } catch (error) {
    console.error("Error generating image:", error);
  }
}

generateIPOImage();
