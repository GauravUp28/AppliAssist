chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "readJobDescription") {
    const jobText = document.body.innerText;
    sendResponse({ jobText: jobText });
  }
  return true;
});