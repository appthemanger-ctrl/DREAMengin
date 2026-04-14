import { mkdtempSync } from 'node:fs';
import fs from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

const scriptPath = join(process.cwd(), 'scripts/export-full-code.mjs');

describe('export-full-code script', () => {
  it('exports only text files and skips ignored paths', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dreamengin-full-code-'));
    const outputFile = join(dir, 'DREAMengin-full-code.txt');

    await fs.mkdir(join(dir, 'app'), { recursive: true });
    await fs.mkdir(join(dir, 'node_modules/pkg'), { recursive: true });
    await fs.mkdir(join(dir, '.git'), { recursive: true });

    await fs.writeFile(join(dir, 'app/page.tsx'), 'export default function Page() {}\n');
    await fs.writeFile(join(dir, 'README.md'), '# hello\n');
    await fs.writeFile(join(dir, 'empty.txt'), '\n\n');
    await fs.writeFile(join(dir, 'node_modules/pkg/index.js'), 'console.log("skip");\n');
    await fs.writeFile(join(dir, '.git/config'), '[core]\n');
    await fs.writeFile(join(dir, 'image.bin'), Buffer.from([0, 159, 146, 150]));

    const { exportFullCodeSnapshot } = await import(scriptPath);
    const result = await exportFullCodeSnapshot({ rootDir: dir, outputFile });
    const output = await fs.readFile(outputFile, 'utf8');

    expect(result.fileCount).toBe(2);
    expect(output).toContain(`===== ${join(dir, 'README.md')} =====`);
    expect(output).toContain(`===== ${join(dir, 'app/page.tsx')} =====`);
    expect(output).not.toContain('node_modules/pkg/index.js');
    expect(output).not.toContain('.git/config');
    expect(output).not.toContain('image.bin');
    expect(output).not.toContain('empty.txt');
    expect(output).not.toContain('DREAMengin-full-code.txt');
  });
});
