/**
 * @nemesis-js/cli - Update command
 *
 * Checks npm for the latest @nemesis-js/cli version and prints upgrade
 * instructions. Never runs package manager commands automatically.
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';
import { checkForUpdate } from '../utils/update-checker.js';

export class UpdateCommand {
  async execute(): Promise<void> {
    const s = p.spinner();
    s.start('Checking for updates…');

    const info = await checkForUpdate({ force: true });

    if (!info) {
      s.stop(chalk.yellow('Could not reach npm registry.'));
      p.log.warn('Please check your internet connection and try again.');
      return;
    }

    if (!info.hasUpdate) {
      s.stop(chalk.green(`You are on the latest version (${chalk.bold(info.currentVersion)})`));
      return;
    }

    s.stop('Update available!');
    console.log('');
    console.log(
      `  ${chalk.gray('Current:')} ${chalk.red(info.currentVersion)}  ` +
      `${chalk.gray('→')}  ${chalk.green.bold(info.latestVersion)}`,
    );
    console.log('');
    p.log.info('Run the following command to upgrade:');
    console.log('');
    console.log(`  ${chalk.cyan(`bun add -g @nemesis-js/cli@${info.latestVersion}`)}`);
    console.log('');
  }
}
