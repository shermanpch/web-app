import json
import os
from pathlib import Path

from regex_child import extract_child_hexagram
from regex_parent import extract_parent_hexagram


class HexagramExtractor:
    def __init__(self, input_dir=None, output_dir=None):
        """
        Initialize the HexagramExtractor.

        Args:
            input_dir: Directory containing data to process
            output_dir: Directory to save output files
        """
        # Get the directory of the current script
        self.script_dir = Path(os.path.dirname(os.path.abspath(__file__)))

        # Set input and output directories with defaults
        self.input_dir = (
            Path(input_dir) if input_dir else self.script_dir.parent / "data"
        )

        self.output_dir = Path(output_dir) if output_dir else self.script_dir / "data"
        # Create output directories
        (self.output_dir / "parent").mkdir(parents=True, exist_ok=True)
        (self.output_dir / "child").mkdir(parents=True, exist_ok=True)

        # Track null entries
        self.parent_null_entries = []
        self.child_null_entries = []

        # Store extracted data
        self.data_dict = {}

    def extract_body_txt_files(self):
        """
        Extract body.txt files from specified folder structure.

        If body.txt is at 0-0/html/body.txt -> assign to "0-0": "parent"
        If body.txt is at 0-0/0/html/body.txt -> assign to "0-0": "child": "0"
        """
        result = {}

        # Walk through all directories in the root directory
        for dir_path, _, files in os.walk(self.input_dir):
            path = Path(dir_path)

            # Check if body.txt exists in current directory
            if "body.txt" in files:
                # Get the file path parts
                parts = path.relative_to(self.input_dir).parts

                # Skip if empty parts
                if not parts:
                    continue

                # Pattern 2: 0-0/0/html/body.txt -> "child": "0"
                if len(parts) >= 3 and parts[-1] == "html" and parts[-2].isdigit():
                    main_dir = parts[0]
                    child_id = parts[-2]

                    if main_dir not in result:
                        result[main_dir] = {}
                    if "child" not in result[main_dir]:
                        result[main_dir]["child"] = {}

                    with open(Path(dir_path) / "body.txt", "r") as f:
                        content = f.read()
                    result[main_dir]["child"][child_id] = content

                # Pattern 1: 0-0/html/body.txt -> "parent"
                elif len(parts) == 2 and parts[-1] == "html":
                    main_dir = parts[0]
                    if main_dir not in result:
                        result[main_dir] = {}

                    with open(Path(dir_path) / "body.txt", "r") as f:
                        content = f.read()
                    result[main_dir]["parent"] = content

        self.data_dict = result
        return result

    def check_for_none_or_empty(self, data, parent_key=""):
        """Recursively check for None values or empty dictionaries in nested structures"""
        if isinstance(data, dict):
            if not data:  # Check if dictionary is empty
                return True, f"{parent_key} (empty dict)"
            for key, value in data.items():
                current_path = f"{parent_key}.{key}" if parent_key else key
                if value is None:
                    return True, current_path
                elif isinstance(value, (dict, list)):
                    found, path = self.check_for_none_or_empty(value, current_path)
                    if found:
                        return True, path
        elif isinstance(data, list):
            if not data:  # Check if list is empty
                return True, f"{parent_key} (empty list)"
            for i, item in enumerate(data):
                current_path = f"{parent_key}[{i}]"
                found, path = self.check_for_none_or_empty(item, current_path)
                if found:
                    return True, path
        return False, ""

    def process_parent_hexagrams(self):
        """Process parent hexagrams and save them to JSON files"""
        for parent_coordinate, hexagram_data in self.data_dict.items():
            if "parent" in hexagram_data:
                parent_text = hexagram_data["parent"]
                # Extract parent hexagram passing the text content
                parent_output = extract_parent_hexagram(parent_text)

                # Check for null values
                found, path = self.check_for_none_or_empty(parent_output)
                if found:
                    self.parent_null_entries.append((parent_coordinate, path))
                    print(
                        f"Found null value in parent {parent_coordinate} at path: {path}"
                    )

                # Format and save parent data
                formatted_coordinate = parent_coordinate.replace("/", ":")
                to_save_json = {
                    "parent_coordinate": formatted_coordinate,
                    "data": parent_output,
                }
                output_file = (
                    self.output_dir / "parent" / f"{formatted_coordinate}.json"
                )
                with open(output_file, "w") as f:
                    json.dump(to_save_json, f, indent=4)

    def process_child_hexagrams(self):
        """Process child hexagrams and save them to JSON files"""
        for parent_coordinate, hexagram_data in self.data_dict.items():
            if "child" in hexagram_data:
                for child_coordinate, child_data in hexagram_data["child"].items():
                    # Extract child hexagram passing the text content
                    child_output = extract_child_hexagram(child_data)

                    # Check for null values
                    found, path = self.check_for_none_or_empty(child_output)
                    if found:
                        self.child_null_entries.append(
                            (f"{parent_coordinate}/{child_coordinate}", path)
                        )
                        print(
                            f"Found null value in child {parent_coordinate}/{child_coordinate} at path: {path}"
                        )

                    # Format and save child data
                    formatted_parent = parent_coordinate.replace("/", ":")
                    formatted_child = child_coordinate.replace("/", ":")
                    to_save_json = {
                        "parent_coordinate": formatted_parent,
                        "child_coordinate": formatted_child,
                        "data": child_output,
                    }
                    output_file = (
                        self.output_dir
                        / "child"
                        / f"{formatted_parent}_{formatted_child}.json"
                    )
                    with open(output_file, "w") as f:
                        json.dump(to_save_json, f, indent=4)

    def process_all(self):
        """Extract data and process both parent and child hexagrams"""
        self.extract_body_txt_files()
        self.process_parent_hexagrams()
        self.process_child_hexagrams()

        # Print summary
        print(f"Total parent entries with null values: {len(self.parent_null_entries)}")
        print(f"Total child entries with null values: {len(self.child_null_entries)}")


if __name__ == "__main__":
    # Create the extractor with default or custom paths
    # Example with custom paths:
    # extractor = HexagramExtractor(input_dir="/path/to/input", output_dir="/path/to/output")

    # Or use default paths (relative to script location):
    extractor = HexagramExtractor()

    # Run the extraction and processing
    extractor.process_all()
