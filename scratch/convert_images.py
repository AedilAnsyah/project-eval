import os
import sys
import shutil
import subprocess

# Ensure we have pillow and pillow-heif for converting HEIC/HEIF
try:
    from PIL import Image
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    print("Installing pillow and pillow-heif for image conversion...")
    subprocess.run([sys.executable, "-m", "pip", "install", "pillow", "pillow-heif"], check=True)
    from PIL import Image
    import pillow_heif
    pillow_heif.register_heif_opener()

src_dir = "sumber-foto"
dest_dir = os.path.join("public", "timeline")

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)
    print(f"Created directory: {dest_dir}")

files = os.listdir(src_dir)
print(f"Found {len(files)} files in {src_dir}")

for filename in files:
    src_path = os.path.join(src_dir, filename)
    if not os.path.isfile(src_path):
        continue
        
    name, ext = os.path.splitext(filename)
    ext_lower = ext.lower()
    
    if ext_lower in ['.heic', '.heif']:
        dest_filename = f"{name.lower()}.jpg"
        dest_path = os.path.join(dest_dir, dest_filename)
        
        # Convert HEIC/HEIF to JPEG
        try:
            print(f"Converting {filename} -> {dest_filename}...")
            image = Image.open(src_path)
            image.save(dest_path, "JPEG", quality=90)
            print(f"  [OK] Converted and saved to {dest_path}")
        except Exception as e:
            print(f"  [ERROR] Failed to convert {filename}: {e}")
    else:
        # Standard image files - copy directly and make name lowercase for consistency
        dest_filename = f"{name.lower()}{ext_lower}"
        dest_path = os.path.join(dest_dir, dest_filename)
        try:
            print(f"Copying {filename} -> {dest_filename}...")
            shutil.copy2(src_path, dest_path)
            print(f"  [OK] Copied to {dest_path}")
        except Exception as e:
            print(f"  [ERROR] Failed to copy {filename}: {e}")

print("Image processing complete!")
