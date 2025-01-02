'use client';

import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeftIcon, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreatePromptDialog } from "@/components/prompts/create-prompt-dialog";
import { DeletePromptDialog } from "@/components/prompts/delete-prompt-dialog";
import { useRouter } from 'next/navigation'
import { getProject, getProjectPrompts, deletePrompt } from "@/app/actions";
import {Project} from "@/types/project";
import {Prompt} from "@/types/prompt";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const resolvedParams = use(params);
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null)

  const handlePromptUpdate = async () => {
    try {
      const data = await getProjectPrompts(resolvedParams.id);
      setPrompts(data);
      setEditingPrompt(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
    }
  };

  const handleDeletePrompt = async () => {
    if (!deletingPrompt) return;

    try {
      await deletePrompt(deletingPrompt.id);
      // Remove the deleted prompt from the list
      setPrompts(prompts.filter(p => p.id !== deletingPrompt.id));
      setDeletingPrompt(null);
    } catch (err) {
      console.error('Error deleting prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch project details and prompts in parallel
        const [projectData, promptsData] = await Promise.all([
          getProject(resolvedParams.id),
          getProjectPrompts(resolvedParams.id)
        ]);
        
        setProject(projectData);
        setPrompts(promptsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeftIcon className="h-4 w-4" />
          <Link href="/" className="text-sm">
            Back to Projects
          </Link>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{project?.name}</h1>
            <p className="text-muted-foreground mt-1">Manage your prompts</p>
          </div>
          <CreatePromptDialog 
            projectId={parseInt(resolvedParams.id)} 
            onPromptCreated={handlePromptUpdate}
          />
        </div>
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => router.push(`/prompts/${prompt.id}/run`)}
                >
                  <div className="font-medium">{prompt.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {prompt.description}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span 
                    className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      prompt.status === "published" && "bg-green-100 text-green-700",
                      prompt.status === "draft" && "bg-yellow-100 text-yellow-700",
                      prompt.status === "testing" && "bg-blue-100 text-blue-700"
                    )}
                  >
                    {prompt.status}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditingPrompt(prompt)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => router.push(`/prompts/${prompt.id}/versions`)}>
                        Versions
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => router.push(`/prompts/${prompt.id}/compare`)}>
                        Compare Runs
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onSelect={() => setDeletingPrompt(prompt)}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingPrompt && (
        <CreatePromptDialog
          projectId={parseInt(resolvedParams.id)}
          onPromptCreated={handlePromptUpdate}
          initialData={{
            id: editingPrompt.id,
            name: editingPrompt.name,
            description: editingPrompt.description,
            content: editingPrompt.content,
            project_id: parseInt(resolvedParams.id),
            variables: editingPrompt.variables || [],
            max_tokens: editingPrompt.max_tokens,
            temperature: editingPrompt.temperature,
            status: editingPrompt.status as 'draft',
            has_structured_output: !!editingPrompt.output_schema,
            output_schema: editingPrompt.output_schema
          }}
          mode="edit"
          onOpenChange={(open) => {
            if (!open) {
              setEditingPrompt(null)
            }
          }}
        />
      )}

      {/* Delete Dialog */}
      <DeletePromptDialog
        open={!!deletingPrompt}
        onOpenChange={(open) => {
          if (!open) setDeletingPrompt(null)
        }}
        onConfirm={handleDeletePrompt}
        promptName={deletingPrompt?.name || ''}
      />
    </div>
  );
}
