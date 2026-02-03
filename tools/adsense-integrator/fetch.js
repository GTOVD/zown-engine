const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const CONSOLE_DATA_PATH = path.join(__dirname, '../../zown-console/data.json');

async function main() {
    if (!fs.existsSync(CONFIG_PATH)) {
        console.error("Config file not found. Run auth_setup.js first.");
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

    if (!config.refresh_token || !config.client_id || !config.client_secret) {
        console.error("Missing credentials in config.json.");
        process.exit(1);
    }

    const oauth2Client = new google.auth.OAuth2(
        config.client_id,
        config.client_secret,
        config.redirect_uri
    );

    oauth2Client.setCredentials({
        refresh_token: config.refresh_token
    });

    const adsense = google.adsense({
        version: 'v2',
        auth: oauth2Client
    });

    try {
        // Get the account ID first if not known, or just list accounts
        const accountsRes = await adsense.accounts.list();
        const accounts = accountsRes.data.accounts;

        if (!accounts || accounts.length === 0) {
            console.error("No AdSense accounts found.");
            return;
        }

        const accountName = accounts[0].name; // e.g., "accounts/pub-123456789"
        console.log(`Using account: ${accountName}`);

        // Fetch report for today
        // Date format: YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];
        
        // We want data for today. 
        // Note: AdSense data might be delayed.
        const report = await adsense.accounts.reports.generate({
            account: accountName,
            dateRange: 'TODAY',
            metrics: ['ESTIMATED_EARNINGS', 'IMPRESSIONS', 'PAGE_VIEWS'],
            dimensions: ['DATE']
        });

        let earnings = 0;
        let impressions = 0;

        if (report.data.rows && report.data.rows.length > 0) {
            // rows[0] is the data for today (since we grouped by DATE)
            // cells: [Date, Earnings, Impressions, PageViews] depending on order?
            // Actually API returns cells corresponding to headers.
            // But with 'TODAY' and 1 row, we can just sum metrics if needed.
            
            // Let's assume simpler:
            const row = report.data.rows[0];
            // We need to map metrics to indices if we requested dimensions.
            // metrics: ESTIMATED_EARNINGS, IMPRESSIONS, PAGE_VIEWS
            
            // Helper to find index
            const getMetricIndex = (name) => report.data.headers.findIndex(h => h.name === name);
            
            const earningsIdx = getMetricIndex('ESTIMATED_EARNINGS');
            const impressionsIdx = getMetricIndex('IMPRESSIONS');
            
            earnings = row.cells[earningsIdx].value || 0;
            impressions = row.cells[impressionsIdx].value || 0;
        }

        console.log(`Fetched Data: Earnings=$${earnings}, Impressions=${impressions}`);

        // Update Console Data
        updateConsoleData(earnings, impressions);

    } catch (error) {
        console.error("Error fetching AdSense data:", error.message);
        // If error is invalid_grant, token is bad
        if (error.message.includes('invalid_grant')) {
             console.error("Refresh token invalid. Please re-authenticate.");
        }
        process.exit(1);
    }
}

function updateConsoleData(earnings, impressions) {
    if (!fs.existsSync(CONSOLE_DATA_PATH)) {
        console.error("Console data file not found.");
        return;
    }

    const data = JSON.parse(fs.readFileSync(CONSOLE_DATA_PATH, 'utf8'));

    // Update Financials
    data.financials.revenue = earnings;
    // We don't update burn here, that's from Governor (or static for now)
    
    // Add extra stats if we want
    data.financials.impressions = impressions;
    
    data.timestamp = new Date().toISOString();

    fs.writeFileSync(CONSOLE_DATA_PATH, JSON.stringify(data, null, 2));
    console.log("Updated zown-console/data.json");
}

main();
