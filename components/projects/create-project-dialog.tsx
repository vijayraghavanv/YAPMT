'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Project, ProjectStatus } from "@/types/project";
import { createOrUpdateProject } from "@/app/actions";

interface ProjectDialogProps {
  mode: 'create' | 'edit';
  project?: Project;
  onProjectCreated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProjectDialog({ 
  mode = 'create',
  project,
  onProjectCreated,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("ACTIVE");
  const [tags, setTags] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle controlled open state
  const isOpen = controlledOpen ?? open;
  const onOpenChange = controlledOnOpenChange ?? setOpen;

  // Reset form when dialog opens and populate with project data if editing
  useEffect(() => {
    if (isOpen && mode === 'edit' && project) {
      console.log('Editing project:', project);
      setName(project.name);
      setDescription(project.description);
      // Convert status to uppercase to ensure it matches our options
      setStatus((project.status || "ACTIVE").toUpperCase() as ProjectStatus);
      setTags(project.tags.join(', '));
    } else if (!isOpen) {
      resetForm();
    }
  }, [isOpen, mode, project]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Project name is required";
    }
    if (!description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!tags.trim()) {
      newErrors.tags = "At least one tag is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        name: name.trim(),
        description: description.trim(),
        status,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      };

      await createOrUpdateProject(projectData, mode === 'edit' ? project?.id : undefined);
      onProjectCreated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error(mode === 'create' ? "Error creating project:" : "Error updating project:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setStatus("ACTIVE");
    setTags("");
    setErrors({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {mode === 'create' && (
        <DialogTrigger asChild>
          <Button className="mt-6">Create Project</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Project' : 'Edit Project'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new project by filling out the details below.'
              : 'Edit your project details below.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <span className="text-sm text-red-500">{errors.name}</span>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <span className="text-sm text-red-500">{errors.description}</span>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={status.toUpperCase()} 
              onValueChange={(value: ProjectStatus) => setStatus(value.toUpperCase() as ProjectStatus)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">
              Tags <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated tags"
              className={errors.tags ? "border-red-500" : ""}
            />
            {errors.tags && (
              <span className="text-sm text-red-500">{errors.tags}</span>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            onOpenChange(false);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (mode === 'create' ? "Creating..." : "Updating...") : (mode === 'create' ? "Create" : "Update")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
