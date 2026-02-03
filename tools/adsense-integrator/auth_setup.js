const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');

const CONFIG_PATH = path.join(__dirname, 'config.json');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    let config = {};
    if (fs.existsSync(CONFIG_PATH)) {
        config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }

    console.log("--- AdSense Auth Setup ---");

    if (!config.client_id || config.client_id === 'YOUR_CLIENT_ID') {
        config.client_id = await ask("Enter Client ID: ");
    }
    if (!config.client_secret || config.client_secret === 'YOUR_CLIENT_SECRET') {
        config.client_secret = await ask("Enter Client Secret: ");
    }
    
    // Ensure redirect URI is set (default to out-of-band for CLI)
    config.redirect_uri = 'urn:ietf:wg:oauth:2.0:oob'; 

    const oauth2Client = new google.auth.OAuth2(
        config.client_id,
        config.client_secret,
        config.redirect_uri
    );

    const scopes = [
        'https://www.googleapis.com/auth/adsense.readonly'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // crucial for refresh token
        scope: scopes
    });

    console.log("\n1. Visit this URL to authorize:");
    console.log(url);
    console.log("\n2. Copy the code provided.");

    const code = await ask("\nEnter the code here: ");

    try {
        const { tokens } = await oauth2Client.getToken(code);
        
        if (tokens.refresh_token) {
            config.refresh_token = tokens.refresh_token;
            console.log("\nSuccess! Refresh token acquired.");
        } else {
            console.log("\nWarning: No refresh token returned. You might need to revoke access and try again to prompt for offline access.");
        }

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        console.log(`\nConfig saved to ${CONFIG_PATH}`);

    } catch (e) {
        console.error("\nError retrieving access token:", e.message);
    }

    rl.close();
}

function ask(question) {
    return new Promise(resolve => {
        rl.question(question, answer => resolve(answer.trim()));
    });
}

main();
