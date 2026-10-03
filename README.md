# Ylldëza & Klei — Wedding

Wedding invitation landing page, built mobile-first. It is a plain static site (HTML, CSS and JS) with no build step.

- `index.html`: page markup
- `styles.css`: all styles
- `script.js`: envelope animation, love-story path, save-the-date sequence, countdown, RSVP form
- `assets/`: images

## Host on GitHub Pages

1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to *Deploy from a branch*, choose **main** and **/ (root)**, then click **Save**.
3. After a minute the site is live at `https://deanhasani.github.io/Ylldeza-and-Klei-wedding/`.

Any other static host (Netlify, Vercel, Cloudflare Pages) also works: point it at the repo root, with no build command.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server.

## Notes

- The countdown targets 14 Nov 2026, 16:00 Kukës time (UTC+1). It is set by `WEDDING` in `script.js`.
- The RSVP form is not connected to a backend yet. To connect a form service, send the `rsvp` object from the submit handler in `script.js`.
