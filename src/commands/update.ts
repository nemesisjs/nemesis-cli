/**
 * @nemesis-js/cli - Update command
 *
 * Checks npm for the latest version of `@nemesis-js/cli` and prints
 * instructions for upgrading.
 *
 * We intentionally do NOT run `bun install` automatically — the user
 * should decide when and how to upgrade their global CLI installation.
 */

import chalk from 'chalk';
import { checkForUpdate } from '../utils/update-checker.js';

export class UpdateCommand {
  async execute(): Promise<void> {
    console.log(chalk.gray('Checking for updates…'));

    const info = await checkForUpdate({ force: true });

    if (!info) {
      console.log(chalk.yellow('Could not reach npm registry. Please check your connection.'));
      return;
    }

    if (!info.hasUpdate) {
      console.log(
        chalk.green(`✔ You are already on the latest version (${chalk.bold(info.currentVersion)})`),
      );
      return;
    }

    console.log();
    console.log(
      `  ${chalk.gray('Current version:')} ${chalk.red(info.currentVersion)}`,
    );
    console.log(
      `  ${chalk.gray('Latest version: ')} ${chalk.green(info.latestVersion)}`,
    );
    console.log();
    console.log('  Run the following command to upgrade:');
    console.log();
    console.log(
      chalk.cyan(`  bun install -g @nemesis-js/cli@${info.latestVersion}`),
    );
    console.log();
  }
}
