import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/app/lib/auth';
import { generateId, task_manager } from "./utils";


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const task_id = searchParams.get('task_id');
  if(!task_id) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
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
 * // only accept file id but not base64
 * Body: { orig_img: string, orig_thumb: string, prompt: string }
 */
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body: { orig_img: string, orig_thumb: string, prompt: string } = await request.json();
    const { orig_img, orig_thumb, prompt } = body;
    if(!orig_img || !orig_thumb || !prompt) {
      return NextResponse.json({ error: "orig_img, orig_thumb, prompt are required" }, { status: 400 });
    }
    const task_id = generateId();
    task_manager.update_task({
      id: task_id,
      timeout: null,
      status: "processing",
      original_image: {
        id: orig_img,
        thumb_id: orig_thumb,
      },
      prompt: prompt,
      result_image: {
        id: "",
        thumb_id: "",
      },
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


/** stop a task
 * PUT /api/image-edit?task_id={task_id}
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