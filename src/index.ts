/**
 * @nemesis-js/cli
 *
 * NemesisJS CLI tool for project scaffolding and code generation.
 */

export { CLI } from './cli.js';
export { NewCommand } from './commands/new.js';
export { GenerateCommand } from './commands/generate.js';
export { UpdateCommand } from './commands/update.js';
export { toPascalCase, toKebabCase, toCamelCase } from './utils/naming.js';
export { checkForUpdate } from './utils/update-checker.js';
export type { UpdateInfo } from './utils/update-checker.js';
