#!/usr/bin/env node

/**
 * Upload gallery images to NobodyClimb via API
 *
 * Usage:
 *   1. Login to get an access token:
 *      curl -X POST https://api.nobodyclimb.cc/api/v1/auth/login \
 *        -H "Content-Type: application/json" \
 *        -d '{"email":"vincentxu@gmail.com","password":"YOUR_PASSWORD"}'
 *
 *   2. Run this script with the token:
 *      ACCESS_TOKEN=your_token node scripts/upload-gallery-images-api.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const API_BASE = process.env.API_BASE || 'https://api.nobodyclimb.cc/api/v1';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'gallery');

if (!ACCESS_TOKEN) {
    console.error('Error: ACCESS_TOKEN environment variable is required');
    console.error('');
    console.error('Usage: ACCESS_TOKEN=your_token node scripts/upload-gallery-images-api.js');
    console.error('');
    console.error('To get a token, login via API:');
    console.error('  curl -X POST https://api.nobodyclimb.cc/api/v1/auth/login \\');
    console.error('    -H "Content-Type: application/json" \\');
    console.error('    -d \'{"email":"vincentxu@gmail.com","password":"YOUR_PASSWORD"}\'');
    process.exit(1);
}

async function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;

        const req = protocol.request(url, {
            method: options.method || 'GET',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                ...options.headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

async function uploadImage(filePath) {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);

    const formData = Buffer.concat([
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from(`Content-Disposition: form-data; name="image"; filename="${fileName}"\r\n`),
        Buffer.from(`Content-Type: image/jpeg\r\n\r\n`),
        fileContent,
        Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    return new Promise((resolve, reject) => {
        const urlObj = new URL(`${API_BASE}/galleries/upload`);
        const protocol = urlObj.protocol === 'https:' ? https : http;

        const req = protocol.request(urlObj, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': formData.length
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        req.write(formData);
        req.end();
    });
}

async function createPhotoRecord(imageUrl, caption) {
    return makeRequest(`${API_BASE}/galleries/photos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image_url: imageUrl,
            caption: caption
        })
    });
}

async function main() {
    console.log('Uploading gallery images via API...');
    console.log(`API Base: ${API_BASE}`);
    console.log(`Images Directory: ${IMAGES_DIR}`);
    console.log('');

    // Get list of images
    const files = fs.readdirSync(IMAGES_DIR)
        .filter(f => f.startsWith('gallery-') && f.endsWith('.jpg'))
        .sort();

    console.log(`Found ${files.length} images to upload`);
    console.log('');

    let successCount = 0;

    for (const file of files) {
        const filePath = path.join(IMAGES_DIR, file);
        console.log(`Uploading: ${file}...`);

        try {
            // Step 1: Upload image to R2
            const uploadResult = await uploadImage(filePath);

            if (uploadResult.status !== 200 || !uploadResult.data.success) {
                console.error(`  Failed to upload image: ${JSON.stringify(uploadResult.data)}`);
                continue;
            }

            const imageUrl = uploadResult.data.data.url;
            console.log(`  Uploaded to: ${imageUrl}`);

            // Step 2: Create photo record
            const photoResult = await createPhotoRecord(imageUrl, file);

            if (photoResult.status !== 201 || !photoResult.data.success) {
                console.error(`  Failed to create record: ${JSON.stringify(photoResult.data)}`);
                continue;
            }

            console.log(`  Created photo record: ${photoResult.data.data.id}`);
            successCount++;
        } catch (error) {
            console.error(`  Error: ${error.message}`);
        }

        console.log('');
    }

    console.log(`Upload complete! ${successCount}/${files.length} images uploaded successfully.`);
}

main().catch(console.error);
