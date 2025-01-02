"use client"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, HelpCircle } from "lucide-react"
import { FileUpload } from "@/components/ui/file-upload"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import ReactMarkdown from 'react-markdown'
import { JsonView, defaultStyles, darkStyles } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'
import { LLMSystem } from "@/types/llm-system"
import { useTheme } from "next-themes"
import { getPromptVersions, getLLMSystems, runPrompt } from "@/app/actions"
import { PromptVersion, PromptVariable } from "@/types/prompt-version"

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

interface RunPromptPageProps {
  params: Promise<{ id: string }>
}

export default function RunPromptPage({ params }: RunPromptPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { theme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string>("")
  const [variables, setVariables] = useState<Record<string, string | File>>({})
  const [result, setResult] = useState<RunResponse | null>(null)
  const [activeTab, setActiveTab] = useState("prompt")
  const [resultTab, setResultTab] = useState("output")
  const [llmSystems, setLLMSystems] = useState<LLMSystem[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [markdownMode, setMarkdownMode] = useState(false)
  const [structuredOutput, setStructuredOutput] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [versionsData, llmSystemsData] = await Promise.all([
          getPromptVersions(resolvedParams.id),
          getLLMSystems()
        ])

        setVersions(versionsData)
        setLLMSystems(llmSystemsData)

        // Set initial version
        if (versionsData.length > 0) {
          setSelectedVersion(versionsData[0].version)
        }

        // Set initial model based on whether we have an image variable
        const hasImage = versionsData[0]?.variables.some((v: PromptVariable) => v.type === 'image') || false
        const defaultSystem = llmSystemsData.find((system: LLMSystem) => system.is_default)
        if (defaultSystem) {
          if (hasImage) {
            setSelectedModel(defaultSystem.default_multimodal || '')
          } else {
            setSelectedModel(defaultSystem.default_model)
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id])

  const handleVariableChange = (name: string, value: string | File | null) => {
    if (value === null) {
      const newVariables = { ...variables }
      delete newVariables[name]
      setVariables(newVariables)
    } else {
      setVariables(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleRun = async () => {
    try {
      setLoading(true)
      const currentVersion = versions.find(v => v.version === selectedVersion)
      if (!currentVersion) {
        throw new Error("Version not found")
      }

      // Prepare input variables
      const inputVariables: Record<string, string> = {}
      
      await Promise.all(
        Object.entries(variables).map(async ([key, value]) => {
          if (value instanceof File) {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                const base64 = reader.result as string
                resolve(base64.split(',')[1]) // Remove data URL prefix
              }
              reader.readAsDataURL(value)
            })
            inputVariables[key] = base64
          } else {
            inputVariables[key] = value as string
          }
        })
      )

      const payload = {
        prompt_id: currentVersion.prompt_id,
        project_id: currentVersion.project_id,
        input_variables: inputVariables,
        model: selectedModel,
        structured_output: structuredOutput,
        markdown_mode: markdownMode,
        ...(currentVersion.is_current ? {} : { version: selectedVersion })
      }

      const data = await runPrompt(payload)
      setResult(data)
      setResultTab("output")
    } catch (err) {
      console.error("Error running prompt:", err)
      setError(err instanceof Error ? err.message : "Failed to run prompt")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = async () => {
    try {
      router.back()
    } catch (err) {
      console.error('Error navigating back:', err)
    }
  }

  const currentVersion = versions.find(v => v.version === selectedVersion)

  // Get all available models from all systems
  const allModels = llmSystems.flatMap(system => {
    try {
      if (currentVersion?.variables.some(v => v.type === 'image')) {
        return system.default_multimodal ? [system.default_multimodal] : []
      }
      return JSON.parse(system.available_models)
    } catch {
      return []
    }
  })

  const hasImageVariable = currentVersion?.variables.some(v => v.type === 'image') || false

  if (loading && !currentVersion) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!currentVersion) return <div>No prompt version found</div>

  return (
    <div className="container mx-auto py-6 space-y-6 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{currentVersion.prompt_name}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedVersion} onValueChange={setSelectedVersion}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((version) => (
                <SelectItem key={version.version} value={version.version}>
                  Version {version.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {allModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={markdownMode}
                      onCheckedChange={setMarkdownMode}
                      id="markdown-mode"
                    />
                    <Label htmlFor="markdown-mode">Markdown Mode</Label>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>When enabled, you need to explicitly ask the model to format its response in markdown.</p>
                  <p>This will not automatically convert the output to markdown.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={structuredOutput}
                      onCheckedChange={setStructuredOutput}
                      id="structured-output"
                    />
                    <Label htmlFor="structured-output">Structured Output</Label>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>When enabled, the model will return a structured output following the defined schema.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button onClick={handleRun} disabled={loading}>
            {loading ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="h-[calc(100vh-200px)] overflow-y-auto pr-4">
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                {currentVersion.output_schema && (
                  <TabsTrigger value="schema">Output Schema</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="prompt">
                <Card className="p-4">
                  <pre className="whitespace-pre-wrap">{currentVersion.content}</pre>
                </Card>
              </TabsContent>
              {currentVersion.output_schema && (
                <TabsContent value="schema">
                  <Card className="p-4">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(currentVersion.output_schema, null, 2)}
                    </pre>
                  </Card>
                </TabsContent>
              )}
            </Tabs>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Variables</h2>
              {currentVersion.variables?.map((variable) => (
                <div key={variable.name} className="space-y-2">
                  <Label htmlFor={variable.name}>
                    {variable.name}
                    {variable.required && <span className="text-red-500">*</span>}
                  </Label>
                  {variable.type.toUpperCase() === "IMAGE" ? (
                    <FileUpload
                      // id={variable.name}
                      accept="image/*"
                      onChange={(file) => handleVariableChange(variable.name, file)}
                    />
                  ) : (
                    <Textarea
                      id={variable.name}
                      value={variables[variable.name] as string || ""}
                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                      placeholder={`Enter ${variable.name}`}
                      className="min-h-[100px]"
                    />
                  )}
                  {variable.description && (
                    <p className="text-sm text-muted-foreground">
                      {variable.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="p-4 h-[calc(100vh-200px)] overflow-auto">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Result</h2>
            
            {result ? (
              <Tabs value={resultTab} onValueChange={setResultTab}>
                <TabsList>
                  <TabsTrigger value="output">Output</TabsTrigger>
                  {(!structuredOutput || !hasImageVariable) && (
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="output" className="space-y-4">
                  <Card className="p-4">
                    {result && (
                      structuredOutput ? (
                        <JsonView 
                          data={hasImageVariable ? result : JSON.parse(result.output)}
                          style={{
                            ...(theme === 'dark' ? darkStyles : defaultStyles),
                            container: "font-mono text-sm",
                          }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {markdownMode ? (
                            <div className="prose dark:prose-invert max-w-none">
                              <ReactMarkdown>{result.output}</ReactMarkdown>
                            </div>
                          ) : (
                            result.output
                          )}
                        </div>
                      )
                    )}
                  </Card>
                </TabsContent>
                
                <TabsContent value="metadata">
                  <div className="mt-4">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(
                        Object.fromEntries(
                          Object.entries(result).filter(([key]) => key !== 'output')
                        ),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-muted-foreground">
                Run the prompt to see results
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
