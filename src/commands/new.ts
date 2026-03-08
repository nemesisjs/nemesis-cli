/**
 * @nemesisjs/cli - New command
 *
 * Scaffolds a new NemesisJS project with all the boilerplate.
 */

import { mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
// @ts-ignore
import mustache from 'mustache';
import { toPascalCase, toKebabCase } from '../utils/naming.js';

export class NewCommand {
  async execute(projectName: string): Promise<void> {
    const kebabName = toKebabCase(projectName);
    const dir = join(process.cwd(), kebabName);

    console.log(`\nCreating NemesisJS project: ${kebabName}\n`);

    // Create directories
    await mkdir(join(dir, 'src'), { recursive: true });
    await mkdir(join(dir, 'tests'), { recursive: true });

    // Write files
    await writeFile(join(dir, 'package.json'), await this.renderTemplate('package.json.mustache', { name: kebabName }));
    await writeFile(join(dir, 'tsconfig.json'), await this.renderTemplate('tsconfig.json.mustache', {}));
    await writeFile(join(dir, 'bunfig.toml'), await this.renderTemplate('bunfig.toml.mustache', {}));
    await writeFile(join(dir, '.gitignore'), await this.renderTemplate('gitignore.mustache', {}));
    await writeFile(join(dir, 'src', 'main.ts'), await this.renderTemplate('main.ts.mustache', {}));
    await writeFile(join(dir, 'src', 'app.module.ts'), await this.renderTemplate('app.module.ts.mustache', {}));
    await writeFile(join(dir, 'src', 'app.controller.ts'), await this.renderTemplate('app.controller.ts.mustache', {}));
    await writeFile(join(dir, 'src', 'app.service.ts'), await this.renderTemplate('app.service.ts.mustache', {}));
    await writeFile(join(dir, 'tests', 'app.test.ts'), await this.renderTemplate('app.test.ts.mustache', {}));

    console.log(`  Created ${kebabName}/`);
    console.log(`  Created package.json`);
    console.log(`  Created tsconfig.json`);
    console.log(`  Created src/main.ts`);
    console.log(`  Created src/app.module.ts`);
    console.log(`  Created src/app.controller.ts`);
    console.log(`  Created src/app.service.ts`);
    console.log(`  Created tests/app.test.ts`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${kebabName}`);
    console.log(`  bun install`);
    console.log(`  bun run dev`);
    console.log('');
  }

  private async renderTemplate(templateName: string, data: any): Promise<string> {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const templatePath = join(currentDir, '..', 'templates', 'new', templateName);
    const template = await readFile(templatePath, 'utf8');
    return mustache.render(template, data);
  }
}
