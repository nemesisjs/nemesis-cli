<p align="center">
  <img src="https://raw.githubusercontent.com/nemesisjs/nemesis/main/assets/nemesis-logo.png" width="150" alt="NemesisJS Logo" />
</p>

<h1 align="center">@nemesisjs/cli</h1>

<p align="center">
  The official Command Line Interface (CLI) for the NemesisJS ecosystem.
</p>

<p align="center">
  <a href="https://npmjs.com/package/@nemesisjs/cli" target="_blank"><img src="https://img.shields.io/npm/v/@nemesisjs/cli.svg" alt="NPM Version" /></a>
  <a href="https://npmjs.com/package/@nemesisjs/cli" target="_blank"><img src="https://img.shields.io/npm/l/@nemesisjs/cli.svg" alt="Package License" /></a>
  <a href="https://npmjs.com/package/@nemesisjs/cli" target="_blank"><img src="https://img.shields.io/npm/dm/@nemesisjs/cli.svg" alt="NPM Downloads" /></a>
</p>

<hr/>

It provides powerful scaffolding and code generation tools to accelerate your development workflow.

## Features

- **Scaffold New Projects**: Quickly generate the foundational structure of a NemesisJS application.
- **Generate Components**: Easily create new controllers, services, and modules using built-in templates.
- **Automated Configuration**: The CLI automatically registers newly generated components in their corresponding module files.

## Installation

Install the CLI globally using your favorite package manager:

```bash
npm install -g @nemesisjs/cli

# or via bun
bun add -g @nemesisjs/cli
```

## Usage

Once installed, you can use the `nemesis` command in your terminal.

```bash
# Display help and available commands
nemesis --help
```

### Generating Resources

You can generate specific files within an existing project using the `generate` or `g` command.

```bash
# Generate a new controller
nemesis generate controller user

# Generate a new service
nemesis generate service user

# Generate a standalone module
nemesis generate module billing
```

*(Note: The `generate` command automatically adds your generated controllers and services to the `providers` array in the respective `.module.ts` file!)*

## License

MIT
