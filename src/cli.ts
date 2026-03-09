/**
 * @nemesis-js/cli - CLI entry-point
 */

import { NewCommand } from './commands/new.js';
import { GenerateCommand } from './commands/generate.js';

const HELP_TEXT = `
NemesisJS CLI

Usage:
  nemesis new <project-name> [options]   Scaffold a new NemesisJS project
  nemesis generate <type> <name> [opts]  Generate a component
  nemesis g <type> <name> [options]      Shorthand for generate
  nemesis serve                          Start dev server with hot reload
  nemesis build                          Build for production
  nemesis test                           Run tests

Generate types:
  controller (co)    Generate a controller
  service    (s)     Generate a service
  module     (mo)    Generate a module (+ controller + service)

Options:
  new:
    --no-test          Skip generating the tests/ scaffold

  generate / g:
    --no-spec          Skip generating the .spec.ts unit-test file

Examples:
  nemesis new my-app
  nemesis new my-app --no-test
  nemesis generate controller User
  nemesis g s User
  nemesis g mo Auth
  nemesis g co Payment --no-spec
`;

/** Parse a simple boolean flag like `--no-spec` or `--no-test` */
function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

export class CLI {
  async run(args: string[]): Promise<void> {
    const command = args[0];

    if (!command || command === '--help' || command === '-h') {
      console.log(HELP_TEXT);
      return;
    }

    switch (command) {
      // ── new ──────────────────────────────────────────────────────────────
      case 'new':
      case 'n': {
        const name = args.find((a) => !a.startsWith('-') && a !== command);
        if (!name) {
          console.error('Error: Project name is required.\nUsage: nemesis new <project-name>');
          process.exit(1);
        }
        const noTest = hasFlag(args, '--no-test');
        const cmd = new NewCommand();
        await cmd.execute(name, { noTest });
        break;
      }

      // ── generate ─────────────────────────────────────────────────────────
      case 'generate':
      case 'g': {
        // Filter out flags so positional args are clean
        const positional = args.slice(1).filter((a) => !a.startsWith('-'));
        const type = positional[0];
        const name = positional[1];
        if (!type || !name) {
          console.error('Error: Type and name are required.\nUsage: nemesis generate <type> <name>');
          process.exit(1);
        }
        const noSpec = hasFlag(args, '--no-spec');
        const cmd = new GenerateCommand();
        await cmd.execute(type, name, { noSpec });
        break;
      }

      // ── serve ─────────────────────────────────────────────────────────────
      case 'serve': {
        console.log('Starting NemesisJS dev server with hot reload...');
        const proc = Bun.spawn(['bun', '--hot', 'src/main.ts'], {
          stdio: ['inherit', 'inherit', 'inherit'],
        });
        await proc.exited;
        break;
      }

      // ── build ─────────────────────────────────────────────────────────────
      case 'build': {
        console.log('Building NemesisJS application...');
        const proc = Bun.spawn(
          ['bun', 'build', './src/main.ts', '--outdir', './dist', '--target', 'bun'],
          { stdio: ['inherit', 'inherit', 'inherit'] },
        );
        await proc.exited;
        break;
      }

      // ── test ──────────────────────────────────────────────────────────────
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
