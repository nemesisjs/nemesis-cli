/**
 * @nemesisjs/cli - Generate command
 *
 * Generates controllers, services, and modules from templates.
 */

import { mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
// @ts-ignore
import mustache from 'mustache';
import { toPascalCase, toKebabCase } from '../utils/naming.js';

type GenerateType = 'controller' | 'service' | 'module';

const TYPE_ALIASES: Record<string, GenerateType> = {
  controller: 'controller',
  co: 'controller',
  service: 'service',
  s: 'service',
  module: 'module',
  mo: 'module',
};

export class GenerateCommand {
  async execute(typeArg: string, name: string): Promise<void> {
    const type = TYPE_ALIASES[typeArg.toLowerCase()];
    if (!type) {
      console.error(
        `Unknown generate type: "${typeArg}". Valid types: controller (co), service (s), module (mo)`,
      );
      process.exit(1);
    }

    const pascalName = toPascalCase(name);
    const kebabName = toKebabCase(name);

    switch (type) {
      case 'controller':
        await this.generateController(pascalName, kebabName);
        break;
      case 'service':
        await this.generateService(pascalName, kebabName);
        break;
      case 'module':
        await this.generateModule(pascalName, kebabName);
        break;
    }
  }

  private async generateController(pascal: string, kebab: string): Promise<void> {
    const dir = join(process.cwd(), 'src', kebab);
    await mkdir(dir, { recursive: true });

    const content = await this.renderTemplate('controller.ts.mustache', {
      pascalName: pascal,
      kebabName: kebab,
      pascalNameLower: pascal.toLowerCase()
    });

    const filePath = join(dir, `${kebab}.controller.ts`);
    await writeFile(filePath, content);
    console.log(`CREATE src/${kebab}/${kebab}.controller.ts`);
  }

  private async generateService(pascal: string, kebab: string): Promise<void> {
    const dir = join(process.cwd(), 'src', kebab);
    await mkdir(dir, { recursive: true });

    const content = await this.renderTemplate('service.ts.mustache', {
      pascalName: pascal,
      kebabName: kebab
    });

    const filePath = join(dir, `${kebab}.service.ts`);
    await writeFile(filePath, content);
    console.log(`CREATE src/${kebab}/${kebab}.service.ts`);
  }

  private async generateModule(pascal: string, kebab: string): Promise<void> {
    const dir = join(process.cwd(), 'src', kebab);
    await mkdir(dir, { recursive: true });

    // Generate module + controller + service
    const moduleContent = await this.renderTemplate('module.ts.mustache', {
      pascalName: pascal,
      kebabName: kebab
    });

    await writeFile(join(dir, `${kebab}.module.ts`), moduleContent);
    console.log(`CREATE src/${kebab}/${kebab}.module.ts`);

    // Also generate controller and service
    await this.generateController(pascal, kebab);
    await this.generateService(pascal, kebab);
  }

  private async renderTemplate(templateName: string, data: any): Promise<string> {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const templatePath = join(currentDir, '..', 'templates', 'generate', templateName);
    const template = await readFile(templatePath, 'utf8');
    return mustache.render(template, data);
  }
}
