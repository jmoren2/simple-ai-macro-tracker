// app/api/analyze-calories/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { items } = await req.body;

        for (const element of items) {
            if (element.calories === 'unknown') {
                const calories = await getCaloriesForItem(element.name);
                element.calories = calories;
            }
        }

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid items array' }, { status: 400 });
        }

        const prompt = `
                You are a nutrition assistant. Given the list of food items with names and calories, respond ONLY in valid JSON.
                If you don't have enough information, google it the food to see if you can find the nutritional information.

                - Calculate total calories, protein, fat, and carbs.
                - Return a JSON object with:
                - "total": { "calories": number, "protein": number, "fat": number, "carbs": number }
                - "breakdown": { [food name]: { "calories": number, "protein": number, "fat": number, "carbs": number } }

                Example:

                {
                "total": { "calories": 300, "protein": 15, "fat": 10, "carbs": 40 },
                "breakdown": {
                    "apple": { "calories": 95, "protein": 0.5, "fat": 0.3, "carbs": 25 },
                    ...
                }
                }

                If information is unavailable, return 0 for those values.

                Return ONLY valid JSON. No explanation, no markdown, no labels.

                Data:
                ${JSON.stringify(items)}
        `;


        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const match = text.match(/```json\s*({[\s\S]*?})\s*```/) || text.match(/{[\s\S]*}/);
        if (!match) {
            return NextResponse.json({ error: 'Could not extract valid JSON' }, { status: 500 });
        }

        const json = JSON.parse(match[1] || match[0]);

        return res.status(200).json(json);
    } catch (error: unknown) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}


const calorieCache = new Map<string, number>();

async function getCaloriesForItem(name: string): Promise<number> {
    if (calorieCache.has(name.toLowerCase())) {
        return calorieCache.get(name.toLowerCase())!;
    }

    const prompt = `How many calories are in ${name}? Respond with just the number. No units, no explanation.`;
    const result = await model.generateContent(prompt);
    const raw = result.response.text()?.trim();
    const match = raw.match(/\d+/);
    if (!match) {
        console.warn(`Could not find calories in response: "${raw}"`);
    }
    const parsed = match ? parseInt(match[0], 10) : 0;

    calorieCache.set(name, parsed);
    return isNaN(parsed) ? 0 : parsed;
}
