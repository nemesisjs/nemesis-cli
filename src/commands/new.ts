/**
 * @nemesis-js/cli - New command
 *
 * Scaffolds a brand new NemesisJS project by delegating to the
 * `application` schematic in `@nemesis-js/schematics`.
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import figlet from 'figlet';
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

export interface NewOptions {
  /** When true, skip generating the tests/ scaffold. */
  noTest: boolean;
}

export class NewCommand {
  async execute(projectName: string, options: NewOptions): Promise<void> {
    // ── Banner ────────────────────────────────────────────────────────────────
    console.log(
      chalk.cyan(
        figlet.textSync('NEMESIS', {
          font: 'Slant',
          horizontalLayout: 'default',
          verticalLayout: 'default',
        }),
      ),
    );
    console.log(
      chalk.bold.blue(
        `\n🚀 Scaffolding new NemesisJS project: ${chalk.green(projectName)}\n`,
      ),
    );

    // ── Run schematic ─────────────────────────────────────────────────────────
    const engine = new SchematicEngine(COLLECTION_PATH);

    const result = await engine.run('application', projectName, {
      noTest: options.noTest,
    });

    // ── Output ────────────────────────────────────────────────────────────────
    for (const op of result.operations) {
      const icon = op.type === 'CREATE' ? chalk.green('  CREATE') : chalk.yellow('  UPDATE');
      console.log(`${icon} ${op.path}`);
    }

    console.log(chalk.bold.green(`\n✨ Project "${projectName}" created successfully!\n`));
    console.log('Next steps:\n');
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan(`  bun install`));
    console.log(chalk.cyan(`  bun run dev`));
    console.log('');
  }
}
