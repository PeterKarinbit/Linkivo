import os

def update_html_files():
    # Directory containing HTML files
    html_dir = '/home/peter-karingithi/Videos/Linkivo/Studiova-1.0.0/html'
    
    # String to find and the line to insert after it
    find_str = '<link rel="stylesheet" href="../assets/css/styles.css" />'
    insert_line = '  <link rel="stylesheet" href="../assets/css/custom-fonts.css" />'
    
    # Counter for updated files
    updated_count = 0
    
    # Process each HTML file in the directory
    for filename in os.listdir(html_dir):
        if filename.endswith('.html'):
            filepath = os.path.join(html_dir, filename)
            
            try:
                # Read the file
                with open(filepath, 'r', encoding='utf-8') as file:
                    lines = file.readlines()
                
                # Check if the file already has the custom fonts CSS
                if any('custom-fonts.css' in line for line in lines):
                    print(f'Skipping {filename} - already updated')
                    continue
                
                # Find the line to insert after
                for i, line in enumerate(lines):
                    if find_str in line and not any('custom-fonts.css' in l for l in lines[i+1:i+3]):
                        # Insert the custom fonts CSS line
                        lines.insert(i + 1, insert_line + '\n')
                        updated_count += 1
                        print(f'Updated {filename}')
                        break
                
                # Write the updated content back to the file
                with open(filepath, 'w', encoding='utf-8') as file:
                    file.writelines(lines)
                    
            except Exception as e:
                print(f'Error processing {filename}: {str(e)}')
    
    print(f'\nUpdate complete. {updated_count} files were updated.')

if __name__ == '__main__':
    update_html_files()
