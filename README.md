# @nemesisjs/cli

The official Command Line Interface (CLI) for the NemesisJS ecosystem. It provides powerful scaffolding and code generation tools to accelerate your development workflow.

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
