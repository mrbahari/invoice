'use server';
/**
 * @fileOverview Extracts a list of materials from a file using AI.
 *
 * - extractMaterialsFromFile: A function that analyzes a file (image, pdf, text).
 * - ExtractMaterialsInput: The input type for the function.
 * - ExtractMaterialsOutput: The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MaterialSchema = z.object({
    material: z.string().describe('The name of the construction material in Persian.'),
    quantity: z.number().describe('The quantity of the material.'),
    unit: z.string().describe('The unit of measurement for the material (e.g., "شاخه", "برگ", "عدد").'),
});

const ExtractMaterialsInputSchema = z.object({
  fileDataUri: z.string().describe("A file (image, PDF, text) encoded as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type ExtractMaterialsInput = z.infer<typeof ExtractMaterialsInputSchema>;

const ExtractMaterialsOutputSchema = z.object({
  materials: z.array(MaterialSchema).describe('An array of materials extracted from the file.'),
});
export type ExtractMaterialsOutput = z.infer<typeof ExtractMaterialsOutputSchema>;


const extractMaterialsPrompt = ai.definePrompt({
    name: 'extractMaterialsPrompt',
    input: { schema: ExtractMaterialsInputSchema },
    output: { schema: ExtractMaterialsOutputSchema },
    prompt: `
    You are an expert assistant for a construction material supplier in Iran.
    Your task is to analyze the provided document (which could be an image of a handwritten list, a PDF, or a text file) and extract a list of all construction materials mentioned.
    For each material, you must identify its name, quantity, and unit of measurement.
    The response MUST be in Persian.

    Analyze the following file content:
    {{media url=fileDataUri}}
    `,
});

const extractMaterialsFlow = ai.defineFlow(
  {
    name: 'extractMaterialsFlow',
    inputSchema: ExtractMaterialsInputSchema,
    outputSchema: ExtractMaterialsOutputSchema,
  },
  async (input) => {
    const { output } = await extractMaterialsPrompt(input);
    
    if (!output || !output.materials) {
      return { materials: [] };
    }
    return output;
  }
);


// Exported wrapper function
export async function extractMaterialsFromFile(input: ExtractMaterialsInput): Promise<ExtractMaterialsOutput> {
    try {
        const result = await extractMaterialsFlow(input);
        return result || { materials: [] };
    } catch (error) {
        console.error("Error in extractMaterialsFromFile flow:", error);
        // Return an empty list on failure to prevent crashes
        return { materials: [] };
    }
}
