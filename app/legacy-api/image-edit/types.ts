

/**
 * Complete task information for internal processing
 * Contains runtime objects not exposed in API responses
 */
export type TaskInfo = {
  /** Unique task identifier */
  id: string;
  /** Abort controller for canceling running tasks */
  controller: AbortController | null;
  /** Timeout handle for task execution limits */
  timeout: NodeJS.Timeout | null;
  /** Current task status */
  status: "processing" | "completed" | "failed";
  /** Original image data (IDs only) */
  original_image: string;
  /** Result image data (IDs only, available when completed) */
  result_image?: string;
  /** User-provided editing instruction */
  prompt: string;
  /** Error or status message */
  message?: string;
  /** Task creation timestamp */
  created_at: number;
  /** Last update timestamp */
  updated_at: number;
}

/**
 * Task response for API consumers
 * Excludes internal runtime objects, contains only image IDs
 */
export type TaskResponse = Omit<TaskInfo, "controller" | "timeout">

export type TaskStorage = {
  tasks: TaskInfo[]
}