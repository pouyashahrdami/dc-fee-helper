// Content scripts are bound by the page's CORS, so the fetch lives here.
const BASE = "https://durhamcollege.ca/wp-json/dc/v2/programs/fees/";

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (sender.id !== chrome.runtime.id || !/^[a-z0-9/_-]+$/i.test(msg?.path)) {
    reply({ error: "bad request" });
    return;
  }
  fetch(BASE + msg.path, { signal: AbortSignal.timeout(10000) })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => reply({ data }))
    .catch((e) => reply({ error: String(e) }));
  return true; // keep the channel open for the async reply
});
