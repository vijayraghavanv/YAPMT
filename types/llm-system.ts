export interface LLMSystem {
  name: string
  api_key_setting: string
  default_model: string
  default_multimodal: string
  available_models: string // JSON string of models array
  is_default: boolean
  id: number
}
