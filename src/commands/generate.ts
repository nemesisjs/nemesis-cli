/**
 * @nemesisjs/cli - Generate command
 *
 * Generates controllers, services, and modules from templates.
 * By default a `.spec.ts` unit-test file is also created alongside each
 * generated artefact. Pass `--no-spec` to skip test generation.
 */

import { mkdir, writeFile, readFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import mustache from 'mustache';
import chalk from 'chalk';
import { toPascalCase, toKebabCase } from '../utils/naming.js';
import { addDeclarationToModule } from '../utils/ast.js';

type GenerateType = 'controller' | 'service' | 'module';

const TYPE_ALIASES: Record<string, GenerateType> = {
  controller: 'controller',
  co: 'controller',
  service: 'service',
  s: 'service',
  module: 'module',
  mo: 'module',
};

export interface GenerateOptions {
  /** When true, skip generating the `.spec.ts` unit-test file. */
  noSpec: boolean;
}

export class GenerateCommand {
  async execute(typeArg: string, name: string, options: GenerateOptions): Promise<void> {
    const type = TYPE_ALIASES[typeArg.toLowerCase()];
    if (!type) {
      console.error(
        chalk.red(`Error: Unknown generate type: "${typeArg}". Valid types: controller (co), service (s), module (mo)`),
      );
      process.exit(1);
    }

    const pascalName = toPascalCase(name);
    const kebabName = toKebabCase(name);

    switch (type) {
      case 'controller':
        await this.generateController(pascalName, kebabName, options);
        break;
      case 'service':
        await this.generateService(pascalName, kebabName, options);
        break;
      case 'module':
        await this.generateModule(pascalName, kebabName, options);
        break;
    }
  }

  // --- Generators -----------------------------------------------------------

  private async generateController(
    pascal: string,
    kebab: string,
    options: GenerateOptions,
  ): Promise<void> {
    const dir = join(process.cwd(), 'src', kebab);
    await mkdir(dir, { recursive: true });

    const data = { pascalName: pascal, kebabName: kebab, pascalNameLower: pascal.toLowerCase() };

    // Main file
    const content = await this.renderTemplate('controller.ts.mustache', data);
    await writeFile(join(dir, `${kebab}.controller.ts`), content);
    console.log(chalk.green(`  CREATE src/${kebab}/${kebab}.controller.ts`));

    // Spec file
    if (!options.noSpec) {
      const specContent = await this.renderTemplate('controller.spec.ts.mustache', data);
      await writeFile(join(dir, `${kebab}.controller.spec.ts`), specContent);
      console.log(chalk.green(`  CREATE src/${kebab}/${kebab}.controller.spec.ts`));
    }

    // Register in nearest module
    const modulePath = await this.findClosestModule(dir);
    if (modulePath) {
      await addDeclarationToModule(
        modulePath,
        `${pascal}Controller`,
        `./${kebab}.controller`,
        'controller',
      );
      console.log(chalk.yellow(`  UPDATE ${modulePath.replace(process.cwd() + '/', '')}`));
    }
  }

  private async generateService(
    pascal: string,
    kebab: string,
    options: GenerateOptions,
  ): Promise<void> {
    const dir = join(process.cwd(), 'src', kebab);
    await mkdir(dir, { recursive: true });

    const data = { pascalName: pascal, kebabName: kebab };

    // Main file
    const content = await this.renderTemplate('service.ts.mustache', data);
    await writeFile(join(dir, `${kebab}.service.ts`), content);
    console.log(chalk.green(`  CREATE src/${kebab}/${kebab}.service.ts`));

    // Spec file
    if (!options.noSpec) {
      const specContent = await this.renderTemplate('service.spec.ts.mustache', data);
      await writeFile(join(dir, `${kebab}.service.spec.ts`), specContent);
      console.log(chalk.green(`  CREATE src/${kebab}/${kebab}.service.spec.ts`));
    }

    // Register in nearest module
    const modulePath = await this.findClosestModule(dir);
    if (modulePath) {
      await addDeclarationToModule(
        modulePath,
        `${pascal}Service`,
        `./${kebab}.service`,
        'provider',
      );
      console.log(chalk.yellow(`  UPDATE ${modulePath.replace(process.cwd() + '/', '')}`));
    }
  }

  private async generateModule(
    pascal: string,
    kebab: string,
    options: GenerateOptions,
  ): Promise<void> {
    const dir = join(process.cwd(), 'src', kebab);
    await mkdir(dir, { recursive: true });

    const data = { pascalName: pascal, kebabName: kebab };

    // Module file
    const moduleContent = await this.renderTemplate('module.ts.mustache', data);
    await writeFile(join(dir, `${kebab}.module.ts`), moduleContent);
    console.log(chalk.green(`  CREATE src/${kebab}/${kebab}.module.ts`));

    // Module spec
    if (!options.noSpec) {
      const specContent = await this.renderTemplate('module.spec.ts.mustache', data);
      await writeFile(join(dir, `${kebab}.module.spec.ts`), specContent);
      console.log(chalk.green(`  CREATE src/${kebab}/${kebab}.module.spec.ts`));
    }

    // Generate controller + service (they auto-register into the new module)
    await this.generateController(pascal, kebab, options);
    await this.generateService(pascal, kebab, options);

    // Register the new module in its parent module's imports[]
    const parentModulePath = await this.findClosestModule(dirname(dir));
    if (parentModulePath) {
      await addDeclarationToModule(
        parentModulePath,
        `${pascal}Module`,
        `./${kebab}/${kebab}.module`,
        'import',
      );
      console.log(chalk.yellow(`  UPDATE ${parentModulePath.replace(process.cwd() + '/', '')}`));
    }
  }

  // --- Helpers --------------------------------------------------------------

  private async renderTemplate(
    templateName: string,
    data: Record<string, unknown>,
  ): Promise<string> {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const templatePath = join(currentDir, '..', 'templates', 'generate', templateName);
    const template = await readFile(templatePath, 'utf8');
    return mustache.render(template, data);
  }

  /**
   * Walk up from `startDir` until a `*.module.ts` file is found.
   * Stops at the project root (process.cwd()).
   */
  private async findClosestModule(startDir: string): Promise<string | null> {
    let currentDir = startDir;
    const cwd = process.cwd();
    while (currentDir !== dirname(cwd) && currentDir !== '/') {
      try {
        const files = await readdir(currentDir);
        for (const file of files) {
          if (file.endsWith('.module.ts')) {
            return join(currentDir, file);
          }
        }
      } catch {
        // Ignore unreadable directories
      }
      currentDir = dirname(currentDir);
    }
    return null;
  }
}
