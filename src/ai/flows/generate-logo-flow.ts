'use server';
/**
 * @fileOverview Generates a logo for a store using AI.
 *
 * - generateLogo - A function that generates a logo based on a given prompt.
 * - GenerateLogoInput - The input type for the generateLogo function.
 * - GenerateLogoOutput - The return type for the generateLogo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateLogoInputSchema = z.object({
  prompt: z.string().describe('The detailed prompt to use for generating the logo.'),
  storeName: z.string().describe('The name of the store (for fallback).'),
});
export type GenerateLogoInput = z.infer<typeof GenerateLogoInputSchema>;

const GenerateLogoOutputSchema = z.object({
  imageUrl: z.string().optional().describe('A URL (data URI) for the generated logo image.'),
});
export type GenerateLogoOutput = z.infer<typeof GenerateLogoOutputSchema>;


// Exported wrapper function
export async function generateLogo(input: GenerateLogoInput): Promise<GenerateLogoOutput> {
  return generateLogoFlow(input);
}


const generateLogoFlow = ai.defineFlow(
  {
    name: 'generateLogoFlow',
    inputSchema: GenerateLogoInputSchema,
    outputSchema: GenerateLogoOutputSchema,
  },
  async (input) => {
    
    try {
      const finalPrompt = `${input.prompt}, logo, minimalist, vector, flat icon, 2d, isolated on white background, simple. NO text, NO letters, NO shadows, NO gradients, NO 3d rendering.`;

      const { media } = await ai.generate({
          model: 'googleai/imagen-4.0-fast-generate-001',
          prompt: finalPrompt,
      });
      if (media && media.url) {
          return { imageUrl: media.url };
      }
    } catch (error) {
      console.warn("AI logo generation failed.", error);
      // Fallback to picsum if AI generation fails, using a unique seed
      const seed = encodeURIComponent(`${input.storeName}-${Date.now()}`);
      return { imageUrl: `https://picsum.photos/seed/${seed}/110/110` };
    }

    return {};
  }
);
