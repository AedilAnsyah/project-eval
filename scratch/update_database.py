import json
import re
import os

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

Rizky Al Kahfi | NIM: 103112400104 | TTL: Bekasi 24 Juli 2006

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
    ttl_str = ttl_str.strip()
    match = re.search(r',\s*(\d+)\s+([a-zA-Z]+)\s+(\d{4})', ttl_str)
    if not match:
        match = re.search(r'(\d+)\s+([a-zA-Z]+)\s+(\d{4})', ttl_str)
    if match:
        day = int(match.group(1))
        month_name = match.group(2).lower()
        year = int(match.group(3))
        month = MONTHS_MAP.get(month_name, 1)
        return f"{year}-{month:02d}-{day:02d}"
    return None

def clean_name(name):
    name = name.replace(',', '')
    return " ".join(name.lower().split())

def match_names(parsed_name, existing_names):
    parsed_clean = clean_name(parsed_name)
    parsed_words = set(parsed_clean.split())
    
    # Direct manual overrides first
    overrides = {
        "muhammad haidar az zacky": "Muh. Haidar Az Zacky",
        "rayhan ahza widyamukti": "Rayhan Ahza Widayamukti"
    }
    if parsed_clean in overrides:
        target = overrides[parsed_clean]
        if target in existing_names:
            return target

    # 1. Exact match
    for name in existing_names:
        if clean_name(name) == parsed_clean:
            return name
            
    # 2. Subset matching
    for name in existing_names:
        exist_clean = clean_name(name)
        exist_words = set(exist_clean.split())
        if parsed_words == exist_words:
            return name
            
    # 3. Fuzzy subset matching
    for name in existing_names:
        exist_clean = clean_name(name)
        if exist_clean in parsed_clean or parsed_clean in exist_clean:
            return name
            
    return None

def main():
    # Load existing members
    # Since members_data.js was overwritten to 52, we will read the current one (which has 52 items)
    # But wait! Rizky Al Kahfi was removed. Does the script need to match him if he's not in the 52?
    # Wait! If he is not in the 52, we cannot load him from members_data.js.
    # Ah! But we can find his details in git history or we can manually reconstruct him!
    # Wait, where was Rizky Al Kahfi in members_data.js?
    # Let's check our previous view of members_data.js:
    # line 229:
    # {
    #     "id": "68bbcb50-381c-484e-8f7a-53623b749bd9",
    #     "no_urut": 17,
    #     "nama": "Rizky Al Kahfi",
    #     "nim": "10122017",
    #     "tanggal_lahir": "2004-01-17",
    #     "role": "staff",
    #     "departemen": "Talent Development & Innovation",
    #     "foto_url": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=RizkyAlKahfi",
    #     "pesan_fatir": "Halo Rizky Al Kahfi, terima kasih banyak atas kontribusimu sebagai Staff of Talent Development & Innovation di periode kepengurusan ini. Kerjamu sangat luar biasa dan sangat membantu kelancaran program kerja HMIF. Tetap semangat dan semoga sukses di langkah berikutnya!",
    #     "pesan_aedil": "Hai Rizky Al Kahfi! Salut dengan dedikasi dan energi positif yang kamu bawa. Sebagai Staff of Talent Development & Innovation, kamu sudah memberikan yang terbaik. Semoga pengalaman di HMIF ini bermanfaat untuk masa depanmu ya!",
    #     "pesan_koor": "Halo Rizky Al Kahfi, sebagai rekan satu tim, aku bangga sekali bisa bekerja bersamamu di departemen Talent Development & Innovation. Kerja kerasmu sangat menginspirasi. Terima kasih atas segala bantuan dan kebersamaan kita!",
    #     "jabatan": "Staff of Talent Development & Innovation"
    # }
    # That is exactly his data! We can hardcode this fallback if Rizky Al Kahfi is missing from members_data.js!
    # Let's include this fallback in the script.
    
    js_path = r"c:\Users\Acer\Documents\project-eval\src\lib\members_data.js"
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    json_str = content[content.find("["):content.rfind("]")+1]
    existing_members = json.loads(json_str)
    
    # Check if "Rizky Al Kahfi" is already in existing_members. If not, add the backup dict.
    if not any(m["nama"] == "Rizky Al Kahfi" for m in existing_members):
        rizky_backup = {
            "id": "68bbcb50-381c-484e-8f7a-53623b749bd9",
            "no_urut": 17,
            "nama": "Rizky Al Kahfi",
            "nim": "10122017",
            "tanggal_lahir": "2004-01-17",
            "role": "staff",
            "departemen": "Talent Development & Innovation",
            "foto_url": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=RizkyAlKahfi",
            "pesan_fatir": "Halo Rizky Al Kahfi, terima kasih banyak atas kontribusimu sebagai Staff of Talent Development & Innovation di periode kepengurusan ini. Kerjamu sangat luar biasa dan sangat membantu kelancaran program kerja HMIF. Tetap semangat dan semoga sukses di langkah berikutnya!",
            "pesan_aedil": "Hai Rizky Al Kahfi! Salut dengan dedikasi dan energi positif yang kamu bawa. Sebagai Staff of Talent Development & Innovation, kamu sudah memberikan yang terbaik. Semoga pengalaman di HMIF ini bermanfaat untuk masa depanmu ya!",
            "pesan_koor": "Halo Rizky Al Kahfi, sebagai rekan satu tim, aku bangga sekali bisa bekerja bersamamu di departemen Talent Development & Innovation. Kerja kerasmu sangat menginspirasi. Terima kasih atas segala bantuan dan kebersamaan kita!",
            "jabatan": "Staff of Talent Development & Innovation"
        }
        existing_members.append(rizky_backup)
        
    existing_names = [m["nama"] for m in existing_members]
    
    parsed_data = []
    lines = raw_text.split("\n")
    for line in lines:
        if "|" in line:
            parts = line.split("|")
            name = parts[0].strip()
            nim = parts[1].replace("NIM:", "").strip()
            ttl = parts[2].replace("TTL:", "").strip()
            dob = parse_dob(ttl)
            if not dob:
                print(f"Warning: could not parse DOB from TTL: {ttl}")
                dob = "2004-01-01"
            parsed_data.append({
                "raw_name": name,
                "nim": nim,
                "dob": dob,
                "ttl": ttl
            })
            
    print(f"Parsed {len(parsed_data)} members from raw input.")
    
    updated_members = []
    matched_existing_names = set()
    
    for item in parsed_data:
        matched_name = match_names(item["raw_name"], existing_names)
        if matched_name:
            matched_existing_names.add(matched_name)
            member_dict = next(m for m in existing_members if m["nama"] == matched_name)
            
            updated_m = dict(member_dict)
            updated_m["nama"] = item["raw_name"]
            updated_m["nim"] = item["nim"]
            updated_m["tanggal_lahir"] = item["dob"]
            updated_members.append(updated_m)
        else:
            print(f"CRITICAL ERROR: Could not match input name: {item['raw_name']}")
            return

    unmatched_existing = [name for name in existing_names if name not in matched_existing_names]
    print(f"Unmatched existing members that will be removed: {unmatched_existing}")
    
    # Sort updated_members by their original no_urut (using a fallback order mapping)
    # To restore original order:
    # EB: no_urut 1-6
    # PSDM / Human Capital: no_urut 7-14 (wait, Chilya Fadhilatin Nisa is 7)
    # TDI: no_urut 15-22 (Rizky Al Kahfi is 17)
    # Humanity / SOSIAL: no_urut 23-29
    # FED: no_urut 30-36
    # CCO: no_urut 37-46
    # ERA: no_urut 47-53
    # Let's map original order based on the initial ID or jabatan / departemen to make sure order is clean and preserves the original indices.
    # The member_dict copies already have their original "no_urut" (Rizky Al Kahfi has 17, and others have their original indices).
    # So we can just sort by original "no_urut" directly!
    # Wait, let's verify if that works. Yes! Rizky Al Kahfi has original no_urut 17, Rista Sania Putri has 18, and so on.
    
    updated_members.sort(key=lambda x: x["no_urut"])
    
    # Re-index no_urut from 1 to N
    for i, m in enumerate(updated_members):
        m["no_urut"] = i + 1
        
    print(f"Total updated members: {len(updated_members)}")
    
    # 1. Output src/lib/members_data.js
    js_content = f"// File auto-generated by seed.py. Contains mock data for 53 members.\n\nexport const members = {json.dumps(updated_members, indent=2)};\n"
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(js_content)
    print("Updated src/lib/members_data.js")
    
    # 2. Output credentials.md
    cred_content = "# Credentials Akun Anggota HMIF untuk Login\n\n"
    cred_content += "Gunakan NIM dan Tanggal Lahir di bawah ini untuk masuk ke dalam sistem evaluasi.\n\n"
    cred_content += "| No | Nama | Jabatan | Departemen | NIM | Tanggal Lahir | Role |\n"
    cred_content += "|---|---|---|---|---|---|---|\n"
    for m in updated_members:
        cred_content += f"| {m['no_urut']} | {m['nama']} | {m['jabatan']} | {m['departemen']} | `{m['nim']}` | `{m['tanggal_lahir']}` | `{m['role']}` |\n"
        
    cred_path = r"c:\Users\Acer\Documents\project-eval\credentials.md"
    with open(cred_path, "w", encoding="utf-8") as f:
        f.write(cred_content)
    print("Updated credentials.md")
    
    # 3. Output supabase/seed_data.sql
    sql_content = "-- SQL Seed: Populate members (anggota)\n\n"
    for m in updated_members:
        esc_nama = m['nama'].replace("'", "''")
        esc_dept = m['departemen'].replace("'", "''")
        esc_foto = m['foto_url'].replace("'", "''")
        esc_fatir = m['pesan_fatir'].replace("'", "''")
        esc_aedil = m['pesan_aedil'].replace("'", "''")
        esc_koor = m['pesan_koor'].replace("'", "''")
        
        sql_content += f"INSERT INTO anggota (id, no_urut, nama, nim, tanggal_lahir, role, departemen, foto_url, pesan_fatir, pesan_aedil, pesan_koor) \n"
        sql_content += f"VALUES ('{m['id']}', {m['no_urut']}, '{esc_nama}', '{m['nim']}', '{m['tanggal_lahir']}', '{m['role']}', '{esc_dept}', '{esc_foto}', '{esc_fatir}', '{esc_aedil}', '{esc_koor}')\n"
        sql_content += f"ON CONFLICT (id) DO UPDATE SET \n"
        sql_content += f"  nama = EXCLUDED.nama, nim = EXCLUDED.nim, tanggal_lahir = EXCLUDED.tanggal_lahir, role = EXCLUDED.role, departemen = EXCLUDED.departemen, foto_url = EXCLUDED.foto_url;\n\n"
        
    sql_path = r"c:\Users\Acer\Documents\project-eval\supabase\seed_data.sql"
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write(sql_content)
    print("Updated supabase/seed_data.sql")

if __name__ == "__main__":
    main()
