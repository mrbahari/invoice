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

// The AI will now only generate the key visual elements, not the full prompt.
const GenerateLogoPromptsOutputSchema = z.object({
  elements: z
    .array(z.string())
    .length(5)
    .describe('An array of exactly 5 distinct, simple, one-or-two-word visual elements for a logo. Examples: "a trowel", "a house outline", "a smiling tooth", "a drywall panel".'),
});
export type GenerateLogoPromptsOutput = z.infer<typeof GenerateLogoPromptsOutputSchema>;


// This is the strict template we will enforce.
const PROMPT_TEMPLATE = "A simple, modern, minimalist vector logo of [ELEMENT]. Flat 2d icon. Isolated on a solid plain white background. NO text, NO letters, NO shadows, NO gradients, NO 3d rendering.";


// Exported wrapper function
export async function generateLogoPrompts(input: GenerateLogoPromptsInput): Promise<{ prompts: string[] }> {
  const result = await generateLogoPromptsFlow(input);
  // Return an empty array if the flow fails, to prevent crashes.
  return result || { prompts: [] };
}

const prompt = ai.definePrompt({
    name: 'generateLogoElementsPrompt', // Renamed for clarity
    input: { schema: GenerateLogoPromptsInputSchema },
    output: { schema: GenerateLogoPromptsOutputSchema },
    prompt: `
    Based on the following store name and description (in Persian), generate 5 distinct, simple, one-or-two-word visual elements that could be used in a logo.
    The elements must be in English.
    Focus on abstract concepts or key physical items from the description. Do NOT describe a scene or a landscape. Just the object/concept.

    Store Name: "{{storeName}}"
    Description (in Persian): "{{description}}"

    Example output for a store that sells "drywall and ceiling materials":
    { "elements": ["a stylized wall corner", "a stack of panels with a trowel", "an abstract house outline", "a single drywall screw", "a measuring tape"] }

    Example output for a dental clinic:
    { "elements": ["a smiling tooth", "an abstract molar shape", "a dental mirror icon", "a sparkling star on a tooth", "a heart with a tooth inside"] }
    `,
});


const generateLogoPromptsFlow = ai.defineFlow(
  {
    name: 'generateLogoPromptsFlow',
    inputSchema: GenerateLogoPromptsInputSchema,
    // The final output of the flow is an array of full prompts
    outputSchema: z.object({ prompts: z.array(z.string()) }), 
  },
  async (input) => {
    try {
      // 1. Get the key visual elements from the AI
      const { output } = await prompt(input);
      if (!output || !output.elements) {
        throw new Error("Failed to generate logo elements.");
      }
      
      // 2. Build the full, strict prompts using our template
      const finalPrompts = output.elements.map(element => 
        PROMPT_TEMPLATE.replace('[ELEMENT]', element)
      );

      return { prompts: finalPrompts };
    } catch (error) {
      console.error("Error in generateLogoPromptsFlow:", error);
      // Return null or an empty structure to handle the failure gracefully
      return null;
    }
  }
);
