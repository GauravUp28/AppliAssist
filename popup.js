// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    updateUIForSavedResume();
    initTheme();
    renderHistory(); // Load previous answers on startup
    initApiKeySettings();

    // Theme Toggle
    const themeToggle = document.getElementById("themeToggle");
    themeToggle.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark-mode");
        const themeIcon = document.getElementById("themeIcon");
        const themeText = document.getElementById("themeText");
        
        if (themeIcon) themeIcon.innerText = isDark ? "☀️" : "🌙";
        if (themeText) themeText.innerText = isDark ? "Light Mode" : "Dark Mode";
        chrome.storage.local.set({ theme: isDark ? "dark" : "light" });
    });

    // Clear Resume
    document.getElementById("clearResume").addEventListener("click", () => {
        chrome.storage.local.remove("savedResume", () => {
            updateUIForSavedResume();
        });
    });

    // View Resume Modal
    const modal = document.getElementById("resumeModal");
    document.getElementById("viewResume").addEventListener("click", () => {
        chrome.storage.local.get(["savedResume"], (result) => {
            document.getElementById("resumeTextContent").innerText = result.savedResume || "No text found.";
            modal.style.display = "block";
        });
    });

    document.getElementById("closeModal").addEventListener("click", () => modal.style.display = "none");
    window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };

    // Clear History
    document.getElementById("clearHistory").addEventListener("click", () => {
        chrome.storage.local.set({ appHistory: [] }, () => renderHistory());
    });
});

// --- UI UPDATES ---
function initApiKeySettings() {
    const input = document.getElementById("apiKeyInput");
    const saveBtn = document.getElementById("saveApiKeyBtn");
    const clearBtn = document.getElementById("clearApiKeyBtn");

    chrome.storage.local.get(["geminiApiKey"], (result) => {
        if (result.geminiApiKey) {
            input.value = result.geminiApiKey;
        }
        updateApiKeyStatus(Boolean(result.geminiApiKey));
    });

    saveBtn.addEventListener("click", () => {
        const key = input.value.trim();
        if (!key) {
            updateApiKeyStatus(false, "Please paste a valid API key.");
            return;
        }
        chrome.storage.local.set({ geminiApiKey: key }, () => {
            updateApiKeyStatus(true, "API key saved on this device.");
        });
    });

    clearBtn.addEventListener("click", () => {
        chrome.storage.local.remove("geminiApiKey", () => {
            input.value = "";
            updateApiKeyStatus(false, "API key removed.");
        });
    });
}

function updateApiKeyStatus(hasKey, customMessage) {
    const keyStatus = document.getElementById("apiKeyStatus");
    if (!keyStatus) return;

    if (customMessage) {
        keyStatus.innerText = customMessage;
        keyStatus.style.color = hasKey ? "#2e7d32" : "#ef4444";
        return;
    }

    keyStatus.innerText = hasKey ? "API key saved on this device." : "No key saved.";
    keyStatus.style.color = hasKey ? "#2e7d32" : "#64748b";
}

function getStoredApiKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["geminiApiKey"], (result) => {
            resolve((result.geminiApiKey || "").trim());
        });
    });
}

function updateUIForSavedResume() {
    const badge = document.getElementById("resumeBadge");
    const upload = document.getElementById("uploadSection");
    const status = document.getElementById("status");

    chrome.storage.local.get(["savedResume"], (result) => {
        if (result.savedResume) {
            badge.style.display = "flex";
            upload.style.display = "none";
            status.innerText = "Ready to generate.";
        } else {
            badge.style.display = "none";
            upload.style.display = "block";
            status.innerText = "Please upload a resume.";
        }
    });
}

function initTheme() {
    chrome.storage.local.get(["theme"], (result) => {
        if (result.theme === "dark") {
            document.body.classList.add("dark-mode");
            document.getElementById("themeIcon").innerText = "☀️";
            document.getElementById("themeText").innerText = "Light Mode";
        }
    });
}

// --- HISTORY LOGIC ---
function renderHistory() {
    const list = document.getElementById("historyList");
    chrome.storage.local.get(["appHistory"], (result) => {
        const history = result.appHistory || [];
        if (history.length === 0) {
            list.innerHTML = `<p style="font-size: 11px; color: #94a3b8; text-align: center;">No history yet.</p>`;
            return;
        }

        list.innerHTML = history.map((item, index) => `
            <div class="history-card" data-index="${index}">
                <div style="font-size: 11px; font-weight: 700; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${item.question}
                </div>
                <div style="font-size: 10px; opacity: 0.6;">${item.date}</div>
            </div>
        `).join("");

        document.querySelectorAll(".history-card").forEach(card => {
            card.onclick = () => {
                const item = history[card.dataset.index];
                document.getElementById("questionInput").value = item.question;
                displayResult(item.answer);
            };
        });
    });
}

function saveToHistory(question, answer) {
    chrome.storage.local.get(["appHistory"], (result) => {
        const history = result.appHistory || [];
        const newEntry = { question, answer, date: new Date().toLocaleDateString() };
        // Keep last 10 entries
        const updatedHistory = [newEntry, ...history].slice(0, 10);
        chrome.storage.local.set({ appHistory: updatedHistory }, () => renderHistory());
    });
}

// --- CORE GENERATION ---
async function fetchAnswer(resumeText, jobText, questionText, apiKey) {
    // Check Cache First
    const res = await new Promise(r => chrome.storage.local.get(["appHistory"], r));
    const cached = (res.appHistory || []).find(h => h.question.trim() === questionText.trim());
    
    if (cached) {
        displayResult(cached.answer);
        return;
    }

    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const loader = document.getElementById("loader");
    const btn = document.getElementById("generateBtn");

    const promptText = `You are a software engineer writing application answers. Resume: ${resumeText}. Job: ${jobText}. Question: ${questionText}. Answer in natural human tone, active voice, max 100 words, no contractions, no dashes.`;

    try {
        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0].content) {
            const result = data.candidates[0].content.parts[0].text;
            saveToHistory(questionText, result);
            displayResult(result);
        }
    } catch (e) {
        document.getElementById("status").innerText = "Connection failed.";
    } finally {
        loader.style.display = "none";
        btn.disabled = false;
    }
}

function displayResult(text) {
    const status = document.getElementById("status");
    status.innerText = text;
    addCopyButton(text);
}

function addCopyButton(text) {
    const existing = document.getElementById("copyBtn");
    if (existing) existing.remove();

    const copyBtn = document.createElement("button");
    copyBtn.id = "copyBtn";
    copyBtn.innerText = "Copy to Clipboard";
    copyBtn.style.marginTop = "15px";
    copyBtn.style.marginBottom = "10px";
    
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(text);
        copyBtn.innerText = "Copied!";
    };
    
    document.querySelector(".main-content").appendChild(copyBtn);
}

// --- CLICK HANDLER ---
document.getElementById("generateBtn").addEventListener("click", async () => {
    const question = document.getElementById("questionInput").value;
    const status = document.getElementById("status");
    const apiKey = await getStoredApiKey();

    if (!question) { status.innerText = "Please paste the question."; return; }
    if (!apiKey) {
        status.innerText = "Please save your Gemini API key first.";
        return;
    }

    chrome.storage.local.get(["savedResume"], (result) => {
        const resumeFile = document.getElementById("resumeUpload").files[0];
        if (resumeFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                mammoth.extractRawText({ arrayBuffer: e.target.result }).then(res => {
                    chrome.storage.local.set({ savedResume: res.value }, () => {
                        updateUIForSavedResume();
                        processAndGenerate(res.value, question, apiKey);
                    });
                });
            };
            reader.readAsArrayBuffer(resumeFile);
        } else if (result.savedResume) {
            processAndGenerate(result.savedResume, question, apiKey);
        } else {
            status.innerText = "Please upload a resume.";
        }
    });
});

function processAndGenerate(resumeText, question, apiKey) {
    document.getElementById("loader").style.display = "block";
    document.getElementById("generateBtn").disabled = true;
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "readJobDescription" }, (response) => {
            fetchAnswer(resumeText, response ? response.jobText : "Not available", question, apiKey);
        });
    });
}
