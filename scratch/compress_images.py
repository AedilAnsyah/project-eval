import os
from PIL import Image

public_dir = r"c:\Users\Acer\Documents\project-eval\public"
images_to_compress = [
    "CCO.jpg",
    "ERA.jpg",
    "FED.jpg",
    "Foto Kabinet.jpg",
    "HCCB.jpg",
    "HID.jpg",
    "TDI.jpg"
]

print("=== STARTING STATIC IMAGE COMPRESSION ===")
for img_name in images_to_compress:
    input_path = os.path.join(public_dir, img_name)
    if not os.path.exists(input_path):
        print(f"File not found: {img_name}")
        continue
    
    orig_size = os.path.getsize(input_path)
    
    # Open and convert to RGB (just in case)
    img = Image.open(input_path)
    if img.mode != 'RGB':
        img = img.convert('RGB')
        
    # We will save both optimized WebP and optimized JPG
    # Let's save as WebP
    webp_name = os.path.splitext(img_name)[0] + ".webp"
    webp_path = os.path.join(public_dir, webp_name)
    
    # Resize if extremely large (e.g. width > 1600px)
    max_width = 1600
    if img.width > max_width:
        ratio = max_width / float(img.width)
        new_height = int(float(img.height) * float(ratio))
        img_resized = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        print(f"Resized {img_name} from {img.width}x{img.height} to {max_width}x{new_height}")
        img_resized.save(webp_path, "WEBP", quality=80)
        
        # Also overwrite the original JPG with an optimized resized JPG
        img_resized.save(input_path, "JPEG", quality=80)
    else:
        img.save(webp_path, "WEBP", quality=80)
        img.save(input_path, "JPEG", quality=80)
        
    webp_size = os.path.getsize(webp_path)
    jpg_size = os.path.getsize(input_path)
    
    print(f"Processed {img_name}:")
    print(f"  - Original JPG: {orig_size / 1024:.2f} KB")
    print(f"  - Optimized JPG: {jpg_size / 1024:.2f} KB (Reduced by {(orig_size - jpg_size) / orig_size * 100:.1f}%)")
    print(f"  - Optimized WebP: {webp_size / 1024:.2f} KB (Reduced by {(orig_size - webp_size) / orig_size * 100:.1f}%)")
print("=== COMPRESSION COMPLETE ===")
