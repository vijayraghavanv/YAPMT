export interface Setting {
    key: string;
    type: string;
    description: string;
    id: number;
    value: string;
}

export interface LLMSetupState {
    step: number;
    selectedLLM: 'openai' | 'anthropic' | null;
    apiKey: string;
}
