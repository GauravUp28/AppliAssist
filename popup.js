// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initApiKeyPanel();
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

    // Clear Saved History
    const clearSavedHistory = document.getElementById("clearSavedHistory");
    if (clearSavedHistory) {
        clearSavedHistory.addEventListener("click", () => {
            chrome.storage.local.set({ savedHistory: [] }, () => renderHistory());
        });
    }
});

// --- UI UPDATES ---
function initTabs() {
    const generateBtn = document.getElementById("generateTabBtn");
    const historyBtn = document.getElementById("historyTabBtn");
    const generateTab = document.getElementById("generateTab");
    const historyTab = document.getElementById("historyTab");

    const setActiveTab = (tabName) => {
        const showGenerate = tabName === "generate";
        generateBtn.classList.toggle("active", showGenerate);
        historyBtn.classList.toggle("active", !showGenerate);
        generateTab.classList.toggle("active", showGenerate);
        historyTab.classList.toggle("active", !showGenerate);
    };

    generateBtn.addEventListener("click", () => setActiveTab("generate"));
    historyBtn.addEventListener("click", () => setActiveTab("history"));
}

function initApiKeyPanel() {
    const toggleBtn = document.getElementById("toggleApiKeyBtn");
    if (!toggleBtn) return;
    toggleBtn.addEventListener("click", () => {
        const section = document.getElementById("apiKeySection");
        section.classList.toggle("open");
    });
}

function setApiKeyPanelOpen(open) {
    const section = document.getElementById("apiKeySection");
    if (!section) return;
    section.classList.toggle("open", open);
}

function updateApiKeyTrigger(hasKey) {
    const toggleBtn = document.getElementById("toggleApiKeyBtn");
    if (!toggleBtn) return;
    toggleBtn.innerText = hasKey ? "Update Gemini API Key" : "Add Gemini API Key";
}

function initApiKeySettings() {
    const input = document.getElementById("apiKeyInput");
    const saveBtn = document.getElementById("saveApiKeyBtn");
    const clearBtn = document.getElementById("clearApiKeyBtn");

    chrome.storage.local.get(["geminiApiKey"], (result) => {
        if (result.geminiApiKey) {
            input.value = result.geminiApiKey;
        }
        updateApiKeyTrigger(Boolean(result.geminiApiKey));
        updateApiKeyStatus(Boolean(result.geminiApiKey));
    });

    saveBtn.addEventListener("click", () => {
        const key = input.value.trim();
        if (!key) {
            updateApiKeyStatus(false, "Please paste a valid API key.");
            return;
        }
        chrome.storage.local.set({ geminiApiKey: key }, () => {
            updateApiKeyTrigger(true);
            updateApiKeyStatus(true, "API key saved on this device.");
            setApiKeyPanelOpen(false);
        });
    });

    clearBtn.addEventListener("click", () => {
        chrome.storage.local.remove("geminiApiKey", () => {
            input.value = "";
            updateApiKeyTrigger(false);
            updateApiKeyStatus(false, "API key removed.");
            setApiKeyPanelOpen(false);
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
function escapeHtml(text) {
    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function renderHistory() {
    const list = document.getElementById("historyList");
    const savedList = document.getElementById("savedHistoryList");
    chrome.storage.local.get(["appHistory", "savedHistory"], (result) => {
        const history = result.appHistory || [];
        const savedHistory = result.savedHistory || [];
        const savedKeys = new Set(savedHistory.map((item) => buildHistoryKey(item)));

        renderSavedHistory(savedList, savedHistory);

        if (history.length === 0) {
            list.innerHTML = `<p style="font-size: 11px; color: #94a3b8; text-align: center;">No history yet.</p>`;
            return;
        }

        list.innerHTML = history.map((item, index) => {
            const isSaved = savedKeys.has(buildHistoryKey(item));
            return `
            <div class="history-card" data-index="${index}">
                <div style="font-size: 11px; font-weight: 700; margin-bottom: 2px; white-space: normal; overflow-wrap: anywhere; word-break: break-word; line-height: 1.35;">
                    ${escapeHtml(item.question)}
                </div>
                <div style="font-size: 10px; opacity: 0.6;">${escapeHtml(item.date)}</div>
                <div class="history-answer">${escapeHtml(item.answer)}</div>
                <div class="history-actions">
                    <button class="copy-history-btn history-action-btn">Copy Answer</button>
                    <button class="save-history-btn history-action-btn" ${isSaved ? "disabled" : ""}>${isSaved ? "Saved" : "Star"}</button>
                </div>
            </div>
        `;
        }).join("");

        document.querySelectorAll(".history-card").forEach(card => {
            card.onclick = () => {
                const alreadyOpen = card.classList.contains("open");
                document.querySelectorAll(".history-card.open").forEach((openCard) => {
                    openCard.classList.remove("open");
                });
                if (!alreadyOpen) {
                    card.classList.add("open");
                }
            };

            const copyBtn = card.querySelector(".copy-history-btn");
            if (copyBtn) {
                copyBtn.onclick = async (event) => {
                    event.stopPropagation();
                    const cardIndex = Number(card.dataset.index);
                    const answer = history[cardIndex]?.answer || "";
                    if (!answer) return;

                    try {
                        await navigator.clipboard.writeText(answer);
                        copyBtn.innerText = "Copied!";
                        setTimeout(() => {
                            copyBtn.innerText = "Copy Answer";
                        }, 1200);
                    } catch (error) {
                        copyBtn.innerText = "Copy failed";
                        setTimeout(() => {
                            copyBtn.innerText = "Copy Answer";
                        }, 1200);
                    }
                };
            }

            const saveBtn = card.querySelector(".save-history-btn");
            if (saveBtn) {
                saveBtn.onclick = (event) => {
                    event.stopPropagation();
                    if (saveBtn.disabled) return;
                    const cardIndex = Number(card.dataset.index);
                    const item = history[cardIndex];
                    if (!item) return;

                    saveEntryForLater(item);
                };
            }
        });
    });
}

function renderSavedHistory(savedList, savedHistory) {
    if (!savedList) return;

    if (!savedHistory.length) {
        savedList.innerHTML = `<p style="font-size: 11px; color: #94a3b8; text-align: center;">No saved questions yet.</p>`;
        return;
    }

    savedList.innerHTML = savedHistory.map((item, index) => `
        <div class="history-card" data-saved-index="${index}">
            <div style="font-size: 11px; font-weight: 700; margin-bottom: 2px; white-space: normal; overflow-wrap: anywhere; word-break: break-word; line-height: 1.35;">
                ${escapeHtml(item.question)}
            </div>
            <div style="font-size: 10px; opacity: 0.6;">Saved: ${escapeHtml(item.savedOn || item.date || "")}</div>
            <div class="saved-answer">${escapeHtml(item.answer)}</div>
            <div class="history-actions">
                <button class="copy-saved-btn history-action-btn">Copy Answer</button>
                <button class="remove-saved-btn history-action-btn danger-btn">Remove</button>
            </div>
        </div>
    `).join("");

    savedList.querySelectorAll(".history-card").forEach((card) => {
        const index = Number(card.dataset.savedIndex);
        const item = savedHistory[index];
        if (!item) return;

        card.onclick = () => {
            const alreadyOpen = card.classList.contains("open");
            savedList.querySelectorAll(".history-card.open").forEach((openCard) => {
                openCard.classList.remove("open");
            });
            if (!alreadyOpen) {
                card.classList.add("open");
            }
        };

        const copyBtn = card.querySelector(".copy-saved-btn");
        if (copyBtn) {
            copyBtn.onclick = async (event) => {
                event.stopPropagation();
                try {
                    await navigator.clipboard.writeText(item.answer || "");
                    copyBtn.innerText = "Copied!";
                    setTimeout(() => {
                        copyBtn.innerText = "Copy Answer";
                    }, 1200);
                } catch (error) {
                    copyBtn.innerText = "Copy failed";
                    setTimeout(() => {
                        copyBtn.innerText = "Copy Answer";
                    }, 1200);
                }
            };
        }

        const removeBtn = card.querySelector(".remove-saved-btn");
        if (removeBtn) {
            removeBtn.onclick = (event) => {
                event.stopPropagation();
                removeSavedEntry(index);
            };
        }
    });
}

function buildHistoryKey(item) {
    return `${item?.question || ""}|||${item?.answer || ""}`;
}

function saveEntryForLater(item) {
    chrome.storage.local.get(["savedHistory"], (result) => {
        const savedHistory = result.savedHistory || [];
        const entryKey = buildHistoryKey(item);
        const alreadySaved = savedHistory.some((savedItem) => buildHistoryKey(savedItem) === entryKey);
        if (alreadySaved) {
            renderHistory();
            return;
        }

        const newSavedEntry = {
            question: item.question,
            answer: item.answer,
            date: item.date,
            savedOn: new Date().toLocaleDateString()
        };
        chrome.storage.local.set({ savedHistory: [newSavedEntry, ...savedHistory] }, () => renderHistory());
    });
}

function removeSavedEntry(indexToRemove) {
    chrome.storage.local.get(["savedHistory"], (result) => {
        const savedHistory = result.savedHistory || [];
        const updated = savedHistory.filter((_, index) => index !== indexToRemove);
        chrome.storage.local.set({ savedHistory: updated }, () => renderHistory());
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
async function fetchAnswer(resumeText, jobText, questionText, additionalContext, apiKey) {
    const loader = document.getElementById("loader");
    const btn = document.getElementById("generateBtn");

    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const contextSection = additionalContext ? ` Additional Context: ${additionalContext}.` : "";
    const promptText =
        "You are writing an application answer on behalf of Gaurav Upadhyay, a full stack software engineer with strong backend and AWS experience. " +
        "Use only facts from the resume and align the answer tightly to the job description. " +
        "Prioritize the most relevant experience, measurable impact, and ownership. " +
        "Write in a natural human tone and active voice. " +
        "Keep it under 100 words. " +
        "Do not use contractions. " +
        "Do not use dashes or bullet points. " +
        "Use simple sentences and minimal punctuation. " +
        "Do not mention that you used a resume or job description. " +
        "Answer the question directly.\n\n" +
        "Resume text:\n" + resumeText + "\n\n" +
        "Job text:\n" + jobText + "\n\n" +
        "Question text:\n" + questionText + "\n\n" +
        (contextSection ? "Extra context:\n" + contextSection + "\n\n" : "") +
        "Answer:";
        
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

    document.getElementById("generateTab").appendChild(copyBtn);
}

// --- CLICK HANDLER ---
document.getElementById("generateBtn").addEventListener("click", async () => {
    const question = document.getElementById("questionInput").value;
    const additionalContext = document.getElementById("contextInput").value.trim();
    const status = document.getElementById("status");
    const apiKey = await getStoredApiKey();

    if (!question) { status.innerText = "Please paste the question."; return; }
    if (!apiKey) {
        status.innerText = "Please save your Gemini API key first.";
        setApiKeyPanelOpen(true);
        return;
    }

    chrome.storage.local.get(["savedResume"], (result) => {
        const resumeFile = document.getElementById("resumeUpload").files[0];
        if (resumeFile) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const { value: html } = await mammoth.convertToHtml({ arrayBuffer: e.target.result });

                const doc = new DOMParser().parseFromString(html, "text/html");

                const links = [...doc.querySelectorAll("a[href]")]
                    .map(a => `${a.textContent?.trim() || "Link"}: ${a.href}`)
                    .filter(Boolean);

                const plainText = (doc.body?.innerText || "").replace(/\n{3,}/g, "\n\n").trim();
                const resumeWithLinks = links.length
                    ? `${plainText}\n\nLinks:\n${links.join("\n")}`
                    : plainText;

                chrome.storage.local.set({ savedResume: resumeWithLinks }, () => {
                    updateUIForSavedResume();
                    processAndGenerate(resumeWithLinks, question, additionalContext, apiKey);
                });
            };
            reader.readAsArrayBuffer(resumeFile);
        } else if (result.savedResume) {
            processAndGenerate(result.savedResume, question, additionalContext, apiKey);
        } else {
            status.innerText = "Please upload a resume.";
        }
    });
});

function processAndGenerate(resumeText, question, additionalContext, apiKey) {
    document.getElementById("loader").style.display = "block";
    document.getElementById("generateBtn").disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "readJobDescription" }, (response) => {
            fetchAnswer(
                resumeText,
                response ? response.jobText : "Not available",
                question,
                additionalContext,
                apiKey
            );
        });
    });
}
