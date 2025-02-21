import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



export const callLLM = async (prompt: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: "chatgpt-4o-latest",
      messages: [
        {
          role: "user",
          content: `Does the query "${prompt}" match any existing entity names? If so, return the canonical name, otherwise return "new_entity"`,
        },
      ],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating response:", error);
    throw new Error("Failed to generate response");
  }
};
