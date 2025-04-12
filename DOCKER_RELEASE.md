# Docker Image Release Guide

This guide explains how to create new releases of the Docker image using Git tags and how to find the built images.

## Creating a New Release

### 1. Ensure Your Code is Ready
```bash
# Make sure you're on the main branch and it's up to date
git checkout main
git pull origin main

# Check status to ensure everything is clean
git status
```

### 2. Create and Push a New Tag
```bash
# Create a new tag (replace X.Y.Z with your version number)
git tag vX.Y.Z

# Push the tag to GitHub
git push origin vX.Y.Z
```

Example:
```bash
git tag v1.0.0
git push origin v1.0.0
```

## How Tags Trigger Builds

1. When you push a tag starting with 'v', it automatically triggers the GitHub Action workflow defined in `.github/workflows/docker-publish.yml`
2. The workflow will:
   - Build the Docker image using the Dockerfile
   - Tag the image with multiple versions:
     * Full version (e.g., `v1.0.0`)
     * Major.Minor version (e.g., `1.0`)
     * Commit SHA
     * `latest` tag (on default branch only)
   - Push the image to GitHub Container Registry (ghcr.io)

## Finding Your Built Image

### 1. Via GitHub Interface
1. Go to your GitHub repository
2. Click on the "Packages" tab
3. Find the container image named `ghcr.io/[username]/nextblog`
4. Click on the package to see all available tags

### 2. Via Command Line
```bash
# Pull the specific version
docker pull ghcr.io/[username]/nextblog:v1.0.0

# Or pull the latest version
docker pull ghcr.io/[username]/nextblog:latest
```

### 3. Monitor Build Progress
1. Go to your GitHub repository
2. Click on the "Actions" tab
3. Look for the workflow run triggered by your tag push
4. Click on the workflow to see detailed build logs

## Using the Built Image

```bash
# Run the container (replace [username] with your GitHub username)
docker run -p 3000:3000 ghcr.io/[username]/nextblog:v1.0.0
```

## Version Tag Format

We use semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR version for incompatible API changes
- MINOR version for new features in a backwards compatible manner
- PATCH version for backwards compatible bug fixes

Example versions:
- v1.0.0 - Initial release
- v1.0.1 - Bug fixes
- v1.1.0 - New features
- v2.0.0 - Breaking changes

## Troubleshooting

If the build fails:
1. Check the Actions tab for error messages
2. Ensure GitHub Container Registry is enabled in your repository settings
3. Verify you have the correct permissions
4. Check if the Dockerfile builds locally:
   ```bash
   docker build -t nextblog:test .
   ``` 