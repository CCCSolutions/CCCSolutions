import os
import shutil
import re

# Source and destination root directories
source_root = r"C:\Users\willp\Documents\GitHub\mmhs-website\frontend-react\mmhs-website\public\past_contests\test data"
dest_root = r"C:\Users\willp\Documents\GitHub\mmhs-website\frontend-react\mmhs-website\public\past_contests"


def organize_test_data():
    # Iterate through years from 2004 to 2015
    for year in range(2004, 2016):
        year_str = str(year)
        source_year_dir = os.path.join(source_root, year_str)

        # Check if the year directory exists in the source
        if not os.path.exists(source_year_dir):
            print(f"Source directory for year {year_str} not found. Skipping.")
            continue

        # Iterate through possible problem numbers (j1, j2, j3, j4, j5, s1, s2, s3, s4, s5)
        for problem in ['j1', 'j2', 'j3', 'j4', 'j5', 's1', 's2', 's3', 's4', 's5']:
            # Create the destination directory for this problem
            dest_dir = os.path.join(dest_root, year_str, problem, 'test_data')
            os.makedirs(dest_dir, exist_ok=True)

            # Regular expression to match files for this problem
            file_pattern = re.compile(f"{problem}\\.\\d+\\.(data|in|out)$", re.IGNORECASE)

            # Iterate through all files in the source year directory
            for filename in os.listdir(source_year_dir):
                if file_pattern.match(filename):
                    source_file = os.path.join(source_year_dir, filename)
                    dest_file = os.path.join(dest_dir, filename)

                    # Copy the file to the new location
                    shutil.copy2(source_file, dest_file)
                    print(f"Copied {filename} to {dest_file}")


if __name__ == "__main__":
    organize_test_data()
    print("Test data organization completed.")