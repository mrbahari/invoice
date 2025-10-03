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
    Each prompt MUST strictly follow this template:
    "A simple, modern, minimalist vector logo of a [key visual element from the store description]. Flat 2d icon. Isolated on a solid plain white background. NO text, NO letters, NO shadows, NO gradients, NO 3d rendering."

    Focus on abstract concepts or key visual elements from the description. Do NOT describe a scene or a landscape. Describe ONLY the icon.

    Store Name: "{{storeName}}"
    Description (in Persian): "{{description}}"

    Example output for a store that sells "drywall and ceiling materials":
    1. A simple, modern, minimalist vector logo of a stylized wall corner with a ceiling line. Flat 2d icon. Isolated on a solid plain white background. NO text, NO letters, NO shadows, NO gradients, NO 3d rendering.
    2. A simple, modern, minimalist vector logo of a stack of panels with a trowel. Flat 2d icon. Isolated on a solid plain white background. NO text, NO letters, NO shadows, NO gradients, NO 3d rendering.
    3. A simple, modern, minimalist vector logo of an abstract house outline made from a single line. Flat 2d icon. Isolated on a solid plain white background. NO text, NO letters, NO shadows, NO gradients, NO 3d rendering.
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
