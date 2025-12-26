# Contributing to Osai

Thank you for your interest in contributing to Osai! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before participating.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title** for the issue to identify the problem.
* **Describe the exact steps to reproduce the problem** in as many details as possible.
* **Provide specific examples** to demonstrate the steps.
* **Describe the behavior you observed** after following the steps.
* **Explain which behavior you expected** to see instead and why.
* **Include screenshots and animated GIFs** if applicable.
* **Include system information** such as OS, Node.js version, Electron version, etc.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title** for the issue.
* **Provide a step-by-step description** of the suggested enhancement.
* **Provide specific examples** to demonstrate the steps.
* **Describe the current behavior** and **explain which behavior you expected** to see instead.
* **Explain why this enhancement would be useful** to most Osai users.

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Include screenshots and animated GIFs in your pull request whenever possible
* Follow the TypeScript and code style guidelines (see below)
* Include thoughtfully-worded, well-structured tests
* Document new code based on the Documentation Styleguide
* End all files with a newline

## Development Process

### Prerequisites

* Node.js >= 16.0.0
* npm >= 8.0.0 or pnpm >= 7.0.0
* Git
* TypeScript 5.0+
* Python >= 3.8 (for OCR functionality)

### Setting Up Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/osai.git
   cd osai
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Run the development environment**
   ```bash
   # Windows
   ./run-dev.bat
   
   # Linux/macOS
   ./run-dev.sh
   
   # Or use npm command
   npm run electron:dev
   ```

### Project Structure

```
osai/
├── electron/          # Electron main process code
├── frontend/          # React frontend application
├── dist-electron/     # Compiled Electron code
└── ...
```

## Coding Standards

### TypeScript Guidelines

* **No `any` types allowed** - Use proper TypeScript types
* Follow SOLID principles
* Use meaningful variable and function names (camelCase for variables/functions, PascalCase for classes/components)
* Use kebab-case for file names
* Add JSDoc comments to all functions

### Code Style

* Follow the existing code style
* Use ESLint 9.15 for code quality checks
* Run `npm run lint` and `npm run lint:style` before submitting
* Use Prettier for code formatting (if configured)

### Component Guidelines

* Use PascalCase for component names
* Keep components small and focused
* Prefer functional components with hooks
* Use TypeScript for type safety

### API Guidelines

* All API calls must use axios, centralized in `utils/api.ts`
* Do not use `fetch` directly in components
* Handle errors appropriately

### Styling Guidelines

* Use Tailwind CSS V4 as the primary styling framework
* Follow the project's Tailwind configuration
* Prefer Tailwind utility classes over custom CSS
* When necessary, use SCSS modules for complex styles

## Commit Message Guidelines

We follow conventional commit message format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

* `feat`: A new feature
* `fix`: A bug fix
* `docs`: Documentation only changes
* `style`: Changes that do not affect the meaning of the code
* `refactor`: A code change that neither fixes a bug nor adds a feature
* `perf`: A code change that improves performance
* `test`: Adding missing tests or correcting existing tests
* `chore`: Changes to the build process or auxiliary tools

### Examples

```
feat(search): add semantic search functionality

Add vector-based semantic search to improve search accuracy.
Uses LanceDB for vector storage and similarity search.

Closes #123
```

```
fix(ocr): resolve image processing memory leak

Fix memory leak in image processor worker when processing
large batches of images.

Fixes #456
```

## Testing

* Write tests for new features and bug fixes
* Ensure all tests pass before submitting a pull request
* Maintain or improve test coverage

## Documentation

* Update the README.md if you change the installation process
* Update code comments and JSDoc for new or modified functions
* Add or update examples if you change functionality

## Internationalization (i18n)

* All user-facing text must use i18n, even for a single language
* Add translations to all language files in `frontend/public/locales/`
* Follow the existing translation structure

## Submitting Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**
   - Follow the coding standards
   - Write or update tests
   - Update documentation

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): your commit message"
   ```

4. **Run linting**
   ```bash
   npm run lint
   npm run lint:style
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Fill out the pull request template
   - Describe your changes clearly
   - Reference any related issues
   - Wait for code review

## Review Process

* All pull requests require at least one approval
* Address review comments promptly
* Be open to feedback and suggestions
* Keep discussions focused and constructive

## Questions?

If you have questions about contributing, please:

* Open an issue with the `question` label
* Contact the maintainers via the contact information in the README

Thank you for contributing to Osai! 🎉

