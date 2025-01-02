export interface PromptVariable {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  default?: string | null;
  example?: string;
}

export interface PromptVersion {
  version: string;
  content: string;
  variables: PromptVariable[];
  max_tokens: number;
  temperature: number;
  created_at: string;
  prompt_id: number;
  prompt_name: string;
  prompt_description: string;
  project_id: number;
  output_schema: Record<string, unknown> | null;
}
