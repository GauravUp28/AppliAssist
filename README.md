# AppliAssist

<p align="center">
  <img src="icons/icon.png" alt="AppliAssist Logo" width="1000" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Version-1.1-informational" alt="Version 1.1" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License: MIT" />
</p>

Smart Chrome extension for generating concise, tailored job application answers from your resume and the active job page.

## What It Does

AppliAssist combines:
- your resume (`.docx`, parsed locally)
- the current tab's cleaned job description text
- your own Gemini API key

Then it generates a short, application-ready response and saves it to local history.

## Current Features

- Answer generation from resume + page context + question
- Resume workflow: upload `.docx`, auto-save parsed resume text locally, view parsed resume text in a modal, and clear stored resume anytime
- Gemini API key management: add or update key, clear key, and view inline key status messaging
- History tab includes `Starred` answers and `Recent Questions` (latest generated answers, up to 10)
- Per-history actions: copy answer, star an answer from recent history, and remove an answer from starred history
- Clear controls for both recent history and starred history
- Light/Dark theme toggle (persisted locally)

## Quick Setup

1. Clone this repository.
2. Open `chrome://extensions/`.
3. Turn on Developer mode.
4. Click Load unpacked and select this project folder.
5. Open AppliAssist and add your Gemini API key under `Manage Gemini API Key`.

## Usage

1. Open a job post page in your browser.
2. Open AppliAssist.
3. Upload resume (`.docx`) once, or reuse previously saved resume text.
4. Enter the application question.
5. Optionally add extra context.
6. Click `Generate Answer`.
7. Use copy or star actions from the result and History tab.

## Privacy and Storage

- API key is user-provided and stored in `chrome.storage.local`.
- Resume text, app history, saved/starred history, and theme are stored locally in the browser profile.
- No API key is bundled in this repository.

## Project Files

- `manifest.json` - extension metadata, permissions, and content script wiring
- `popup.html` - popup layout and UI styles
- `popup.js` - popup behavior, storage, API requests, and history logic
- `content.js` - page text extraction and cleanup for job descriptions
- `mammoth.js` - DOCX to HTML/text conversion

## License

This project is licensed under the MIT License. See `LICENSE` for details.
