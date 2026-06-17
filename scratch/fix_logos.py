import os
from PIL import Image

def process_hmif_logo():
    path = "public/hmif_logo.png"
    backup_path = "public/hmif_logo_orig.png"
    if not os.path.exists(backup_path):
        os.rename(path, backup_path)
        print("Backed up hmif_logo.png to hmif_logo_orig.png")
    else:
        print("Backup hmif_logo_orig.png already exists")
        
    img = Image.open(backup_path).convert("RGBA")
    w, h = img.size
    cx, cy = w // 2, h // 2
    r_max = w // 2 - 2  # radius of the circle
    
    new_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    pixels = img.load()
    new_pixels = new_img.load()
    
    for y in range(h):
        for x in range(w):
            pixel = pixels[x, y]
            rd, gd, bd, ad = pixel
            
            # Calculate distance to center
            dist = ((x - cx)**2 + (y - cy)**2)**0.5
            
            if dist <= r_max:
                # Inside the logo circle
                # If the pixel is dark/black, change it to white
                if rd < 45 and gd < 45 and bd < 45 and ad > 100:
                    # Replace with white
                    new_pixels[x, y] = (255, 255, 255, 255)
                else:
                    new_pixels[x, y] = pixel
            else:
                # Outside the logo circle
                new_pixels[x, y] = pixel
                
    new_img.save(path)
    print("Saved cleaned hmif_logo.png")

def process_kabinet_logo():
    path = "public/kabinet_logo.png"
    backup_path = "public/kabinet_logo_orig.png"
    if not os.path.exists(backup_path):
        os.rename(path, backup_path)
        print("Backed up kabinet_logo.png to kabinet_logo_orig.png")
    else:
        print("Backup kabinet_logo_orig.png already exists")
        
    img = Image.open(backup_path).convert("RGBA")
    w, h = img.size
    cx, cy = w // 2, h // 2
    # The gold leaf symbol is in a circular badge. Let's find its radius.
    # From inspection, the badge radius is roughly w // 2. Let's use w // 2 - 4 to avoid outer borders.
    r_max = w // 2 - 2
    
    new_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    pixels = img.load()
    new_pixels = new_img.load()
    
    for y in range(h):
        for x in range(w):
            pixel = pixels[x, y]
            rd, gd, bd, ad = pixel
            
            dist = ((x - cx)**2 + (y - cy)**2)**0.5
            
            if dist <= r_max:
                # Inside the badge circle
                # Check if it is checkerboard grey/white or transparent.
                # A checkerboard pixel is either transparent (ad < 100) or gray/white (rd > 180, gd > 180, bd > 180 and close to each other).
                # We want to keep the gold leaf details: gold is yellowish (rd > 200, gd between 150 and 210, bd < 100).
                # So if a pixel is not gold/leaf details, make it white.
                is_gold = rd > 180 and gd > 140 and bd < 120
                if not is_gold:
                    new_pixels[x, y] = (255, 255, 255, 255)
                else:
                    new_pixels[x, y] = pixel
            else:
                # Outside the badge circle
                new_pixels[x, y] = pixel
                
    new_img.save(path)
    print("Saved cleaned kabinet_logo.png")

def main():
    process_hmif_logo()
    process_kabinet_logo()

if __name__ == "__main__":
    main()
