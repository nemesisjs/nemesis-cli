/**
 * @nemesis-js/cli - CLI router
 *
 * Parses raw argv and dispatches to the appropriate command.
 * All heavy lifting is done by the command classes; this file stays thin.
 */

import chalk from 'chalk';
import { NewCommand } from './commands/new.js';
import { GenerateCommand } from './commands/generate.js';
import { UpdateCommand } from './commands/update.js';
import { checkForUpdate } from './utils/update-checker.js';

// ── Help text ──────────────────────────────────────────────────────────────────

const HELP_TEXT = `
${chalk.bold('NemesisJS CLI')}

${chalk.bold('Usage:')}
  nemesis <command> [options]

${chalk.bold('Commands:')}
  ${chalk.cyan('new <name>')}               Scaffold a new NemesisJS project
  ${chalk.cyan('generate <type> <name>')}   Generate a component  (alias: ${chalk.cyan('g')})
  ${chalk.cyan('serve')}                    Start dev server with hot reload
  ${chalk.cyan('build')}                    Build for production
  ${chalk.cyan('test')}                     Run tests
  ${chalk.cyan('update')}                   Check for CLI updates

${chalk.bold('Generate types:')}
  ${chalk.cyan('controller')} (co)    Controller
  ${chalk.cyan('service')}    (s)     Service
  ${chalk.cyan('module')}     (mo)    Module + controller + service
  ${chalk.cyan('resource')}   (res)   Full CRUD resource
  ${chalk.cyan('guard')}      (gu)    Guard
  ${chalk.cyan('pipe')}       (pi)    Pipe
  ${chalk.cyan('filter')}     (f)     Exception filter

${chalk.bold('Options:')}
  new:
    ${chalk.gray('--no-test')}        Skip generating the tests/ scaffold

  generate / g:
    ${chalk.gray('--no-spec')}        Skip generating the .spec.ts unit-test file

${chalk.bold('Examples:')}
  ${chalk.gray('nemesis new my-app')}
  ${chalk.gray('nemesis new my-app --no-test')}
  ${chalk.gray('nemesis generate controller users')}
  ${chalk.gray('nemesis g s users')}
  ${chalk.gray('nemesis g mo auth')}
  ${chalk.gray('nemesis g res posts')}
  ${chalk.gray('nemesis g co payment --no-spec')}
  ${chalk.gray('nemesis update')}
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true if the given flag is present in the args list. */
function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

/**
 * Print an update banner if a newer CLI version is available.
 * Runs in the background — never blocks the main command.
 */
function backgroundUpdateCheck(): void {
  checkForUpdate()
    .then((info) => {
      if (info?.hasUpdate) {
        console.log(
          chalk.yellow(
            `\n  ⚡ Update available! ${chalk.gray(info.currentVersion)} → ${chalk.green(info.latestVersion)}` +
              `\n  Run ${chalk.cyan('nemesis update')} to see upgrade instructions.\n`,
          ),
        );
      }
    })
    .catch(() => {
      /* silently ignore network errors */
    });
}

// ── CLI class ─────────────────────────────────────────────────────────────────

export class CLI {
  async run(args: string[]): Promise<void> {
    const command = args[0];

    if (!command || command === '--help' || command === '-h') {
      console.log(HELP_TEXT);
      return;
    }

    // Fire-and-forget background update check (skipped for `update` itself)
    if (command !== 'update') {
      backgroundUpdateCheck();
    }

    switch (command) {
      // ── new ──────────────────────────────────────────────────────────────
      case 'new':
      case 'n': {
        const name = args.find((a) => !a.startsWith('-') && a !== command);
        if (!name) {
          console.error(chalk.red('Error: Project name is required.'));
          console.error('Usage: nemesis new <project-name>');
          process.exit(1);
        }
        await new NewCommand().execute(name, {
          noTest: hasFlag(args, '--no-test'),
        });
        break;
      }

      // ── generate ─────────────────────────────────────────────────────────
      case 'generate':
      case 'g': {
        const positional = args.slice(1).filter((a) => !a.startsWith('-'));
        const type = positional[0];
        const name = positional[1];

        if (!type || !name) {
          console.error(chalk.red('Error: Type and name are required.'));
          console.error('Usage: nemesis generate <type> <name>');
          process.exit(1);
        }
        await new GenerateCommand().execute(type, name, {
          noSpec: hasFlag(args, '--no-spec'),
        });
        break;
      }

      // ── serve ─────────────────────────────────────────────────────────────
      case 'serve': {
        console.log(chalk.gray('Starting NemesisJS dev server with hot reload…'));
        const proc = Bun.spawn(['bun', '--hot', 'src/main.ts'], {
          stdio: ['inherit', 'inherit', 'inherit'],
        });
        await proc.exited;
        break;
      }

      // ── build ─────────────────────────────────────────────────────────────
      case 'build': {
        console.log(chalk.gray('Building NemesisJS application…'));
        const proc = Bun.spawn(
          ['bun', 'build', './src/main.ts', '--outdir', './dist', '--target', 'bun'],
          { stdio: ['inherit', 'inherit', 'inherit'] },
        );
        await proc.exited;
        break;
      }

      // ── test ──────────────────────────────────────────────────────────────
      case 'test': {
        const proc = Bun.spawn(['bun', 'test'], {
          stdio: ['inherit', 'inherit', 'inherit'],
        });
        await proc.exited;
        break;
      }

      // ── update ────────────────────────────────────────────────────────────
      case 'update': {
        await new UpdateCommand().execute();
        break;
      }

      default:
        console.error(chalk.red(`Unknown command: ${command}`));
        console.log(HELP_TEXT);
        process.exit(1);
    }
  }
}
