#!/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is required but not installed."
    exit 1
fi

# Directory for icons
ICONS_DIR="client/public/icons"

# Create directory if it doesn't exist
mkdir -p "$ICONS_DIR"

# Use the existing app logo file already being used in the header
LOGO_FILE="./client/public/stonewhistle-logo-new.png"
echo "Using logo: $LOGO_FILE"
ls -la "$LOGO_FILE"

# Convert to various PNG sizes for PWA
SIZES=("72" "96" "128" "144" "152" "192" "384" "512")

for size in "${SIZES[@]}"; do
    echo "Creating icon-${size}x${size}.png"
    convert "$LOGO_FILE" -resize "${size}x${size}" "$ICONS_DIR/icon-${size}x${size}.png"
done

# Create special iOS icons
echo "Creating iOS icons"
convert "$LOGO_FILE" -resize "180x180" "$ICONS_DIR/apple-icon-180.png"
convert "$LOGO_FILE" -resize "167x167" "$ICONS_DIR/apple-icon-167.png"

# Create maskable icon (with safe area margin for adaptive icons)
echo "Creating maskable icon"
# Add a small margin around the logo for maskable icons (Android adaptive icons)
convert "$LOGO_FILE" -resize "460x460" -gravity center -background "#1F5B61" -extent 512x512 "$ICONS_DIR/maskable-icon.png"

# Create splash screens for iOS
echo "Creating iOS splash screens"
# iPad Pro 12.9"
convert "$LOGO_FILE" -resize "400x400" -gravity center -background "#F5F5F0" -extent 2048x2732 "$ICONS_DIR/apple-splash-2048-2732.jpg"
# iPad Pro 11"
convert "$LOGO_FILE" -resize "350x350" -gravity center -background "#F5F5F0" -extent 1668x2388 "$ICONS_DIR/apple-splash-1668-2388.jpg"
# iPad 10.2"
convert "$LOGO_FILE" -resize "350x350" -gravity center -background "#F5F5F0" -extent 1536x2048 "$ICONS_DIR/apple-splash-1536-2048.jpg"
# iPhone XS Max
convert "$LOGO_FILE" -resize "300x300" -gravity center -background "#F5F5F0" -extent 1242x2688 "$ICONS_DIR/apple-splash-1242-2688.jpg"
# iPhone X/XS
convert "$LOGO_FILE" -resize "300x300" -gravity center -background "#F5F5F0" -extent 1125x2436 "$ICONS_DIR/apple-splash-1125-2436.jpg"
# iPhone XR
convert "$LOGO_FILE" -resize "300x300" -gravity center -background "#F5F5F0" -extent 828x1792 "$ICONS_DIR/apple-splash-828-1792.jpg"

echo "All icons created successfully!"