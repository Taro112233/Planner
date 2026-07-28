// scripts/merge-seeds.js
// Merge all seed modules (not needed but for consistency)

const fs = require('fs');
const path = require('path');

console.log('✅ Seed files are already modular - no merge needed');
console.log('📁 Location: prisma/seeds/*.seed.ts');
console.log('🎯 Run: pnpm db:seed');

process.exit(0);