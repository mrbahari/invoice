'use server';
/**
 * @fileOverview Generates a list of creative prompts for designing a logo.
 *
 * - generateLogoPrompts - A function that creates logo design prompts based on a store's name and description.
 * - GenerateLogoPromptsInput - The input type for the function.
 * - GenerateLogoPromptsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateLogoPromptsInputSchema = z.object({
  storeName: z.string().describe('The name of the store or company.'),
  description: z.string().describe('A brief description of what the store sells or does.'),
});
export type GenerateLogoPromptsInput = z.infer<typeof GenerateLogoPromptsInputSchema>;

const GenerateLogoPromptsOutputSchema = z.object({
  prompts: z
    .array(z.string())
    .length(5)
    .describe('An array of exactly 5 creative and distinct prompts for generating a logo.'),
});
export type GenerateLogoPromptsOutput = z.infer<typeof GenerateLogoPromptsOutputSchema>;

// Exported wrapper function
export async function generateLogoPrompts(input: GenerateLogoPromptsInput): Promise<GenerateLogoPromptsOutput> {
  return generateLogoPromptsFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateLogoPromptsPrompt',
    input: { schema: GenerateLogoPromptsInputSchema },
    output: { schema: GenerateLogoPromptsOutputSchema },
    prompt: `
    Based on the following store name and description, generate 5 distinct and creative prompts for an AI image generator to create a logo.
    The prompts should be in English.
    The logo should be modern, symbolic, minimal, and use a vector style. It must NOT contain any text.
    The background must be a solid white color.
    Focus on abstract concepts or key visual elements from the description.

    Store Name: "{{storeName}}"
    Description (in Persian): "{{description}}"

    Example Output Format:
    1. A minimalist vector logo of a stylized [key element], using geometric shapes and a [color palette] color scheme, on a solid white background. No text.
    2. An abstract logo representing [concept from description], with clean lines and a simple, modern design, on a solid white background. No text.
    3. A simple, iconic mark combining [element 1] and [element 2], flat vector style, on a solid white background. No text.
    4. A negative space logo featuring a [main subject] within a [shape], clean and clever design, on a solid white background. No text.
    5. A geometric logo made of interlocking shapes that form a [symbol related to the store], using a limited color palette, on a solid white background. No text.
    `,
});


const generateLogoPromptsFlow = ai.defineFlow(
  {
    name: 'generateLogoPromptsFlow',
    inputSchema: GenerateLogoPromptsInputSchema,
    outputSchema: GenerateLogoPromptsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Failed to generate logo prompts.");
    }
    return output;
  }
);
