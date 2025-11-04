"""
Pytest configuration and fixtures.

This file is automatically loaded by pytest and sets up the test environment.
"""

import os
from pathlib import Path
from dotenv import load_dotenv


def pytest_configure(config):
    """Load environment variables before running tests."""
    # Load from .env file in the retrieval-agent directory
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
    
    # Also try to load from parent .env.local (for Next.js integration)
    parent_env = Path(__file__).parent.parent / ".env.local"
    if parent_env.exists():
        load_dotenv(parent_env)

