import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import logger from '../utils/logger';

// Initialize custom Google provider with the specific API key
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Initialize OpenAI provider
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIService {
  /**
   * Uses Gemini to analyze weather data and provide a recommendation.
   * @param location The location to analyze
   */
  async getWeatherAnalysis(location: string): Promise<any> {
    try {
      const { text } = await generateText({
        model: google('gemini-1.5-flash'),
        system: "You are a helpful weather assistant. Provide a concise weather analysis and recommendation for the given location.",
        prompt: `Analyze the weather for ${location} and give a recommendation.`,
      });

      return {
        analysis: text,
        provider: "Google Gemini 1.5 Flash (Vercel AI SDK)",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error("Gemini API error:", error);
      throw new Error("Failed to get weather analysis from Gemini");
    }
  }

  /**
   * Uses Gemini to analyze market sentiment for a token.
   * @param token The token symbol (e.g., AVAX)
   */
  async getMarketSentiment(token: string): Promise<any> {
    try {
      // Using Gemini 1.5 Flash for speed and efficiency
      const { text } = await generateText({
        model: google('gemini-1.5-flash'),
        prompt: `Analyze the current market sentiment for ${token} (Avalanche). Provide a bullish/bearish score (0-100) and a brief reason.`,
      });

      return {
        sentiment: text,
        provider: "Google Gemini 1.5 Flash (Vercel AI SDK)",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error("Gemini API error:", error);
      // Fallback for demo if API fails or key is missing
      return {
        sentiment: `Simulated Bullish Sentiment for ${token} (Gemini Fallback)`,
        score: 85,
        provider: "Google Gemini (Simulated)",
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Uses OpenAI to generate a completion.
   * @param prompt The user prompt
   */
  async getOpenAICompletion(prompt: string): Promise<any> {
    try {
      const { text } = await generateText({
        model: openai('gpt-4o'),
        prompt: prompt,
      });

      return {
        response: text,
        provider: "OpenAI GPT-4o",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error("OpenAI API error:", error);
      throw new Error("Failed to get completion from OpenAI");
    }
  }
}
