// Wrapper to ensure correct cwd for Tailwind JIT scanning
process.chdir(__dirname);
process.argv = ['node', 'next', 'dev', '-p', '3001'];
require('./node_modules/next/dist/bin/next');
