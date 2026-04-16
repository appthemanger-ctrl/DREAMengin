import { readFile, writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Project root for file operations – override via CODEENGIN_PROJECT_ROOT.
// For Supabase-backed projects, replace the fs calls with storage API calls.
const PROJECT_ROOT =
  process.env.CODEENGIN_PROJECT_ROOT ?? process.cwd();

/**
 * Host tools exposed to the agent-os VM for CodeEngin.
 *
 * These give the AI agent controlled access to the project file system and
 * shell. Replace the `fs` / `exec` calls with your actual storage layer
 * (e.g. Supabase Storage) if the project does not run on a local disk.
 */
export const codeEnginHostTools = {
  getFileContent: async (filePath: string): Promise<string> => {
    try {
      const fullPath = path.resolve(PROJECT_ROOT, filePath);
      return await readFile(fullPath, 'utf-8');
    } catch (error) {
      return `Error reading file: ${(error as Error).message}`;
    }
  },

  writeFile: async (filePath: string, content: string): Promise<string> => {
    try {
      const fullPath = path.resolve(PROJECT_ROOT, filePath);
      await writeFile(fullPath, content, 'utf-8');
      return `File ${filePath} written successfully.`;
    } catch (error) {
      return `Error writing file: ${(error as Error).message}`;
    }
  },

  runCommand: async (
    cmd: string,
  ): Promise<{ stdout: string; stderr: string }> => {
    try {
      const { stdout, stderr } = await execAsync(cmd, { cwd: PROJECT_ROOT });
      return { stdout, stderr };
    } catch (error) {
      return { stdout: '', stderr: (error as Error).message };
    }
  },

  getProjectTree: async (
    relativePath = '',
  ): Promise<{ name: string; type: 'file' | 'directory'; path: string }[]> => {
    const { readdir } = await import('fs/promises');
    const fullPath = path.resolve(PROJECT_ROOT, relativePath);
    try {
      const entries = await readdir(fullPath, { withFileTypes: true });
      return entries.map(entry => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        path: path.join(relativePath, entry.name),
      }));
    } catch {
      return [];
    }
  },
} as const;

export type CodeEnginHostTools = typeof codeEnginHostTools;
