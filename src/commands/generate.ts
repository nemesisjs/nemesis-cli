/**
 * @nemesis-js/cli - Generate command
 *
 * Generates NemesisJS components (controller, service, module, resource,
 * guard, pipe, filter) by delegating to `@nemesis-js/schematics`.
 *
 * All scaffolding logic lives in the schematics package — this command
 * is purely a thin CLI adapter that parses options and prints results.
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { SchematicEngine } from '@nemesis-js/schematics';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Path to the schematics package's collection.json. */
const COLLECTION_PATH = join(
  __dirname,
  '..',
  '..',
  'node_modules',
  '@nemesis-js',
  'schematics',
  'collection.json',
);

/** Human-readable descriptions for the help text. */
const SCHEMATIC_DESCRIPTIONS: Record<string, string> = {
  controller: 'Generate a controller                     (alias: co)',
  service:    'Generate a service                        (alias: s)',
  module:     'Generate a module + controller + service  (alias: mo)',
  resource:   'Generate a full CRUD resource             (alias: res)',
  guard:      'Generate a guard                          (alias: gu)',
  pipe:       'Generate a pipe                           (alias: pi)',
  filter:     'Generate an exception filter              (alias: f)',
};

export interface GenerateOptions {
  /** When true, skip generating the `.spec.ts` unit-test file. */
  noSpec: boolean;
}

export class GenerateCommand {
  async execute(type: string, name: string, options: GenerateOptions): Promise<void> {
    const engine = new SchematicEngine(COLLECTION_PATH);

    let result;
    try {
      result = await engine.run(type, name, { noSpec: options.noSpec });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`\nError: ${msg}\n`));
      console.error(this.availableTypes());
      process.exit(1);
    }

    // Print each file operation with size
    for (const op of result.operations) {
      const icon = op.type === 'CREATE' ? chalk.green('  CREATE') : chalk.yellow('  UPDATE');
      const size = formatBytes(op.size);
      console.log(`${icon} ${op.path} ${chalk.gray(`(${size})`)}`);
    }

    console.log(chalk.bold.green(`\n✔ ${result.schematicName} generated successfully\n`));
  }

  availableTypes(): string {
    const lines = Object.entries(SCHEMATIC_DESCRIPTIONS)
      .map(([type, desc]) => `  ${chalk.cyan(type.padEnd(12))} ${desc}`)
      .join('\n');
    return `Available types:\n${lines}`;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} kB`;
}
