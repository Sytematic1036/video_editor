#!/bin/bash

# Video Editor - Setup Script
# ===========================

set -e

echo "=== Video Editor Setup ==="
echo ""

# Check for Python
if ! command -v python &> /dev/null; then
    echo "ERROR: Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

PYTHON_VERSION=$(python --version 2>&1 | cut -d' ' -f2)
echo "Found Python version: $PYTHON_VERSION"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
    echo "Virtual environment created."
else
    echo "Virtual environment already exists."
fi

# Activate virtual environment
echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]] || [[ -n "$WINDIR" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
if [ -f "requirements.txt" ]; then
    echo "Installing dependencies from requirements.txt..."
    pip install -r requirements.txt
else
    echo "Installing default video editing dependencies..."
    pip install moviepy opencv-python pillow numpy

    # Save requirements
    pip freeze > requirements.txt
    echo "Created requirements.txt"
fi

# Create project structure if it doesn't exist
echo "Setting up project structure..."

mkdir -p src
mkdir -p tests
mkdir -p assets/videos
mkdir -p assets/audio
mkdir -p assets/images
mkdir -p output

# Create __init__.py files
touch src/__init__.py
touch tests/__init__.py

# Create main.py if it doesn't exist
if [ ! -f "src/main.py" ]; then
    cat > src/main.py << 'EOF'
"""
Video Editor - Main Entry Point
"""

def main():
    print("Video Editor - Ready!")
    print("Start building your video editing application here.")

if __name__ == "__main__":
    main()
EOF
    echo "Created src/main.py"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << 'EOF'
# Virtual environment
venv/
env/
.env

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# IDE
.idea/
.vscode/
*.swp
*.swo

# Output files
output/
*.mp4
*.avi
*.mov
*.mkv
!assets/videos/*

# OS
.DS_Store
Thumbs.db

# Logs
*.log
EOF
    echo "Created .gitignore"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To activate the virtual environment:"
echo "  Windows: venv\\Scripts\\activate"
echo "  Linux/Mac: source venv/bin/activate"
echo ""
echo "To run the application:"
echo "  python src/main.py"
echo ""
