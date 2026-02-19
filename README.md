# AppliAssist

<p align="center">
  <img src="icons/icon.png" alt="AppliAssist Logo" width="1000" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Author-Gaurav Upadhyay-red" alt="Author: Gaurav Upadhyay" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License: MIT" />
  
</p>

> Smart Chrome extension for faster, tailored job application answers.

AppliAssist helps generate concise application responses using:
- your resume (`.docx`)
- the job description on the active page
- your own Gemini API key

## Features

- Resume upload and local parsing (`.docx`)
- User-managed Gemini API key (saved locally)
- AI-generated tailored answers
- One-click copy to clipboard
- Recent answer history in popup
- Light/Dark theme support

## Quick Setup

1. Clone this repository.
2. Open `chrome://extensions/`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select this project folder.
5. Click the extension icon and paste your Gemini API key into the **Gemini API Key** field to get started.

## Usage

1. Open the extension popup.
2. Paste your Gemini API key and click **Save Key**.
3. Upload your resume (`.docx`) once.
4. Open a job post page.
5. Paste a question and click **Generate Answer**.

## Privacy and Security

- API keys are user-provided and stored in `chrome.storage.local`.
- No production API key is bundled in this repo.
- Resume text and answer history are stored locally in the browser profile.

## Core Files

- `manifest.json` - extension config and permissions
- `popup.html` - popup UI
- `popup.js` - main extension logic
- `content.js` - page text reader
- `mammoth.js` - DOCX text extraction library

## What's Next

- Improve job-description extraction using targeted DOM selectors.
- Add support for more resume formats (like PDF).
- Let users tune tone and answer length from the popup.
- Add optional export/download for answer history.

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.

