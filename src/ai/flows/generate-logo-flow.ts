'use server';
/**
 * @fileOverview Generates a logo for a store using AI.
 *
 * - generateLogo - A function that generates a logo based on store name and description.
 * - GenerateLogoInput - The input type for the generateLogo function.
 * - GenerateLogoOutput - The return type for the generateLogo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateLogoInputSchema = z.object({
  storeName: z.string().describe('The name of the store or company.'),
  description: z.string().describe('A brief description of what the store sells or does.'),
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
      const { media } = await ai.generate({
          model: 'googleai/imagen-4.0-fast-generate-001',
          prompt: `یک لوگوی مدرن، ساده و مینیمال برای یک فروشگاه با نام «${input.storeName}» طراحی کن. توضیحات فروشگاه: «${input.description}». لوگو باید حرفه‌ای، تمیز و مناسب برای استفاده در وب‌سایت باشد. از پس‌زمینه سفید استفاده کن و هیچ متنی به لوگو اضافه نکن.`,
      });
      if (media && media.url) {
          return { imageUrl: media.url };
      }
    } catch (error) {
      console.warn("AI logo generation failed.", error);
      // Fallback to picsum if AI generation fails
      const seed = encodeURIComponent(`${input.storeName} ${input.description}`);
      return { imageUrl: `https://picsum.photos/seed/${seed}/110/110` };
    }

    return {};
  }
);
