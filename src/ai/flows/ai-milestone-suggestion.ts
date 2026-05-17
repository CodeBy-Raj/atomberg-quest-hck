'use server';
/**
 * @fileOverview An AI assistant that suggests achievable sub-tasks and milestones for a given goal.
 *
 * - suggestMilestones - A function that handles the milestone suggestion process.
 * - SuggestMilestoneInput - The input type for the suggestMilestones function.
 * - SuggestMilestoneOutput - The return type for the suggestMilestones function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMilestoneInputSchema = z.object({
  goal: z.string().describe('The main goal for which milestones and sub-tasks are to be suggested.'),
});
export type SuggestMilestoneInput = z.infer<typeof SuggestMilestoneInputSchema>;

const MilestoneSchema = z.object({
  title: z.string().describe('The title or description of a specific milestone.'),
  subTasks: z.array(z.string()).describe('A list of achievable sub-tasks required to complete this milestone.'),
});

const SuggestMilestoneOutputSchema = z.object({
  milestones: z.array(MilestoneSchema).describe('A list of suggested milestones, each containing a title and associated sub-tasks.'),
});
export type SuggestMilestoneOutput = z.infer<typeof SuggestMilestoneOutputSchema>;

export async function suggestMilestones(input: SuggestMilestoneInput): Promise<SuggestMilestoneOutput> {
  return aiMilestoneSuggestionFlow(input);
}

const aiMilestoneSuggestionPrompt = ai.definePrompt({
  name: 'aiMilestoneSuggestionPrompt',
  input: {schema: SuggestMilestoneInputSchema},
  output: {schema: SuggestMilestoneOutputSchema},
  prompt: `You are an AI Milestone Assistant. Your task is to break down a given main goal into a series of achievable milestones, and for each milestone, list specific sub-tasks required to complete it. Provide concise and actionable suggestions in JSON format.

Main Goal: {{{goal}}}`,
});

const aiMilestoneSuggestionFlow = ai.defineFlow(
  {
    name: 'aiMilestoneSuggestionFlow',
    inputSchema: SuggestMilestoneInputSchema,
    outputSchema: SuggestMilestoneOutputSchema,
  },
  async input => {
    const {output} = await aiMilestoneSuggestionPrompt(input);
    return output!;
  }
);
