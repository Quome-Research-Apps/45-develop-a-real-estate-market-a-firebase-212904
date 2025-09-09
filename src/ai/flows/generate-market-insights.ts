'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating market insights from a real estate dataset.
 *
 * The flow takes a dataset summary as input and returns a human-readable summary of key market insights and trends.
 *
 * @fileExport generateMarketInsights - An async function to trigger the market insights generation flow.
 * @fileExport GenerateMarketInsightsInput - The input type for the generateMarketInsights function.
 * @fileExport GenerateMarketInsightsOutput - The output type for the generateMarketInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMarketInsightsInputSchema = z.object({
  datasetSummary: z
    .string()
    .describe(
      'A summary of the real estate dataset, including key statistics and characteristics.'
    ),
  userPrompt: z
    .string()
    .optional()
    .describe(
      'Optional prompt from the user, asking the AI to focus on certain aspects of the dataset when generating the insights.'
    ),
});
export type GenerateMarketInsightsInput = z.infer<
  typeof GenerateMarketInsightsInputSchema
>;

const GenerateMarketInsightsOutputSchema = z.object({
  insights: z
    .string()
    .describe('A human-readable summary of key market insights and trends.'),
});
export type GenerateMarketInsightsOutput = z.infer<
  typeof GenerateMarketInsightsOutputSchema
>;

export async function generateMarketInsights(
  input: GenerateMarketInsightsInput
): Promise<GenerateMarketInsightsOutput> {
  return generateMarketInsightsFlow(input);
}

const generateMarketInsightsPrompt = ai.definePrompt({
  name: 'generateMarketInsightsPrompt',
  input: {schema: GenerateMarketInsightsInputSchema},
  output: {schema: GenerateMarketInsightsOutputSchema},
  prompt: `You are an expert real estate market analyst. Analyze the following dataset summary and generate a human-readable summary of key market insights and trends.

Dataset Summary:
{{datasetSummary}}

{{#if userPrompt}}
User Prompt: {{userPrompt}}

Consider the user prompt while generating the insights. Focus your analysis based on the prompt.
{{/if}}

Focus on identifying the most significant trends, patterns, and anomalies in the data. Provide actionable insights that would be valuable to real estate investors and analysts.

Output Format:
A concise summary of key insights and trends.
`,
});

const generateMarketInsightsFlow = ai.defineFlow(
  {
    name: 'generateMarketInsightsFlow',
    inputSchema: GenerateMarketInsightsInputSchema,
    outputSchema: GenerateMarketInsightsOutputSchema,
  },
  async input => {
    const {output} = await generateMarketInsightsPrompt(input);
    return output!;
  }
);
