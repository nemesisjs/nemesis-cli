/**
 * @nemesis-js/cli - New command
 *
 * Scaffolds a new NemesisJS project with all the boilerplate including:
 * - ESLint (flat config) + Prettier out of the box
 * - Comprehensive .gitignore
 * - emitDecoratorMetadata enabled in tsconfig
 * - Unit-test scaffold (pass --no-test to skip)
 */

import { mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import mustache from 'mustache';
import chalk from 'chalk';
import figlet from 'figlet';
import { toKebabCase } from '../utils/naming.js';

export interface NewOptions {
  /** When true, skip generating the tests/ scaffold. */
  noTest: boolean;
}

export class NewCommand {
  async execute(projectName: string, options: NewOptions): Promise<void> {
    const kebabName = toKebabCase(projectName);
    const dir = join(process.cwd(), kebabName);

    console.log(
      chalk.cyan(
        figlet.textSync('NEMESIS', {
          font: 'Slant',
          horizontalLayout: 'default',
          verticalLayout: 'default',
        })
      )
    );
    console.log(chalk.bold.blue(`\n🚀 Scaffolding new NemesisJS project: ${chalk.green(kebabName)}\n`));

    // ── Directories ──────────────────────────────────────────────────────────
    await mkdir(join(dir, 'src'), { recursive: true });
    if (!options.noTest) {
      await mkdir(join(dir, 'tests'), { recursive: true });
    }

    const data = { name: kebabName };

    // ── Root config files ────────────────────────────────────────────────────
    await this.write(dir, 'package.json',      await this.render('package.json.mustache', data));
    await this.write(dir, 'tsconfig.json',     await this.render('tsconfig.json.mustache', data));
    await this.write(dir, 'bunfig.toml',       await this.render('bunfig.toml.mustache', data));
    await this.write(dir, '.gitignore',        await this.render('gitignore.mustache', data));
    await this.write(dir, 'eslint.config.mjs', await this.render('eslint.config.mjs.mustache', data));
    await this.write(dir, '.prettierrc',       await this.render('prettierrc.mustache', data));
    await this.write(dir, '.prettierignore',   await this.render('prettierignore.mustache', data));

    // ── Source files ─────────────────────────────────────────────────────────
    await this.write(join(dir, 'src'), 'main.ts',           await this.render('main.ts.mustache', data));
    await this.write(join(dir, 'src'), 'app.module.ts',     await this.render('app.module.ts.mustache', data));
    await this.write(join(dir, 'src'), 'app.controller.ts', await this.render('app.controller.ts.mustache', data));
    await this.write(join(dir, 'src'), 'app.service.ts',    await this.render('app.service.ts.mustache', data));

    // ── Tests ────────────────────────────────────────────────────────────────
    if (!options.noTest) {
      await this.write(join(dir, 'tests'), 'app.test.ts', await this.render('app.test.ts.mustache', data));
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log(chalk.green(`  ✔ Created directory: ${kebabName}/`));
    console.log(chalk.gray(`  - package.json`));
    console.log(chalk.gray(`  - tsconfig.json`));
    console.log(chalk.gray(`  - eslint.config.mjs`));
    console.log(chalk.gray(`  - .prettierrc`));
    console.log(chalk.gray(`  - .gitignore`));
    console.log(chalk.gray(`  - src/main.ts`));
    console.log(chalk.gray(`  - src/app.module.ts`));
    console.log(chalk.gray(`  - src/app.controller.ts`));
    console.log(chalk.gray(`  - src/app.service.ts`));
    if (!options.noTest) {
      console.log(chalk.gray(`  - tests/app.test.ts`));
    }

    console.log(chalk.bold.blue(`\n✨ Project successfully created!\n`));
    console.log(`Next steps:\n`);
    console.log(chalk.cyan(`  $ cd ${kebabName}`));
    console.log(chalk.cyan(`  $ bun install`));
    console.log(chalk.cyan(`  $ bun run start:dev`));
    console.log('');
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async write(dir: string, filename: string, content: string): Promise<void> {
    await writeFile(join(dir, filename), content, 'utf8');
  }

  private async render(templateName: string, data: Record<string, unknown>): Promise<string> {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const templatePath = join(currentDir, '..', 'templates', 'new', templateName);
    const template = await readFile(templatePath, 'utf8');
    return mustache.render(template, data);
  }
}
