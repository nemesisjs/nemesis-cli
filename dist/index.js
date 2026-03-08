// @bun
// src/commands/new.ts
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

// src/utils/naming.ts
function toPascalCase(str) {
  return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : "").replace(/^(.)/, (_, c) => c.toUpperCase());
}
function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[\s_]+/g, "-").toLowerCase();
}
function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// src/commands/new.ts
class NewCommand {
  async execute(projectName) {
    const kebabName = toKebabCase(projectName);
    const dir = join(process.cwd(), kebabName);
    console.log(`
Creating NemesisJS project: ${kebabName}
`);
    await mkdir(join(dir, "src"), { recursive: true });
    await mkdir(join(dir, "tests"), { recursive: true });
    await writeFile(join(dir, "package.json"), this.packageJson(kebabName));
    await writeFile(join(dir, "tsconfig.json"), this.tsconfig());
    await writeFile(join(dir, "bunfig.toml"), this.bunfig());
    await writeFile(join(dir, ".gitignore"), this.gitignore());
    await writeFile(join(dir, "src", "main.ts"), this.mainTs());
    await writeFile(join(dir, "src", "app.module.ts"), this.appModuleTs());
    await writeFile(join(dir, "src", "app.controller.ts"), this.appControllerTs());
    await writeFile(join(dir, "src", "app.service.ts"), this.appServiceTs());
    await writeFile(join(dir, "tests", "app.test.ts"), this.appTestTs());
    console.log(`  Created ${kebabName}/`);
    console.log(`  Created package.json`);
    console.log(`  Created tsconfig.json`);
    console.log(`  Created src/main.ts`);
    console.log(`  Created src/app.module.ts`);
    console.log(`  Created src/app.controller.ts`);
    console.log(`  Created src/app.service.ts`);
    console.log(`  Created tests/app.test.ts`);
    console.log(`
Next steps:`);
    console.log(`  cd ${kebabName}`);
    console.log(`  bun install`);
    console.log(`  bun run dev`);
    console.log("");
  }
  packageJson(name) {
    return JSON.stringify({
      name,
      version: "0.1.0",
      scripts: {
        dev: "bun --hot src/main.ts",
        start: "bun src/main.ts",
        build: "bun build ./src/main.ts --outdir ./dist --target bun",
        test: "bun test"
      },
      dependencies: {
        "@nemesisjs/common": "^0.1.0",
        "@nemesisjs/core": "^0.1.0",
        "@nemesisjs/http": "^0.1.0",
        "@nemesisjs/platform-bun": "^0.1.0"
      },
      devDependencies: {
        "@nemesisjs/testing": "^0.1.0",
        typescript: "^5.7.0",
        "@types/bun": "latest"
      }
    }, null, 2);
  }
  tsconfig() {
    return JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ES2022",
        lib: ["ES2022"],
        moduleResolution: "bundler",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        experimentalDecorators: true,
        useDefineForClassFields: false,
        outDir: "./dist",
        rootDir: "./src",
        declaration: true
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"]
    }, null, 2);
  }
  bunfig() {
    return `[test]
root = "."
timeout = 30000
`;
  }
  gitignore() {
    return `node_modules/
dist/
bun.lockb
.DS_Store
`;
  }
  mainTs() {
    return `import { createHttpApp } from '@nemesisjs/http';
import { AppModule } from './app.module';

const app = await createHttpApp(AppModule);
await app.listen(3000);

console.log(\`NemesisJS server running at \${app.getUrl()}\`);
`;
  }
  appModuleTs() {
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
  appControllerTs() {
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
  appServiceTs() {
    return `import { Injectable } from '@nemesisjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from NemesisJS!';
  }
}
`;
  }
  appTestTs() {
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

// src/commands/generate.ts
import { mkdir as mkdir2, writeFile as writeFile2 } from "fs/promises";
import { join as join2 } from "path";
var TYPE_ALIASES = {
  controller: "controller",
  co: "controller",
  service: "service",
  s: "service",
  module: "module",
  mo: "module"
};

class GenerateCommand {
  async execute(typeArg, name) {
    const type = TYPE_ALIASES[typeArg.toLowerCase()];
    if (!type) {
      console.error(`Unknown generate type: "${typeArg}". Valid types: controller (co), service (s), module (mo)`);
      process.exit(1);
    }
    const pascalName = toPascalCase(name);
    const kebabName = toKebabCase(name);
    switch (type) {
      case "controller":
        await this.generateController(pascalName, kebabName);
        break;
      case "service":
        await this.generateService(pascalName, kebabName);
        break;
      case "module":
        await this.generateModule(pascalName, kebabName);
        break;
    }
  }
  async generateController(pascal, kebab) {
    const dir = join2(process.cwd(), "src", kebab);
    await mkdir2(dir, { recursive: true });
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
    const filePath = join2(dir, `${kebab}.controller.ts`);
    await writeFile2(filePath, content);
    console.log(`CREATE src/${kebab}/${kebab}.controller.ts`);
  }
  async generateService(pascal, kebab) {
    const dir = join2(process.cwd(), "src", kebab);
    await mkdir2(dir, { recursive: true });
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
    const filePath = join2(dir, `${kebab}.service.ts`);
    await writeFile2(filePath, content);
    console.log(`CREATE src/${kebab}/${kebab}.service.ts`);
  }
  async generateModule(pascal, kebab) {
    const dir = join2(process.cwd(), "src", kebab);
    await mkdir2(dir, { recursive: true });
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
    await writeFile2(join2(dir, `${kebab}.module.ts`), moduleContent);
    console.log(`CREATE src/${kebab}/${kebab}.module.ts`);
    await this.generateController(pascal, kebab);
    await this.generateService(pascal, kebab);
  }
}

// src/cli.ts
var HELP_TEXT = `
NemesisJS CLI v0.1.0

Usage:
  nemesis new <project-name>              Create a new NemesisJS project
  nemesis generate <type> <name>          Generate a component
  nemesis g <type> <name>                 Shorthand for generate
  nemesis serve                           Start dev server with hot reload
  nemesis build                           Build for production
  nemesis test                            Run tests

Generate types:
  controller (co)    Generate a controller
  service (s)        Generate a service
  module (mo)        Generate a module

Examples:
  nemesis new my-app
  nemesis generate controller User
  nemesis g s User
  nemesis g mo Auth
`;

class CLI {
  async run(args) {
    const command = args[0];
    if (!command || command === "--help" || command === "-h") {
      console.log(HELP_TEXT);
      return;
    }
    switch (command) {
      case "new":
      case "n": {
        const name = args[1];
        if (!name) {
          console.error(`Error: Project name is required.
Usage: nemesis new <project-name>`);
          process.exit(1);
        }
        const cmd = new NewCommand;
        await cmd.execute(name);
        break;
      }
      case "generate":
      case "g": {
        const type = args[1];
        const name = args[2];
        if (!type || !name) {
          console.error(`Error: Type and name are required.
Usage: nemesis generate <type> <name>`);
          process.exit(1);
        }
        const cmd = new GenerateCommand;
        await cmd.execute(type, name);
        break;
      }
      case "serve": {
        console.log("Starting NemesisJS dev server with hot reload...");
        const proc = Bun.spawn(["bun", "--hot", "src/main.ts"], {
          stdio: ["inherit", "inherit", "inherit"]
        });
        await proc.exited;
        break;
      }
      case "build": {
        console.log("Building NemesisJS application...");
        const proc = Bun.spawn(["bun", "build", "./src/main.ts", "--outdir", "./dist", "--target", "bun"], {
          stdio: ["inherit", "inherit", "inherit"]
        });
        await proc.exited;
        break;
      }
      case "test": {
        console.log("Running NemesisJS tests...");
        const proc = Bun.spawn(["bun", "test"], {
          stdio: ["inherit", "inherit", "inherit"]
        });
        await proc.exited;
        break;
      }
      default:
        console.error(`Unknown command: ${command}`);
        console.log(HELP_TEXT);
        process.exit(1);
    }
  }
}
export {
  toPascalCase,
  toKebabCase,
  toCamelCase,
  NewCommand,
  GenerateCommand,
  CLI
};
