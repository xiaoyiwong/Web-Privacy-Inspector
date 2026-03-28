let TRACKER_LIST = {};

/*
Load tracker lists from txt files
*/
async function loadTrackerLists() {

  const categories = [
    "abuse",
    "ads",
    "fraud",
    "gambling",
    "google",
    "malware",
    "phishing",
    "ransomware",
    "redirect",
    "scam",
    "socialmedia",
    "tracking"
  ];

  for (const category of categories) {

    const url = chrome.runtime.getURL(`trackerLists/${category}.txt`);

    const response = await fetch(url);
    const text = await response.text();

    TRACKER_LIST[category] = text
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith("#"));
  }

  console.log("Tracker lists loaded:", TRACKER_LIST);
}


/*
Detect tracker purpose
*/
function detectTrackerPurpose(domain) {

  let purposes = [];

  for (const [purpose, domains] of Object.entries(TRACKER_LIST)) {
    if (domains.some(d => domain.includes(d))) {
      purposes.push(purpose);
    }
  }

  return purposes.length ? purposes : ["unknown"];
}

// expose globally
self.detectTrackerPurpose = detectTrackerPurpose;
self.loadTrackerLists = loadTrackerLists;