export type ImageData = {
  id: string;
  thumb_id: string;
}

export type TaskInfo = {
  id: string;
  controller: AbortController | null;
  timeout: NodeJS.Timeout | null;
  status: "processing" | "completed" | "failed";
  original_image: ImageData;  // file id
  result_image?: ImageData;  // file id
  prompt: string;
  created_at: number;
  updated_at: number;
}

export type TaskResponse = Omit<TaskInfo, "controller" | "timeout">

export type TaskStorage = {
  tasks: TaskInfo[]
}