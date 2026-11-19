# DC Fee Helper

A Chrome extension for Durham College students. Open your MyCampus **Account Summary** and get your next semester's estimated fees next to your balance, with the amount **still to pay** worked out for you. No more flipping between the Program Fee Estimator and your account.

> Unofficial. Not affiliated with or endorsed by Durham College. Numbers are estimates; the fees on your account are always the correct ones.

## What it does

- Pick your program, Domestic/International, and when your year starts. Saved for next time.
- Pick a semester and see the fee breakdown (tuition, ancillary, student association, program, co-op).
- Subtracts your account credit (a negative balance is money left in your account) or adds what you already owe.

## Install

1. Download or clone this repo.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select this folder.
4. Sign in to MyCampus and open **Account Summary**. The panel appears top right.

## Privacy

- Your balance is read from the page in your own browser and never leaves it.
- The only network call is to Durham College's public fee data (`durhamcollege.ca/wp-json/dc/v2/programs/fees/`), the same data the official estimator uses.
- Your selections are stored locally with `chrome.storage`. No analytics, no accounts.

## Known limits

- Fees are the full-time estimates from the official estimator. Part-time loads or extra courses can differ.
- If the College changes its fee API or the Account Summary layout, the extension may need an update.

## License

MIT
