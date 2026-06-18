// Database client wrapper with automatic Mock Fallback
import { createClient } from '@supabase/supabase-js';
import { members as initialMembers } from './members_data.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabase = null;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// ----------------------------------------------------
// LOCAL STORAGE MOCK DATABASE IMPLEMENTATION
// ----------------------------------------------------
const MOCK_MEMBERS_KEY = 'hmif_eval_members_db';
const MOCK_FEEDBACK_KEY = 'hmif_eval_feedback_db';

function getLocalMembers() {
  if (typeof window === 'undefined') return initialMembers.map(m => ({ ...m, stamps: m.stamps || "" }));
  let data = localStorage.getItem(MOCK_MEMBERS_KEY);
  if (!data) {
    const normalizedInitial = initialMembers.map(m => ({ ...m, stamps: m.stamps || "" }));
    localStorage.setItem(MOCK_MEMBERS_KEY, JSON.stringify(normalizedInitial));
    return normalizedInitial;
  }
  try {
    const parsed = JSON.parse(data);
    const hasOldNims = parsed.some(m => m.nim.startsWith('101220'));
    const countMismatch = parsed.length !== initialMembers.length;
    if (hasOldNims || countMismatch) {
      const normalizedInitial = initialMembers.map(m => ({ ...m, stamps: m.stamps || "" }));
      localStorage.setItem(MOCK_MEMBERS_KEY, JSON.stringify(normalizedInitial));
      return normalizedInitial;
    }
    return parsed.map(m => ({ ...m, stamps: m.stamps || "" }));
  } catch (e) {
    const normalizedInitial = initialMembers.map(m => ({ ...m, stamps: m.stamps || "" }));
    localStorage.setItem(MOCK_MEMBERS_KEY, JSON.stringify(normalizedInitial));
    return normalizedInitial;
  }
}

function saveLocalMembers(members) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_MEMBERS_KEY, JSON.stringify(members));
  }
}

function getLocalFeedback() {
  if (typeof window === 'undefined') return [];
  let data = localStorage.getItem(MOCK_FEEDBACK_KEY);
  if (!data) {
    localStorage.setItem(MOCK_FEEDBACK_KEY, JSON.stringify([]));
    return [];
  }
  return JSON.parse(data);
}

function saveLocalFeedback(feedback) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_FEEDBACK_KEY, JSON.stringify(feedback));
  }
}

// ----------------------------------------------------
// EXPORTED DB ACTIONS (AUTOMATIC MOCK/REAL SWITCH)
// ----------------------------------------------------

// SHA-256 hashes of the admin & koor passwords (QA-01 Security Fix)
const hashedPasswordsMap = {
  "Fatir Gibran": "0729ed86c0352636f82128c395d6352134f50b3a2067b48d8610a5873b642649",
  "Aedil Riski Ansyah": "b79faf8e688326e8990ebd1c1f6c465f3a37e39a8df89c11b51ed4a4bf0d31b3",
  "Muhammad Fachri Auravyano Saka": "fa716147666babcf677cba4099df5ca98f6a0bbaf78ed62f9ccc9784f36e74df",
  "Chilya Fadhilatin Nisa": "b68e84dfbf4fc6e3b0239860e02ac90e2f2b3170b95d71c5e9babcd397a26a4f",
  "Syahla Kheisya Mayastria": "72f488e8c74f07a6bfb6b3643b56811afb8d78920768c4b6dbdde7db4912db72",
  "Damanik, Yohanes Geovan Ondova": "48828bab5d0ab7cfe4303a3b505ca27b4bb16b6c937cb6104c8549341c7cfef6",
  "Ridha Akifah": "1f00aa253f6d9d8fc27b2ed5cdd3b2cdb1a057f6948463e41b9016cb6a13a22d",
  "Dafa Awal Wahyu Pambudi": "f0dd9b598dc192fcee2cb8fc9500dac94cdd1bad0b38e6477763b410bd64ed71"
};

// Helper to hash password using browser Web Crypto API
async function hashPassword(pw) {
  const msgBuffer = new TextEncoder().encode(pw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates credentials and returns user details.
 */
export async function signIn(nim, dob, password) {
  const cleanNim = nim.trim();
  const cleanDob = dob.trim(); // Format: YYYY-MM-DD

  if (isSupabaseConfigured) {
    // Note: Since this is pre-registered authentication via NIM/DOB,
    // we query the anggota table to find a matching member.
    const { data, error } = await supabase
      .from('anggota')
      .select('*')
      .eq('nim', cleanNim)
      .eq('tanggal_lahir', cleanDob)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('NIM atau Tanggal Lahir salah!');

    // If role is admin or koor, require password verification
    if (data.role === 'admin' || data.role === 'koor') {
      const expectedHash = hashedPasswordsMap[data.nama];
      const inputHash = await hashPassword(password);
      if (!expectedHash || inputHash !== expectedHash) {
        throw new Error('Password salah!');
      }
    }
    return data;
  } else {
    // Mock Database Authentication
    const members = getLocalMembers();
    const found = members.find(
      (m) => m.nim === cleanNim && m.tanggal_lahir === cleanDob
    );
    if (!found) {
      throw new Error('NIM atau Tanggal Lahir salah! Silakan periksa credentials.md');
    }

    // If role is admin or koor, require password verification
    if (found.role === 'admin' || found.role === 'koor') {
      const expectedHash = hashedPasswordsMap[found.nama];
      const inputHash = await hashPassword(password);
      if (!expectedHash || inputHash !== expectedHash) {
        throw new Error('Password salah!');
      }
    }
    return found;
  }
}

/**
 * Fetches all members (for gallery or admin view).
 */
export async function getMembers(departemen = null) {
  if (isSupabaseConfigured) {
    let query = supabase
      .from('anggota')
      .select('*')
      .order('no_urut', { ascending: true });
      
    if (departemen) {
      query = query.eq('departemen', departemen);
    }
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  } else {
    const members = getLocalMembers();
    if (departemen) {
      return members.filter((m) => m.departemen === departemen);
    }
    return members;
  }
}

/**
 * Fetches a single member by ID.
 */
export async function getMemberById(id) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('anggota')
      .select('*')
      .eq('id', id)
      .maybeSingle();
      
    if (error) throw new Error(error.message);
    return data;
  } else {
    const members = getLocalMembers();
    return members.find((m) => m.id === id) || null;
  }
}

/**
 * Updates a member record. Used by Coords to edit pesan_koor,
 * or by Admin to edit credentials and other messages.
 */
export async function updateMember(id, updatedFields) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('anggota')
      .update(updatedFields)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    return data;
  } else {
    const members = getLocalMembers();
    const index = members.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Member not found');
    
    members[index] = { ...members[index], ...updatedFields };
    saveLocalMembers(members);
    return members[index];
  }
}

/**
 * Fetches all feedback entries.
 */
export async function getFeedbacks(tujuan = null, departemen_pengirim = null) {
  if (isSupabaseConfigured) {
    let query = supabase
      .from('feedback_surat')
      .select('*, anggota:pengirim_id(nama, nim, departemen)')
      .order('created_at', { ascending: false });
      
    if (tujuan) {
      query = query.eq('tujuan', tujuan);
    }
    if (departemen_pengirim) {
      query = query.eq('departemen_pengirim', departemen_pengirim);
    }
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  } else {
    const feedbacks = getLocalFeedback();
    const members = getLocalMembers();
    
    // Join with members to simulate the relation
    let joined = feedbacks.map(f => {
      const sender = members.find(m => m.id === f.pengirim_id);
      return {
        ...f,
        anggota: sender ? { nama: sender.nama, nim: sender.nim, departemen: sender.departemen } : null
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    if (tujuan) {
      joined = joined.filter(f => f.tujuan === tujuan);
    }
    if (departemen_pengirim) {
      joined = joined.filter(f => f.departemen_pengirim === departemen_pengirim);
    }
    return joined;
  }
}

/**
 * Submits a new feedback response.
 */
export async function addFeedback(feedbackData) {
  // feedbackData: { pengirim_id, tujuan, departemen_pengirim, isi_balasan, is_anonim }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('feedback_surat')
      .insert([feedbackData])
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    return data;
  } else {
    const feedbacks = getLocalFeedback();
    const newFeedback = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      ...feedbackData
    };
    feedbacks.push(newFeedback);
    saveLocalFeedback(feedbacks);
    return newFeedback;
  }
}

/**
 * Deletes a feedback response by ID.
 */
export async function deleteFeedback(id) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('feedback_surat')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();
      
    if (error) throw new Error(error.message);
    return data;
  } else {
    const feedbacks = getLocalFeedback();
    const filtered = feedbacks.filter((f) => f.id !== id);
    saveLocalFeedback(filtered);
    return { id };
  }
}

// ----------------------------------------------------
// STICKY NOTES IMPLEMENTATION (MOCK & SUPABASE)
// ----------------------------------------------------
const MOCK_STICKY_NOTES_KEY = 'hmif_eval_sticky_notes_db';

function getLocalStickyNotes() {
  if (typeof window === 'undefined') return [];
  let data = localStorage.getItem(MOCK_STICKY_NOTES_KEY);
  if (!data) {
    localStorage.setItem(MOCK_STICKY_NOTES_KEY, JSON.stringify([]));
    return [];
  }
  return JSON.parse(data);
}

function saveLocalStickyNotes(notes) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_STICKY_NOTES_KEY, JSON.stringify(notes));
  }
}

export async function getStickyNotes() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('sticky_notes')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  } else {
    return getLocalStickyNotes().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
}

export async function addStickyNote(noteData) {
  const randomRotation = Math.floor(Math.random() * 12) - 6; // -6 to 5 degrees
  const randomX = Math.floor(Math.random() * 80) + 10; // 10% to 90%
  const randomY = Math.floor(Math.random() * 60) + 10; // 10% to 70%
  
  const finalNote = {
    ...noteData,
    rotation: randomRotation,
    x_pos: randomX,
    y_pos: randomY
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('sticky_notes')
      .insert([finalNote])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  } else {
    const notes = getLocalStickyNotes();
    const newNote = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      ...finalNote
    };
    notes.push(newNote);
    saveLocalStickyNotes(notes);
    return newNote;
  }
}

export async function deleteStickyNote(id) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('sticky_notes')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  } else {
    const notes = getLocalStickyNotes();
    const filtered = notes.filter((n) => n.id !== id);
    saveLocalStickyNotes(filtered);
    return { id };
  }
}

