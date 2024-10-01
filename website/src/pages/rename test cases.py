import os

# Define the base directory where the past contest folders are stored
base_directory = r'C:\Users\willp\Documents\GitHub\CCCSolutions\website\public\past_contests'

# Define the year range to target
year_range = range(2017, 2025)

# Iterate over the specified year directories
for year in year_range:
    year_directory = os.path.join(base_directory, str(year))

    # Check if the directory exists before proceeding
    if os.path.exists(year_directory):
        # Iterate over all the subdirectories (problem folders) in the year directory
        for problem_folder in os.listdir(year_directory):
            problem_directory = os.path.join(year_directory, problem_folder)

            # If it's a directory, check for .py files
            if os.path.isdir(problem_directory):
                for filename in os.listdir(problem_directory):
                    if filename.endswith('.py'):
                        # Full path of the current .py file
                        old_file_path = os.path.join(problem_directory, filename)

                        # Define the default new file path (renaming to solution.txt)
                        new_file_path = os.path.join(problem_directory, 'solution.txt')

                        # If solution.txt already exists, rename to solution2.txt
                        if os.path.exists(new_file_path):
                            new_file_path = os.path.join(problem_directory, 'solution2.txt')

                        # Rename the .py file to the appropriate .txt file
                        os.rename(old_file_path, new_file_path)

print("Files from 2017 to 2024 have been renamed to solution.txt or solution2.txt if needed.")
