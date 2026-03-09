#!/usr/bin/env bun
/**
 * @nemesis-js/cli - Main CLI entry point
 *
 * Usage:
 *   nemesis new <project-name>        Create a new NemesisJS project
 *   nemesis generate <type> <name>    Generate a component (controller, service, module)
 *   nemesis serve                     Start the dev server with hot reload
 *   nemesis build                     Build for production
 *   nemesis test                      Run tests
 */

import { CLI } from '../src/cli.js';

const cli = new CLI();
cli.run(process.argv.slice(2));
