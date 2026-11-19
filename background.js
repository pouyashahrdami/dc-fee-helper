// Content scripts are bound by the page's CORS, so the fetch lives here.
const BASE = "https://durhamcollege.ca/wp-json/dc/v2/programs/fees/";

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  fetch(BASE + msg.path)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => reply({ data }))
    .catch((e) => reply({ error: String(e) }));
  return true; // keep the channel open for the async reply
});
