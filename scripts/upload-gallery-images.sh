#!/bin/bash

# Upload gallery images to R2 and create database records
# Usage: CLOUDFLARE_API_TOKEN=your_token USER_ID=user_id ./scripts/upload-gallery-images.sh [preview|production]
#
# Required environment variables:
#   CLOUDFLARE_API_TOKEN - Cloudflare API token with R2 and D1 permissions
#   USER_ID - The user ID to associate with the uploaded images
#
# Example:
#   CLOUDFLARE_API_TOKEN=xxxx USER_ID=abc123 ./scripts/upload-gallery-images.sh production

set -e

# Get script directory for portable paths
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
BACKEND_DIR="${SCRIPT_DIR}/../backend"
IMAGES_DIR="${SCRIPT_DIR}/../public/images/gallery"

# Check for required environment variables
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "Error: CLOUDFLARE_API_TOKEN environment variable is required"
    echo ""
    echo "Usage: CLOUDFLARE_API_TOKEN=your_token USER_ID=user_id ./scripts/upload-gallery-images.sh [preview|production]"
    echo ""
    echo "Get a token from: https://dash.cloudflare.com/profile/api-tokens"
    echo "Required permissions: Account > D1 > Edit, Account > R2 > Edit"
    exit 1
fi

USER_ID=${USER_ID:?Error: USER_ID environment variable is required.}

ENV=${1:-production}
GALLERY_TITLE="我的照片"
GALLERY_DESC="個人攝影集"

if [ "$ENV" = "production" ]; then
    R2_BUCKET="nobodyclimb-storage"
    R2_PUBLIC_URL="https://storage.nobodyclimb.cc"
    DB_NAME="nobodyclimb-db"
else
    R2_BUCKET="nobodyclimb-storage-preview"
    R2_PUBLIC_URL="https://storage-preview.nobodyclimb.cc"
    DB_NAME="nobodyclimb-db-preview"
fi

echo "Uploading gallery images to $ENV environment..."
echo "R2 Bucket: $R2_BUCKET"
echo "Database: $DB_NAME"
echo "User ID: $USER_ID"
echo "Images Directory: $IMAGES_DIR"
echo ""

# Generate unique IDs using openssl for portability
generate_id() {
    openssl rand -hex 16
}

# Run wrangler from backend directory
run_wrangler() {
    (cd "$BACKEND_DIR" && pnpm exec wrangler "$@")
}

# Check if user already has a gallery with this title
echo "Checking for existing gallery..."
EXISTING_GALLERY=$(run_wrangler d1 execute $DB_NAME --env $ENV --remote --command "SELECT id FROM galleries WHERE author_id = '$USER_ID' AND title = '$GALLERY_TITLE' LIMIT 1;" --json 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

if [ -n "$EXISTING_GALLERY" ]; then
    GALLERY_ID="$EXISTING_GALLERY"
    echo "Found existing gallery with ID: $GALLERY_ID"
else
    GALLERY_ID=$(generate_id)
    GALLERY_SLUG="my-photos-${GALLERY_ID:0:8}"
    echo "Creating new gallery with ID: $GALLERY_ID"

    # Create the gallery in D1 (using --remote to access remote database)
    run_wrangler d1 execute $DB_NAME --env $ENV --remote --command "INSERT INTO galleries (id, author_id, title, slug, description) VALUES ('$GALLERY_ID', '$USER_ID', '$GALLERY_TITLE', '$GALLERY_SLUG', '$GALLERY_DESC');"
    echo "Gallery created successfully!"
fi

echo ""

# Upload each image
SORT_ORDER=0

for img in "$IMAGES_DIR"/gallery-*.jpg; do
    if [ -f "$img" ]; then
        FILENAME=$(basename "$img")
        IMAGE_ID=$(generate_id)
        R2_KEY="gallery/${IMAGE_ID}.jpg"
        IMAGE_URL="${R2_PUBLIC_URL}/${R2_KEY}"

        echo "Uploading: $FILENAME -> $R2_KEY"

        # Upload to R2
        run_wrangler r2 object put "${R2_BUCKET}/${R2_KEY}" --file "$img" --content-type "image/jpeg"

        echo "Creating database record..."

        # Insert into D1 (using --remote)
        run_wrangler d1 execute $DB_NAME --env $ENV --remote --command "INSERT INTO gallery_images (id, gallery_id, image_url, caption, sort_order) VALUES ('$IMAGE_ID', '$GALLERY_ID', '$IMAGE_URL', '$FILENAME', $SORT_ORDER);"

        echo "Uploaded: $FILENAME"
        echo ""

        SORT_ORDER=$((SORT_ORDER + 1))
    fi
done

echo "All images uploaded successfully!"
echo "Gallery ID: $GALLERY_ID"
echo "Total images: $SORT_ORDER"
