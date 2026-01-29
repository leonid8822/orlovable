#!/usr/bin/env python3
"""
Process gem images - crop to circle with transparent background.
Usage: python process_gems.py input_image.png output_image.png
"""

import sys
from PIL import Image, ImageDraw
import os

def crop_gem_to_circle(input_path, output_path, padding=10):
    """
    Crop an image to a circle with transparent background.
    Automatically detects the gem area and crops it.
    """
    # Open image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size

    # Find the bounding box of non-white/non-gray pixels (the gem)
    pixels = img.load()
    min_x, min_y = width, height
    max_x, max_y = 0, 0

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Check if pixel is not white/light gray (background)
            # Gems are colorful, background is white/light gray
            if not (r > 230 and g > 230 and b > 230):
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    # Crop to bounding box with padding
    min_x = max(0, min_x - padding)
    min_y = max(0, min_y - padding)
    max_x = min(width, max_x + padding)
    max_y = min(height, max_y + padding)

    # Make it square (use the larger dimension)
    crop_width = max_x - min_x
    crop_height = max_y - min_y
    size = max(crop_width, crop_height)

    # Center the crop
    center_x = (min_x + max_x) // 2
    center_y = (min_y + max_y) // 2

    left = center_x - size // 2
    top = center_y - size // 2
    right = left + size
    bottom = top + size

    # Adjust if out of bounds
    if left < 0:
        right -= left
        left = 0
    if top < 0:
        bottom -= top
        top = 0
    if right > width:
        left -= (right - width)
        right = width
    if bottom > height:
        top -= (bottom - height)
        bottom = height

    # Crop
    cropped = img.crop((left, top, right, bottom))
    size = cropped.size[0]

    # Create circular mask
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)

    # Apply mask
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(cropped, mask=mask)

    # Save
    result.save(output_path, "PNG")
    print(f"Saved: {output_path} ({size}x{size})")
    return result

def main():
    if len(sys.argv) < 3:
        print("Usage: python process_gems.py input_image.png output_image.png")
        print("Or: python process_gems.py --batch input_dir output_dir")
        sys.exit(1)

    if sys.argv[1] == "--batch":
        input_dir = sys.argv[2]
        output_dir = sys.argv[3]
        os.makedirs(output_dir, exist_ok=True)

        for filename in os.listdir(input_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                input_path = os.path.join(input_dir, filename)
                output_path = os.path.join(output_dir, filename.rsplit('.', 1)[0] + '.png')
                try:
                    crop_gem_to_circle(input_path, output_path)
                except Exception as e:
                    print(f"Error processing {filename}: {e}")
    else:
        input_path = sys.argv[1]
        output_path = sys.argv[2]
        crop_gem_to_circle(input_path, output_path)

if __name__ == "__main__":
    main()
