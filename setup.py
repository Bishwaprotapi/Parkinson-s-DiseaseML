import subprocess
import sys
import os

def install_requirements():
    print("Installing requirements...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

def create_venv():
    print("Creating virtual environment...")
    subprocess.check_call([sys.executable, "-m", "venv", ".venv"])

def main():
    # Create virtual environment
    create_venv()
    
    # Install requirements
    install_requirements()
    
    print("\nSetup completed successfully!")
    print("\nTo run the notebook:")
    print("1. Activate the virtual environment:")
    print("   - Windows: .venv\\Scripts\\activate")
    print("2. Start Jupyter Notebook:")
    print("   jupyter notebook")
    print("3. Open parkinson_disease_analysis.ipynb")

if __name__ == "__main__":
    main() 