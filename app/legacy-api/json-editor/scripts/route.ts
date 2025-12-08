import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';
import { CustomScript } from '@/app/components/JsonEditor/types';

const SCRIPTS_DIR = path.join(process.cwd(), 'blogs/json-editor-scripts');
const INDEX_FILE = path.join(SCRIPTS_DIR, 'index.json');

/**
 * Ensures the scripts directory and index file exist
 */
async function ensureScriptsDir() {
  try {
    await fs.access(SCRIPTS_DIR);
  } catch {
    await fs.mkdir(SCRIPTS_DIR, { recursive: true });
  }

  try {
    await fs.access(INDEX_FILE);
  } catch {
    await fs.writeFile(INDEX_FILE, JSON.stringify({ scripts: [] }, null, 2));
  }
}

/**
 * Reads the script index
 */
async function readIndex(): Promise<{ scripts: CustomScript[] }> {
  await ensureScriptsDir();
  const content = await fs.readFile(INDEX_FILE, 'utf-8');
  return JSON.parse(content);
}

/**
 * Writes the script index
 */
async function writeIndex(data: { scripts: CustomScript[] }): Promise<void> {
  await fs.writeFile(INDEX_FILE, JSON.stringify(data, null, 2));
}

/**
 * GET /api/json-editor/scripts
 * Returns all scripts (no auth required)
 */
export async function GET() {
  try {
    const index = await readIndex();
    return NextResponse.json(index.scripts);
  } catch (error) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json({ error: 'Failed to fetch scripts' }, { status: 500 });
  }
}

/**
 * POST /api/json-editor/scripts
 * Creates a new script (requires auth)
 */
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, code, description, outputMode } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    const newScript: CustomScript = {
      id: `script-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      code,
      description,
      outputMode: outputMode || 'inplace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save script file
    const scriptFile = path.join(SCRIPTS_DIR, `${newScript.id}.json`);
    await ensureScriptsDir();
    await fs.writeFile(scriptFile, JSON.stringify(newScript, null, 2));

    // Update index
    const index = await readIndex();
    index.scripts.push(newScript);
    await writeIndex(index);

    return NextResponse.json(newScript, { status: 201 });
  } catch (error) {
    console.error('Error creating script:', error);
    return NextResponse.json({ error: 'Failed to create script' }, { status: 500 });
  }
});

