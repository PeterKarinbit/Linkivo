import os
import re

# GTM Head Code
gtm_head = '''<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5CN28545');</script>
<!-- End Google Tag Manager -->'''

# GTM Body Code
gtm_body = '''<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5CN28545"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->'''

# Directory containing HTML files
html_dir = '/home/peter-karingithi/Videos/Linkivo/Studiova-1.0.0/html'

# Skip these files (already processed or test files)
skip_files = ['index.html']  # Already processed

for filename in os.listdir(html_dir):
    if not filename.endswith('.html') or filename in skip_files:
        continue
        
    filepath = os.path.join(html_dir, filename)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Skip if GTM is already present
        if 'GTM-5CN28545' in content:
            print(f"Skipping {filename} - GTM already present")
            continue
            
        # Add GTM to head
        if '<head>' in content:
            content = content.replace('<head>', '<head>\n' + gtm_head)
        
        # Add GTM after body tag
        if '<body' in content:
            # Handle body tag with attributes
            body_match = re.search(r'<body[^>]*>', content)
            if body_match:
                body_tag = body_match.group(0)
                content = content.replace(body_tag, body_tag + '\n' + gtm_body, 1)
        
        # Write changes back to file
        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(content)
            
        print(f"Updated {filename} with GTM code")
        
    except Exception as e:
        print(f"Error processing {filename}: {str(e)}")
