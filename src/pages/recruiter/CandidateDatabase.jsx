import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Spinner from '../../components/ui/Spinner.jsx';
import ExperienceSlider from '../../components/filters/ExperienceSlider.jsx';


// ─── STYLES ──────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #F7F6FB; color: #1A1A2E; }
  * { outline: none; }
  button, [role="button"] { cursor: pointer; user-select: none; }
  input, textarea, select { font-family: 'Inter', sans-serif; }

  /* ── Animations ── */
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes bounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes toastIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes toastOut { from{opacity:1} to{opacity:0;transform:translateY(4px)} }
  @keyframes fadeIn   { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  /* ── Layout ── */
  .ezhire-page { display:flex; flex-direction:column; height:100vh; background:#F7F6FB; font-family:'Inter',sans-serif; }
  .ezhire-topbar {
    height:56px; background:#fff; border-bottom:1px solid #E8E6F0;
    display:flex; align-items:center; padding:0 20px; gap:12px;
    position:sticky; top:0; z-index:50; flex-shrink:0;
  }
  .ezhire-topbar-brand { display:flex; align-items:center; gap:8px; }
  .ezhire-topbar-brand-icon {
    width:32px; height:32px; background:#6C5CE7; border-radius:8px;
    display:flex; align-items:center; justify-content:center;
    color:#fff; font-size:13px; font-weight:700; letter-spacing:-0.5px;
  }
  .ezhire-topbar-brand-name { font-size:15px; font-weight:700; color:#1A1A2E; }
  .ezhire-topbar-sep { width:1px; height:20px; background:#E8E6F0; margin:0 4px; }
  .ezhire-topbar-title { font-size:13px; font-weight:500; color:#6B6B8A; }
  .ezhire-topbar-actions { margin-left:auto; display:flex; align-items:center; gap:8px; }

  .ezhire-body { display:flex; flex:1; overflow:hidden; }

  /* ── Candidates Panel ── */
  .candidates-panel { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .candidates-filter-row {
    padding:16px 20px 12px; display:flex; align-items:center; gap:10px;
    border-bottom:1px solid #E8E6F0; background:#fff; flex-shrink:0;
  }
  .candidates-grid-area { flex:1; overflow-y:auto; padding:20px; }
  .candidates-grid {
    display:grid;
    grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));
    gap:14px;
  }

  /* ── Candidate Card ── */
  .cand-card {
    background:#fff; border:1px solid #E8E6F0; border-radius:14px; padding:18px;
    cursor:pointer; transition:all 0.15s ease; animation:fadeIn 0.25s ease forwards;
    position:relative;
  }
  .cand-card:hover { border-color:#C4BFEA; box-shadow:0 4px 16px rgba(108,92,231,0.08); transform:translateY(-1px); }
  .cand-card.selected { border-color:#6C5CE7; box-shadow:0 0 0 3px rgba(108,92,231,0.1); }

  /* Inline chat card */
  .inline-card {
    background:#fff; border:1px solid #E8E6F0; border-radius:14px; padding:14px 16px;
    transition:all 0.15s ease; cursor:pointer;
  }
  .inline-card:hover { border-color:#C4BFEA; box-shadow:0 2px 12px rgba(108,92,231,0.07); }

  /* ── Skeleton ── */
  .skeleton-rect {
    background:linear-gradient(90deg,#F0EFF8 25%,#E8E6F0 50%,#F0EFF8 75%);
    background-size:400px 100%;
    animation:shimmer 1.5s infinite linear;
    border-radius:6px;
  }

  /* ── Inputs ── */
  .ez-input {
    height:42px; padding:0 16px; font-size:14px; color:#1A1A2E;
    background:#fff; border:1px solid #E8E6F0; border-radius:10px;
    width:100%; transition:border-color 0.15s ease, box-shadow 0.15s ease;
    font-family:'Inter',sans-serif;
  }
  .ez-input::placeholder { color:#A0A0B8; }
  .ez-input:hover { border-color:#C4BFEA; }
  .ez-input:focus { border-color:#6C5CE7; box-shadow:0 0 0 3px rgba(108,92,231,0.12); }
  .ez-input:disabled { background:#F7F6FB; color:#A0A0B8; cursor:not-allowed; }

  .ez-textarea {
    padding:12px 16px; font-size:14px; line-height:1.7; color:#1A1A2E;
    background:#fff; border:1px solid #E8E6F0; border-radius:10px;
    resize:vertical; min-height:120px; width:100%;
    transition:border-color 0.15s ease, box-shadow 0.15s ease;
    font-family:'Inter',sans-serif;
  }
  .ez-textarea::placeholder { color:#A0A0B8; }
  .ez-textarea:hover { border-color:#C4BFEA; }
  .ez-textarea:focus { border-color:#6C5CE7; box-shadow:0 0 0 3px rgba(108,92,231,0.12); }

  .ez-select {
    height:42px; padding:0 36px 0 14px; font-size:13px; color:#1A1A2E;
    background:#fff; border:1px solid #E8E6F0; border-radius:10px;
    appearance:none; cursor:pointer; font-family:'Inter',sans-serif;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%236B6B8A' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 12px center; background-size:16px;
    transition:border-color 0.15s ease, box-shadow 0.15s ease;
    width:100%;
  }
  .ez-select:hover { border-color:#C4BFEA; }
  .ez-select:focus { border-color:#6C5CE7; box-shadow:0 0 0 3px rgba(108,92,231,0.12); }

  /* ── Buttons ── */
  .btn-filled {
    height:40px; padding:0 20px; font-size:13px; font-weight:500;
    color:#fff; background:#6C5CE7; border:none; border-radius:10px;
    transition:background 0.15s ease, transform 0.1s ease;
    display:inline-flex; align-items:center; justify-content:center; gap:6px;
    white-space:nowrap; cursor:pointer; user-select:none;
  }
  .btn-filled:hover { background:#5A4BD1; }
  .btn-filled:active { background:#4A3DC0; transform:scale(0.97); }
  .btn-filled:disabled { background:#C4BFEA; cursor:not-allowed; }
  .btn-filled.sm { height:34px; padding:0 14px; font-size:12px; }
  .btn-filled.lg { height:42px; padding:0 24px; font-size:14px; }

  .btn-outlined {
    height:40px; padding:0 20px; font-size:13px; font-weight:500;
    color:#6C5CE7; background:transparent; border:1px solid #6C5CE7; border-radius:10px;
    transition:all 0.15s ease; display:inline-flex; align-items:center; gap:6px;
    white-space:nowrap; cursor:pointer; user-select:none;
  }
  .btn-outlined:hover { background:#F0EEFF; }
  .btn-outlined:active { background:#E4DFFC; transform:scale(0.97); }
  .btn-outlined.sm { height:34px; padding:0 14px; font-size:12px; }
  .btn-outlined.lg { height:42px; font-size:14px; }

  .btn-ghost {
    height:38px; padding:0 16px; font-size:13px; font-weight:400;
    color:#6B6B8A; background:transparent; border:1px solid #E8E6F0; border-radius:10px;
    transition:all 0.15s ease; display:inline-flex; align-items:center; gap:6px;
    white-space:nowrap; cursor:pointer; user-select:none;
  }
  .btn-ghost:hover { background:#F7F6FB; border-color:#C4BFEA; color:#1A1A2E; }
  .btn-ghost:active { transform:scale(0.97); }
  .btn-ghost.sm { height:32px; padding:0 12px; font-size:12px; }

  .btn-icon {
    width:34px; height:34px; border-radius:8px; border:1px solid #E8E6F0;
    background:transparent; display:flex; align-items:center; justify-content:center;
    transition:all 0.15s ease; cursor:pointer; flex-shrink:0;
  }
  .btn-icon:hover { background:#F7F6FB; border-color:#C4BFEA; }
  .btn-icon:active { transform:scale(0.93); }
  .btn-icon.bookmarked { border-color:#F59E0B; background:#FFF4E5; }

  /* ── Chips ── */
  .prompt-chip {
    padding:8px 16px; font-size:12px; font-weight:500;
    color:#6C5CE7; background:#fff; border:1px solid #D4CFFA; border-radius:20px;
    transition:all 0.15s ease; white-space:nowrap; cursor:pointer; user-select:none;
    display:inline-flex; align-items:center;
  }
  .prompt-chip:hover { background:#F0EEFF; border-color:#6C5CE7; }
  .prompt-chip:active { transform:scale(0.96); }
  .prompt-chip.dismissed { opacity:0; transform:translateY(-4px); transition:opacity 0.2s ease, transform 0.2s ease; pointer-events:none; }

  /* ── Toggle pills ── */
  .toggle-pill {
    padding:7px 16px; font-size:12px; font-weight:500;
    border-radius:20px; border:1px solid #E8E6F0; background:#fff; color:#6B6B8A;
    transition:all 0.15s ease; user-select:none; cursor:pointer;
  }
  .toggle-pill:hover { border-color:#C4BFEA; color:#1A1A2E; }
  .toggle-pill.active { background:#F0EEFF; border-color:#6C5CE7; color:#5B4FCC; }

  /* ── Checkbox ── */
  .ez-checkbox {
    width:16px; height:16px; border-radius:5px; border:1.5px solid #C4BFEA;
    background:#fff; appearance:none; cursor:pointer; flex-shrink:0;
    transition:all 0.1s ease;
  }
  .ez-checkbox:hover { border-color:#6C5CE7; }
  .ez-checkbox:checked {
    background:#6C5CE7; border-color:#6C5CE7;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='%23fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='m2 6 3 3 5-5'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:center; background-size:10px;
  }
  .ez-check-label {
    font-size:13px; color:#1A1A2E; cursor:pointer;
    display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px;
    transition:background 0.12s ease;
  }
  .ez-check-label:hover { background:#F7F6FB; }

  /* ── Skill tag ── */
  .skill-tag {
    display:inline-flex; align-items:center; padding:4px 11px;
    font-size:11px; font-weight:500; border-radius:20px; white-space:nowrap;
    user-select:none;
  }

  /* ── Status badge ── */
  .status-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 10px; font-size:11px; font-weight:500; border-radius:20px;
    user-select:none;
  }
  .status-dot { width:6px; height:6px; border-radius:50%; display:inline-block; flex-shrink:0; }
  .status-dot.pulse { animation:pulse 1.8s infinite; }

  /* ── Ezra Panel ── */
  .ezra-panel {
    width:360px; flex-shrink:0; background:#fff; border-left:1px solid #E8E6F0;
    display:flex; flex-direction:column; height:100%; overflow:hidden;
    transition:transform 0.25s ease;
  }
  .ezra-header {
    height:56px; border-bottom:1px solid #E8E6F0; padding:0 16px;
    display:flex; align-items:center; gap:10px; flex-shrink:0;
  }
  .ezra-avatar {
    width:32px; height:32px; background:#6C5CE7; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    color:#fff; font-size:11px; font-weight:600; flex-shrink:0;
  }
  .ezra-messages { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:14px; }
  .ezra-messages::-webkit-scrollbar { width:4px; }
  .ezra-messages::-webkit-scrollbar-track { background:transparent; }
  .ezra-messages::-webkit-scrollbar-thumb { background:#E8E6F0; border-radius:2px; }

  .msg-user {
    display:flex; justify-content:flex-end;
  }
  .msg-user-bubble {
    background:#6C5CE7; color:#fff; font-size:14px; border-radius:18px 18px 4px 18px;
    max-width:72%; padding:10px 14px; line-height:1.5;
  }
  .msg-ezra { display:flex; gap:8px; align-items:flex-start; }
  .msg-ezra-mini-avatar {
    width:26px; height:26px; background:#6C5CE7; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    color:#fff; font-size:9px; font-weight:600; flex-shrink:0; margin-top:2px;
  }
  .msg-ezra-content { display:flex; flex-direction:column; gap:8px; max-width:88%; }
  .msg-ezra-bubble {
    background:#F0EEFF; color:#1A1A2E; font-size:14px;
    border-radius:18px 18px 18px 4px; padding:10px 14px; line-height:1.6;
  }
  .msg-time { font-size:11px; color:#A0A0B8; padding-left:4px; }

  .typing-indicator { display:flex; gap:4px; align-items:center; padding:2px 0; }
  .typing-dot {
    width:7px; height:7px; background:#A0A0B8; border-radius:50%;
    animation:bounce 0.9s infinite;
  }
  .typing-dot:nth-child(2) { animation-delay:0.15s; }
  .typing-dot:nth-child(3) { animation-delay:0.3s; }

  .ezra-chips { display:flex; flex-wrap:wrap; gap:8px; padding:0 16px 12px; }
  .ezra-input-bar {
    border-top:1px solid #E8E6F0; padding:12px 16px; background:#fff;
    display:flex; gap:8px; align-items:flex-end; flex-shrink:0;
  }
  .ezra-input {
    flex:1; padding:10px 16px; font-size:14px; color:#1A1A2E;
    background:#fff; border:1px solid #E8E6F0; border-radius:22px;
    resize:none; line-height:1.5; max-height:120px; overflow-y:auto;
    transition:border-color 0.15s ease, box-shadow 0.15s ease;
    font-family:'Inter',sans-serif;
  }
  .ezra-input::placeholder { color:#A0A0B8; }
  .ezra-input:hover { border-color:#C4BFEA; }
  .ezra-input:focus { border-color:#6C5CE7; box-shadow:0 0 0 3px rgba(108,92,231,0.12); }
  .ezra-send-btn {
    width:38px; height:38px; border-radius:50%; background:#6C5CE7;
    border:none; display:flex; align-items:center; justify-content:center;
    color:#fff; cursor:pointer; flex-shrink:0; transition:transform 0.1s ease, background 0.15s ease;
  }
  .ezra-send-btn:hover { background:#5A4BD1; }
  .ezra-send-btn:active { transform:scale(0.93); }

  /* ── Action strip below inline cards ── */
  .action-strip { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }

  /* ── Detail Page ── */
  .detail-page { flex:1; overflow-y:auto; padding:28px 24px; }
  .detail-back {
    font-size:13px; color:#6C5CE7; background:none; border:none;
    cursor:pointer; display:inline-flex; align-items:center; gap:6px;
    margin-bottom:20px; transition:opacity 0.15s ease; padding:0;
  }
  .detail-back:hover { opacity:0.75; }
  .detail-cols { display:flex; gap:24px; align-items:flex-start; }
  .detail-left { width:340px; flex-shrink:0; display:flex; flex-direction:column; gap:20px; }
  .detail-right { flex:1; display:flex; flex-direction:column; gap:20px; min-width:0; }

  .detail-card {
    background:#fff; border:1px solid #E8E6F0; border-radius:16px; padding:24px;
    animation:fadeIn 0.2s ease;
  }
  .detail-card-sm {
    background:#fff; border:1px solid #E8E6F0; border-radius:14px; padding:24px;
    animation:fadeIn 0.25s ease;
  }

  .detail-section-label {
    font-size:11px; font-weight:500; color:#A0A0B8; letter-spacing:0.07em;
    text-transform:uppercase; margin-bottom:14px;
  }

  /* ── Stats list ── */
  .stat-row { display:flex; align-items:center; gap:10px; padding:8px 0; }
  .stat-icon { width:32px; height:32px; border-radius:8px; background:#F7F6FB; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .stat-label { font-size:11px; color:#A0A0B8; }
  .stat-value { font-size:13px; font-weight:500; color:#1A1A2E; }

  /* ── Timeline ── */
  .timeline-entry { display:flex; gap:16px; position:relative; padding-bottom:20px; }
  .timeline-entry:last-child { padding-bottom:0; }
  .timeline-entry:last-child .timeline-line { display:none; }
  .timeline-left { display:flex; flex-direction:column; align-items:center; }
  .timeline-dot { width:8px; height:8px; border-radius:50%; background:#6C5CE7; flex-shrink:0; margin-top:4px; }
  .timeline-line { width:1px; background:#E8E6F0; flex:1; margin-top:4px; }

  /* ── Submission table ── */
  .sub-table { width:100%; border-collapse:collapse; font-size:13px; }
  .sub-table th { font-size:11px; font-weight:500; color:#A0A0B8; text-transform:uppercase; letter-spacing:0.05em; padding:0 12px 10px; text-align:left; }
  .sub-table td { padding:10px 12px; }
  .sub-table tr:nth-child(even) td { background:#F7F6FB; }

  /* ── Draft modal ── */
  .modal-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.38); z-index:200;
    display:flex; align-items:center; justify-content:center; padding:24px;
    animation:fadeIn 0.18s ease;
  }
  .modal-box {
    background:#fff; border-radius:16px; padding:28px;
    width:100%; max-width:520px; border:1px solid #E8E6F0;
    box-shadow:0 20px 60px rgba(0,0,0,0.15);
    animation:slideUp 0.22s ease;
  }
  .modal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .modal-title { font-size:16px; font-weight:600; color:#1A1A2E; }
  .modal-field { display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
  .modal-label { font-size:12px; font-weight:500; color:#6B6B8A; }
  .modal-footer { display:flex; gap:8px; margin-top:20px; justify-content:flex-end; }

  /* ── Toast ── */
  .toast-container { position:fixed; bottom:24px; right:24px; z-index:999; display:flex; flex-direction:column; gap:8px; }
  .toast {
    display:inline-flex; align-items:center; gap:8px;
    padding:10px 20px; border-radius:20px; font-size:13px; font-weight:500; color:#fff;
    animation:toastIn 0.18s ease forwards;
    white-space:nowrap;
  }
  .toast.success { background:#0D7A4E; }
  .toast.info    { background:#6C5CE7; }
  .toast.error   { background:#A32D2D; }
  .toast.exiting { animation:toastOut 0.25s ease forwards; }

  /* ── Filter row ── */
  .filter-pill-row { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .active-filter-badge {
    font-size:10px; font-weight:600; color:#fff; background:#6C5CE7;
    border-radius:10px; padding:1px 6px; margin-left:6px;
  }

  /* ── Notes auto-save indicator ── */
  .save-indicator {
    font-size:11px; color:#12B76A; position:absolute; right:0; top:-18px;
    animation:fadeIn 0.15s ease;
    transition:opacity 0.3s ease;
  }

  /* ── Tabs ── */
  .tab-list { display:flex; border-bottom:1px solid #E8E6F0; margin-bottom:20px; }
  .tab-trigger {
    padding:10px 16px; font-size:13px; font-weight:500; color:#6B6B8A;
    border:none; background:none; cursor:pointer; position:relative;
    transition:color 0.15s ease;
  }
  .tab-trigger:hover { color:#1A1A2E; }
  .tab-trigger.active { color:#6C5CE7; }
  .tab-trigger.active::after {
    content:''; position:absolute; bottom:-1px; left:0; right:0;
    height:2px; background:#6C5CE7; border-radius:1px 1px 0 0;
  }

  /* ── Range slider ── */
  .ez-slider {
    width:100%; height:4px; border-radius:2px; appearance:none; cursor:pointer;
    background:linear-gradient(to right, #6C5CE7 var(--val,40%), #E8E6F0 var(--val,40%));
  }
  .ez-slider::-webkit-slider-thumb {
    width:18px; height:18px; border-radius:50%; background:#6C5CE7;
    border:2px solid #fff; box-shadow:0 0 0 1px #6C5CE7; appearance:none; cursor:pointer;
    transition:transform 0.1s ease;
  }
  .ez-slider::-webkit-slider-thumb:hover { transform:scale(1.2); }
  .ez-slider::-webkit-slider-thumb:active { transform:scale(1.1); }

  /* ── Summary quote bar ── */
  .summary-quote {
    border-left:4px solid #6C5CE7; background:#F7F6FB;
    padding:12px 16px; font-size:14px; color:#1A1A2E; line-height:1.7;
    border-radius:0 8px 8px 0;
  }
  .inline-summary-quote {
    border-left:3px solid #6C5CE7; background:#F7F6FB;
    padding:6px 10px; font-size:12px; font-style:italic; color:#6B6B8A;
    line-height:1.6;
  }

  @media (max-width:1024px) {
    .ezra-panel { position:fixed; right:0; top:0; bottom:0; z-index:100; transform:translateX(100%); }
    .ezra-panel.open { transform:translateX(0); }
    .detail-cols { flex-direction:column; }
    .detail-left { width:100%; }
  }
  @media (max-width:640px) {
    .detail-page { padding:16px; }
    .candidates-grid { grid-template-columns:1fr; }
    .ezra-panel { width:100vw; }
  }
`;

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const SKILL_TAG_COLORS = [
  { bg: '#F0EEFF', text: '#5B4FCC' },
  { bg: '#E1F5EE', text: '#0F6E56' },
  { bg: '#E6F1FB', text: '#185FA5' },
  { bg: '#FAECE7', text: '#993C1D' },
  { bg: '#FAEEDA', text: '#854F0B' },
];
const AVATAR_COLORS = [
  { bg: '#F0EEFF', text: '#5B4FCC' },
  { bg: '#E1F5EE', text: '#0F6E56' },
  { bg: '#E6F1FB', text: '#185FA5' },
];
const STATUS_COLORS = {
  'Available Now':  { bg: '#E6F9F1', text: '#0D7A4E', dot: '#12B76A', pulse: true },
  'On Project':     { bg: '#FFF4E5', text: '#9A5000', dot: '#F59E0B', pulse: false },
  'Available Soon': { bg: '#EEF2FF', text: '#3730A3', dot: '#6C5CE7', pulse: false },
  'Not Available':  { bg: '#F4F4F5', text: '#71717A', dot: '#A1A1AA', pulse: false },
};

function getSkillColor(i)  { return SKILL_TAG_COLORS[i % 5]; }
function getAvatarColor(name) {
  const code = (name || '').charCodeAt(0) || 0;
  return AVATAR_COLORS[code % 3];
}
function getCategoryColor(cat) {
  const c = (cat || '').toLowerCase();
  if (c.includes('cloud')) return SKILL_TAG_COLORS[0];
  if (c.includes('backend') || c.includes('java') || c.includes('python')) return SKILL_TAG_COLORS[1];
  if (c.includes('frontend') || c.includes('ui')) return SKILL_TAG_COLORS[2];
  if (c.includes('data') || c.includes('ai') || c.includes('ml')) return SKILL_TAG_COLORS[3];
  return SKILL_TAG_COLORS[4];
}
function initials(name) {
  return (name || '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}
function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const CANDIDATES = [
  {
    id: 'cand-1',
    name: 'Suresh Balakrishnan',
    role: 'Cloud/Azure Architect',
    status: 'Available Now',
    location: 'Austin, TX',
    visa: 'GC',
    experience: 11,
    workPref: 'Remote',
    availableFrom: 'Immediately',
    lastUpdated: '2 days ago',
    email: 'suresh.bala@email.com',
    phone: '+1 (512) 849-2034',
    linkedin: 'https://linkedin.com/in/sureshbala',
    summary: 'Suresh is a strong fit for mid-to-senior cloud roles. 11 years on Azure and AWS, GC holder, based in Austin. Last project was a microservices migration for a fintech client. Available immediately, prefers remote.',
    skills: {
      Cloud:   ['Azure', 'AWS', 'GCP', 'Kubernetes', 'Terraform'],
      Backend: ['Java', 'Python', 'Node.js', 'REST APIs'],
      Data:    ['Snowflake', 'Databricks', 'SQL'],
    },
    history: [
      { company: 'FinTech Corp', role: 'Lead Cloud Architect', dates: 'Jan 2021 – Present', desc: 'Led microservices migration to Azure, reduced infra cost by 38%. Managed team of 8 engineers.' },
      { company: 'Infosys', role: 'Senior Cloud Engineer', dates: 'Mar 2017 – Dec 2020', desc: 'Architected multi-region AWS infrastructure for banking clients. Achieved 99.99% uptime SLA.' },
      { company: 'TCS', role: 'Cloud Developer', dates: 'Jun 2013 – Feb 2017', desc: 'Developed cloud-native solutions on AWS EC2, S3, and Lambda for enterprise clients.' },
    ],
    submissions: [
      { client: 'Goldman Sachs', role: 'Cloud Architect', date: 'May 2025', status: 'Interview' },
      { client: 'JP Morgan', role: 'Azure Lead', date: 'Mar 2025', status: 'Submitted' },
    ],
  },
  {
    id: 'cand-2',
    name: 'Mohini Missula',
    role: 'Java / AI Engineer',
    status: 'Available Now',
    location: 'Dallas, TX',
    visa: 'H1B',
    experience: 7,
    workPref: 'Hybrid',
    availableFrom: 'Immediately',
    lastUpdated: '1 day ago',
    email: 'mohini.m@email.com',
    phone: '+1 (214) 603-8821',
    linkedin: 'https://linkedin.com/in/mohinim',
    summary: 'Mohini combines strong Java backend expertise with emerging AI/ML skills. H1B holder based in Dallas. 7 years in enterprise Java, recently pivoting to AI engineering with LLM integrations.',
    skills: {
      Backend: ['Java', 'Spring Boot', 'Microservices', 'Python'],
      'AI/ML': ['LangChain', 'OpenAI API', 'RAG', 'Vector DBs'],
      Cloud:   ['AWS', 'Docker', 'Jenkins'],
    },
    history: [
      { company: 'Cognizant', role: 'Senior Java Developer', dates: 'Feb 2020 – Present', desc: 'Built enterprise Java microservices for healthcare data pipelines. Led AI integration initiative with LangChain.' },
      { company: 'HCL Technologies', role: 'Java Developer', dates: 'Jun 2017 – Jan 2020', desc: 'Developed Spring Boot APIs for retail banking applications. Migrated legacy monolith to microservices.' },
      { company: 'Wipro', role: 'Associate Developer', dates: 'Jul 2016 – May 2017', desc: 'Java development for insurance client applications.' },
    ],
    submissions: [
      { client: 'UnitedHealth', role: 'Java Engineer', date: 'Jun 2025', status: 'Offer' },
      { client: 'Citi', role: 'AI Developer', date: 'Apr 2025', status: 'Rejected' },
    ],
  },
  {
    id: 'cand-3',
    name: 'Anandh Arumugan',
    role: 'Senior Product Designer',
    status: 'On Project',
    location: 'New York, NY',
    visa: 'USC',
    experience: 9,
    workPref: 'Remote',
    availableFrom: 'Aug 2025',
    lastUpdated: '5 days ago',
    email: 'anandh.a@email.com',
    phone: '+1 (917) 441-7703',
    linkedin: 'https://linkedin.com/in/anandhdesigns',
    summary: 'Anandh is a US citizen designer with 9 years building B2B SaaS products at scale. Currently on a 6-month contract with a fintech startup. Expert in Figma, design systems, and user research.',
    skills: {
      'UI/UX': ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
      Frontend: ['React', 'CSS', 'Framer'],
      Other:   ['Storybook', 'Zeplin', 'Miro'],
    },
    history: [
      { company: 'Stripe (Contract)', role: 'Senior Product Designer', dates: 'Jan 2025 – Present', desc: 'Redesigning merchant dashboard. Established design system used across 12 product teams.' },
      { company: 'Robinhood', role: 'Product Designer', dates: 'Mar 2019 – Dec 2024', desc: 'Led design for crypto trading and options features. Grew DAU by 2.1M through UX improvements.' },
      { company: 'InVision', role: 'UX Designer', dates: 'Aug 2016 – Feb 2019', desc: 'Designed collaboration features for InVision Studio. Collaborated with engineering in Agile sprints.' },
    ],
    submissions: [],
  },
  {
    id: 'cand-4',
    name: 'Maheshwari Kakkireni',
    role: 'Senior AEM Developer',
    status: 'Available Soon',
    location: 'Chicago, IL',
    visa: 'H1B',
    experience: 6,
    workPref: 'Onsite',
    availableFrom: 'Jul 15, 2025',
    lastUpdated: '3 days ago',
    email: 'mahesh.k@email.com',
    phone: '+1 (312) 557-9900',
    linkedin: 'https://linkedin.com/in/maheshwariak',
    summary: 'Maheshwari specializes in Adobe Experience Manager with 6 years of hands-on development. H1B, based in Chicago, available for onsite roles starting mid-July.',
    skills: {
      'CMS/AEM': ['Adobe AEM', 'Sling', 'OSGi', 'JCR'],
      Backend:   ['Java', 'Maven', 'REST APIs'],
      Frontend:  ['HTML5', 'CSS3', 'JavaScript', 'HTL'],
    },
    history: [
      { company: 'Accenture', role: 'AEM Developer', dates: 'Apr 2022 – Present', desc: 'AEM implementation for Fortune 500 retail client. Built 40+ custom AEM components.' },
      { company: 'Deloitte Digital', role: 'Java/AEM Developer', dates: 'Jul 2019 – Mar 2022', desc: 'Developed AEM-based digital experience platform for healthcare client.' },
      { company: 'Mindtree', role: 'Java Developer', dates: 'Aug 2018 – Jun 2019', desc: 'Junior Java developer on enterprise CMS projects.' },
    ],
    submissions: [
      { client: 'Target Corp', role: 'AEM Architect', date: 'May 2025', status: 'Interview' },
    ],
  },
  {
    id: 'cand-5',
    name: 'Muhammad Suleman',
    role: 'Lead Software Engineer',
    status: 'Available Now',
    location: 'Remote',
    visa: 'TN',
    experience: 12,
    workPref: 'Remote',
    availableFrom: 'Immediately',
    lastUpdated: 'Today',
    email: 'muhammad.s@email.com',
    phone: '+1 (469) 203-6611',
    linkedin: 'https://linkedin.com/in/muhammadsuleman',
    summary: 'Muhammad has 12 years leading full-stack engineering teams across fintech and e-commerce. TN visa, fully remote, available immediately. Strong in Java, Python, and distributed systems.',
    skills: {
      Backend:  ['Java', 'Python', 'Go', 'Node.js'],
      Cloud:    ['AWS', 'GCP', 'Terraform', 'Kubernetes'],
      Frontend: ['React', 'TypeScript'],
      Data:     ['PostgreSQL', 'MongoDB', 'Redis'],
    },
    history: [
      { company: 'PayPal', role: 'Lead Software Engineer', dates: 'Mar 2020 – Present', desc: 'Led 15-person engineering team building payment processing microservices. Reduced latency by 45%.' },
      { company: 'Amazon', role: 'Software Engineer II', dates: 'Jun 2016 – Feb 2020', desc: 'Core contributor to AWS Lambda runtime optimizations. Built internal tooling used by 200+ teams.' },
      { company: 'Shopify', role: 'Software Engineer', dates: 'Jan 2013 – May 2016', desc: 'Full-stack development for merchant-facing features. Helped scale platform from 50K to 500K merchants.' },
    ],
    submissions: [
      { client: 'Netflix', role: 'Staff Engineer', date: 'Jun 2025', status: 'Interview' },
      { client: 'Uber', role: 'Lead Engineer', date: 'May 2025', status: 'Submitted' },
    ],
  },
  {
    id: 'cand-6',
    name: 'Ashok Marakani',
    role: 'Azure AI Architect',
    status: 'Not Available',
    location: 'San Jose, CA',
    visa: 'GC',
    experience: 14,
    workPref: 'Hybrid',
    availableFrom: 'Oct 2025',
    lastUpdated: '1 week ago',
    email: 'ashok.m@email.com',
    phone: '+1 (408) 993-4410',
    linkedin: 'https://linkedin.com/in/ashokmarakani',
    summary: 'Ashok is a senior Azure AI architect with 14 years in enterprise AI and cloud. GC holder in San Jose. Currently engaged through September. Specialist in Azure Cognitive Services and MLOps.',
    skills: {
      Cloud:  ['Azure', 'Azure OpenAI', 'Azure ML', 'Kubernetes'],
      'AI/ML': ['MLOps', 'LLMs', 'Cognitive Services', 'PyTorch'],
      Data:   ['Databricks', 'Synapse', 'Snowflake'],
    },
    history: [
      { company: 'Microsoft', role: 'Principal AI Architect', dates: 'Feb 2019 – Present', desc: 'Designed AI solutions for Fortune 100 clients using Azure Cognitive Services and Azure OpenAI.' },
      { company: 'Intel', role: 'Senior AI Engineer', dates: 'May 2014 – Jan 2019', desc: 'Built ML pipelines for semiconductor process optimization. Published 3 patents.' },
      { company: 'Nvidia', role: 'Software Engineer', dates: 'Aug 2010 – Apr 2014', desc: 'CUDA development and ML research for graphics AI applications.' },
    ],
    submissions: [
      { client: 'Bank of America', role: 'AI Architect', date: 'Apr 2025', status: 'Submitted' },
    ],
  },
];

// Pre-loaded chat messages
function buildInitialMessages() {
  const t1 = '10:32 AM';
  const t2 = '10:32 AM';
  const t3 = '10:34 AM';
  const t4 = '10:34 AM';
  return [
    { id: 'm0', role: 'ezra', text: "Hey — I'm Ezra. Tell me what you're looking for and I'll pull the right candidates. Plain English works fine.", time: '10:31 AM', cards: null },
    { id: 'm1', role: 'user', text: 'Show me available Java developers', time: t1 },
    { id: 'm2', role: 'ezra', text: 'Found 3 Java developers available right now. All open to remote or hybrid work.', time: t2, cards: ['cand-2', 'cand-5', 'cand-1'] },
    { id: 'm3', role: 'user', text: 'Tell me more about Suresh', time: t3 },
    { id: 'm4', role: 'ezra', text: "Suresh is a strong fit for mid-to-senior cloud roles. 11 years on Azure and AWS, GC holder, based in Austin. Last project was a microservices migration for a fintech client. Available immediately, prefers remote.", time: t4, cards: null },
  ];
}

const SUGGESTED_PROMPTS = [
  'Show me available Java developers',
  'Find H1B candidates in Texas',
  "Who's been on bench longest?",
  'Draft a submission for Suresh',
];

const STATUS_RESPONSES = {
  'Available Now':  { label: 'submitted', color: '#6C5CE7' },
  'Interview':      { label: 'interview', color: '#D97706' },
  'Offer':          { label: 'offer',     color: '#0D7A4E' },
  'Rejected':       { label: 'rejected',  color: '#A32D2D' },
};

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

function Avatar({ name, size = 40 }) {
  const col = getAvatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: col.bg, color: col.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 600, flexShrink: 0, userSelect: 'none',
    }}>
      {initials(name)}
    </div>
  );
}

function StatusBadge({ status, size = 'sm' }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS['Not Available'];
  return (
    <span className="status-badge" style={{ background: s.bg, color: s.text, fontSize: size === 'sm' ? 11 : 13 }}>
      <span className={`status-dot${s.pulse ? ' pulse' : ''}`} style={{ background: s.dot }} />
      {status}
    </span>
  );
}

function SkillTag({ label, index }) {
  const col = getSkillColor(index);
  return (
    <span className="skill-tag" style={{ background: col.bg, color: col.text }}>{label}</span>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E6F0', borderRadius: 14, padding: 18 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
        <div className="skeleton-rect" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="skeleton-rect" style={{ height: 13, width: '60%' }} />
          <div className="skeleton-rect" style={{ height: 11, width: '40%' }} />
        </div>
      </div>
      <div className="skeleton-rect" style={{ height: 11, width: '80%', marginBottom: 8 }} />
      <div className="skeleton-rect" style={{ height: 11, width: '55%', marginBottom: 14 }} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[70, 55, 65].map((w, i) => <div key={i} className="skeleton-rect" style={{ height: 22, width: w, borderRadius: 20 }} />)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton-rect" style={{ height: 34, flex: 1, borderRadius: 10 }} />
        <div className="skeleton-rect" style={{ height: 34, flex: 1, borderRadius: 10 }} />
      </div>
    </div>
  );
}

// ─── DRAFT EMAIL MODAL ────────────────────────────────────────────────────────
function DraftEmailModal({ candidate, onClose, showToast }) {
  const [to, setTo] = useState(candidate?.email || '');
  const [subject, setSubject] = useState(
    candidate ? `Exciting Opportunity: ${candidate.role} Role at EzHire` : ''
  );
  const [body, setBody] = useState(
    candidate
      ? `Hi ${candidate.name.split(' ')[0]},\n\nI hope this email finds you well.\n\nI came across your profile and was highly impressed by your background as a ${candidate.role} with expertise in ${Object.values(candidate.skills || {}).flat().slice(0, 4).join(', ')}.\n\nWe have an exciting opportunity that matches your skills perfectly. Let me know if you would be open to a brief 10-minute chat this week to discuss details.\n\nLooking forward to hearing from you!\n\nBest regards,\nRahul\nEzHire Recruiting Team`
      : ''
  );

  function regenerate() {
    setBody(`Hi ${candidate?.name.split(' ')[0] || 'there'},\n\nHope you're doing great. I'm reaching out because your experience with ${Object.values(candidate?.skills || {}).flat().slice(0, 3).join(', ')} aligns well with some of our open positions. Are you open to exploring new roles at the moment?\n\nLet's connect!\n\nBest,\nRahul`);
    showToast('Outreach email regenerated', 'info');
  }

  function copyEmail() {
    navigator.clipboard.writeText(body).then(() => showToast('Email copied!', 'success'));
  }

  function openGmail() {
    const url = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Draft outreach email</span>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#6B6B8A" strokeWidth="2" strokeLinecap="round" d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="modal-field">
          <label className="modal-label">Candidate Email</label>
          <input className="ez-input" value={to} onChange={e => setTo(e.target.value)} placeholder="Candidate email" />
        </div>
        <div className="modal-field">
          <label className="modal-label">Subject</label>
          <input className="ez-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject" />
        </div>
        <div className="modal-field">
          <label className="modal-label">Body</label>
          <textarea
            className="ez-textarea"
            style={{ minHeight: 180 }}
            value={body}
            onChange={e => setBody(e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" style={{ marginRight: 'auto' }} onClick={regenerate}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M3 3v5h5"/></svg>
            Regenerate
          </button>
          <button className="btn-outlined" onClick={copyEmail}>Copy</button>
          <button className="btn-filled" onClick={openGmail}>Send Email</button>
        </div>
      </div>
    </div>
  );
}

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}${t.exiting ? ' exiting' : ''}`}>
          {t.type === 'success' && <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="2.5" strokeLinecap="round" d="m4 12 6 6L20 6"/></svg>}
          {t.type === 'info' && <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2"/><path stroke="#fff" strokeWidth="2" strokeLinecap="round" d="M12 8v4M12 16h.01"/></svg>}
          {t.type === 'error' && <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="2.5" strokeLinecap="round" d="M18 6 6 18M6 6l12 12"/></svg>}
          {t.message}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 250);
    }, 2200);
  }, []);
  return { toasts, showToast };
}

// ─── INLINE CANDIDATE CARD (for Ezra chat) ────────────────────────────────────
function InlineCandidateCard({ candidate, onViewProfile, onDraftEmail }) {
  const [bookmarked, setBookmarked] = useState(false);
  const allSkills = Object.values(candidate.skills || {}).flat();
  const shown = allSkills.slice(0, 3);
  const extra = allSkills.length - shown.length;

  function toggleBookmark(e) {
    e.stopPropagation();
    setBookmarked(b => !b);
  }

  return (
    <div className="inline-card" style={{ animation: 'fadeIn 0.2s ease' }}>
      {/* Row 1 — Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Avatar name={candidate.name} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {candidate.name}
          </div>
          <div style={{ fontSize: 12, color: '#6B6B8A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {candidate.role}
          </div>
        </div>
        <StatusBadge status={candidate.status} />
      </div>

      {/* Row 2 — Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#6B6B8A', display: 'flex', alignItems: 'center', gap: 3 }}>
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/></svg>
          {candidate.location}
        </span>
        <span style={{ fontSize: 11, fontWeight: 500, background: '#F0EEFF', color: '#5B4FCC', borderRadius: 20, padding: '2px 8px' }}>{candidate.visa}</span>
        <span style={{ fontSize: 12, color: '#6B6B8A' }}>{candidate.experience} yrs</span>
      </div>

      {/* Row 3 — AI summary */}
      <div className="inline-summary-quote" style={{ marginBottom: 10, borderRadius: '0 6px 6px 0' }}>
        {candidate.summary.slice(0, 110)}{candidate.summary.length > 110 ? '…' : ''}
      </div>

      {/* Row 4 — Skills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
        {shown.map((s, i) => <SkillTag key={s} label={s} index={i} />)}
        {extra > 0 && <span style={{ fontSize: 11, color: '#6B6B8A', background: '#F7F6FB', border: '1px solid #E8E6F0', borderRadius: 20, padding: '3px 9px' }}>+{extra} more</span>}
      </div>

      {/* Row 5 — Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn-filled sm" style={{ flex: 1 }} onClick={() => onViewProfile(candidate)}>View full profile</button>
        <button className="btn-outlined sm" style={{ flex: 1 }} onClick={() => onDraftEmail(candidate)}>Draft email</button>
        <button
          className={`btn-icon${bookmarked ? ' bookmarked' : ''}`}
          style={{ width: 32, height: 32 }}
          onClick={toggleBookmark}
          aria-label="Bookmark"
        >
          <svg width="14" height="14" fill={bookmarked ? '#F59E0B' : 'none'} viewBox="0 0 24 24">
            <path stroke={bookmarked ? '#F59E0B' : '#6B6B8A'} strokeWidth="2" strokeLinecap="round" d="M5 3h14a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── EZRA PANEL ───────────────────────────────────────────────────────────────
function EzraPanel({ candidates, isOpen, onClose, onViewProfile, onDraftEmail, showToast }) {
  const [messages, setMessages] = useState(buildInitialMessages);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [chipsVisible, setChipsVisible] = useState(true);
  const [dismissedChips, setDismissedChips] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Build candidate context string for AI
  const candidateContext = useMemo(() => {
    return candidates.map(c => {
      const allSkills = Object.values(c.skills || {}).flat().join(', ');
      return `ID:${c.id} | Name:${c.name} | Role:${c.role} | Status:${c.status} | Location:${c.location} | Visa:${c.visa} | Experience:${c.experience}yrs | WorkPref:${c.workPref} | AvailableFrom:${c.availableFrom} | Skills:[${allSkills}] | Summary:${c.summary}`;
    }).join('\n');
  }, [candidates]);

  async function getEzraResponse(userText) {
    const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_KEY;

    // If no API key, fall back to keyword matching
    if (!OPENROUTER_KEY) {
      return getEzraResponseFallback(userText);
    }

    try {
      const systemPrompt = `You are Ezra, an AI recruiting assistant for EzHire. You help recruiters navigate and manage their candidate database.

Here is the current candidate database:
${candidateContext}

AVAILABLE FILTERS ON UI:
- statusFilter: "All", "Available Now", "Interview", "Offer", "Rejected", "Not Available"
- visaFilter: "All", "USC", "GC", "H1B", "TN", "H4 EAD", "OPT"
- workPref: "All", "Remote", "Hybrid", "Onsite"
- expFilter: Number (minimum years of experience)
- resumeFilter: "All", "With", "Without" (checks if they have a resume)
- linkedinFilter: "All", "With", "Without" (checks if they have LinkedIn)
- emailFilter: "All", "With", "Without" (checks if they have email)
- phoneFilter: "All", "With", "Without" (checks if they have phone number)

RULES & ACTIONS YOU CAN INITIATE:
1. Search & Filter: If the user wants to filter, search, or find specific criteria, include a JSON block at the end like:
   <!-- APPLY_FILTERS:{"search":"optional query","visaFilter":"GC","resumeFilter":"With"} -->
   Only specify the keys that need updating.
2. Select Candidate: If the user asks for details about a candidate, select them on the screen by adding:
   <!-- ACTION:selectCandidate:cand-X -->
3. Draft Outreach Email: If the user asks to email or contact a candidate, add:
   <!-- ACTION:draftEmail:cand-X -->
4. Include card previews for matching candidates:
   <!-- CARDS:["cand-1","cand-3"] -->
5. Responses should be helpful and concise (2-3 sentences).
6. Never make up candidate IDs or info not present in the database above.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'EzHire Recruiter Platform',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.filter(m => m.role === 'user' || m.role === 'ezra').slice(-6).map(m => ({
              role: m.role === 'ezra' ? 'assistant' : 'user',
              content: m.text,
            })),
            { role: 'user', content: userText },
          ],
          max_tokens: 400,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        console.warn('OpenRouter API error:', response.status);
        return getEzraResponseFallback(userText);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';

      // Extract card IDs from <!-- CARDS:["cand-1","cand-2"] -->
      let cards = null;
      const cardsMatch = content.match(/<!--\s*CARDS:\s*(\[.*?\])\s*-->/);
      if (cardsMatch) {
        try { cards = JSON.parse(cardsMatch[1]); } catch(e) {}
      }

      // Extract action
      let action = null;
      const actionMatch = content.match(/<!--\s*ACTION:(\w+):([\w\-]+)\s*-->/);
      if (actionMatch) {
        action = `${actionMatch[1]}:${actionMatch[2]}`;
      }

      // Extract filters
      let applyFilters = null;
      const filterMatch = content.match(/<!--\s*APPLY_FILTERS:\s*(\{.*?\})\s*-->/);
      if (filterMatch) {
        try { applyFilters = JSON.parse(filterMatch[1]); } catch(e) {}
      }

      // Clean the visible text (remove HTML comments)
      const cleanText = content.replace(/<!--.*?-->/g, '').trim();

      return {
        text: cleanText || "I've searched your database but found no exact match. Try adjusting your query.",
        cards,
        action,
        applyFilters
      };
    } catch (err) {
      console.error('Ezra AI error:', err);
      return getEzraResponseFallback(userText);
    }
  }

  // Fallback keyword-based responses when API is unavailable
  function getEzraResponseFallback(userText) {
    const t = userText.toLowerCase();
    if (t.includes('java') || t.includes('developer') || t.includes('available')) {
      return {
        text: 'Found 3 Java developers available right now. All open to remote or hybrid work.',
        cards: ['cand-2', 'cand-5', 'cand-1'],
        applyFilters: { search: 'Java', statusFilter: 'Available Now' }
      };
    }
    if (t.includes('suresh')) {
      return {
        text: "Suresh Balakrishnan is a senior Cloud/Azure architect with 11 years experience, located in Austin, TX. I've highlighted his profile for you.",
        cards: ['cand-1'],
        action: 'selectCandidate:cand-1'
      };
    }
    if (t.includes('h1b') || t.includes('texas') || t.includes('tx')) {
      return {
        text: 'Found H1B candidates in Texas. I have updated the filters to show H1B and Texas for you.',
        cards: ['cand-2'],
        applyFilters: { visaFilter: 'H1B', search: 'Texas' }
      };
    }
    if (t.includes('resume') && (t.includes('no') || t.includes('without'))) {
      return {
        text: 'Filtering the grid to show candidates without a resume on file.',
        applyFilters: { resumeFilter: 'Without' }
      };
    }
    if (t.includes('draft') || t.includes('email') || t.includes('submission') || t.includes('outreach')) {
      return {
        text: "Opening outreach email composer now.",
        cards: null,
        action: 'draftEmail:cand-1',
      };
    }
    return {
      text: "Got it. Let me search for candidates matching that criteria. Try being more specific — for example: 'Java developers in Texas with H1B' or 'senior cloud architects available now'.",
      cards: null,
    };
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
    const userMsg = { id: `u${Date.now()}`, role: 'user', text: text.trim(), time: now() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setChipsVisible(false);
    setTyping(true);

    try {
      const resp = await getEzraResponse(text);
      setTyping(false);
      const ezraMsg = { id: `e${Date.now()}`, role: 'ezra', text: resp.text, time: now(), cards: resp.cards || null };
      setMessages(p => [...p, ezraMsg]);

      // Handle filters application
      if (resp.applyFilters && typeof onViewProfile === 'function') {
        // We'll bubble this filter change up through a prop handler
        if (showToast) showToast('AI updated grid filters!', 'info');
      }

      // Handle actions bubbled up
      if (resp.action) {
        const [actionType, targetId] = resp.action.split(':');
        const candidate = candidates.find(c => c.id === targetId);
        
        if (actionType === 'draftEmail' && candidate) {
          setTimeout(() => onDraftEmail(candidate), 300);
        } else if (actionType === 'selectCandidate' && candidate) {
          setTimeout(() => onViewProfile(candidate), 300);
        }
      }

      // Bubble up filters to parent if callback exists
      if (resp.applyFilters && window.__applyEzraFilters) {
        window.__applyEzraFilters(resp.applyFilters);
      }

      inputRef.current?.focus();
    } catch (err) {
      setTyping(false);
      const errorMsg = { id: `e${Date.now()}`, role: 'ezra', text: "Sorry, I hit an error. Try again or rephrase your question.", time: now(), cards: null };
      setMessages(p => [...p, errorMsg]);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleChip(chip) {
    setDismissedChips(p => [...p, chip]);
    setTimeout(() => sendMessage(chip), 200);
  }

  function sendActionPrompt(prompt) {
    sendMessage(prompt);
  }

  const candMap = useMemo(() => Object.fromEntries(candidates.map(c => [c.id, c])), [candidates]);

  return (
    <div className={`ezra-panel${isOpen ? ' open' : ''}`}>
      {/* Header */}
      <div className="ezra-header">
        <div className="ezra-avatar">EZ</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', lineHeight: 1.3 }}>Ezra</div>
          <div style={{ fontSize: 12, color: '#6B6B8A', display: 'flex', alignItems: 'center', gap: 5 }}>
            AI Recruiter · Online
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#12B76A', display: 'inline-block', animation: 'pulse 1.8s infinite' }} />
          </div>
        </div>
        <button className="btn-icon" onClick={onClose} aria-label="Minimize Ezra" style={{ width: 30, height: 30 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="#6B6B8A" strokeWidth="2" strokeLinecap="round" d="M18 15 12 9l-6 6"/></svg>
        </button>
      </div>

      {/* Messages */}
      <div className="ezra-messages">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'user' ? (
              <div className="msg-user">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div className="msg-user-bubble">{msg.text}</div>
                  <span className="msg-time">{msg.time}</span>
                </div>
              </div>
            ) : (
              <div className="msg-ezra">
                <div className="msg-ezra-mini-avatar">EZ</div>
                <div className="msg-ezra-content">
                  <div className="msg-ezra-bubble">{msg.text}</div>
                  {msg.cards && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {msg.cards.map(cid => {
                        const c = candMap[cid];
                        if (!c) return null;
                        return (
                          <InlineCandidateCard
                            key={cid}
                            candidate={c}
                            onViewProfile={onViewProfile}
                            onDraftEmail={onDraftEmail}
                          />
                        );
                      })}
                      {/* Action strip */}
                      <div className="action-strip">
                        <button className="btn-ghost sm" onClick={() => sendActionPrompt('Draft submission emails for all candidates shown')}>Draft emails for all</button>
                        <button className="btn-ghost sm" onClick={() => sendActionPrompt('Refine this search')}>Refine search</button>
                        <button className="btn-ghost sm" onClick={() => {
                          showToast('Added to shortlist!', 'success');
                        }}>Add all to shortlist</button>
                      </div>
                    </div>
                  )}
                  <span className="msg-time">{msg.time}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {typing && (
          <div className="msg-ezra">
            <div className="msg-ezra-mini-avatar">EZ</div>
            <div className="msg-ezra-bubble" style={{ display: 'inline-flex', padding: '10px 16px' }}>
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chips */}
      {chipsVisible && (
        <div className="ezra-chips">
          {SUGGESTED_PROMPTS.map(chip => (
            <button
              key={chip}
              className={`prompt-chip${dismissedChips.includes(chip) ? ' dismissed' : ''}`}
              onClick={() => handleChip(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="ezra-input-bar">
        <textarea
          ref={inputRef}
          className="ezra-input"
          rows={1}
          placeholder="Ask Ezra anything…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="ezra-send-btn" onClick={() => sendMessage(input)} aria-label="Send">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── CANDIDATE GRID CARD ─────────────────────────────────────────────────────
function CandidateGridCard({ candidate, selected, onClick, onDraftEmail }) {
  const [bookmarked, setBookmarked] = useState(false);
  const allSkills = Object.values(candidate.skills || {}).flat();
  const shown = allSkills.slice(0, 4);
  const extra = allSkills.length - shown.length;

  return (
    <div className={`cand-card${selected ? ' selected' : ''}`} onClick={onClick}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <Avatar name={candidate.name} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{candidate.name}</div>
          <div style={{ fontSize: 12, color: '#6B6B8A', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{candidate.role}</div>
        </div>
        <StatusBadge status={candidate.status} />
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#6B6B8A', display: 'flex', alignItems: 'center', gap: 3 }}>
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/></svg>
          {candidate.location}
        </span>
        <span style={{ fontSize: 11, fontWeight: 500, background: '#F0EEFF', color: '#5B4FCC', borderRadius: 20, padding: '2px 8px' }}>{candidate.visa}</span>
        <span style={{ fontSize: 12, color: '#6B6B8A' }}>{candidate.experience} yrs</span>
      </div>

      {/* Skills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
        {shown.map((s, i) => <SkillTag key={s} label={s} index={i} />)}
        {extra > 0 && <span style={{ fontSize: 11, color: '#6B6B8A', background: '#F7F6FB', border: '1px solid #E8E6F0', borderRadius: 20, padding: '3px 9px' }}>+{extra} more</span>}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
        <button className="btn-outlined sm" style={{ flex: 1 }} onClick={() => onDraftEmail(candidate)}>Draft email</button>
        <button
          className={`btn-icon${bookmarked ? ' bookmarked' : ''}`}
          onClick={e => { e.stopPropagation(); setBookmarked(b => !b); }}
          aria-label="Bookmark"
        >
          <svg width="14" height="14" fill={bookmarked ? '#F59E0B' : 'none'} viewBox="0 0 24 24">
            <path stroke={bookmarked ? '#F59E0B' : '#6B6B8A'} strokeWidth="2" strokeLinecap="round" d="M5 3h14a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// Helper to get embeddable resume url
function getEmbeddableResumeUrl(url) {
  if (!url) return "";
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9\-_]+)/);
  if (openMatch) {
    return `https://drive.google.com/file/d/${openMatch[1]}/preview`;
  }
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9\-_]+)/);
  if (fileMatch) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }

  const lowercaseUrl = url.toLowerCase();
  if (
    lowercaseUrl.endsWith(".docx") ||
    lowercaseUrl.endsWith(".doc") ||
    lowercaseUrl.includes(".docx?") ||
    lowercaseUrl.includes(".doc?")
  ) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  return url;
}

// ─── CANDIDATE DETAIL PAGE ────────────────────────────────────────────────────
function DetailPage({ candidate, onBack, onDraftEmail, showToast }) {
  const [tab, setTab] = useState('overview'); // 'overview' | 'resume'
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const saveTimer = useRef(null);

  const debouncedSave = useCallback(
    debounce((val) => {
      setSaveStatus('Saved ✓');
      setTimeout(() => setSaveStatus(''), 2000);
    }, 800),
    []
  );

  function handleNotes(e) {
    setNotes(e.target.value);
    debouncedSave(e.target.value);
  }

  const statuses = {
    Submitted: { bg: '#E6F1FB', text: '#185FA5' },
    Interview: { bg: '#FFF4E5', text: '#9A5000' },
    Offer:     { bg: '#E6F9F1', text: '#0D7A4E' },
    Rejected:  { bg: '#FAECE7', text: '#993C1D' },
  };

  // Ezra predictions based on profile data
  const ezraInsights = useMemo(() => {
    let baseRate = 45;
    baseRate += (candidate.experience || 5) * 3.5;
    if (candidate.role.toLowerCase().includes('architect') || candidate.role.toLowerCase().includes('lead')) baseRate += 22;
    if (candidate.role.toLowerCase().includes('senior')) baseRate += 12;
    if (candidate.location.toLowerCase().includes('ca') || candidate.location.toLowerCase().includes('ny') || candidate.location.toLowerCase().includes('jose') || candidate.location.toLowerCase().includes('york')) baseRate += 15;
    if (candidate.visa === 'USC' || candidate.visa === 'GC') baseRate += 8;

    const rateMin = Math.round(baseRate * 0.9);
    const rateMax = Math.round(baseRate * 1.1);
    
    // Compute a mock demand and recommendation score deterministically
    const demandScore = Math.min(65 + (candidate.experience * 2) + (Object.values(candidate.skills || {}).flat().length * 1.5), 98);
    const recommendationScore = ((demandScore / 10) + 0.3).toFixed(1);

    return {
      rate: `$${rateMin} - $${rateMax} / hr`,
      demand: `${Math.round(demandScore)}th Percentile (High Demand)`,
      readiness: `${recommendationScore} / 10`
    };
  }, [candidate]);

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={onBack}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="#6C5CE7" strokeWidth="2" strokeLinecap="round" d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to candidates
      </button>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 16, margin: '14px 20px 8px', borderBottom: '1px solid #E8E6F0' }}>
        <button
          className={`tab-btn${tab === 'overview' ? ' active' : ''}`}
          onClick={() => setTab('overview')}
          style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: tab === 'overview' ? '2px solid #6C5CE7' : 'none', color: tab === 'overview' ? '#6C5CE7' : '#6B6B8A', fontWeight: 600, fontSize: 13 }}
        >
          Overview & Insights
        </button>
        <button
          className={`tab-btn${tab === 'resume' ? ' active' : ''}`}
          onClick={() => setTab('resume')}
          style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: tab === 'resume' ? '2px solid #6C5CE7' : 'none', color: tab === 'resume' ? '#6C5CE7' : '#6B6B8A', fontWeight: 600, fontSize: 13 }}
        >
          Resume Viewer
        </button>
      </div>

      <div className="detail-cols" style={{ padding: '0 20px 20px' }}>
        {/* LEFT CARD */}
        <div className="detail-left">
          <div className="detail-card">
            {/* Hero */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 20 }}>
              <Avatar name={candidate.name} size={64} />
              <div style={{ marginTop: 12, fontSize: 22, fontWeight: 700, color: '#1A1A2E' }}>{candidate.name}</div>
              <div style={{ fontSize: 15, color: '#6B6B8A', marginTop: 4 }}>{candidate.role}</div>
              <div style={{ marginTop: 10 }}>
                <StatusBadge status={candidate.status} size="md" />
              </div>
            </div>

            <div style={{ height: 1, background: '#E8E6F0', margin: '16px 0' }} />

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { icon: '💼', label: 'Experience', value: `${candidate.experience} years` },
                { icon: '🛂', label: 'Visa', value: candidate.visa },
                { icon: '📍', label: 'Location', value: candidate.location },
                { icon: '🏠', label: 'Work pref', value: candidate.workPref },
                { icon: '📅', label: 'Available from', value: candidate.availableFrom },
                { icon: '🕐', label: 'Last updated', value: candidate.lastUpdated },
              ].map(s => (
                <div key={s.label} className="stat-row" style={{ borderBottom: '1px solid #F7F6FB' }}>
                  <div style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: '#E8E6F0', margin: '16px 0' }} />

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn-filled lg" style={{ width: '100%' }} onClick={() => onDraftEmail(candidate)}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"/></svg>
                Draft outreach email
              </button>
              <button className="btn-outlined lg" style={{ width: '100%' }} onClick={() => showToast('Added to shortlist!', 'success')}>
                Add to shortlist
              </button>
            </div>

            {/* Notes */}
            <div style={{ marginTop: 20, position: 'relative' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#A0A0B8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Your notes
              </div>
              {saveStatus && <span className="save-indicator">{saveStatus}</span>}
              <textarea
                className="ez-textarea"
                style={{ minHeight: 100 }}
                placeholder="Add private notes about this candidate…"
                value={notes}
                onChange={handleNotes}
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - SWITCHED BY TABS */}
        <div className="detail-right" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'overview' ? (
            <>
              {/* Ezra Predictions & Ratings strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ background: '#F5F3FF', border: '1px solid #C4B5FD', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#6B6B8A', textTransform: 'uppercase', marginBottom: 4 }}>Predicted Rate</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#5B4FCC' }}>{ezraInsights.rate}</div>
                </div>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#6B6B8A', textTransform: 'uppercase', marginBottom: 4 }}>Market Demand</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>{ezraInsights.demand}</div>
                </div>
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#6B6B8A', textTransform: 'uppercase', marginBottom: 4 }}>Ezra Match Score</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#B45309' }}>{ezraInsights.readiness}</div>
                </div>
              </div>

              {/* Ezra's summary */}
              <div className="detail-card-sm">
                <div className="detail-section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3v18M3 12h18" stroke="#6C5CE7" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  Ezra AI Summary
                </div>
                <div className="summary-quote">{candidate.summary}</div>
              </div>

              {/* Skills */}
              <div className="detail-card-sm">
                <div className="detail-section-label">Skills & technologies</div>
                {Object.entries(candidate.skills || {}).map(([cat, skills]) => {
                  const col = getCategoryColor(cat);
                  return (
                    <div key={cat} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#A0A0B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{cat}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {skills.map(s => (
                          <span key={s} className="skill-tag" style={{ background: col.bg, color: col.text }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Work History */}
              <div className="detail-card-sm">
                <div className="detail-section-label">Experience</div>
                {(candidate.history || []).map((entry, i) => (
                  <div key={i} className="timeline-entry">
                    <div className="timeline-left">
                      <div className="timeline-dot" />
                      <div className="timeline-line" />
                    </div>
                    <div style={{ paddingBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{entry.company}</div>
                      <div style={{ fontSize: 13, color: '#6B6B8A', marginTop: 1 }}>{entry.role}</div>
                      <div style={{ fontSize: 12, color: '#A0A0B8', marginTop: 2 }}>{entry.dates}</div>
                      <div style={{ fontSize: 13, color: '#6B6B8A', marginTop: 6, lineHeight: 1.6 }}>{entry.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Resume Viewer Document Tab */
            <div className="detail-card-sm" style={{ flex: 1, minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
              <div className="detail-section-label" style={{ marginBottom: 12 }}>Resume Document</div>
              {candidate.resume_url ? (
                <iframe
                  src={getEmbeddableResumeUrl(candidate.resume_url)}
                  style={{ width: '100%', flex: 1, border: '1px solid #E8E6F0', borderRadius: 8, background: '#fff' }}
                  title={`${candidate.name} Resume`}
                />
              ) : (
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#A0A0B8', padding: '40px 0' }}>
                  <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>
                  <span style={{ fontSize: 14, fontWeight: 500, marginTop: 12 }}>No resume document linked.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FILTER + GRID PANEL ──────────────────────────────────────────────────────
function CandidatesPanel({
  candidates,
  onViewProfile,
  onDraftEmail,
  showToast,
  search, setSearch,
  statusFilter, setStatusFilter,
  visaFilter, setVisaFilter,
  workPref, setWorkPref,
  expFilter, setExpFilter,
  resumeFilter, setResumeFilter,
  linkedinFilter, setLinkedinFilter,
  emailFilter, setEmailFilter,
  phoneFilter, setPhoneFilter
}) {
  const [loading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, visaFilter, workPref, expFilter, resumeFilter, linkedinFilter, emailFilter, phoneFilter]);

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      const q = search.toLowerCase();
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) || Object.values(c.skills || {}).flat().some(s => s.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchVisa = visaFilter === 'All' || c.visa === visaFilter;
      const matchWork = workPref === 'All' || c.workPref === workPref;
      const matchExp = c.experience >= expFilter;

      // Completeness filters
      const hasResume = !!(c.resume_url?.trim());
      const matchResume = resumeFilter === 'All' || (resumeFilter === 'With' ? hasResume : !hasResume);

      const hasLinkedin = !!(c.linkedin?.trim());
      const matchLinkedin = linkedinFilter === 'All' || (linkedinFilter === 'With' ? hasLinkedin : !hasLinkedin);

      const hasEmail = !!(c.email?.trim());
      const matchEmail = emailFilter === 'All' || (emailFilter === 'With' ? hasEmail : !hasEmail);

      const hasPhone = !!(c.phone?.trim());
      const matchPhone = phoneFilter === 'All' || (phoneFilter === 'With' ? hasPhone : !hasPhone);

      return matchQ && matchStatus && matchVisa && matchWork && matchExp && matchResume && matchLinkedin && matchEmail && matchPhone;
    });
  }, [candidates, search, statusFilter, visaFilter, workPref, expFilter, resumeFilter, linkedinFilter, emailFilter, phoneFilter]);

  const activeFilters = [statusFilter, visaFilter, workPref, resumeFilter, linkedinFilter, emailFilter, phoneFilter].filter(f => f !== 'All').length + (search ? 1 : 0) + (expFilter > 0 ? 1 : 0);

  // Paginated chunk
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  return (
    <div className="candidates-panel">
      {/* Search Bar */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #E8E6F0', background: '#fff' }}>
        <input
          className="ez-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search candidates, skills, location..."
        />
      </div>

      {/* Filter bar */}
      <div className="candidates-filter-row" style={{ flexWrap: 'wrap', gap: '8px', padding: '12px 20px' }}>
        <select className="ez-select" style={{ width: 130 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select className="ez-select" style={{ width: 110 }} value={visaFilter} onChange={e => setVisaFilter(e.target.value)}>
          <option value="All">All Visas</option>
          {['USC', 'GC', 'H1B', 'TN', 'H4 EAD', 'OPT'].map(v => <option key={v} value={v}>{v}</option>)}
        </select>

        {/* Completeness Dropdowns */}
        <select className="ez-select" style={{ width: 130 }} value={resumeFilter} onChange={e => setResumeFilter(e.target.value)}>
          <option value="All">Resumes: All</option>
          <option value="With">With Resume</option>
          <option value="Without">No Resume</option>
        </select>

        <select className="ez-select" style={{ width: 130 }} value={linkedinFilter} onChange={e => setLinkedinFilter(e.target.value)}>
          <option value="All">LinkedIn: All</option>
          <option value="With">With LinkedIn</option>
          <option value="Without">No LinkedIn</option>
        </select>

        <select className="ez-select" style={{ width: 120 }} value={emailFilter} onChange={e => setEmailFilter(e.target.value)}>
          <option value="All">Email: All</option>
          <option value="With">With Email</option>
          <option value="Without">No Email</option>
        </select>

        <select className="ez-select" style={{ width: 120 }} value={phoneFilter} onChange={e => setPhoneFilter(e.target.value)}>
          <option value="All">Phone: All</option>
          <option value="With">With Phone</option>
          <option value="Without">No Phone</option>
        </select>

        <div style={{ display: 'flex', gap: 4 }}>
          {['All', 'Remote', 'Hybrid', 'Onsite'].map(p => (
            <button key={p} className={`toggle-pill${workPref === p ? ' active' : ''}`} onClick={() => setWorkPref(p)} style={{ padding: '6px 12px', fontSize: '11.5px' }}>
              {p}
            </button>
          ))}
        </div>
        <ExperienceSlider value={expFilter} onChange={setExpFilter} min={0} max={20} step={1} />

        {activeFilters > 0 && (
          <button className="btn-ghost sm" onClick={() => {
            setSearch(''); setStatusFilter('All'); setVisaFilter('All'); setWorkPref('All');
            setResumeFilter('All'); setLinkedinFilter('All'); setEmailFilter('All'); setPhoneFilter('All');
            setExpFilter(0);
          }}>
            Clear {activeFilters > 0 && <span className="active-filter-badge">{activeFilters}</span>}
          </button>
        )}
      </div>

      {/* Count bar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #E8E6F0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: '#6B6B8A' }}>
          Showing <span style={{ fontWeight: 600, color: '#1A1A2E' }}>
            {filtered.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filtered.length)} of ${filtered.length}` : '0'}
          </span> candidates
          {activeFilters > 0 && <span style={{ color: '#6C5CE7', marginLeft: 4 }}>· filtered</span>}
        </span>
        <button className="btn-ghost sm" onClick={() => {
          const emails = filtered.map(c => c.email).filter(Boolean).join(', ');
          navigator.clipboard.writeText(emails).then(() => showToast(`Copied ${filtered.filter(c=>c.email).length} emails!`, 'success'));
        }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/><path stroke="currentColor" strokeWidth="2" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy emails
        </button>
      </div>

      {/* Grid */}
      <div className="candidates-grid-area">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spinner size={32} />
          </div>
        ) : paginatedCandidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#A0A0B8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#6B6B8A', marginBottom: 6 }}>No candidates found</div>
            <div style={{ fontSize: 13 }}>Try adjusting your filters or search query</div>
          </div>
        ) : (
          <>
            <div className="candidates-grid">
              {paginatedCandidates.map(c => (
                <CandidateGridCard
                  key={c.id}
                  candidate={c}
                  selected={selectedId === c.id}
                  onClick={() => { setSelectedId(c.id); onViewProfile(c); }}
                  onDraftEmail={onDraftEmail}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24, paddingBottom: 12 }}>
                <button
                  className="btn-outlined sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                >
                  Previous
                </button>
                <span style={{ fontSize: 13, color: '#6B6B8A' }}>
                  Page <b>{currentPage}</b> of {totalPages}
                </span>
                <button
                  className="btn-outlined sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────
export default function CandidateDatabase() {
  const navigate = useNavigate();
  const [view, setView] = useState('candidates'); // 'candidates' | 'detail'
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [ezraOpen, setEzraOpen] = useState(true);
  const [draftTarget, setDraftTarget] = useState(null);
  const { toasts, showToast } = useToast();
  
  // Lifted filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [visaFilter, setVisaFilter] = useState('All');
  const [workPref, setWorkPref] = useState('All');
  const [expFilter, setExpFilter] = useState(0);
  const [resumeFilter, setResumeFilter] = useState('All');
  const [linkedinFilter, setLinkedinFilter] = useState('All');
  const [emailFilter, setEmailFilter] = useState('All');
  const [phoneFilter, setPhoneFilter] = useState('All');

  // Register window handler for Ezra AI to dynamically update filters
  useEffect(() => {
    window.__applyEzraFilters = (newFilters) => {
      if (typeof newFilters.search === 'string') setSearch(newFilters.search);
      if (typeof newFilters.statusFilter === 'string') setStatusFilter(newFilters.statusFilter);
      if (typeof newFilters.visaFilter === 'string') setVisaFilter(newFilters.visaFilter);
      if (typeof newFilters.workPref === 'string') setWorkPref(newFilters.workPref);
      if (typeof newFilters.expFilter === 'number') setExpFilter(newFilters.expFilter);
      if (typeof newFilters.resumeFilter === 'string') setResumeFilter(newFilters.resumeFilter);
      if (typeof newFilters.linkedinFilter === 'string') setLinkedinFilter(newFilters.linkedinFilter);
      if (typeof newFilters.emailFilter === 'string') setEmailFilter(newFilters.emailFilter);
      if (typeof newFilters.phoneFilter === 'string') setPhoneFilter(newFilters.phoneFilter);
    };
    return () => {
      delete window.__applyEzraFilters;
    };
  }, []);

  // Seed with mock data initially so nothing is empty on load
  const [candidatesList, setCandidatesList] = useState(CANDIDATES);

  // Fetch actual database candidates on mount
  useEffect(() => {
    async function loadCandidates() {
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching candidates from Supabase:', error);
          return;
        }

        if (data && data.length > 0) {
          // Map database columns to the mapped format expected by components
          const mapped = data.map((c, index) => {
            const skillsArray = c["Skills"]
              ? c["Skills"].split(/[|,]/).map(s => s.trim()).filter(Boolean)
              : [];

            return {
              id: c.id || c.candidate_uuid || `db-${index}`,
              name: c["Candidate Name"] || "Unknown Candidate",
              role: c["Title"] || c["role"] || "Software Engineer",
              status: c["status"] || "Available Now",
              location: c["Current Location"] || "Remote",
              visa: c["VISA"] || "USC",
              experience: Number(c["experience"]) || 5,
              workPref: c["work_pref"] || c["workPref"] || "Remote",
              availableFrom: c["available_from"] || c["availableFrom"] || "Immediately",
              email: c["Email"] || "",
              phone: c["Contact No"] || "",
              linkedin: c["LinkedIn"] || "",
              resume_url: c["resume_url"] || "",
              summary: c["summary"] || c["AI Summary"] || `${c["Candidate Name"] || "Candidate"} is an experienced professional in this field.`,
              skills: {
                All: skillsArray
              },
              history: Array.isArray(c["history"]) ? c["history"] : [
                { company: c["current_employer"] || "Previous Company", role: c["Title"] || "Software Engineer", dates: "N/A", desc: "Experience imported from database profile." }
              ],
              submissions: Array.isArray(c["submissions"]) ? c["submissions"] : []
            };
          });
          setCandidatesList(mapped);
        }
      } catch (err) {
        console.error('Unexpected error loading candidates:', err);
      }
    }
    loadCandidates();
  }, []);

  // Inject styles once
  useEffect(() => {
    const id = 'ezhire-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
    return () => {};
  }, []);

  function viewProfile(candidate) {
    setSelectedCandidate(candidate);
    setView('detail');
  }

  function openDraftEmail(candidate) {
    setDraftTarget(candidate);
  }

  return (
    <div className="ezhire-page">
      {/* Topbar */}
      <div className="ezhire-topbar">
        <div className="ezhire-topbar-brand">
          <div className="ezhire-topbar-brand-icon">EZ</div>
          <span className="ezhire-topbar-brand-name">EzHire</span>
        </div>
        <div className="ezhire-topbar-sep" />
        <span className="ezhire-topbar-title">
          {view === 'detail' && selectedCandidate ? selectedCandidate.name : 'Candidate Database'}
        </span>
        <div className="ezhire-topbar-actions">
          <button
            className={`btn-ghost sm`}
            onClick={() => navigate('/recruiter/dashboard')}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/></svg>
            Dashboard
          </button>
          <button
            className={`btn-${ezraOpen ? 'filled' : 'outlined'} sm`}
            onClick={() => setEzraOpen(o => !o)}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {ezraOpen ? 'Hide Ezra' : 'Ask Ezra'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="ezhire-body">
        {view === 'candidates' ? (
          <CandidatesPanel
            candidates={candidatesList}
            onViewProfile={viewProfile}
            onDraftEmail={openDraftEmail}
            showToast={showToast}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            visaFilter={visaFilter}
            setVisaFilter={setVisaFilter}
            workPref={workPref}
            setWorkPref={setWorkPref}
            expFilter={expFilter}
            setExpFilter={setExpFilter}
            resumeFilter={resumeFilter}
            setResumeFilter={setResumeFilter}
            linkedinFilter={linkedinFilter}
            setLinkedinFilter={setLinkedinFilter}
            emailFilter={emailFilter}
            setEmailFilter={setEmailFilter}
            phoneFilter={phoneFilter}
            setPhoneFilter={setPhoneFilter}
          />
        ) : (
          <DetailPage
            candidate={selectedCandidate}
            onBack={() => setView('candidates')}
            onDraftEmail={openDraftEmail}
            showToast={showToast}
          />
        )}

        {/* Ezra Panel */}
        <EzraPanel
          candidates={candidatesList}
          isOpen={ezraOpen}
          onClose={() => setEzraOpen(false)}
          onViewProfile={viewProfile}
          onDraftEmail={openDraftEmail}
          showToast={showToast}
        />
      </div>

      {/* Draft Email Modal */}
      {draftTarget && (
        <DraftEmailModal
          candidate={draftTarget}
          onClose={() => setDraftTarget(null)}
          showToast={showToast}
        />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} removeToast={() => {}} />
    </div>
  );
}

// Trigger Vercel Build

