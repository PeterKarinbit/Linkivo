import os

def remove_duplicate_logos():
    # Directory containing HTML files
    html_dir = '/home/peter-karingithi/Videos/Linkivo/Studiova-1.0.0/html'
    
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
                
                # Check if the file has the duplicate logo structure
                if 'logo-white' in content and 'logo-dark' in content:
                    # Replace with single logo version
                    new_logo = '''        <div class="logo d-flex align-items-center gap-2">
          <a href="index.html" class="d-flex align-items-center gap-2 text-decoration-none">
            <img src="../assets/images/Linkivo.png" alt="Linkivo Logo" style="height: 50px; width: auto;">
            <h3 class="mb-0 text-white fw-bold d-none d-md-block">Linkivo</h3>
          </a>
        </div>'''
                    
                    # Find and replace the logo section
                    if '<div class="logo">' in content and '</div>' in content:
                        start = content.find('<div class="logo"')
                        end = content.find('</div>', start) + 6
                        content = content[:start] + new_logo + content[end:]
                        
                        # Write the updated content back to the file
                        with open(filepath, 'w', encoding='utf-8') as file:
                            file.write(content)
                        
                        updated_count += 1
                        print(f'Updated {filename}')
                
            except Exception as e:
                print(f'Error processing {filename}: {str(e)}')
    
    print(f'\nUpdate complete. {updated_count} files were updated.')

if __name__ == '__main__':
    remove_duplicate_logos()
