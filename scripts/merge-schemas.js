// scripts/merge-schemas.js - NextJS Starter 2026 Schema Merger
//
// Merges all files in prisma/schemas/ into prisma/schema.prisma.
// Files listed in SCHEMA_ORDER are processed first (dependency order).
// Any remaining *.prisma files are appended automatically.
//
// Run via: pnpm schema:merge

const fs = require('fs');
const path = require('path');

const SCHEMAS_DIR = path.join(__dirname, '../prisma/schemas');
const OUTPUT_FILE = path.join(__dirname, '../prisma/schema.prisma');

const baseSchema = `// This file is auto-generated. Do not edit manually.
// Edit files in prisma/schemas/ directory instead.
// Last generated: ${new Date().toISOString()}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

`;

// Dependency-ordered schema files.
// Add new *.prisma files here when they depend on types defined in earlier files.
// Files NOT listed here are appended automatically at the end.
const SCHEMA_ORDER = [
  'base.prisma',        // Shared enums + SelectOption model (no dependencies)
  'better-auth.prisma', // User, Session, Account, Verification + UserRole enum
  // Add your domain schemas below as your app grows:
  // 'project.prisma',
  // 'audit.prisma',
];

function mergeSchemas() {
  console.log('🔄 Merging NextJS Starter schemas...');
  
  if (!fs.existsSync(SCHEMAS_DIR)) {
    console.error(`❌ Schemas directory not found: ${SCHEMAS_DIR}`);
    process.exit(1);
  }
  
  let mergedContent = baseSchema;
  let processedCount = 0;
  
  // Process schemas in specific order
  SCHEMA_ORDER.forEach(fileName => {
    const filePath = path.join(SCHEMAS_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Schema file not found: ${fileName} (skipping)`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Clean content - remove generator and datasource blocks
    content = content
      .replace(/generator\s+\w+\s*{[^}]*}/gs, '')
      .replace(/datasource\s+\w+\s*{[^}]*}/gs, '')
      .trim();
    
    if (!content) {
      console.log(`⚠️  Empty schema file: ${fileName} (skipping)`);
      return;
    }
    
    // Add section header with visual separation
    const sectionName = fileName.replace('.prisma', '').toUpperCase();
    mergedContent += `\n// ==========================================\n`;
    mergedContent += `// ${sectionName} SCHEMA\n`;
    mergedContent += `// ==========================================\n\n`;
    mergedContent += content + '\n';
    
    processedCount++;
    console.log(`✅ Merged ${fileName}`);
  });
  
  // Check for any additional schema files not in the order
  const allFiles = fs.readdirSync(SCHEMAS_DIR)
    .filter(file => file.endsWith('.prisma') && !SCHEMA_ORDER.includes(file));
  
  if (allFiles.length > 0) {
    console.log(`\n📋 Processing additional schema files:`);
    allFiles.forEach(fileName => {
      const filePath = path.join(SCHEMAS_DIR, fileName);
      let content = fs.readFileSync(filePath, 'utf8');
      
      content = content
        .replace(/generator\s+\w+\s*{[^}]*}/gs, '')
        .replace(/datasource\s+\w+\s*{[^}]*}/gs, '')
        .trim();
      
      if (content) {
        const sectionName = fileName.replace('.prisma', '').toUpperCase();
        mergedContent += `\n// ==========================================\n`;
        mergedContent += `// ${sectionName} SCHEMA\n`;
        mergedContent += `// ==========================================\n\n`;
        mergedContent += content + '\n';
        processedCount++;
        console.log(`✅ Merged ${fileName} (additional)`);
      }
    });
  }
  
  // Write merged schema
  try {
    fs.writeFileSync(OUTPUT_FILE, mergedContent);
    console.log(`\n🎉 Successfully merged ${processedCount} schema files into ${OUTPUT_FILE}`);
    console.log(`📊 Schema Statistics:`);
    console.log(`   - Total lines: ${mergedContent.split('\n').length}`);
    console.log(`   - File size: ${(mergedContent.length / 1024).toFixed(2)} KB`);
    
    return mergedContent;
  } catch (error) {
    console.error('❌ Failed to write merged schema:', error.message);
    process.exit(1);
  }
}

// Validation function to check schema syntax
function validateSchema() {
  console.log('\n🔍 Validating merged schema...');
  
  try {
    const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
    
    // Basic validation checks
    const modelCount = (content.match(/^model\s+\w+/gm) || []).length;
    const enumCount = (content.match(/^enum\s+\w+/gm) || []).length;
    
    console.log(`   - Models found: ${modelCount}`);
    console.log(`   - Enums found: ${enumCount}`);
    
    // Check for common issues
    const issues = [];
    
    if (!content.includes('generator client')) {
      issues.push('Missing generator client');
    }
    
    if (!content.includes('datasource db')) {
      issues.push('Missing datasource db');
    }
    
    if (issues.length > 0) {
      console.log(`⚠️  Potential issues:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log(`✅ Schema validation passed`);
    }
    
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--check-only')) {
    validateSchema();
  } else {
    mergeSchemas();
    validateSchema();
  }
}

module.exports = { mergeSchemas, validateSchema };