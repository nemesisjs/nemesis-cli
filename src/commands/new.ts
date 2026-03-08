/**
 * @nemesisjs/cli - New command
 *
 * Scaffolds a new NemesisJS project with all the boilerplate.
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
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
    await writeFile(join(dir, 'package.json'), this.packageJson(kebabName));
    await writeFile(join(dir, 'tsconfig.json'), this.tsconfig());
    await writeFile(join(dir, 'bunfig.toml'), this.bunfig());
    await writeFile(join(dir, '.gitignore'), this.gitignore());
    await writeFile(join(dir, 'src', 'main.ts'), this.mainTs());
    await writeFile(join(dir, 'src', 'app.module.ts'), this.appModuleTs());
    await writeFile(join(dir, 'src', 'app.controller.ts'), this.appControllerTs());
    await writeFile(join(dir, 'src', 'app.service.ts'), this.appServiceTs());
    await writeFile(join(dir, 'tests', 'app.test.ts'), this.appTestTs());

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

  private packageJson(name: string): string {
    return JSON.stringify(
      {
        name,
        version: '0.1.0',
        scripts: {
          dev: 'bun --hot src/main.ts',
          start: 'bun src/main.ts',
          build: 'bun build ./src/main.ts --outdir ./dist --target bun',
          test: 'bun test',
        },
        dependencies: {
          '@nemesisjs/common': '^0.1.0',
          '@nemesisjs/core': '^0.1.0',
          '@nemesisjs/http': '^0.1.0',
          '@nemesisjs/platform-bun': '^0.1.0',
        },
        devDependencies: {
          '@nemesisjs/testing': '^0.1.0',
          typescript: '^5.7.0',
          '@types/bun': 'latest',
        },
      },
      null,
      2,
    );
  }

  private tsconfig(): string {
    return JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ES2022',
          lib: ['ES2022'],
          moduleResolution: 'bundler',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          experimentalDecorators: true,
          useDefineForClassFields: false,
          outDir: './dist',
          rootDir: './src',
          declaration: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2,
    );
  }

  private bunfig(): string {
    return `[test]\nroot = "."\ntimeout = 30000\n`;
  }

  private gitignore(): string {
    return `node_modules/\ndist/\nbun.lockb\n.DS_Store\n`;
  }

  private mainTs(): string {
    return `import { createHttpApp } from '@nemesisjs/http';
import { AppModule } from './app.module';

const app = await createHttpApp(AppModule);
await app.listen(3000);

console.log(\`NemesisJS server running at \${app.getUrl()}\`);
`;
  }

  private appModuleTs(): string {
    return `import { Module } from '@nemesisjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [
    { provide: 'AppService', useClass: AppService },
  ],
})
export class AppModule {}
`;
  }

  private appControllerTs(): string {
    return `import { Controller, Get, Inject, Injectable } from '@nemesisjs/common';
import type { RequestContext } from '@nemesisjs/http';
import type { AppService } from './app.service';

@Controller('/')
export class AppController {
  constructor(@Inject('AppService') private readonly appService: AppService) {}

  @Get('/')
  getHello(ctx: RequestContext) {
    return ctx.json({ message: this.appService.getHello() });
  }
}
`;
  }

  private appServiceTs(): string {
    return `import { Injectable } from '@nemesisjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from NemesisJS!';
  }
}
`;
  }

  private appTestTs(): string {
    return `import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { createHttpApp } from '@nemesisjs/http';
import { TestClient } from '@nemesisjs/testing';
import { AppModule } from '../src/app.module';

describe('AppController', () => {
  let client: TestClient;

  beforeAll(async () => {
    const app = await createHttpApp(AppModule);
    client = new TestClient(app);
    await client.listen();
  });

  afterAll(async () => {
    await client.close();
  });

  it('GET / should return hello message', async () => {
    const res = await client.get('/');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('Hello from NemesisJS!');
  });
});
`;
  }
}
