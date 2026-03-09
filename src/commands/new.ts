/**
 * @nemesis-js/cli - New command
 *
 * Interactive project scaffolding powered by @clack/prompts.
 * NemesisJS is Bun-native — only Bun is supported.
 *
 * Flow:
 *   1. Ask project name (if not given as arg)
 *   2. Ask for e2e tests
 *   3. Scaffold files  ← spinner
 *   4. Run bun install ← spinner (automatic, no manual step needed)
 *   5. Outro with: cd <name> && bun run dev
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { SchematicEngine } from '@nemesis-js/schematics';

const __dirname = dirname(fileURLToPath(import.meta.url));

const COLLECTION_PATH = join(
  __dirname, '..', '..', 'node_modules', '@nemesis-js', 'schematics', 'collection.json',
);

export interface NewOptions {
  noTest: boolean;
}

export class NewCommand {
  async execute(nameArg: string | undefined, options: NewOptions): Promise<void> {
    // ── Project name ──────────────────────────────────────────────────────────
    let projectName = nameArg;
    if (!projectName) {
      const answer = await p.text({
        message: 'What would you like to name your project?',
        placeholder: 'my-nemesis-app',
        validate: (v) => (v?.trim().length === 0 ? 'Project name cannot be empty.' : undefined),
      });
      if (p.isCancel(answer)) { p.cancel('Operation cancelled.'); process.exit(0); }
      projectName = answer as string;
    }

    // ── Tests ─────────────────────────────────────────────────────────────────
    let withTests = !options.noTest;
    if (!options.noTest) {
      const testsAnswer = await p.confirm({
        message: 'Would you like to generate e2e tests?',
        initialValue: true,
      });
      if (p.isCancel(testsAnswer)) { p.cancel('Operation cancelled.'); process.exit(0); }
      withTests = testsAnswer as boolean;
    }

    // ── Scaffold files ────────────────────────────────────────────────────────
    const s = p.spinner();
    s.start('Creating project files…');

    let result;
    try {
      const engine = new SchematicEngine(COLLECTION_PATH);
      result = await engine.run('application', projectName, { noTest: !withTests });
    } catch (err) {
      s.stop('Failed to create project.');
      p.log.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }

    s.stop(chalk.green('Project files created!'));

    // Print file list
    console.log('');
    for (const op of result.operations) {
      const icon = op.type === 'CREATE' ? chalk.green('CREATE') : chalk.yellow('UPDATE');
      console.log(`  ${icon} ${chalk.gray(op.path)}`);
    }
    console.log('');

    // ── Install dependencies ──────────────────────────────────────────────────
    s.start('Installing dependencies with Bun…');

    const projectDir = join(process.cwd(), projectName);
    const installProc = Bun.spawn(['bun', 'install'], {
      cwd: projectDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const exitCode = await installProc.exited;

    if (exitCode !== 0) {
      // Collect stderr to show a useful error message
      const errText = await new Response(installProc.stderr).text();
      s.stop(chalk.yellow('Dependency install failed — run bun install manually.'));
      if (errText.trim()) p.log.warn(errText.trim());
    } else {
      s.stop(chalk.green('Dependencies installed!'));
    }

    // ── Outro ─────────────────────────────────────────────────────────────────
    p.outro(
      `${chalk.bold.green('✔')} Project ${chalk.cyan(projectName)} is ready!\n\n` +
      `  ${chalk.gray('Start your app:')}\n` +
      `  ${chalk.cyan(`cd ${projectName}`)}\n` +
      `  ${chalk.cyan('bun run dev')}`,
    );
  }
}
