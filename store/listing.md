# Chrome Web Store listing

**Name:** DC Fee Helper
**Category:** Productivity (or Education)
**Short description (max 132 chars):**
See your Durham College semester fees and what's left to pay, right on your MyCampus Account Summary.

**Detailed description:**
Tired of flipping between the Program Fee Estimator and your MyCampus balance?

DC Fee Helper adds a small panel to your Account Summary page:
• Search your program, pick Domestic or International and when your year of study starts
• Pick a semester and see the fee breakdown (tuition, ancillary, student association, program and co-op fees)
• Your account credit or balance is applied automatically, so you see exactly what's still to pay
• One click opens the official estimator with your selections
• Drag the panel anywhere; your choices are remembered

Private by design: your balance never leaves your browser. No accounts, no tracking. Fee amounts come from Durham College's public estimator data.

Unofficial and not affiliated with Durham College. Estimates only: the fees on your account are always correct.

**Single purpose:** Show Durham College fee estimates next to the student's account balance.

**Permission justifications:**
- `storage`: remember the student's program, tuition type, start term, semester and panel position on their device.
- Host `https://durhamcollege.ca/wp-json/dc/v2/programs/fees/*`: fetch the public fee data used by the official estimator.
- Content script on `https://ssp.mycampus.ca/StudentSelfService/*`: show the panel and read the displayed account balance.

**Privacy policy URL:** https://github.com/pouyashahrdami/dc-fee-helper/blob/main/PRIVACY.md (the repo must be public for this link to work)

**Assets still needed (you):** 1-5 screenshots at 1280x800 (blur your name and balance, or use a fake one), optional 440x280 promo tile. `icons/logo.png` is the 1024px logo.
