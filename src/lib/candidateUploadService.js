/**
 * candidateUploadService.js
 *
 * Handles the full resume-upload pipeline:
 *   1. Upload resume file → Supabase Storage (resumes bucket)
 *   2. Upsert candidate profile → Supabase DB via insert_candidate() RPC
 *
 * Returns { profileId, resumeUrl, isUpdate } on success.
 */

import { supabase } from './supabase';

// ─── Main entry point ─────────────────────────────────────────────────────────
export async function submitCandidateProfile({ form, file, resumeText }) {
  let resumeUrl  = '';
  let resumeFile = '';

  // ── STEP 1: Upload resume file to storage ──────────────────────────────────
  if (file) {
    const result = await uploadResume(file, form.email || form.name);
    resumeUrl  = result.url;
    resumeFile = result.fileName;
  }

  // ── STEP 2: Upsert candidate row via RPC ──────────────────────────────────
  const skillsStr = Array.isArray(form.skills)
    ? form.skills.join(', ')
    : (form.skills || '');

  let notesStr = form.notes || '';
  if (notesStr && !notesStr.trim().startsWith('[')) {
    notesStr = JSON.stringify([{
      id: Date.now(),
      author: "Parsing Portal",
      initials: "PP",
      color: "#2563EB",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      type: "text",
      text: notesStr.trim()
    }]);
  }

  const { data, error } = await supabase.rpc('insert_candidate', {
    p_name:        form.name        || '',
    p_email:       form.email       || '',
    p_phone:       form.phone       || '',
    p_linkedin:    form.linkedin    || '',
    p_location:    form.location    || '',
    p_visa:        form.visa        || '',
    p_title:       form.title       || '',
    p_skills:      skillsStr,
    p_experience:  form.experience  || '',
    p_employer:    form.currentEmployer || '',
    p_summary:     form.summary     || '',
    p_resume_url:  resumeUrl,
    p_resume_file: resumeFile,
    p_resume_text: (resumeText || '').slice(0, 50000), // cap at 50k chars
    p_notes:       notesStr || null,
    p_source:      'resume_upload',
  });

  if (error) throw error;

  const row = typeof data === 'string' ? JSON.parse(data) : data;
  return {
    profileId: row?.candidate_uuid || row?.id || null,
    resumeUrl,
    candidateName: row?.['Candidate Name'] || form.name || '',
    isUpdate: !!row?.last_updated,
  };
}

// ─── Upload file to Supabase Storage ─────────────────────────────────────────
async function uploadResume(file, identifier) {
  // Build a unique path: resumes/<slug>/<timestamp>.<ext>
  const ext      = getExtension(file.name);
  const slug     = slugify(identifier || 'candidate');
  const ts       = Date.now();
  const fileName = `${slug}_${ts}${ext}`;
  const path     = `uploads/${fileName}`;

  const { error } = await supabase.storage
    .from('resumes')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    });

  if (error) {
    // If upload fails (bucket not ready etc.), continue without resume URL
    console.error('[uploadService] Storage upload failed:', error.message);
    return { url: '', fileName: file.name };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('resumes')
    .getPublicUrl(path);

  return {
    url:      urlData?.publicUrl || '',
    fileName: file.name,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getExtension(filename) {
  const parts = (filename || '').split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
}

function slugify(str) {
  return (str || 'candidate')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'candidate';
}
