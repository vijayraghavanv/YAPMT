'use server'

import { Setting } from "@/types/settings"
import { Project, ProjectStatus } from "@/types/project"
import { Prompt } from "@/types/prompt"
import { PromptVersion, PromptVariable } from "@/types/prompt-version"
import { LLMSystem } from "@/types/llm-system"

interface RunComparison {
  prompt_id: number
  project_id: number
  input_variables: Record<string, string>
  model: string
  structured_output: boolean
  version: number
  id: number
  output: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  latency_ms: number
  run_metadata: {
    structured_output: boolean
    has_images: boolean
    timestamp: string
  }
  created_at: string
  updated_at: string | null
}

interface RunPayload {
  prompt_id: number
  project_id: number
  input_variables: Record<string, string>
  model: string
  structured_output: boolean
  markdown_mode: boolean
  version?: string
}

interface RunResponse {
  output: string
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  latency_ms?: number
  structured_output?: boolean
  run_metadata?: {
    structured_output: boolean
    has_images: boolean
    timestamp: string
  }
}

interface CreatePromptData {
  id?: number
  name: string
  description?: string
  content: string
  project_id: number
  variables: PromptVariable[]
  max_tokens: number
  temperature: number
  status: 'draft'
  output_schema?: Record<string, unknown> | null
  has_structured_output: boolean
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://backend:8000'

export async function getSettings(): Promise<Setting[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/settings`)
    if (!response.ok) {
      throw new Error('Failed to fetch settings')
    }
    return response.json()
  } catch (error) {
    console.error('Error fetching settings:', error)
    return []
  }
}

export async function saveSetting(setting: {
  key: string
  type: string
  value: string
  description: string
}): Promise<Setting> {
  const response = await fetch(`${BACKEND_URL}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(setting)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || 'Failed to save setting')
  }

  const data = await response.json()
  if (!data.key) {
    throw new Error('Invalid response from server')
  }

  return data
}

export async function getProjects(): Promise<Project[]> {
  const response = await fetch(`${BACKEND_URL}/projects`)
  if (!response.ok) {
    throw new Error('Failed to fetch projects')
  }
  return response.json()
}

export async function deleteProject(projectId: number): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/projects/${projectId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete project')
  }
}

export async function getProject(projectId: string): Promise<Project> {
  const response = await fetch(`${BACKEND_URL}/projects/${projectId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch project details')
  }
  return response.json()
}

export async function getProjectPrompts(projectId: string): Promise<Prompt[]> {
  const response = await fetch(`${BACKEND_URL}/prompts/project/${projectId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch prompts')
  }
  return response.json()
}

export async function deletePrompt(promptId: number): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/prompts/${promptId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete prompt')
  }
}

export async function createOrUpdateProject(
  projectData: {
    name: string
    description: string
    status: ProjectStatus
    tags: string[]
  },
  projectId?: number
): Promise<Project> {
  const method = projectId ? 'PUT' : 'POST'
  const url = projectId ? `${BACKEND_URL}/projects/${projectId}` : `${BACKEND_URL}/projects`

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectData),
  })

  if (!response.ok) {
    throw new Error(projectId ? 'Failed to update project' : 'Failed to create project')
  }

  return response.json()
}

export async function getPromptVersions(promptId: string): Promise<PromptVersion[]> {
  const response = await fetch(`${BACKEND_URL}/prompts/${promptId}/versions`)
  if (!response.ok) {
    throw new Error('Failed to fetch versions')
  }
  return response.json()
}

export async function getPromptRuns(promptId: string): Promise<RunComparison[]> {
  const response = await fetch(`${BACKEND_URL}/runs/${promptId}/list`)
  if (!response.ok) {
    throw new Error('Failed to fetch runs')
  }
  return response.json()
}

export async function getLLMSystems(): Promise<LLMSystem[]> {
  const response = await fetch(`${BACKEND_URL}/llm-systems`)
  if (!response.ok) {
    throw new Error('Failed to fetch LLM systems')
  }
  return response.json()
}

export async function runPrompt(payload: RunPayload): Promise<RunResponse> {
  const response = await fetch(`${BACKEND_URL}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || 'Failed to run prompt')
  }

  return response.json()
}

export async function createOrUpdatePrompt(promptData: CreatePromptData, promptId?: number): Promise<Prompt> {
  const method = promptId ? 'PUT' : 'POST'
  const url = promptId ? `${BACKEND_URL}/prompts/${promptId}` : `${BACKEND_URL}/prompts`

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(promptData),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || 'Failed to create/update prompt')
  }

  return response.json()
}
