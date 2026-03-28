function getPurposeSeverity(purpose) {

  const map = {
    abuse: "sev-high",
    ads: "sev-low",
    fraud: "sev-critical",
    gambling: "sev-med",
    google: "sev-low",
    malware: "sev-critical",
    phishing: "sev-critical",
    ransomware: "sev-critical",
    redirect: "sev-med",
    scam: "sev-critical",
    socialmedia: "sev-low",
    tracking: "sev-medium",
    unknown: "sev-unknown"
  };

  return map[purpose] || "sev-unknown";
}

function renderSummary(siteDomain, siteLog) {

  const total = siteLog.length;
  const firstParty = siteLog.filter(r => r.type === "first-party").length;
  const thirdParty = siteLog.filter(r => r.type === "third-party").length;
  const insecureCount = siteLog.filter(r => r.insecure).length;
  
  const uniqueTrackers = new Set(
  siteLog
    .filter(r => r.type === "third-party")
    .map(r => r.domain)
).size;

  const trackerMap = {};

  siteLog
    .filter(r => r.type === "third-party")
    .forEach(r => {
      if (!trackerMap[r.domain]) {
        trackerMap[r.domain] = new Set();
      }

      if (r.purpose) {
        r.purpose.forEach(p => trackerMap[r.domain].add(p));
      }
    });

  let trackerHTML = "";

  Object.entries(trackerMap).forEach(([domain, purposes]) => {

    const purposeTags = Array.from(purposes).map(p => {
      const sevClass = getPurposeSeverity(p);
      return `<span class="purpose-tag ${sevClass}">${p}</span>`;
    }).join(" ");

    trackerHTML += `
      <div class="tracker-item">
        <b>${domain}</b><br>
        ${purposeTags}
      </div>
    `;
  });

  if (!trackerHTML) {
    trackerHTML = "<p>No third-party trackers detected.</p>";
  }

  let purposeCount = {
      abuse: 0,
      ads: 0,
      fraud: 0,
      gambling: 0,
      google: 0,
      malware: 0,
      phishing: 0,
      ransomware: 0,
      redirect: 0,
      scam: 0,
      socialmedia: 0,
      tracking: 0,
      unknown: 0
    };

    siteLog.forEach(r => {
      if (r.purpose && r.purpose.length > 0) {
        r.purpose.forEach(p => {
          if (purposeCount[p] !== undefined) {
            purposeCount[p]++;
          }
        });
      }
    });

  let riskScore = 0;

  riskScore += purposeCount.ads * 1;
  riskScore += purposeCount.socialmedia * 1;
  riskScore += purposeCount.google * 1;
  riskScore += purposeCount.tracking * 2;
  riskScore += purposeCount.redirect * 2;
  riskScore += purposeCount.gambling * 2;

  riskScore += purposeCount.abuse * 3;

  riskScore += purposeCount.malware * 5;
  riskScore += purposeCount.phishing * 5;
  riskScore += purposeCount.ransomware * 5;
  riskScore += purposeCount.fraud * 5;
  riskScore += purposeCount.scam * 5;

  let riskLabel = "Low";
  let riskClass = "risk-low";
  let insight = "Minimal privacy or security risks detected.";

  if (riskScore >= 15) {
    riskLabel = "Critical";
    riskClass = "risk-high";
    insight = "Critical security threat detected (phishing, malware, or fraud domains).";
  }
  else if (riskScore >= 8) {
    riskLabel = "High";
    riskClass = "risk-high";
    insight = "Multiple risky trackers detected.";
  }
  else if (riskScore >= 3) {
    riskLabel = "Medium";
    riskClass = "risk-med";
    insight = "Moderate tracking or redirect activity detected.";
  }

  const securityStatus = insecureCount > 0
    ? "Insecure request detected (HTTP)"
    : "All requests use secure HTTPS";

  document.getElementById("summary").innerHTML = `
    <p><b>Site:</b> ${siteDomain}</p>
    <p><b>Total Requests:</b> ${total}</p>
    <p><b>First-party:</b> ${firstParty}</p>
    <p><b>Third-party:</b> ${thirdParty}</p>
    <p><b>Unique Trackers:</b> ${uniqueTrackers}</p>
    <p><b>Connection Security:</b> ${securityStatus}</p>
  `;

  document.getElementById("trackerPurpose").innerHTML = `
    <p><b>Ads:</b> ${purposeCount.ads}</p>
    <p><b>Tracking:</b> ${purposeCount.tracking}</p>
    <p><b>Social Media:</b> ${purposeCount.socialmedia}</p>
    <p><b>Redirect:</b> ${purposeCount.redirect}</p>
    <p><b>Gambling:</b> ${purposeCount.gambling}</p>
    <p><b>Google:</b> ${purposeCount.google}</p>

    <p><b>Abuse:</b> ${purposeCount.abuse}</p>
    <p><b>Fraud:</b> ${purposeCount.fraud}</p>
    <p><b>Malware:</b> ${purposeCount.malware}</p>
    <p><b>Phishing:</b> ${purposeCount.phishing}</p>
    <p><b>Ransomware:</b> ${purposeCount.ransomware}</p>
    <p><b>Scam:</b> ${purposeCount.scam}</p>
  `;

  document.getElementById("riskInsight").innerHTML = `
    <p><b>Risk Level:</b> <span class="risk-text ${riskClass}">${riskLabel}</span></p>
    <p>${insight}</p>
  `;

  document.getElementById("trackerList").innerHTML = trackerHTML;
}

function loadLogs() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0] || !tabs[0].url.startsWith("http")) return;
    
    const siteDomain = new URL(tabs[0].url).hostname;

    chrome.storage.local.get("requestLog", (data) => {
      const log = data.requestLog || {};
      const siteLog = log[siteDomain] || [];
      renderSummary(siteDomain, siteLog);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadLogs();

  const btn = document.getElementById("infoBtn");
  const panel = document.getElementById("infoPanel");

  // Toggle panel
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.classList.toggle("active");
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== btn) {
      panel.classList.remove("active");
    }
  });

  setInterval(loadLogs, 3000);
});
