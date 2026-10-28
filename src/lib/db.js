// Database client wrapper - Voting System (Kahim/Wakahim HMIF 2026)
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
// LOCAL STORAGE - MEMBERS
// ----------------------------------------------------
const MOCK_MEMBERS_KEY = 'hmif_eval_members_db';

function getLocalMembers() {
  if (typeof window === 'undefined') return initialMembers.map(m => ({ ...m }));
  let data = localStorage.getItem(MOCK_MEMBERS_KEY);
  if (!data) {
    localStorage.setItem(MOCK_MEMBERS_KEY, JSON.stringify(initialMembers));
    return initialMembers;
  }
  try {
    const parsed = JSON.parse(data);
    const countMismatch = parsed.length !== initialMembers.length;
    if (countMismatch) {
      localStorage.setItem(MOCK_MEMBERS_KEY, JSON.stringify(initialMembers));
      return initialMembers;
    }
    return parsed;
  } catch (e) {
    localStorage.setItem(MOCK_MEMBERS_KEY, JSON.stringify(initialMembers));
    return initialMembers;
  }
}

// ----------------------------------------------------
// LOCAL STORAGE - VOTES
// Format: [{ voter_id, voter_nim, votes: [{candidate_id, candidate_nim, candidate_nama, rank}], submitted_at }]
// ----------------------------------------------------
const VOTING_DB_KEY = 'hmif_voting_db';

function getLocalVotes() {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(VOTING_DB_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveLocalVotes(votes) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(VOTING_DB_KEY, JSON.stringify(votes));
  }
}

// ----------------------------------------------------
// AUTHENTICATION
// Password format: NIM (12 chars) + DDMMYYYY (8 chars) = 20 chars total
// Example: NIM=103112400101, DOB=2006-06-24 → password = "10311240010124062006"
//          (DDMMYYYY of 2006-06-24 is "24062006")
// ----------------------------------------------------
export async function signIn(identifierOrPassword, maybePassword) {
  let nim = '';
  let ddmmyyyy = '';

  if (maybePassword !== undefined && maybePassword !== null && maybePassword !== '') {
    const cleanId = (identifierOrPassword || '').trim();
    const cleanPass = (maybePassword || '').trim();

    if (cleanPass.length === 20) {
      nim = cleanPass.slice(0, 12);
      ddmmyyyy = cleanPass.slice(12, 20);
    } else if (cleanPass.length === 8) {
      nim = cleanId;
      ddmmyyyy = cleanPass;
    } else if (cleanPass.length > 20) {
      nim = cleanPass.slice(0, 12);
      ddmmyyyy = cleanPass.slice(12, 20);
    } else {
      throw new Error(
        'Format password salah! Format: NIM (12 digit) + Tanggal Lahir (DDMMYYYY, 8 digit). Contoh: 10311240010124062006'
      );
    }
  } else {
    const clean = (identifierOrPassword || '').trim();
    if (clean.length < 20) {
      throw new Error(
        'Format password salah! Gunakan NIM (12 digit) + Tanggal Lahir (DDMMYYYY, 8 digit). Contoh: 10311240010124062006'
      );
    }
    nim = clean.slice(0, 12);
    ddmmyyyy = clean.slice(12, 20);
  }

  if (ddmmyyyy.length !== 8) {
    throw new Error('Tanggal lahir harus 8 digit (DDMMYYYY). Contoh: 24062006');
  }

  // Parse DDMMYYYY → YYYY-MM-DD
  const day   = ddmmyyyy.slice(0, 2);
  const month = ddmmyyyy.slice(2, 4);
  const year  = ddmmyyyy.slice(4, 8);
  const dob   = `${year}-${month}-${day}`;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('anggota')
        .select('*')
        .eq('nim', nim)
        .eq('tanggal_lahir', dob)
        .maybeSingle();

      if (error) {
        console.warn('Supabase query error, falling back to local DB:', error.message);
      } else if (data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase connection failed (TypeError Failed to fetch), using local fallback:', err);
    }
  }

  // Local fallback / default authentication
  const members = getLocalMembers();
  const found = members.find(m => m.nim === nim && m.tanggal_lahir === dob);
  if (!found) throw new Error('Password salah! Pastikan NIM dan Tanggal Lahir sudah benar.');
  return found;
}

// ----------------------------------------------------
// MEMBERS
// ----------------------------------------------------

/**
 * Fetches all members, optionally filtered by departemen.
 */
export async function getMembers(departemen = null) {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('anggota')
        .select('*')
        .order('no_urut', { ascending: true });
      if (departemen) query = query.eq('departemen', departemen);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
      if (error) console.warn('Supabase getMembers error, falling back to local DB:', error.message);
    } catch (err) {
      console.warn('Supabase getMembers failed to fetch, using local fallback:', err);
    }
  }

  const members = getLocalMembers();
  if (departemen) return members.filter(m => m.departemen === departemen);
  return members;
}

/**
 * Fetches a single member by ID.
 */
export async function getMemberById(id) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('anggota')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getMemberById failed to fetch, using local fallback:', err);
    }
  }

  const members = getLocalMembers();
  return members.find(m => m.id === id) || null;
}

// ----------------------------------------------------
// VOTING FUNCTIONS
// Bobot: Rank 1 = 5 poin, Rank 2 = 4 poin, ..., Rank 5 = 1 poin
// Kandidat: hanya angkatan 25 (NIM prefix "109")
// Voter: semua anggota (ang24 & ang25)
// Aturan: ang24 pilih ang25; ang25 pilih ang25 lain (bukan diri sendiri)
// ----------------------------------------------------

/**
 * Submit a vote for the current user.
 * @param {string} voterId - Member UUID
 * @param {string} voterNim - Member NIM
 * @param {Array}  votes - [{ candidate_id, candidate_nim, candidate_nama, rank }]
 *                         rank goes from 1 (highest) to max 5 (lowest)
 */
export async function submitVote(voterId, voterNim, votes) {
  if (!votes || votes.length < 3 || votes.length > 5) {
    throw new Error('Pilih minimal 3 dan maksimal 5 kandidat!');
  }

  // Validate no duplicate candidates
  const candidateIds = votes.map(v => v.candidate_id);
  if (new Set(candidateIds).size !== candidateIds.length) {
    throw new Error('Terdapat duplikasi kandidat dalam pilihan!');
  }

  // Validate cannot vote for self
  if (votes.some(v => v.candidate_id === voterId || v.candidate_nim === voterNim)) {
    throw new Error('Anda tidak dapat memilih diri Anda sendiri!');
  }

  // Validate candidate is angkatan 25 (NIM starts with 109)
  if (votes.some(v => !v.candidate_nim || !v.candidate_nim.startsWith('109'))) {
    throw new Error('Opsi kandidat yang tersedia hanya anggota angkatan 25 (NIM 109...)!');
  }

  // Validate ranks are sequential starting from 1
  const ranks = votes.map(v => v.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) {
    if (ranks[i] !== i + 1) throw new Error('Urutan rank tidak valid!');
  }

  const voteRecord = {
    voter_id: voterId,
    voter_nim: voterNim,
    votes: votes,
    submitted_at: new Date().toISOString(),
  };

  const allVotes = getLocalVotes();
  const existingLocal = allVotes.find(v => v.voter_id === voterId);
  if (existingLocal) throw new Error('Kamu sudah pernah melakukan voting sebelumnya!');

  if (isSupabaseConfigured) {
    try {
      const { data: existing } = await supabase
        .from('votes')
        .select('id')
        .eq('voter_id', voterId)
        .maybeSingle();

      if (existing) throw new Error('Kamu sudah pernah melakukan voting sebelumnya!');

      await supabase
        .from('votes')
        .insert([{
          voter_id: voterId,
          voter_nim: voterNim,
          votes: votes,
        }]);
    } catch (err) {
      if (err.message && err.message.includes('sudah pernah')) throw err;
      console.warn('Supabase submitVote failed, storing locally:', err);
    }
  }

  allVotes.push(voteRecord);
  saveLocalVotes(allVotes);
  return voteRecord;
}

/**
 * Get a voter's existing vote record. Returns null if not voted yet.
 * This is a synchronous function (reads from localStorage directly).
 */
export function getMyVote(voterId) {
  if (typeof window === 'undefined') return null;
  const allVotes = getLocalVotes();
  return allVotes.find(v => v.voter_id === voterId) || null;
}

/**
 * Get aggregated voting results with weighted scores.
 * For admin use only (Aedil).
 * @param {Array} allMembers - All members from getMembers()
 * @returns {{ candidates: Array, allVotes: Array, totalEligibleVoters: number }}
 */
export function getVotingResults(allMembers) {
  if (typeof window === 'undefined') {
    return { candidates: [], allVotes: [], totalEligibleVoters: 0 };
  }

  const RANK_WEIGHTS = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 };
  const allVotes = getLocalVotes();

  // All members are eligible voters
  const totalEligibleVoters = allMembers.length;

  // Aggregate weighted scores per candidate
  const scoreMap = {};

  for (const voteRecord of allVotes) {
    for (const v of voteRecord.votes) {
      if (!scoreMap[v.candidate_id]) {
        scoreMap[v.candidate_id] = {
          candidateId:    v.candidate_id,
          candidateNama:  v.candidate_nama,
          candidateNim:   v.candidate_nim,
          totalScore:     0,
          rankBreakdown:  { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          voteCount:      0,
        };
      }
      const weight = RANK_WEIGHTS[v.rank] || 0;
      scoreMap[v.candidate_id].totalScore += weight;
      scoreMap[v.candidate_id].rankBreakdown[v.rank] =
        (scoreMap[v.candidate_id].rankBreakdown[v.rank] || 0) + 1;
      scoreMap[v.candidate_id].voteCount += 1;
    }
  }

  // Sort candidates by totalScore descending, then by voteCount as tiebreaker
  const candidates = Object.values(scoreMap).sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return b.voteCount - a.voteCount;
  });

  return { candidates, allVotes, totalEligibleVoters };
}

/**
 * Reset vote for a single voter (useful for testing or re-voting).
 */
export async function resetMyVote(voterId) {
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('votes')
        .delete()
        .eq('voter_id', voterId);
    } catch (e) {
      console.error("Error resetting vote in Supabase:", e);
    }
  }
  if (typeof window !== 'undefined') {
    const allVotes = getLocalVotes();
    const filtered = allVotes.filter(v => v.voter_id !== voterId);
    saveLocalVotes(filtered);
  }
}

/**
 * Reset all vote data. Admin-only action.
 */
export async function resetVotes() {
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('votes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.error("Error resetting all votes in Supabase:", e);
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(VOTING_DB_KEY);
  }
}

// ----------------------------------------------------
// LEGACY COMPATIBILITY HELPERS (For /dashboard, /memo, /letter)
// ----------------------------------------------------
const MOCK_FEEDBACK_KEY = 'hmif_eval_feedback_db';
const MOCK_STICKY_NOTES_KEY = 'hmif_eval_sticky_notes_db';

function saveLocalMembers(members) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_MEMBERS_KEY, JSON.stringify(members));
  }
}

function getLocalFeedback() {
  if (typeof window === 'undefined') return [];
  let data = localStorage.getItem(MOCK_FEEDBACK_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalFeedback(feedbacks) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_FEEDBACK_KEY, JSON.stringify(feedbacks));
  }
}

function getLocalStickyNotes() {
  if (typeof window === 'undefined') return [];
  let data = localStorage.getItem(MOCK_STICKY_NOTES_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalStickyNotes(notes) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_STICKY_NOTES_KEY, JSON.stringify(notes));
  }
}

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

export async function getFeedbacks(tujuan = null, departemen_pengirim = null) {
  if (isSupabaseConfigured) {
    let query = supabase
      .from('feedback_surat')
      .select('*, anggota:pengirim_id(nama, nim, departemen)')
      .order('created_at', { ascending: false });
    if (tujuan) query = query.eq('tujuan', tujuan);
    if (departemen_pengirim) query = query.eq('departemen_pengirim', departemen_pengirim);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  } else {
    const feedbacks = getLocalFeedback();
    const members = getLocalMembers();
    let joined = feedbacks.map(f => {
      const sender = members.find(m => m.id === f.pengirim_id);
      return {
        ...f,
        anggota: sender ? { nama: sender.nama, nim: sender.nim, departemen: sender.departemen } : null
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (tujuan) joined = joined.filter(f => f.tujuan === tujuan);
    if (departemen_pengirim) joined = joined.filter(f => f.departemen_pengirim === departemen_pengirim);
    return joined;
  }
}

export async function addFeedback(feedbackData) {
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
  const randomRotation = Math.floor(Math.random() * 12) - 6;
  const randomX = Math.floor(Math.random() * 80) + 10;
  const randomY = Math.floor(Math.random() * 60) + 10;
  const finalNote = { ...noteData, rotation: randomRotation, x_pos: randomX, y_pos: randomY };

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

