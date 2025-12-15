# Contributing to BetterMITM

Thank you for your interest in contributing to BetterMITM! This document provides guidelines and instructions for contributing to the project.

## 🤝 How to Contribute

We welcome contributions in many forms:

- 🐛 **Bug Reports**: Help us identify and fix issues
- ✨ **Feature Requests**: Suggest new features or improvements
- 💻 **Code Contributions**: Submit pull requests with code changes
- 📝 **Documentation**: Improve documentation and examples
- 🎨 **UI/UX**: Enhance the user interface and user experience
- 🧪 **Testing**: Add tests or improve test coverage
- 🌍 **Translation**: Help translate BetterMITM to other languages

## 🚀 Getting Started

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BetterMint/BetterMITM.git
   cd BetterMITM
   ```

2. **Install dependencies**:
   
   **Windows:**
   ```cmd
   run.bat
   ```
   
   **Linux/MacOS:**
   ```bash
   chmod +x run.sh
   ./run.sh
   ```

   This will install `uv` (if needed), Python dependencies, and build the web frontend.

3. **Set up development environment**:
   
   ```bash
   # Activate the virtual environment
   # Windows:
   .venv\Scripts\activate
   
   # Linux/MacOS:
source .venv/bin/activate
   ```

4. **Verify installation**:
   ```bash
   uv run mitmweb --version
```

### Running Tests

BetterMITM uses `tox` for testing. To run all tests:

```bash
uv run tox
```

To run tests for a specific environment:

```bash
uv run tox -e py312
```

To run individual test files:

```bash
cd test/BetterMITM/addons
uv run pytest --cov BetterMITM.addons.advanced_interceptor --cov-report term-missing test_advanced_interceptor.py
```

### Code Style

We enforce code style consistency. Before submitting a PR, run:

```bash
uv run tox -e lint
```

This will check:
- Python code style (ruff, mypy)
- TypeScript/JavaScript code style (ESLint, Prettier)

If linting errors are detected, the automated checks will fail and block merging.

## 📝 Contribution Guidelines

### Bug Reports

When reporting a bug, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs **actual behavior**
4. **Environment details**:
   - Operating system
   - Python version
   - Node.js version
   - BetterMITM version
5. **Screenshots** (if applicable)
6. **Error messages** or logs

### Feature Requests

When requesting a feature:

1. **Clear description** of the feature
2. **Use case** - why is this feature needed?
3. **Proposed implementation** (if you have ideas)
4. **Examples** of how it would be used

Check [FEATURE_IDEAS.md](FEATURE_IDEAS.md) to see if your idea is already planned.

### Pull Requests

1. **Fork the repository** and create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**:
   - Write clear, readable code
   - Add comments where necessary
   - Follow existing code style
   - Add tests for new features
   - Update documentation

3. **Test your changes**:
   ```bash
   uv run tox
   uv run tox -e lint
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```
   
   Use clear, descriptive commit messages. Follow the format:
   - `feat: Add new feature`
   - `fix: Fix bug description`
   - `docs: Update documentation`
   - `style: Code style changes`
   - `refactor: Code refactoring`
   - `test: Add tests`

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**:
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure all tests pass

### Code Style Guidelines

#### Python

- Follow PEP 8 style guide
- Use type hints where appropriate
- Keep functions focused and small
- Add docstrings for public functions/classes
- Remove all comments (project requirement)

#### TypeScript/JavaScript

- Follow ESLint and Prettier configurations
- Use TypeScript for type safety
- Follow React best practices
- Remove all comments (project requirement)

#### General

- Write clear, self-documenting code
- Add tests for new functionality
- Update documentation for user-facing changes
- Keep commits focused and atomic

## 🎯 Areas for Contribution

### High Priority

- 🐛 Bug fixes
- ✨ Advanced Interceptor improvements
- 🎨 UI/UX enhancements
- 📝 Documentation improvements
- 🧪 Test coverage

### Medium Priority

- 🔧 Performance optimizations
- 🌐 Internationalization
- 📊 Analytics features
- 🔐 Security enhancements

### Feature Development

If you want to work on a larger feature:

1. Check [FEATURE_IDEAS.md](FEATURE_IDEAS.md) for planned features
2. Open an issue to discuss your approach
3. Get feedback before starting implementation
4. Create a draft PR for early feedback

## 🧪 Testing

### Writing Tests

- Add tests for new features
- Ensure existing tests still pass
- Aim for good test coverage
- Test edge cases

### Test Structure

- Python tests: `test/BetterMITM/`
- Frontend tests: `web/src/js/__tests__/`
- Integration tests: `test/integration/`

## 📚 Documentation

### Updating Documentation

- Update `docs.md` for user-facing changes
- Update `README.md` for major features
- Add code comments (though comments are removed in final code)
- Update inline help text in the UI

### Documentation Style

- Use clear, concise language
- Include examples where helpful
- Keep formatting consistent
- Link to related sections

## 🐛 Reporting Security Issues

**Do not** open public issues for security vulnerabilities. Instead:

1. Email security concerns to the maintainers
2. Wait for a response before disclosing publicly
3. Follow responsible disclosure practices

## 💬 Getting Help

- **Discord**: Join our [Discord server](https://discord.gg/bettermint-development-1098267851732815932) for real-time help
- **GitHub Discussions**: Use GitHub Discussions for questions
- **Issues**: Open an issue for bugs or feature requests

## ✅ Checklist Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass (`uv run tox`)
- [ ] Linting passes (`uv run tox -e lint`)
- [ ] Documentation updated (if needed)
- [ ] Commit messages are clear
- [ ] PR description is complete
- [ ] No merge conflicts

## 🎉 Recognition

Contributors will be:
- Listed in the project's contributors
- Credited in release notes
- Appreciated by the community! 🙏

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help maintain a positive community

Thank you for contributing to BetterMITM! 🚀
