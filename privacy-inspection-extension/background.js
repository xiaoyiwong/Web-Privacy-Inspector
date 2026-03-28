importScripts("trackerPurpose.js");

let requestLog = {};

loadTrackerLists().then(() => {
  console.log("Tracker lists ready");
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {

    if (details.tabId === -1) return;

    chrome.tabs.get(details.tabId, (tab) => {

      if (!tab || !tab.url || !tab.url.startsWith("http")) return;

      const siteDomain = new URL(tab.url).hostname;
      const requestUrl = new URL(details.url);
      const requestDomain = requestUrl.hostname;

      const type = siteDomain === requestDomain ? "first-party" : "third-party";
      const insecure = requestUrl.protocol === "http:";

      let purpose = [];

      if (type === "third-party") {
        purpose = detectTrackerPurpose(requestDomain);
      }

      if (!requestLog[siteDomain]) {
        requestLog[siteDomain] = [];
      }

      requestLog[siteDomain].push({
        url: details.url,
        type,
        insecure,
        domain: requestDomain,
        purpose,
        time: new Date().toISOString()
      });

      chrome.storage.local.set({ requestLog });

    });

  },
  { urls: ["<all_urls>"] }
);