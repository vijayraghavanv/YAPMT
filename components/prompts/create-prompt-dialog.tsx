"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, HelpCircle, PlusCircle } from "lucide-react"
import { PromptVariable } from "@/types/prompt-version"

interface CreatePromptFormData {
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

interface CreatePromptDialogProps {
  projectId: number
  onPromptCreated: () => void
  initialData?: CreatePromptFormData
  mode?: 'create' | 'edit'
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function CreatePromptDialog({
  projectId, 
  initialData,
  mode = 'create',
  onOpenChange,
  onSuccess
}: CreatePromptDialogProps) {
  const [step, setStep] = useState(1)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedVariables, setExtractedVariables] = useState<string[]>([])
  const [jsonSchemaText, setJsonSchemaText] = useState("")
  const [jsonSchemaError, setJsonSchemaError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreatePromptFormData>(initialData || {
    name: "",
    description: "",
    content: "",
    project_id: projectId,
    variables: [],
    max_tokens: 2000,
    temperature: 0.7,
    status: "draft",
    has_structured_output: false,
    output_schema: null
  })

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      // Extract variables from content
      const matches = initialData.content.match(/\{([^}]+)\}/g) || []
      const vars = matches.map(match => match.slice(1, -1))
      setExtractedVariables([...new Set(vars)])
    }
  }, [initialData])

  useEffect(() => {
    if (formData.content) {
      const matches = formData.content.match(/\{([^}]+)\}/g) || []
      const vars = matches.map(match => match.slice(1, -1))
      setExtractedVariables([...new Set(vars)])
    }
  }, [formData.content])

  // Open dialog automatically when in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setOpen(true)
    }
  }, [mode, initialData])

  const validateJsonSchema = (text: string): boolean => {
    try {
      const parsed = JSON.parse(text)
      formData.output_schema = parsed
      setJsonSchemaError(null)
      return true
    } catch (err) {
      console.log(err)
      setJsonSchemaError("Invalid JSON format")
      return false
    }
  }

  const getTotalSteps = () => {
    const baseSteps = 2 // Basic info and configuration
    const variableSteps = extractedVariables.length
    const schemaStep = formData.has_structured_output ? 1 : 0
    return baseSteps + variableSteps + schemaStep
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const isLastStep = () => {
    if (formData.has_structured_output) {
      return step === getTotalSteps()
    }
    if (extractedVariables.length === 0) {
      return step === 2 // Configuration step
    }
    return step === 2 + extractedVariables.length // Last variable step
  }

  const renderFooter = () => {
    return (
      <DialogFooter>
        <div className="flex justify-between w-full">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            Back
          </Button>
          <Button type="submit">
            {isLastStep() ? "Create" : "Next"}
          </Button>
        </div>
      </DialogFooter>
    )
  }

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (step === 1) {
      if (!formData.name || !formData.content) {
        setError("Name and content are required")
        return
      }
      setError(null)
    }

    // Only validate JSON schema during final submission
    if (isLastStep() && formData.has_structured_output) {
      if (!validateJsonSchema(jsonSchemaText)) {
        return
      }
    }

    if (isLastStep()) {
      await handleSubmit()
    } else {
      setStep(step + 1)
    }
  }

  const handleSubmit = async () => {
    setError(null);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/prompts${
          mode === 'edit' ? `/${initialData?.id}` : ''
        }`,
        {
          method: mode === 'edit' ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            project_id: projectId,
          }),
        }
      );

      const responseData = await response.json();
      console.log('Response:', {
        status: response.status,
        ok: response.ok,
        data: responseData
      });

      if (!response.ok) {
        // Log the exact error response
        console.log('Error response structure:', responseData);
        
        // Check the exact structure of the error
        const errorMessage = responseData?.message || 
                           responseData?.error?.message ||
                           responseData?.error ||
                           'Failed to create prompt';
        console.log('Setting error message to:', errorMessage);
        setError(errorMessage);
        return;
      }

      onSuccess?.();
      setOpen(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
    if (!newOpen) {
      // Reset state when dialog closes
      setStep(1)
      setError(null)
      setJsonSchemaError(null)
      if (!initialData) {
        setFormData({
          name: "",
          description: "",
          content: "",
          project_id: projectId,
          variables: [],
          max_tokens: 2000,
          temperature: 0.7,
          status: "draft",
          has_structured_output: false,
          output_schema: null
        })
      }
    }
  }

  const renderStep1 = () => (
    <form onSubmit={handleNext} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor="name">Name</Label>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button type="button" variant="ghost" size="icon">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent>
              Must start with a letter and can only contain letters, numbers, underscores, hyphens, and dots.
            </HoverCardContent>
          </HoverCard>
        </div>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          pattern="^[a-zA-Z][a-zA-Z0-9_\-\.]*$"
          required
          minLength={3}
          maxLength={100}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          maxLength={500}
          placeholder="Brief description of what this prompt does"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor="content">Content</Label>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button type="button" variant="ghost" size="icon">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent>
              Use {"{variable_name}"} syntax to define variables in your prompt template.
            </HoverCardContent>
          </HoverCard>
        </div>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
          minLength={10}
          maxLength={10000}
          className="h-32"
          placeholder="Enter your prompt template here. Use {variable_name} for variables."
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="structured-output"
          checked={formData.has_structured_output}
          onCheckedChange={(checked) => setFormData({ ...formData, has_structured_output: checked })}
        />
        <Label htmlFor="structured-output">Structured Output</Label>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button type="button" variant="ghost" size="icon">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent>
            Enable if you want the output to follow a specific JSON schema structure.
          </HoverCardContent>
        </HoverCard>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {renderFooter()}
    </form>
  )

  const renderStep2 = () => (
    <form onSubmit={handleNext} className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label>Temperature</Label>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button type="button" variant="ghost" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent>
                Controls randomness in the output. Higher values make the output more diverse but less predictable.
              </HoverCardContent>
            </HoverCard>
          </div>
          <div className="pt-2">
            <Slider
              defaultValue={[formData.temperature]}
              onValueChange={([value]) => setFormData({ ...formData, temperature: value })}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>0.5</span>
              <span>1</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label>Max Tokens</Label>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button type="button" variant="ghost" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent>
                Maximum number of tokens in the response.
              </HoverCardContent>
            </HoverCard>
          </div>
          <div className="pt-2">
            <Slider
              defaultValue={[formData.max_tokens]}
              onValueChange={([value]) => setFormData({ ...formData, max_tokens: value })}
              min={1}
              max={8000}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>{formData.max_tokens}</span>
              <span>8000</span>
            </div>
          </div>
        </div>
      </div>
      
      {renderFooter()}
    </form>
  )

  const renderVariableStep = (index: number) => {
    const currentVar = extractedVariables[index]
    const isFirstVariable = index === 0
    const existingVarType = formData.variables[0]?.type

    return (
      <form onSubmit={handleNext} className="space-y-4">
        <div className="space-y-2">
          <Label>Variable Name</Label>
          <Input value={currentVar} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="var-description">Description</Label>
          <Input
            id="var-description"
            value={formData.variables[index]?.description || ""}
            onChange={(e) => {
              const newVariables = [...formData.variables]
              newVariables[index] = {
                ...newVariables[index] || {},
                name: currentVar,
                description: e.target.value,
                required: true,
                type: isFirstVariable ? "string" : (existingVarType || "string")
              }
              setFormData({ ...formData, variables: newVariables })
            }}
            required
          />
        </div>

        {isFirstVariable && (
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="string"
                  checked={!formData.variables[0]?.type || formData.variables[0]?.type === "string"}
                  onChange={() => {
                    const newVariables = [...formData.variables]
                    newVariables[0] = {
                      ...newVariables[0] || {},
                      name: currentVar,
                      type: "string"
                    }
                    setFormData({ ...formData, variables: newVariables })
                  }}
                />
                <span>String</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="image"
                  checked={formData.variables[0]?.type === "image"}
                  onChange={() => {
                    setFormData({
                      ...formData,
                      variables: [{
                        name: currentVar,
                        description: formData.variables[0]?.description || "",
                        required: true,
                        type: "image"
                      }]
                    })
                    if (extractedVariables.length > 1) {
                      setError("Image type can only be used with a single variable")
                    }
                  }}
                />
                <span>Image</span>
              </label>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {renderFooter()}
      </form>
    )
  }

  const renderJsonSchemaStep = () => (
    <form onSubmit={handleNext} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="json-schema">Output Schema (JSON)</Label>
        <Textarea
          id="json-schema"
          value={jsonSchemaText}
          onChange={(e) => {
            setJsonSchemaText(e.target.value)
            setJsonSchemaError(null) // Clear any previous errors
          }}
          className="font-mono h-[300px]"
          placeholder="Enter your JSON schema here..."
        />
        {jsonSchemaError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{jsonSchemaError}</AlertDescription>
          </Alert>
        )}
      </div>
      {renderFooter()}
    </form>
  )

  const renderCurrentStep = () => {
    if (step === 1) {
      return renderStep1()
    } else if (step === 2) {
      return renderStep2()
    } else if (step <= 2 + extractedVariables.length) {
      return renderVariableStep(step - 3)
    } else if (formData.has_structured_output) {
      return renderJsonSchemaStep()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {mode === 'create' ? (
        <DialogTrigger asChild>
          <Button onClick={() => setOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Prompt
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && (mode === 'create' ? "Create New Prompt" : "Edit Prompt")}
            {step === 2 && "Configure Settings"}
            {step > 2 && step <= 2 + extractedVariables.length && "Configure Variables"}
            {step > 2 + extractedVariables.length && formData.has_structured_output && "Define Output Schema"}
            <span className="text-sm text-muted-foreground ml-2">
              Step {step} of {getTotalSteps()}
            </span>
          </DialogTitle>
        </DialogHeader>
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {renderCurrentStep()}
      </DialogContent>
    </Dialog>
  )
}
