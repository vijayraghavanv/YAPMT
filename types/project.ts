export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'DRAFT';

export interface Project {
    id: number;
    name: string;
    description: string;
    status: ProjectStatus;
    tags: string[];
    start_date: string;
    end_date: string;
}
