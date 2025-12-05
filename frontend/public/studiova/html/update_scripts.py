import os

def update_html_with_script():
    # Directory containing HTML files
    html_dir = '/home/peter-karingithi/Videos/Linkivo/Studiova-1.0.0/html'
    
    # Script tag to add
    script_tag = '  <script src="../assets/js/scroll-animations.js"></script>\n</body>'
    
    # Counter for updated files
    updated_count = 0
    
    # Process each HTML file in the directory
    for filename in os.listdir(html_dir):
        if filename.endswith('.html'):
            filepath = os.path.join(html_dir, filename)
            
            try:
                # Read the file
                with open(filepath, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                # Check if the file already has the script
                if 'scroll-animations.js' in content:
                    print(f'Skipping {filename} - already has script')
                    continue
                
                # Add the script before the closing body tag
                if '</body>' in content:
                    content = content.replace('</body>', script_tag)
                    updated_count += 1
                    print(f'Updated {filename}')
                    
                    # Write the updated content back to the file
                    with open(filepath, 'w', encoding='utf-8') as file:
                        file.write(content)
                else:
                    print(f'Skipping {filename} - no closing body tag found')
                    
            except Exception as e:
                print(f'Error processing {filename}: {str(e)}')
    
    print(f'\nUpdate complete. {updated_count} files were updated.')

if __name__ == '__main__':
    update_html_with_script()
