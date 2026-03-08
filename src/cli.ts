/**
 * @nemesisjs/cli - CLI handler
 */

import { NewCommand } from './commands/new.js';
import { GenerateCommand } from './commands/generate.js';

const HELP_TEXT = `
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

export class CLI {
  async run(args: string[]): Promise<void> {
    const command = args[0];

    if (!command || command === '--help' || command === '-h') {
      console.log(HELP_TEXT);
      return;
    }

    switch (command) {
      case 'new':
      case 'n': {
        const name = args[1];
        if (!name) {
          console.error('Error: Project name is required.\nUsage: nemesis new <project-name>');
          process.exit(1);
        }
        const cmd = new NewCommand();
        await cmd.execute(name);
        break;
      }

      case 'generate':
      case 'g': {
        const type = args[1];
        const name = args[2];
        if (!type || !name) {
          console.error('Error: Type and name are required.\nUsage: nemesis generate <type> <name>');
          process.exit(1);
        }
        const cmd = new GenerateCommand();
        await cmd.execute(type, name);
        break;
      }

      case 'serve': {
        console.log('Starting NemesisJS dev server with hot reload...');
        const proc = Bun.spawn(['bun', '--hot', 'src/main.ts'], {
          stdio: ['inherit', 'inherit', 'inherit'],
        });
        await proc.exited;
        break;
      }

      case 'build': {
        console.log('Building NemesisJS application...');
        const proc = Bun.spawn(['bun', 'build', './src/main.ts', '--outdir', './dist', '--target', 'bun'], {
          stdio: ['inherit', 'inherit', 'inherit'],
        });
        await proc.exited;
        break;
      }

      case 'test': {
        console.log('Running NemesisJS tests...');
        const proc = Bun.spawn(['bun', 'test'], {
          stdio: ['inherit', 'inherit', 'inherit'],
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
