import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';
import { CustomScript } from '@/app/components/JsonEditor/types';

const SCRIPTS_DIR = path.join(process.cwd(), 'blogs/json-editor-scripts');
const INDEX_FILE = path.join(SCRIPTS_DIR, 'index.json');

/**
 * Reads the script index
 */
async function readIndex(): Promise<{ scripts: CustomScript[] }> {
  try {
    const content = await fs.readFile(INDEX_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { scripts: [] };
  }
}

/**
 * Writes the script index
 */
async function writeIndex(data: { scripts: CustomScript[] }): Promise<void> {
  await fs.writeFile(INDEX_FILE, JSON.stringify(data, null, 2));
}

/**
 * GET /api/json-editor/scripts/[id]
 * Returns a single script (no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const scriptFile = path.join(SCRIPTS_DIR, `${id}.json`);

    try {
      const content = await fs.readFile(scriptFile, 'utf-8');
      const script = JSON.parse(content);
      return NextResponse.json(script);
    } catch {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching script:', error);
    return NextResponse.json({ error: 'Failed to fetch script' }, { status: 500 });
  }
}

/**
 * PUT /api/json-editor/scripts/[id]
 * Updates a script (requires auth)
 */
export const PUT = requireAuth(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const body = await request.json();
      const { name, code, description, outputMode } = body;

      const scriptFile = path.join(SCRIPTS_DIR, `${id}.json`);

      // Read existing script
      let existingScript: CustomScript;
      try {
        const content = await fs.readFile(scriptFile, 'utf-8');
        existingScript = JSON.parse(content);
      } catch {
        return NextResponse.json({ error: 'Script not found' }, { status: 404 });
      }

      // Update script
      const updatedScript: CustomScript = {
        ...existingScript,
        name: name ?? existingScript.name,
        code: code ?? existingScript.code,
        description: description ?? existingScript.description,
        outputMode: outputMode ?? existingScript.outputMode,
        updatedAt: new Date().toISOString(),
      };

      // Save updated script
      await fs.writeFile(scriptFile, JSON.stringify(updatedScript, null, 2));

      // Update index
      const index = await readIndex();
      const scriptIndex = index.scripts.findIndex((s) => s.id === id);
      if (scriptIndex !== -1) {
        index.scripts[scriptIndex] = updatedScript;
        await writeIndex(index);
      }

      return NextResponse.json(updatedScript);
    } catch (error) {
      console.error('Error updating script:', error);
      return NextResponse.json({ error: 'Failed to update script' }, { status: 500 });
    }
  }
);

/**
 * DELETE /api/json-editor/scripts/[id]
 * Deletes a script (requires auth)
 */
export const DELETE = requireAuth(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const scriptFile = path.join(SCRIPTS_DIR, `${id}.json`);

      // Delete script file
      try {
        await fs.unlink(scriptFile);
      } catch {
        return NextResponse.json({ error: 'Script not found' }, { status: 404 });
      }

      // Update index
      const index = await readIndex();
      index.scripts = index.scripts.filter((s) => s.id !== id);
      await writeIndex(index);

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting script:', error);
      return NextResponse.json({ error: 'Failed to delete script' }, { status: 500 });
    }
  }
);

