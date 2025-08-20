import { GoogleGenerativeAI } from '@google/generative-ai';
import "dotenv/config";

const GEMINI_API_KEY = '<your-gemini-api-key>';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

// Get the model
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
(async () => {
    const items = [
        { name: 'apple', calories: 10 },
        { name: 'banana', calories: 20 },
        { name: 'orange', calories: 30 }
    ];
    // const result = await model.generateContent('what is 100+100?');
    const result = await model.generateContent(
        'What is the total calorie count of the following items, give me the total number of calories, protein, fats and carbs in a comma-separated format like this cal: x pro: y fat: z carb: w: . ' +
        'if you dont have enough information, google it. ' +
        'give me total followed by the breakdown of each individual item: ' +
        'apple, banana' +
        ' and return the result in a JSON format with the keys "total" and "breakdown". both should be in json as well.'
    );
    const response = result.response;
    // const responseText = response.text().slice(7, response.text().length).trim().trimEnd().slice(0, -3);
    // const json = JSON.parse(response);
    console.log(response.text());

})();
