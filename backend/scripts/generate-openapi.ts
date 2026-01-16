#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

// Import the main app
import app from '../src/index';

async function generateOpenAPI() {
  try {
    console.log('🔄 Generating OpenAPI specification...');

    // Get the OpenAPI document from the app
    const openapiDoc = app.getOpenAPIDocument({
      openapi: '3.0.3',
      info: {
        version: '1.0.0',
        title: 'NobodyClimb API',
        description: 'NobodyClimb 攀岩社群 API',
      },
      servers: [
        {
          url: 'https://api.nobodyclimb.cc',
          description: '生產環境'
        },
        {
          url: 'http://localhost:8787',
          description: '開發環境'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    });

    // Convert to YAML
    const yamlContent = yaml.stringify(openapiDoc);

    // Write to file
    const outputPath = path.join(__dirname, '..', 'openapi.yaml');
    fs.writeFileSync(outputPath, yamlContent, 'utf8');

    console.log(`✅ OpenAPI YAML generated successfully at: ${outputPath}`);
    console.log(`📊 Total paths: ${Object.keys(openapiDoc.paths || {}).length}`);
    console.log(`🏷️  Total tags: ${(openapiDoc.tags || []).length}`);

  } catch (error) {
    console.error('❌ Error generating OpenAPI YAML:', error);
    process.exit(1);
  }
}

// Run the generator
generateOpenAPI();