import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function AigetStanceScore(Number, description) {
  const prompt = `
You are a political analyst. Evaluate the ideological stance of the following legislative bill. On a scale from 1 (very conservative) to 10 (very progressive), how would you rate this bill based on its language, policy goals, and typical partisan alignment?

Bill Number: ${Number}
Bill Description: ${description}

Return your rating and 1-sentence reasoning like this:
Rating: X
Reason: [short explanation]
`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3
  });

  const content = response.choices[0].message.content;
  const match = content.match(/Rating:\s*(\d+)/i);
  const score = match ? parseInt(match[1]) : null;

  return { score, reasoning: content };
}
