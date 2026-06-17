import json
import re

# Raw text from the user
raw_text = """
DEPARTEMEN: FED
Amelia Candradewi | NIM: 103112400140 | TTL: Tangerang, 10 Mei 2006

Aqilah Izani | NIM: 109082530006 | TTL: Pekalongan, 27 Januari 2007

Herdian Abdillah Purnomo | NIM: 103112430048 | TTL: Banyumas, 4 Maret 2006

Nabella Rahmatus Sania | NIM: 103112430002 | TTL: Sragen, 14 Maret 2006

Rafi Azis Faozan | NIM: 109082500069 | TTL: Brebes, 30 Oktober 2007

Shasa Olivia Rose | NIM: 109082500207 | TTL: Banyumas, 04 Mei 2007

Syahla Kheisya Mayastria | NIM: 103112430018 | TTL: Banyumas, 14 Maret 2006

DEPARTEMEN: ERA
Ais Nurhanifah | NIM: 109082500162 | TTL: Banjarnegara, 04 April 2007

Angelina Loria Timba | NIM: 109082500146 | TTL: Balikpapan, 07 Juni 2007

Damanik, Yohanes Geovan Ondova | NIM: 103112400022 | TTL: Bekasi, 5 September 2006

Elfan Endriyanto | NIM: 103112430040 | TTL: Lampung, 17 Januari 2006

Ilham Sulistyo Rizqi | NIM: 109082500121 | TTL: Tangerang, 19 November 2005

RAKHMAT PRATAMA | NIM: 109082530037 | TTL: Purbalingga, 21 Agustus 2007

Rayhan Ahza Widyamukti | NIM: 109082500210 | TTL: Makassar, 16 November 2007

DEPARTEMEN: CCO
Aqilla Rachel Rabbani | NIM: 109082500199 | TTL: Purbalingga, 6 Februari 2007

Chadafya Putra Zulfikar | NIM: 103112430173 | TTL: Ketapang, 21 Juli 2006

Dafa Awal Wahyu Pambudi | NIM: 103112400275 | TTL: Cilacap, 09 Maret 2006

Laluna Afril Diasyifa | NIM: 109082500009 | TTL: Banyumas, 16 April 2007

Mahardhika Putra Azlian | NIM: 109082500025 | TTL: Banyumas, 28 Mei 2007

Manggala Patra Raditya | NIM: 109082500179 | TTL: Banyumas, 13 Agustus 2007

Moh. Chandra Wardana | NIM: 109082530025 | TTL: Brebes, 11 November 2006

Muhammad Haidar Az Zacky | NIM: 109082530035 | TTL: Sukoharjo, 27 Juli 2007

Muhammad Zacky Permana | NIM: 103112430228 | TTL: Tangerang, 21 Juni 2006

Pamela Sandra Amelia Br Ginting | NIM: 103112430152 | TTL: Medan, 18 Januari 2006

DEPARTEMEN: TDI

Ahmad Luthfi Habibie | NIM: 109082500190 | TTL: Tegal, 31 Mei 2006

Brilyant Keyza Hidayat | NIM: 109082500106 | TTL: Cirebon, 24 Januari 2007

Marzhendo Galang Saputra | NIM: 103112400102 | TTL: Cilacap, 3 Maret 2006

Nawwar Ulayya Frodine | NIM: 109082500153 | TTL: Temanggung, 21 Juni 2007

Raysa Rahma Irahim | NIM: 109082500167 | TTL: Batam, 18 Januari 2007

Ridha Akifah | NIM: 103112400132 | TTL: Brebes, 1 Juni 2006

Rista Sania Putri | NIM: 109082530026 | TTL: Brebes, 22 Januari 2007

DEPARTEMEN: EB

Fatir Gibran | NIM: 103112430153 | TTL: Medan, 8 Februari 2006

Aedil Riski Ansyah | NIM: 103112400101 | TTL: Tegal, 24 Juni 2006

Alya Maghfira Pratiwi | NIM: 103112400240 | TTL: Kendal, 16 Oktober 2005

Fidela Marshallwa Abelvio Santoso | NIM: 103112400105 | TTL: Purbalingga, 28 Maret 2006

Salsadilla Hanny Azizah | NIM: 109082500014 | TTL: Banyumas, 2 April 2007

Sarah Maulidya Natasyah | NIM: 109082530023 | TTL: Indramayu, 28 Maret 2007

DEPARTEMEN: PSDM
Adhara Faliya Utanti | NIM: 109082500033 | TTL: Banyumas, 16 Januari 2007

Amanda Septiana Salsabila | NIM: 109082500125 | TTL: Purwokerto, 11 September 2006

Annisa Berliana Nindya Syah Putri | NIM: 109082500166 | TTL: Tegal, 15 Agustus 2006

Barret Fairuz Azizah | NIM: 109082530034 | TTL: Banyumas, 19 Juni 2007

Diva Zahrah Nabila | NIM: 109082500112 | TTL: Banyumas, 30 April 2007

Nehemia Pandu Indragiri | NIM: 109082500019 | TTL: Purwokerto, Banyumas, 18 Maret 2007

Tio Armani | NIM: 103112430225 | TTL: Rantau Prapat, 30 April 2006

DEPARTEMEN: SOSIAL
Assyifa Zahra | NIM: 109082500196 | TTL: Medan, 13 Maret 2007

Chilya Fadhilatin Nisa | NIM: 103112430010 | TTL: Banyumas, 5 Mei 2006

Hiliyati Aulia | NIM: 109082500157 | TTL: Makassar, 16 Juli 2007

Jahraa Syarifah Naqiyyah Salsabila | NIM: 1090825000999 | TTL: Bojonegoro, 6 Mei 2007

Muhammad Fachri Auravyano Saka | NIM: 103112430180 | TTL: Kupang, 28 Desember 2005

Muhammad Farrel Argiyanto | NIM: 109082500018 | TTL: Purwokerto, 13 September 2006

Mukhammad Ari Trianirto | NIM: 109082530027 | TTL: Jakarta, 24 Februari 2005

Shafira Shifa Azahra | NIM: 109082500125 | TTL: Cilacap, 10 Februari 2007
"""

MONTHS_MAP = {
    'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6,
    'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12
}

def parse_dob(ttl_str):
    # E.g. "Tangerang, 10 Mei 2006"
    ttl_str = ttl_str.strip()
    match = re.search(r',\s*(\d+)\s+([a-zA-Z]+)\s+(\d{4})', ttl_str)
    if not match:
        # Try without comma, e.g. "Banyumas 14 Maret 2006"
        match = re.search(r'(\d+)\s+([a-zA-Z]+)\s+(\d{4})', ttl_str)
    if match:
        day = int(match.group(1))
        month_name = match.group(2).lower()
        year = int(match.group(3))
        month = MONTHS_MAP.get(month_name, 1)
        return f"{year}-{month:02d}-{day:02d}"
    return "2004-01-01"

def clean_name(name):
    # Remove commas, strip, and lowercase
    name = name.replace(',', '')
    return " ".join(name.lower().split())

def match_names(parsed_name, existing_names):
    parsed_clean = clean_name(parsed_name)
    parsed_words = set(parsed_clean.split())
    
    # 1. Exact match (case insensitive, ignoring commas)
    for name in existing_names:
        if clean_name(name) == parsed_clean:
            return name
            
    # 2. Subset matching (e.g. "Damanik, Yohanes Geovan Ondova" matches "Yohanes Geovan Ondova Damanik")
    for name in existing_names:
        exist_clean = clean_name(name)
        exist_words = set(exist_clean.split())
        if parsed_words == exist_words:
            return name
            
    # 3. Fuzzy subset matching (if at least 2 words match, or is substring)
    for name in existing_names:
        exist_clean = clean_name(name)
        if exist_clean in parsed_clean or parsed_clean in exist_clean:
            return name
            
    return None

def main():
    # Load existing members
    js_path = r"c:\Users\Acer\Documents\project-eval\src\lib\members_data.js"
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Simple JSON extraction from JS file
    json_str = content[content.find("["):content.rfind("]")+1]
    existing_members = json.loads(json_str)
    existing_names = [m["nama"] for m in existing_members]
    
    parsed_data = []
    # Parse raw text lines
    lines = raw_text.split("\n")
    for line in lines:
        if "|" in line:
            parts = line.split("|")
            name = parts[0].strip()
            nim = parts[1].replace("NIM:", "").strip()
            ttl = parts[2].replace("TTL:", "").strip()
            dob = parse_dob(ttl)
            parsed_data.append({
                "raw_name": name,
                "nim": nim,
                "dob": dob,
                "ttl": ttl
            })
            
    print(f"Parsed {len(parsed_data)} members from raw input.")
    
    matches = {}
    mismatches = []
    
    for item in parsed_data:
        matched_name = match_names(item["raw_name"], existing_names)
        if matched_name:
            matches[matched_name] = item
        else:
            mismatches.append(item)
            
    print(f"Successfully matched: {len(matches)}")
    print(f"Unmatched items from input: {len(mismatches)}")
    for item in mismatches:
        print(f" - {item['raw_name']} | NIM {item['nim']} | TTL {item['ttl']}")
        
    # Check if there are members in existing_members that were NOT matched
    unmatched_existing = [name for name in existing_names if name not in matches]
    print(f"Unmatched existing members in DB: {len(unmatched_existing)}")
    for name in unmatched_existing:
        print(f" - {name}")

if __name__ == "__main__":
    main()
