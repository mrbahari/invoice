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
    The prompts must be in English.
    Each prompt must request a modern, symbolic, and minimalist vector-style logo.
    Crucially, each prompt must explicitly forbid the use of any text, letters, shadows, gradients, or 3D rendering.
    The background for every logo must be a solid white color.
    Focus on abstract concepts or key visual elements from the description.

    Store Name: "{{storeName}}"
    Description (in Persian): "{{description}}"

    Example Output Format:
    1. A minimalist vector logo of a stylized [key element], using geometric shapes and a [color palette] color scheme. NO text, letters, shadows, or 3d rendering.
    2. An abstract logo representing [concept from description], with clean lines and a simple, modern design, flat icon style. NO text, letters, shadows, or 3d rendering.
    3. A simple, iconic mark combining [element 1] and [element 2], flat 2d vector style, on a solid white background. NO text, letters, shadows, or 3d rendering.
    4. A negative space logo featuring a [main subject] within a [shape], clean and clever design, isolated on a solid white background. NO text, letters, shadows, or 3d rendering.
    5. A geometric logo made of interlocking shapes that form a [symbol related to the store], using a limited color palette. NO text, letters, shadows, or 3d rendering.
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
