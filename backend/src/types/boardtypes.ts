// Board and Column related types

export interface CreateBoardInput {
  name: string;
  projectId: string;
}

export interface UpdateBoardInput {
  name?: string;
}

export interface CreateColumnInput {
  name: string;
  wipLimit?: number;
}

export interface UpdateColumnInput {
  name?: string;
  wipLimit?: number;
}

export interface ColumnReorderInput {
  columnId: string;
  newPosition: number;
}

export interface ReorderRequestBody {
  columns: ColumnReorderInput[];
}
