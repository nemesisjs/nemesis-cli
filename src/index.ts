/**
 * @nemesis-js/cli
 *
 * NemesisJS CLI tool for project scaffolding and code generation.
 */

export { CLI } from './cli.js';
export { NewCommand } from './commands/new.js';
export { GenerateCommand } from './commands/generate.js';
export { toPascalCase, toKebabCase, toCamelCase } from './utils/naming.js';
