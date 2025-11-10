import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/app/lib/auth';
import { generateId, task_manager } from "./utils";


/**
 * Get task status and details
 * GET /api/image-edit?task_id={task_id}
 * 
 * Response includes:
 * - id: string (task ID)
 * - status: "processing" | "completed" | "failed"
 * - original_image: { id: string, thumb_id: string } (image IDs only)
 * - result_image: { id: string, thumb_id: string } (image IDs only)
 * - prompt: string
 * - created_at: number
 * - updated_at: number
 * 
 * Note: All image references are IDs only, use /api/asset/image/{id} to get actual images
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const task_id = searchParams.get('task_id');
  if(!task_id) {
    const tasks = task_manager.view_tasks();
    return NextResponse.json(tasks);
  }
  const task_info = task_manager.view_task(task_id);
  if(!task_info) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json(task_info);
}

/**
 * Start a task
 * POST /api/image-edit
 * 
 * Request Body: 
 * - orig_img: string (image ID, not URL or base64)
 * - prompt: string (editing instruction)
 * 
 * Response:
 * - task_id: string (unique task identifier)
 * 
 * Note: Only accepts image IDs for efficient processing
 */
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body: { orig_img: string, prompt: string } = await request.json();
    const { orig_img, prompt } = body;
    if(!orig_img || !prompt) {
      return NextResponse.json({ error: "orig_img, orig_thumb, prompt are required" }, { status: 400 });
    }
    const task_id = generateId();
    task_manager.update_task({
      id: task_id,
      timeout: null,
      status: "processing",
      original_image: orig_img,
      prompt: prompt,
      result_image: "",
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    task_manager.start_task(task_id);  // 启动异步任务
    return NextResponse.json({ task_id: task_id }, { status: 200 });
  } catch (error) {
    console.error("Error editing image:", error);
    return NextResponse.json(
      { error: "Failed to edit image" },
      { status: 500 }
    );
  }
});

/**
 * Delete a task
 * DELETE /api/image-edit?task_id={task_id}
 * 
 * Stops the task if running and removes it from storage.
 * Response: { message: "Task stopped" }
 */
export const DELETE = requireAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const task_id = searchParams.get('task_id');
  if(!task_id) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }
  task_manager.delete_task(task_id);
  return NextResponse.json({ message: "Task stopped" }, { status: 200 });
});


/**
 * Stop a running task or retry a failed task
 * PUT /api/image-edit?task_id={task_id}&action=stop
 * PATCH /api/image-edit?task_id={task_id}&action=retry
 * 
 * PUT: Stops task execution but keeps it in storage with "failed" status.
 * PATCH: Retries a failed task by resetting its state and restarting it.
 * Response: { message: "Task stopped" } or { message: "Task retried" }
 */
export const PUT = requireAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const task_id = searchParams.get('task_id');
  if(!task_id) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }
  task_manager.stop_task(task_id);
  return NextResponse.json({ message: "Task stopped" }, { status: 200 });
});

export const PATCH = requireAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const task_id = searchParams.get('task_id');
  if(!task_id) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const newPrompt = body.prompt;
    await task_manager.retry_task(task_id, newPrompt);
    return NextResponse.json({ message: "Task retried" }, { status: 200 });
  } catch (error) {
    console.error("Error retrying task:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retry task" },
      { status: 500 }
    );
  }
});