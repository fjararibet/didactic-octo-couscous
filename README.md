# didactic-octo-couscous

## Development Setup

### Pre-commit Hooks

This project uses [pre-commit](https://pre-commit.com/)

To install pre-commit:

1.  Ensure you have `pipx` installed.
2.  Install `pre-commit` using `pipx`:
    ```bash
    pipx install pre-commit
    ```
3.  Install the git hooks for this repository:
    ```bash
    pre-commit install
    ```
Now, `pre-commit` will automatically run checks before each commit.
