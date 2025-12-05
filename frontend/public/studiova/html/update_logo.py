import os

def update_logo_in_html():
    # Directory containing HTML files
    html_dir = '/home/peter-karingithi/Videos/Linkivo/Studiova-1.0.0/html'
    
    # Logo HTML to insert
    logo_html = '''        <div class="logo">
          <a href="index.html" class="logo-white">
            <img src="../assets/images/Linkivo.png" alt="Linkivo Logo" style="height: 40px; width: auto;">
          </a>
          <a href="index.html" class="logo-dark">
            <img src="../assets/images/Linkivo.png" alt="Linkivo Logo" style="height: 40px; width: auto;">
          </a>
        </div>'''
    
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
                
                # Find and replace the logo section
                if '<div class="logo">' in content and '</div>' in content:
                    # Find the start and end of the logo div
                    start = content.find('<div class="logo">')
                    end = content.find('</div>', start) + 6  # +6 to include </div>
                    
                    # Replace the old logo with the new one
                    new_content = content[:start] + logo_html + content[end:]
                    
                    # Write the updated content back to the file
                    with open(filepath, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    
                    updated_count += 1
                    print(f'Updated logo in {filename}')
                else:
                    print(f'No logo found in {filename}')
                    
            except Exception as e:
                print(f'Error processing {filename}: {str(e)}')
    
    print(f'\nUpdate complete. {updated_count} files were updated.')

if __name__ == '__main__':
    update_logo_in_html()
