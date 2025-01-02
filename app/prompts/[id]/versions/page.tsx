"use client"
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from 'lucide-react'
import { PromptVersion } from '@/types/prompt-version'
import { getPromptVersions } from '@/app/actions'

interface VersionComparisonProps {
  params: Promise<{ id: string }>
}

export default function VersionComparison({ params }: VersionComparisonProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion['version'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('prompt')

  const currentVersion = versions.length > 0 ? versions[0] : null
  const olderVersions = versions.slice(1)

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const data = await getPromptVersions(resolvedParams.id)
        console.log('API Response:', data)
        setVersions(data)
        if (data.length > 1) {
          setSelectedVersion(data[1].version) // Select first older version by default
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load versions')
      } finally {
        setLoading(false)
      }
    }

    fetchVersions()
  }, [resolvedParams.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const renderVersionDetails = (version: PromptVersion | null) => {
    if (!version) return null

    return (
      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Version {version.version}</h3>
          <p className="text-sm text-muted-foreground">
            Created at: {formatDate(version.created_at)}
          </p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Content</h4>
          <pre className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
            {version.content}
          </pre>
        </div>

        <div>
          <h4 className="font-medium mb-2">Variables</h4>
          <div className="space-y-4">
            {version.variables.map((variable) => (
              <div key={variable.name} className="bg-muted p-4 rounded-lg">
                <div className="font-medium">{variable.name}</div>
                <div className="text-sm text-muted-foreground">
                  {variable.description}
                </div>
                <div className="text-sm mt-2">
                  <span className="font-medium">Type:</span>{' '}
                  {variable.type}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Required:</span>{' '}
                  {variable.required ? 'Yes' : 'No'}
                </div>
                {variable.default && (
                  <div className="text-sm">
                    <span className="font-medium">Default:</span>{' '}
                    {variable.default}
                  </div>
                )}
                {variable.example && (
                  <div className="text-sm">
                    <span className="font-medium">Example:</span>{' '}
                    {variable.example}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <span className="font-medium">Temperature:</span>{' '}
            {version.temperature}
          </div>
          <div>
            <span className="font-medium">Max Tokens:</span> {version.max_tokens}
          </div>
        </div>
      </Card>
    )
  }

  const renderSchemaComparison = (version: PromptVersion | null) => {
    if (!version?.output_schema) return <div>No schema defined</div>

    return (
      <Card className="p-6">
        <div className="bg-muted p-4 rounded-lg overflow-hidden">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(version.output_schema, null, 2)}
          </pre>
        </div>
      </Card>
    )
  }

  const handleBack = () => {
    if (currentVersion) {
      router.push(`/projects/${currentVersion.project_id}`)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>

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
            Back to Prompts
          </Button>
          <h1 className="text-2xl font-bold">{currentVersion?.prompt_name}</h1>
        </div>

        <Select
          value={selectedVersion?.toString()}
          onValueChange={(value) => setSelectedVersion((value as PromptVersion['version']))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select version to compare" />
          </SelectTrigger>
          <SelectContent>
            {olderVersions.map((version) => (
              <SelectItem
                key={version.version}
                value={version.version.toString()}
              >
                Version {version.version} ({formatDate(version.created_at)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="prompt">Prompt Details</TabsTrigger>
          <TabsTrigger value="schema">Output Schema</TabsTrigger>
        </TabsList>

        <TabsContent value="prompt" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Current Version</h2>
              {renderVersionDetails(currentVersion)}
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Comparing with</h2>
              {renderVersionDetails(
                versions.find((v) => v.version === selectedVersion) || null
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schema" className="mt-6">
          <div className="h-[calc(100vh-200px)] relative">
            <div className="grid grid-cols-2 gap-6 absolute inset-0 overflow-auto">
              <div className="min-h-full">
                <h2 className="text-xl font-semibold mb-4 sticky top-0 bg-background z-10 py-2">Current Version Schema</h2>
                {renderSchemaComparison(currentVersion)}
              </div>
              <div className="min-h-full">
                <h2 className="text-xl font-semibold mb-4 sticky top-0 bg-background z-10 py-2">Comparing Schema with</h2>
                {renderSchemaComparison(
                  versions.find((v) => v.version === selectedVersion) || null
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
