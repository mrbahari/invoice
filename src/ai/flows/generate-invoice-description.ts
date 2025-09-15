'use server';

/**
 * @fileOverview Generates a professional and concise description for an invoice based on the products and quantities included.
 *
 * - generateInvoiceDescription - A function that generates the invoice description.
 * - GenerateInvoiceDescriptionInput - The input type for the generateInvoiceDescription function.
 * - GenerateInvoiceDescriptionOutput - The return type for the generateInvoiceDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInvoiceDescriptionInputSchema = z.object({
  products: z.array(
    z.object({
      name: z.string().describe('The name of the product.'),
      quantity: z.number().describe('The quantity of the product.'),
    })
  ).describe('A list of products included in the invoice.'),
});
export type GenerateInvoiceDescriptionInput = z.infer<typeof GenerateInvoiceDescriptionInputSchema>;

const GenerateInvoiceDescriptionOutputSchema = z.object({
  description: z.string().describe('A professional and concise description of the invoice.'),
});
export type GenerateInvoiceDescriptionOutput = z.infer<typeof GenerateInvoiceDescriptionOutputSchema>;

export async function generateInvoiceDescription(input: GenerateInvoiceDescriptionInput): Promise<GenerateInvoiceDescriptionOutput> {
  return generateInvoiceDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInvoiceDescriptionPrompt',
  input: {schema: GenerateInvoiceDescriptionInputSchema},
  output: {schema: GenerateInvoiceDescriptionOutputSchema},
  prompt: `Generate a professional and concise description for the following invoice.

Invoice Items:
{{#each products}}
- {{quantity}} x {{name}}
{{/each}}

Description:`, // Keep it simple and direct
});

const generateInvoiceDescriptionFlow = ai.defineFlow(
  {
    name: 'generateInvoiceDescriptionFlow',
    inputSchema: GenerateInvoiceDescriptionInputSchema,
    outputSchema: GenerateInvoiceDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
