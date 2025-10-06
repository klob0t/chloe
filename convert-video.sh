#!/bin/bash

# Create frames directory
mkdir -p public/frames

# Extract frames from video (adjust fps and resolution as needed)
ffmpeg -i public/logo.mp4 -vf "fps=24,scale=100x30" -f image2 temp-frames/frame-%04d.png

# Check if jp2a is installed, if not install it
if ! command -v jp2a &> /dev/null; then
    echo "jp2a not found. Installing..."
    # On Windows, you might need to use a different approach
    # For Linux/Mac: sudo apt-get install jp2a or brew install jp2a
fi

# Convert each frame to ASCII
for file in temp-frames/*.png; do
    if [ -f "$file" ]; then
        filename=$(basename "$file" .png)
        jp2a --width=100 --height=30 "$file" > "public/frames/${filename}.txt"
        echo "Converted $file to ASCII"
    fi
done

# Clean up temporary frames
rm -rf temp-frames

echo "ASCII conversion complete! Frames saved to public/frames/"