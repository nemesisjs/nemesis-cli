/**
 * @nemesis-js/cli - Generate command
 *
 * Generates NemesisJS components via @nemesis-js/schematics.
 * Output format matches NestJS CLI exactly:
 *
 *   CREATE src/users/users.controller.ts (245 bytes)
 *   UPDATE src/app.module.ts (312 bytes)
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

export interface GenerateOptions {
  noSpec: boolean;
}

export class GenerateCommand {
  async execute(type: string, name: string, options: GenerateOptions): Promise<void> {
    const engine = new SchematicEngine(COLLECTION_PATH);

    // Spinner while the schematic runs (file I/O + module AST update)
    const s = p.spinner();
    s.start(`Generating ${chalk.cyan(type)} ${chalk.white(name)}…`);

    let result;
    try {
      result = await engine.run(type, name, { noSpec: options.noSpec });
    } catch (err) {
      s.stop(chalk.red('Generation failed.'));
      const msg = err instanceof Error ? err.message : String(err);
      p.log.error(msg);
      console.log('');
      console.log(this.availableTypes());
      process.exit(1);
    }

    s.stop('');

    // ── NestJS-style file listing ─────────────────────────────────────────────
    for (const op of result.operations) {
      const icon  = op.type === 'CREATE' ? chalk.green('CREATE') : chalk.yellow('UPDATE');
      const size  = formatBytes(op.size);
      console.log(`${icon} ${op.path} ${chalk.gray(`(${size})`)}`);
    }

    console.log('');
    p.log.success(`${capitalize(result.schematicName)} generated successfully.`);
  }

  availableTypes(): string {
    const rows: Array<[string, string, string]> = [
      ['controller', 'co',  'Controller'],
      ['service',    's',   'Service'],
      ['module',     'mo',  'Module + controller + service'],
      ['resource',   'res', 'Full CRUD resource'],
      ['guard',      'gu',  'Guard'],
      ['pipe',       'pi',  'Pipe'],
      ['filter',     'f',   'Exception filter'],
    ];
    const lines = rows.map(
      ([name, alias, desc]) =>
        `  ${chalk.cyan(name.padEnd(12))} ${chalk.gray(`(${alias})`.padEnd(7))} ${desc}`,
    );
    return `Available types:\n${lines.join('\n')}`;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
