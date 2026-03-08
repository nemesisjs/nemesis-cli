/**
 * @nemesisjs/cli - Generate command
 *
 * Generates controllers, services, and modules from templates.
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
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

    const content = `import { Controller, Get, Inject } from '@nemesisjs/common';
import type { RequestContext } from '@nemesisjs/http';

@Controller('/${kebab}')
export class ${pascal}Controller {
  @Get('/')
  findAll(ctx: RequestContext) {
    return ctx.json({ message: '${pascal} controller works!' });
  }

  @Get('/:id')
  findOne(ctx: RequestContext) {
    const id = ctx.getParam('id');
    return ctx.json({ id, message: 'Found ${pascal.toLowerCase()}' });
  }
}
`;

    const filePath = join(dir, `${kebab}.controller.ts`);
    await writeFile(filePath, content);
    console.log(`CREATE src/${kebab}/${kebab}.controller.ts`);
  }

  private async generateService(pascal: string, kebab: string): Promise<void> {
    const dir = join(process.cwd(), 'src', kebab);
    await mkdir(dir, { recursive: true });

    const content = `import { Injectable } from '@nemesisjs/common';

@Injectable()
export class ${pascal}Service {
  findAll() {
    return [];
  }

  findOne(id: string) {
    return { id };
  }

  create(data: any) {
    return { ...data, id: crypto.randomUUID() };
  }

  update(id: string, data: any) {
    return { ...data, id };
  }

  remove(id: string) {
    return { id, deleted: true };
  }
}
`;

    const filePath = join(dir, `${kebab}.service.ts`);
    await writeFile(filePath, content);
    console.log(`CREATE src/${kebab}/${kebab}.service.ts`);
  }

  private async generateModule(pascal: string, kebab: string): Promise<void> {
    const dir = join(process.cwd(), 'src', kebab);
    await mkdir(dir, { recursive: true });

    // Generate module + controller + service
    const moduleContent = `import { Module } from '@nemesisjs/common';
import { ${pascal}Controller } from './${kebab}.controller';
import { ${pascal}Service } from './${kebab}.service';

@Module({
  controllers: [${pascal}Controller],
  providers: [
    { provide: '${pascal}Service', useClass: ${pascal}Service },
  ],
  exports: ['${pascal}Service'],
})
export class ${pascal}Module {}
`;

    await writeFile(join(dir, `${kebab}.module.ts`), moduleContent);
    console.log(`CREATE src/${kebab}/${kebab}.module.ts`);

    // Also generate controller and service
    await this.generateController(pascal, kebab);
    await this.generateService(pascal, kebab);
  }
}
