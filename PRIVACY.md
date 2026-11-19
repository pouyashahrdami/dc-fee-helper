# Privacy Policy: DC Fee Helper

_Last updated: 2026-11-19_

DC Fee Helper is an unofficial extension for Durham College students. It is not affiliated with or endorsed by Durham College.

**What it reads.** On the MyCampus Account Summary page (`ssp.mycampus.ca`) it reads your account balance from the page you are already viewing, so it can work out how much is left to pay for a semester.

**What leaves your browser.** Nothing about you. Your balance and your selections are never sent anywhere, and there is no server, analytics, advertising or tracking. The only network request the extension makes is to Durham College's public fee data (`durhamcollege.ca/wp-json/dc/v2/programs/fees/`), asking for fee amounts for a program. That request contains only the program code, tuition type and start term you picked.

**What it stores.** Your last selections (program, domestic/international, start term, semester) and the panel position are saved on your device with `chrome.storage.local`. Uninstalling the extension removes them.

**Contact.** Open an issue at https://github.com/pouyashahrdami/dc-fee-helper/issues.
