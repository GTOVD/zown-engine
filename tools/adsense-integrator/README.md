# AdSense Integrator

This tool fetches estimated earnings from Google AdSense and updates the Zown Console.

## Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project.
   - Enable the **AdSense Management API**.

2. **Create Credentials**
   - Go to APIs & Services > Credentials.
   - Create **OAuth Client ID**.
   - Application Type: **Desktop App** (or Web Application).
   - If Web App, add `http://localhost` to authorized redirect URIs. For Desktop, use `urn:ietf:wg:oauth:2.0:oob`.

3. **Run Setup Script**
   - Run: `node tools/adsense-integrator/auth_setup.js`
   - Paste your Client ID and Client Secret.
   - Follow the link to authorize and paste the code.

4. **Verify**
   - Run: `node tools/adsense-integrator/fetch.js`
   - Check `zown-console/data.json` to see if revenue updated.

## Usage

The `fetch.js` script is designed to be run by the Elastic Worker (cron job).
