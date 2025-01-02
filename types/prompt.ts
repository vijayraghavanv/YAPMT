import { PromptVariable } from "./prompt-version";

export interface Prompt {
  id: number;
  name: string;
  description: string;
  version_count: number;
  current_version: number;
  status: string;
  content: string;
  variables: PromptVariable[];
  max_tokens: number;
  temperature: number;
  output_schema: Record<string, unknown>;
}
