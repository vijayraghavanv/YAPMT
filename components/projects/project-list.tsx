'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types/project";
import { useEffect, useState } from "react";
import { ProjectDialog } from "./create-project-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [deleteProject, setDeleteProject] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProject) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${deleteProject.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Refresh the projects list
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setDeleteProject(null);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Filter projects based on showAllProjects state
  const filteredProjects = projects.filter(project => 
    showAllProjects || project.status.toUpperCase() === 'ACTIVE'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-muted-foreground">Loading projects...</div>
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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold">Your Projects</h1>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-all"
              checked={showAllProjects}
              onCheckedChange={setShowAllProjects}
            />
            <Label htmlFor="show-all" className="text-sm text-muted-foreground">
              Show archived and draft projects
            </Label>
          </div>
        </div>
        <ProjectDialog 
          mode="create"
          onProjectCreated={fetchProjects}
        />
      </div>
      
      {/* Project count summary */}
      <div className="flex gap-4 mb-6">
        <div className="text-sm text-muted-foreground">
          Showing: {filteredProjects.length} {showAllProjects ? 'total' : 'active'} projects
        </div>
        {showAllProjects && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Active: {projects.filter(p => p.status.toUpperCase() === 'ACTIVE').length}</span>
            <span>Archived: {projects.filter(p => p.status.toUpperCase() === 'ARCHIVED').length}</span>
            <span>Draft: {projects.filter(p => p.status.toUpperCase() === 'DRAFT').length}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card 
            key={project.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => router.push(`/projects/${project.id}`)}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="group-hover:text-primary transition-colors">
                <CardTitle className="flex items-center gap-2">
                  {project.name}
                  {project.status.toUpperCase() !== 'ACTIVE' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {project.status.toLowerCase()}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </div>
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
                  <DropdownMenuItem
                    onClick={() => setEditProject(project)}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteProject({ id: project.id, name: project.name })}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <DeleteProjectDialog
        projectName={deleteProject?.name ?? ''}
        open={!!deleteProject}
        onOpenChange={(open) => !open && setDeleteProject(null)}
        onConfirm={handleDeleteProject}
      />
      <ProjectDialog
        mode="edit"
        project={editProject ?? undefined}
        open={!!editProject}
        onOpenChange={(open) => !open && setEditProject(null)}
        onProjectCreated={fetchProjects}
      />
    </div>
  );
}
