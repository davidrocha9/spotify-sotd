const fs = require('fs');
const path = require('path');

// Define directories to exclude (e.g., node_modules, .git, etc.)
const excludeDirs = ['node_modules', '.git', '.next', 'out', 'build', 'dist'];

// Define file extensions to scan
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Regex to match console.log statements
const consoleLogRegex = /console\.(log|error|warn|info|debug)\s*\([^)]*\);?/g;

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = content.replace(consoleLogRegex, '');
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Removed console log(s) from: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}: ${error.message}`);
  }
}

function traverseDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        traverseDirectory(fullPath);
      }
    } else if (extensions.includes(path.extname(file))) {
      processFile(fullPath);
    }
  }
}

// Start from the project root directory
traverseDirectory(path.resolve('./'));
console.log('Finished removing console logs from the codebase.'); 