"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import { JsonView, defaultStyles, darkStyles } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'
import ReactMarkdown from 'react-markdown'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getPromptRuns } from "@/app/actions"

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

interface ComparePageProps {
  params: Promise<{ id: string }>
}

export default function ComparePage({ params }: ComparePageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { theme } = useTheme()
  const [runs, setRuns] = useState<RunComparison[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState("output")
  const [leftRunId, setLeftRunId] = useState<string>("")
  const [rightRunId, setRightRunId] = useState<string>("")

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        setLoading(true)
        const data = await getPromptRuns(resolvedParams.id)
        setRuns(data)
        // Set default selections to the two most recent runs
        if (data.length >= 2) {
          setLeftRunId(String(data[0].id))
          setRightRunId(String(data[1].id))
        }
      } catch (err) {
        console.error("Error fetching runs:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch runs")
      } finally {
        setLoading(false)
      }
    }

    fetchRuns()
  }, [resolvedParams.id])

  const handleBack = () => {
    router.push(`/projects/${runs[0]?.project_id}`)
  }

  const leftRun = runs.find(r => String(r.id) === leftRunId)
  const rightRun = runs.find(r => String(r.id) === rightRunId)

  const formatRunLabel = (run: RunComparison) => {
    const date = new Date(run.created_at).toLocaleString()
    return `Run ${run.id} - V${run.version} (${date})`
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (runs.length === 0) return <div>No runs found</div>

  return (
    <div className="container mx-auto py-6 space-y-6">
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
          <h1 className="text-2xl font-bold">Compare Runs</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={leftRunId} onValueChange={setLeftRunId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select left run" />
            </SelectTrigger>
            <SelectContent>
              {runs.map((run) => (
                <SelectItem key={run.id} value={String(run.id)}>
                  {formatRunLabel(run)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rightRunId} onValueChange={setRightRunId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select right run" />
            </SelectTrigger>
            <SelectContent>
              {runs.map((run) => (
                <SelectItem key={run.id} value={String(run.id)}>
                  {formatRunLabel(run)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {leftRun && rightRun && (
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
          </TabsList>

          <TabsContent value="output" className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold">
                  {formatRunLabel(leftRun)}
                </h3>
                <div className="text-sm text-muted-foreground">
                  Model: {leftRun.model}
                </div>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {leftRun.structured_output ? (
                  <JsonView
                    data={JSON.parse(leftRun.output)}
                    style={{
                      ...(theme === 'dark' ? darkStyles : defaultStyles),
                      container: "font-mono text-sm",
                    }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{leftRun.output}</ReactMarkdown>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold">
                  {formatRunLabel(rightRun)}
                </h3>
                <div className="text-sm text-muted-foreground">
                  Model: {rightRun.model}
                </div>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {rightRun.structured_output ? (
                  <JsonView
                    data={JSON.parse(rightRun.output)}
                    style={{
                      ...(theme === 'dark' ? darkStyles : defaultStyles),
                      container: "font-mono text-sm",
                    }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{rightRun.output}</ReactMarkdown>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="metadata" className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">{formatRunLabel(leftRun)}</h3>
              <div className="space-y-2">
                <div>Prompt Tokens: {leftRun.prompt_tokens}</div>
                <div>Completion Tokens: {leftRun.completion_tokens}</div>
                <div>Total Tokens: {leftRun.total_tokens}</div>
                <div>Latency: {leftRun.latency_ms}ms</div>
                <div>Model: {leftRun.model}</div>
                <div>Version: {leftRun.version}</div>
                <div>Created: {new Date(leftRun.created_at).toLocaleString()}</div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">{formatRunLabel(rightRun)}</h3>
              <div className="space-y-2">
                <div>Prompt Tokens: {rightRun.prompt_tokens}</div>
                <div>Completion Tokens: {rightRun.completion_tokens}</div>
                <div>Total Tokens: {rightRun.total_tokens}</div>
                <div>Latency: {rightRun.latency_ms}ms</div>
                <div>Model: {rightRun.model}</div>
                <div>Version: {rightRun.version}</div>
                <div>Created: {new Date(rightRun.created_at).toLocaleString()}</div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="variables" className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">{formatRunLabel(leftRun)}</h3>
              <JsonView
                data={leftRun.input_variables}
                style={{
                  ...(theme === 'dark' ? darkStyles : defaultStyles),
                  container: "font-mono text-sm",
                }}
              />
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">{formatRunLabel(rightRun)}</h3>
              <JsonView
                data={rightRun.input_variables}
                style={{
                  ...(theme === 'dark' ? darkStyles : defaultStyles),
                  container: "font-mono text-sm",
                }}
              />
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
