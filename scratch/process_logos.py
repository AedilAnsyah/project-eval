from PIL import Image
from collections import Counter

def list_gray_pixels(path):
    img = Image.open(path).convert("RGBA")
    pixels = list(img.getdata())
    grays = []
    for p in pixels:
        r, g, b, a = p
        if a > 0:
            # Check if it's near-gray and not gold or white
            if abs(r - g) < 5 and abs(g - b) < 5 and r < 250 and r > 100:
                grays.append((r, g, b, a))
    
    counter = Counter(grays)
    print(f"\nMost common gray colors in {path}:")
    for color, count in counter.most_common(15):
        print(f"Color: {color}, Count: {count}")

def main():
    list_gray_pixels("public/kabinet_logo.png")

if __name__ == "__main__":
    main()
