#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

/**
 * Schema validation script
 * Validates all JSON schemas and OpenAPI contract
 */

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

interface ValidationResult {
  file: string;
  valid: boolean;
  errors?: string[];
}

function validateJsonSchema(filePath: string): ValidationResult {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const schema = JSON.parse(content);
    
    // Validate that it's a valid JSON Schema
    const metaSchema = ajv.getSchema('http://json-schema.org/draft-07/schema#');
    if (!metaSchema) {
      // Add draft-07 meta schema if not present
      ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-07.json'));
    }
    
    const valid = ajv.validateSchema(schema);
    
    return {
      file: filePath,
      valid: valid === true,
      errors: valid === true ? undefined : ajv.errors?.map(err => `${err.instancePath}: ${err.message}`) || ['Unknown validation error'],
    };
  } catch (error) {
    return {
      file: filePath,
      valid: false,
      errors: [`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

function validateOpenApiSpec(filePath: string): ValidationResult {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic YAML/OpenAPI validation
    // In a real implementation, you'd use a proper OpenAPI validator
    if (!content.includes('openapi:') && !content.includes('swagger:')) {
      return {
        file: filePath,
        valid: false,
        errors: ['File does not appear to be an OpenAPI specification'],
      };
    }
    
    if (!content.includes('paths:')) {
      return {
        file: filePath,
        valid: false,
        errors: ['OpenAPI spec must contain paths'],
      };
    }
    
    return {
      file: filePath,
      valid: true,
    };
  } catch (error) {
    return {
      file: filePath,
      valid: false,
      errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

function main() {
  console.log('🔍 Validating schemas and contracts...\n');
  
  const results: ValidationResult[] = [];
  
  // Validate JSON schemas
  const schemasDir = path.join(__dirname, '../schemas');
  if (fs.existsSync(schemasDir)) {
    const schemaFiles = fs.readdirSync(schemasDir).filter(file => file.endsWith('.json'));
    
    for (const file of schemaFiles) {
      const filePath = path.join(schemasDir, file);
      results.push(validateJsonSchema(filePath));
    }
  }
  
  // Validate OpenAPI contract
  const contractPath = path.join(__dirname, '../contracts/openapi.yaml');
  if (fs.existsSync(contractPath)) {
    results.push(validateOpenApiSpec(contractPath));
  }
  
  // Report results
  let hasErrors = false;
  
  for (const result of results) {
    const status = result.valid ? '✅' : '❌';
    const relativePath = path.relative(process.cwd(), result.file);
    
    console.log(`${status} ${relativePath}`);
    
    if (!result.valid) {
      hasErrors = true;
      if (result.errors) {
        for (const error of result.errors) {
          console.log(`   └─ ${error}`);
        }
      }
      console.log();
    }
  }
  
  if (hasErrors) {
    console.log('\n❌ Schema validation failed');
    process.exit(1);
  } else {
    console.log('\n✅ All schemas and contracts are valid');
  }
}

if (require.main === module) {
  main();
}
