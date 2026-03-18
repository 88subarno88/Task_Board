// Issue type options
export type IssueType = 'STORY' | 'TASK' | 'BUG';
// Priority options
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
//creating a new issue
export interface CreateIssueInput {
  title: string;
  description?: string;
  type: IssueType;
  priority?: Priority;
  boardId: string;
  columnId: string;
  assigneeId?: string;
  parentId?: string;
  dueDate?: Date;
}
//updating an existing issue
export interface UpdateIssueInput {
  title?: string;
  description?: string;
  priority?: Priority;
  assigneeId?: string;
  dueDate?: Date;
  parentId?: string | null;
}
export interface MoveIssueInput {
  columnId: string;
  dueDate?: string | Date | null;
}
//filtering issues
export interface IssueFilterInput {
  boardId?: string;
  columnId?: string;
  assigneeId?: string;
  type?: IssueType;
  priority?: Priority;
}
