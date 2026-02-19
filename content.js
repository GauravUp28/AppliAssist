chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "readJobDescription") {
    const clonedBody = document.body.cloneNode(true);

    // Remove common boilerplate sections that pollute JD extraction.
    const removeSelectors = [
      "nav",
      "header",
      "footer",
      "aside",
      "script",
      "style",
      "noscript",
      "[role='dialog']",
      "[aria-modal='true']",
      "[class*='modal']",
      "[id*='modal']",
      "[class*='cookie']",
      "[id*='cookie']",
      "[class*='consent']",
      "[id*='consent']",
      "[class*='banner']",
      "[id*='banner']",
      "[class*='advert']",
      "[id*='advert']",
      "[class*='ad-']",
      "[id*='ad-']",
      "[class*='related']",
      "[id*='related']",
      "[class*='recommend']",
      "[id*='recommend']"
    ];

    removeSelectors.forEach((selector) => {
      clonedBody.querySelectorAll(selector).forEach((node) => node.remove());
    });

    const jobText = clonedBody.innerText.replace(/\n{3,}/g, "\n\n").trim();
    sendResponse({ jobText: jobText });
  }
  return true;
});
