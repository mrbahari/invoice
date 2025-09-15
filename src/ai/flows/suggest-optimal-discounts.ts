// use server'

/**
 * @fileOverview This file defines a Genkit flow for suggesting optimal discounts for an invoice.
 *
 * The flow considers customer purchase history, selected products, and current promotions to
 * maximize sales while rewarding loyal customers.
 *
 * @interface SuggestOptimalDiscountsInput - Input schema for the suggestOptimalDiscounts flow.
 * @interface SuggestOptimalDiscountsOutput - Output schema for the suggestOptimalDiscounts flow.
 * @function suggestOptimalDiscounts -  Wrapper function to call suggestOptimalDiscountsFlow.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


const SuggestOptimalDiscountsInputSchema = z.object({
  customerId: z.string().describe('The ID of the customer.'),
  products: z.array(z.object({
    productId: z.string().describe('The ID of the product.'),
    quantity: z.number().describe('The quantity of the product.'),
    price: z.number().describe('The price of the product.')
  })).describe('The products included in the invoice.'),
  currentPromotions: z.array(z.object({
    promotionId: z.string().describe('The ID of the promotion.'),
    description: z.string().describe('The description of the promotion.'),
    discountPercentage: z.number().describe('The discount percentage of the promotion.')
  })).optional().describe('The current active promotions.'),
  customerPurchaseHistory: z.string().describe('A string containing the customer purchase history.')
});

export type SuggestOptimalDiscountsInput = z.infer<typeof SuggestOptimalDiscountsInputSchema>;

const SuggestOptimalDiscountsOutputSchema = z.object({
  suggestedDiscounts: z.array(z.object({
    productId: z.string().optional().describe('The ID of the product to apply the discount to, if applicable.'),
    promotionId: z.string().optional().describe('The ID of the promotion to apply, if applicable.'),
    discountPercentage: z.number().describe('The suggested discount percentage.'),
    reason: z.string().describe('The reason for the suggested discount.')
  })).describe('The suggested discounts for the invoice.')
});

export type SuggestOptimalDiscountsOutput = z.infer<typeof SuggestOptimalDiscountsOutputSchema>;


export async function suggestOptimalDiscounts(input: SuggestOptimalDiscountsInput): Promise<SuggestOptimalDiscountsOutput> {
  return suggestOptimalDiscountsFlow(input);
}

const suggestOptimalDiscountsPrompt = ai.definePrompt({
  name: 'suggestOptimalDiscountsPrompt',
  input: {schema: SuggestOptimalDiscountsInputSchema},
  output: {schema: SuggestOptimalDiscountsOutputSchema},
  prompt: `You are an expert sales strategist. Given the following information about a customer, their purchase, and current promotions, suggest the optimal discounts to apply to the invoice to maximize sales and reward loyal customers.

Customer ID: {{{customerId}}}
Customer Purchase History: {{{customerPurchaseHistory}}}
Products:
{{#each products}}
  - Product ID: {{{productId}}}, Quantity: {{{quantity}}}, Price: {{{price}}}
{{/each}}
Current Promotions:
{{#if currentPromotions}}
{{#each currentPromotions}}
  - Promotion ID: {{{promotionId}}}, Description: {{{description}}}, Discount Percentage: {{{discountPercentage}}}
{{/each}}
{{else}}
  No current promotions.
{{/if}}

Consider the customer's purchase history, the products they are buying, and any current promotions to determine the best discounts to apply.  Provide a reason for each discount. If there are no discounts to apply, return an empty array.

Ensure that the output is a JSON array of objects, where each object has the following keys:
- productId: The ID of the product to apply the discount to, if applicable. If the discount is not product-specific, this field should be null.
- promotionId: The ID of the promotion to apply, if applicable. If the discount is not tied to a specific promotion, this field should be null.
- discountPercentage: The suggested discount percentage.
- reason: The reason for the suggested discount.
`,
});

const suggestOptimalDiscountsFlow = ai.defineFlow(
  {
    name: 'suggestOptimalDiscountsFlow',
    inputSchema: SuggestOptimalDiscountsInputSchema,
    outputSchema: SuggestOptimalDiscountsOutputSchema,
  },
  async input => {
    const {output} = await suggestOptimalDiscountsPrompt(input);
    return output!;
  }
);
