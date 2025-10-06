# Create frames directory
New-Item -ItemType Directory -Force -Path "public/frames" | Out-Null

# Create temp frames directory
New-Item -ItemType Directory -Force -Path "temp-frames" | Out-Null

# Extract frames from video using ffmpeg
Write-Host "Extracting frames from video..."
ffmpeg -i "public/logo.mp4" -vf "fps=24,scale=100x30" -f image2 "temp-frames/frame-%04d.png"

# Check if ImageMagick is available for ASCII conversion
try {
    $magick = Get-Command magick -ErrorAction Stop
    Write-Host "Using ImageMagick for ASCII conversion..."

    # Convert each frame to ASCII using ImageMagick
    Get-ChildItem "temp-frames/*.png" | ForEach-Object {
        $filename = $_.BaseName
        # Convert to grayscale then to ASCII-like text
        magick $_.FullName -colorspace gray -resize 100x30 -depth 8 txt:- |
        ForEach-Object {
            if ($_ -match 'gray\((\d+)\)') {
                $gray = [int]$matches[1]
                # Map grayscale to ASCII characters
                $ascii = switch ($gray) {
                    {$_ -lt 64} { " " }
                    {$_ -lt 128} { "░" }
                    {$_ -lt 192} { "▒" }
                    default { "█" }
                }
                $ascii
            }
        } | Out-File "public/frames/${filename}.txt" -Encoding UTF8
        Write-Host "Converted $_ to ASCII"
    }
} catch {
    Write-Host "ImageMagick not found. Please install ImageMagick for ASCII conversion."
    Write-Host "Download from: https://imagemagick.org/script/download.php"
}

# Clean up temp frames
Remove-Item -Recurse -Force "temp-frames"

Write-Host "ASCII conversion complete!"