// Database client wrapper with automatic Mock Fallback
import { createClient } from '@supabase/supabase-js';
import { members as initialMembers } from './members_data';

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
  if (typeof window === 'undefined') return initialMembers;
  let data = localStorage.getItem(MOCK_MEMBERS_KEY);
  if (!data) {
    localStorage.setItem(MOCK_MEMBERS_KEY, JSON.stringify(initialMembers));
    return initialMembers;
  }
  try {
    const parsed = JSON.parse(data);
    const hasOldNims = parsed.some(m => m.nim.startsWith('101220'));
    const countMismatch = parsed.length !== initialMembers.length;
    if (hasOldNims || countMismatch) {
      localStorage.setItem(MOCK_MEMBERS_KEY, JSON.stringify(initialMembers));
      return initialMembers;
    }
    return parsed;
  } catch (e) {
    localStorage.setItem(MOCK_MEMBERS_KEY, JSON.stringify(initialMembers));
    return initialMembers;
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

/**
 * Validates credentials and returns user details.
 */
export async function signIn(nim, dob, password) {
  const cleanNim = nim.trim();
  const cleanDob = dob.trim(); // Format: YYYY-MM-DD

  // Passwords mapping for admin & koor roles
  const passwordsMap = {
    "Fatir Gibran": "akubiawak",
    "Aedil Riski Ansyah": "goatsejati",
    "Muhammad Fachri Auravyano Saka": "mynameispace",
    "Chilya Fadhilatin Nisa": "emangakugaptek",
    "Syahla Kheisya Mayastria": "umibatu",
    "Damanik, Yohanes Geovan Ondova": "batakdongo",
    "Ridha Akifah": "dudahunter",
    "Dafa Awal Wahyu Pambudi": "cewemanalagiini"
  };

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
      const expectedPassword = passwordsMap[data.nama];
      if (!expectedPassword || password !== expectedPassword) {
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
      const expectedPassword = passwordsMap[found.nama];
      if (!expectedPassword || password !== expectedPassword) {
        throw new Error('Password salah!');
      }
    }
    return found;
  }
}

/**
 * Fetches all members (for gallery or admin view).
 */
export async function getMembers() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('anggota')
      .select('*')
      .order('no_urut', { ascending: true });
    
    if (error) throw new Error(error.message);
    return data;
  } else {
    return getLocalMembers();
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
export async function getFeedbacks() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('feedback_surat')
      .select('*, anggota:pengirim_id(nama, nim, departemen)')
      .order('created_at', { ascending: false });
      
    if (error) throw new Error(error.message);
    return data;
  } else {
    const feedbacks = getLocalFeedback();
    const members = getLocalMembers();
    
    // Join with members to simulate the relation
    return feedbacks.map(f => {
      const sender = members.find(m => m.id === f.pengirim_id);
      return {
        ...f,
        anggota: sender ? { nama: sender.nama, nim: sender.nim, departemen: sender.departemen } : null
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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

