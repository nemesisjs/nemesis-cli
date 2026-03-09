/**
 * @nemesis-js/cli - CLI router
 */

import figlet from 'figlet';
import gradient from 'gradient-string';
import chalk from 'chalk';
import * as p from '@clack/prompts';
import { NewCommand } from './commands/new.js';
import { GenerateCommand } from './commands/generate.js';
import { UpdateCommand } from './commands/update.js';
import { checkForUpdate } from './utils/update-checker.js';

// ── Banner ─────────────────────────────────────────────────────────────────────

function printBanner(): void {
  const art = figlet.textSync('NEMESIS', { font: 'Slant' });
  // Deep purple → hot pink → orange gradient
  console.log(gradient(['#6C63FF', '#E040FB', '#FF6D00']).multiline(art));
  console.log(
    chalk.gray('  The Bun-native NemesisJS framework CLI\n'),
  );
}

// ── Help text ──────────────────────────────────────────────────────────────────

function printHelp(): void {
  printBanner();
  console.log(
    [
      chalk.bold('Usage:'),
      `  ${chalk.cyan('nemesis')} ${chalk.white('<command>')} ${chalk.gray('[options]')}`,
      '',
      chalk.bold('Commands:'),
      `  ${chalk.cyan('new')}  ${chalk.white('<name>')}                  Scaffold a new project`,
      `  ${chalk.cyan('generate')} ${chalk.white('<type> <name>')}       Generate a component  ${chalk.gray('(alias: g)')}`,
      `  ${chalk.cyan('serve')}                           Start dev server with hot reload`,
      `  ${chalk.cyan('build')}                           Compile for production`,
      `  ${chalk.cyan('test')}                            Run tests`,
      `  ${chalk.cyan('update')}                          Check for CLI updates`,
      '',
      chalk.bold('Generate types:'),
      `  ${chalk.cyan('controller')} ${chalk.gray('(co)')}   Controller`,
      `  ${chalk.cyan('service')}    ${chalk.gray('(s)')}    Service`,
      `  ${chalk.cyan('module')}     ${chalk.gray('(mo)')}   Module + controller + service`,
      `  ${chalk.cyan('resource')}   ${chalk.gray('(res)')}  Full CRUD resource`,
      `  ${chalk.cyan('guard')}      ${chalk.gray('(gu)')}   Guard`,
      `  ${chalk.cyan('pipe')}       ${chalk.gray('(pi)')}   Pipe`,
      `  ${chalk.cyan('filter')}     ${chalk.gray('(f)')}    Exception filter`,
      '',
      chalk.bold('Flags:'),
      `  ${chalk.gray('--no-test')}   Skip e2e test scaffold  ${chalk.gray('(new)')}`,
      `  ${chalk.gray('--no-spec')}   Skip .spec.ts file      ${chalk.gray('(generate)')}`,
      '',
      chalk.bold('Examples:'),
      `  ${chalk.gray('nemesis new my-api')}`,
      `  ${chalk.gray('nemesis g controller users')}`,
      `  ${chalk.gray('nemesis g res posts')}`,
      `  ${chalk.gray('nemesis g mo auth')}`,
    ].join('\n'),
  );
  console.log('');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

/** Non-blocking background update check — prints banner if update found. */
function backgroundUpdateCheck(): void {
  checkForUpdate()
    .then((info) => {
      if (info?.hasUpdate) {
        console.log(
          chalk.hex('#E040FB')(
            `\n  ⚡ Update available  ${chalk.gray(info.currentVersion)} → ${chalk.bold.green(info.latestVersion)}\n` +
            `  Run ${chalk.cyan('nemesis update')} to see upgrade instructions.\n`,
          ),
        );
      }
    })
    .catch(() => { /* ignore network errors */ });
}

// ── CLI class ─────────────────────────────────────────────────────────────────

export class CLI {
  async run(args: string[]): Promise<void> {
    const command = args[0];

    if (!command || command === '--help' || command === '-h') {
      printHelp();
      return;
    }

    if (command !== 'update') {
      backgroundUpdateCheck();
    }

    switch (command) {
      // ── new ──────────────────────────────────────────────────────────────
      case 'new':
      case 'n': {
        printBanner();

        // Name may or may not be provided — NewCommand handles the prompt
        const nameArg = args.find((a) => !a.startsWith('-') && a !== command);

        p.intro(chalk.bold.hex('#6C63FF')(' NemesisJS — New Project '));

        await new NewCommand().execute(nameArg, {
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
          p.log.error('Type and name are required.');
          console.log(`  ${chalk.gray('Usage:')} nemesis generate ${chalk.white('<type>')} ${chalk.white('<name>')}`);
          console.log('');
          console.log(new GenerateCommand().availableTypes());
          process.exit(1);
        }
        await new GenerateCommand().execute(type, name, {
          noSpec: hasFlag(args, '--no-spec'),
        });
        break;
      }

      // ── serve ─────────────────────────────────────────────────────────────
      case 'serve': {
        p.log.info('Starting dev server with hot reload…');
        const proc = Bun.spawn(['bun', '--hot', 'src/main.ts'], {
          stdio: ['inherit', 'inherit', 'inherit'],
        });
        await proc.exited;
        break;
      }

      // ── build ─────────────────────────────────────────────────────────────
      case 'build': {
        p.log.info('Building application…');
        const proc = Bun.spawn(
          ['bun', 'build', './src/main.ts', '--outdir', './dist', '--target', 'bun'],
          { stdio: ['inherit', 'inherit', 'inherit'] },
        );
        await proc.exited;
        break;
      }

      // ── test ──────────────────────────────────────────────────────────────
      case 'test': {
        const proc = Bun.spawn(['bun', 'test'], { stdio: ['inherit', 'inherit', 'inherit'] });
        await proc.exited;
        break;
      }

      // ── update ────────────────────────────────────────────────────────────
      case 'update': {
        p.intro(chalk.bold.hex('#6C63FF')(' NemesisJS — Update Check '));
        await new UpdateCommand().execute();
        break;
      }

      default:
        p.log.error(`Unknown command: ${chalk.white(command)}`);
        printHelp();
        process.exit(1);
    }
  }
}
