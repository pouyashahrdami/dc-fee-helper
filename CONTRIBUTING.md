# Contributing to DC Fee Helper

Thanks for helping other Durham College students. Bug reports, fixes and ideas are all welcome.

## Before you post anything
**Never paste your real balance, name, student number or screenshots of your account** into an issue or pull request. Use made-up numbers or blur them.

## Report a problem
Open an issue using one of the templates:
- **Bug**: the panel doesn't show, or something looks or behaves wrong.
- **Wrong or missing fees**: a program, term or amount doesn't match the official estimator.

## Run it locally
No build step and no dependencies.
1. Clone the repo.
2. `chrome://extensions` → Developer mode → **Load unpacked** → pick the repo folder.
3. Open MyCampus Account Summary. After editing code, click the refresh icon on the extension card, then reload the page.

Useful commands:
```bash
node --check content.js && node --check background.js   # syntax check
node tests/sweep.mjs                                    # checks the fee API for every program/term/tuition combo
./scripts/pack.sh                                       # builds dist/dc-fee-helper-<version>.zip
```

## How it works
- `content.js` runs on the Account Summary page: reads the balance, draws the panel (inside a shadow DOM so MyCampus styles can't affect it) and does the math.
- `background.js` fetches the college's public fee data (the page itself can't, because of CORS).
- Fee data: `https://durhamcollege.ca/wp-json/dc/v2/programs/fees/`.

## Pull requests
- Keep them small and focused: one fix or feature each.
- Match the surrounding style. No new dependencies unless there is a strong reason.
- Don't add analytics, tracking or any network call other than the college fee data. Student privacy is the core promise of this project.
- Say how you tested it (which program, tuition type and start term).

By contributing you agree your work is released under the MIT license.
