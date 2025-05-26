# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "pyyaml",
# ]
# ///
"""
Script to add 'published' field to markdown files based on git creation date.

This script recursively finds markdown files in a directory, checks if they have
frontmatter without '', and adds a 'published' field with the git
creation date of the file.

[Written by Sonnet 4 in Cursor.]
"""

import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

import yaml


def get_git_creation_date(file_path: str) -> Optional[str]:
    """
    Get the git creation date of a file using git log.
    
    Args:
        file_path: Path to the file
        
    Returns:
        ISO format date string or None if unable to get date
    """
    try:
        # Get the first commit that added this file
        result = subprocess.run(
            ["git", "log", "--follow", "--format=%aI", "--", file_path],
            capture_output=True,
            text=True,
        )
        
        if result.returncode == 0 and result.stdout.strip():
            # Get the last line (earliest commit)
            dates = result.stdout.strip().split('\n')
            if dates:
                # Parse the ISO date and return just the date part
                git_date = dates[-1]
                parsed_date = datetime.fromisoformat(git_date.replace('Z', '+00:00'))
                return parsed_date.strftime('%Y-%m-%d')
        
        return None
    except Exception as e:
        print(f"Error getting git date for {file_path}: {e}")
        return None


def parse_frontmatter(content: str) -> Tuple[Optional[dict], str]:
    """
    Parse YAML frontmatter from markdown content.
    
    Args:
        content: The full markdown content
        
    Returns:
        Tuple of (frontmatter_dict, content_without_frontmatter)
    """
    # Check if content starts with frontmatter
    if not content.startswith('---'):
        return None, content
    
    # Find the end of frontmatter
    end_match = re.search(r'\n---\n', content)
    if not end_match:
        return None, content
    
    try:
        # Extract frontmatter
        frontmatter_text = content[4:end_match.start()]
        frontmatter = yaml.safe_load(frontmatter_text) or {}
        
        # Get content after frontmatter
        remaining_content = content[end_match.end():]
        
        return frontmatter, remaining_content
    except yaml.YAMLError as e:
        print(f"Error parsing YAML frontmatter: {e}")
        return None, content


def serialize_frontmatter(frontmatter: dict) -> str:
    """
    Serialize frontmatter dict back to YAML string.
    
    Args:
        frontmatter: Dictionary containing frontmatter data
        
    Returns:
        Formatted YAML string
    """
    return yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True).strip()


def should_process_file(frontmatter: Optional[dict]) -> bool:
    """
    Check if a file should be processed (doesn't have ).
    
    Args:
        frontmatter: Parsed frontmatter dictionary
        
    Returns:
        True if file should be processed, False otherwise
    """
    if frontmatter is None:
        return True
    
    # Check if draft field exists and is True
    draft_value = frontmatter.get('draft')
    return draft_value is not True


def process_markdown_file(file_path: Path, dry_run: bool = False) -> bool:
    """
    Process a single markdown file to add published date.
    
    Args:
        file_path: Path to the markdown file
        dry_run: If True, only print what would be done
        
    Returns:
        True if file was processed, False otherwise
    """
    try:
        # Read file content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse frontmatter
        frontmatter, body = parse_frontmatter(content)
        
        # Check if file should be processed
        if not should_process_file(frontmatter):
            print(f"Skipping {file_path} (has )")
            return False
        
        # Check if already has published field
        if frontmatter and 'published' in frontmatter:
            print(f"Skipping {file_path} (already has published field)")
            return False
        
        # Get git creation date
        git_date = get_git_creation_date(str(file_path))
        if not git_date:
            print(f"Warning: Could not get git creation date for {file_path}")
            return False
        
        # Add published field to frontmatter
        if frontmatter is None:
            frontmatter = {}
        
        frontmatter['published'] = git_date
        
        # Reconstruct file content
        new_content = f"---\n{serialize_frontmatter(frontmatter)}\n---\n{body}"
        
        if dry_run:
            print(f"Would add 'published: {git_date}' to {file_path}")
            return True
        
        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"Added 'published: {git_date}' to {file_path}")
        return True
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False


def find_markdown_files(directory: Path) -> list[Path]:
    """
    Recursively find all markdown files in a directory.
    
    Args:
        directory: Directory to search
        
    Returns:
        List of Path objects for markdown files
    """
    markdown_files = []
    for file_path in directory.rglob("*.md"):
        if file_path.is_file():
            markdown_files.append(file_path)
    return markdown_files


def main():
    """Main function to process markdown files."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Add 'published' field to markdown files based on git creation date"
    )
    parser.add_argument(
        "directory",
        help="Directory containing markdown files to process"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes"
    )
    
    args = parser.parse_args()
    
    # Validate directory
    directory = Path(args.directory)
    if not directory.exists():
        print(f"Error: Directory {directory} does not exist")
        sys.exit(1)
    
    if not directory.is_dir():
        print(f"Error: {directory} is not a directory")
        sys.exit(1)
    
    # Check if we're in a git repository
    try:
        subprocess.run(
            ["git", "rev-parse", "--git-dir"],
            capture_output=True,
            check=True,
            cwd=directory
        )
    except subprocess.CalledProcessError:
        print(f"Error: {directory} is not in a git repository")
        sys.exit(1)
    
    # Find all markdown files
    markdown_files = find_markdown_files(directory)
    if not markdown_files:
        print(f"No markdown files found in {directory}")
        return
    
    print(f"Found {len(markdown_files)} markdown files")
    
    # Process each file
    processed_count = 0
    for file_path in markdown_files:
        if process_markdown_file(file_path, args.dry_run):
            processed_count += 1
    
    action = "Would process" if args.dry_run else "Processed"
    print(f"\n{action} {processed_count} files")


if __name__ == "__main__":
    main() 
