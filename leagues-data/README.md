# Leagues Data Fetcher

This folder contains scripts to fetch league data from both Fotmob and Unibet APIs and save them as JSON files.

## 📁 Files

- `fetch-fotmob-leagues.js` - Fetches league data from Fotmob API
- `fetch-unibet-leagues.js` - Fetches league data from Unibet API
- `fotmob-leagues.json` - Generated file containing Fotmob leagues data
- `unibet-leagues.json` - Generated file containing Unibet leagues data
- `unibet-leagues-by-country.json` - Generated file containing Unibet leagues organized by country

## 🚀 Usage

### Prerequisites

Make sure you have Node.js installed on your system.

### Fetch Fotmob Leagues

```bash
node fetch-fotmob-leagues.js
```

This will:
- Fetch all available leagues from Fotmob API
- Save the data to `fotmob-leagues.json`
- Include popular leagues, international competitions, and country-specific leagues
- Handle errors gracefully with retry logic

### Fetch Unibet Leagues

```bash
node fetch-unibet-leagues.js
```

This will:
- Fetch all available leagues from Unibet API
- Save the data to `unibet-leagues.json`
- Also fetch country-specific leagues and save to `unibet-leagues-by-country.json`
- Include tournament data, odds information, and league details
- Handle errors gracefully with retry logic

### Fetch Both

```bash
# Run both scripts
node fetch-fotmob-leagues.js && node fetch-unibet-leagues.js
```

## 📊 Output Files

### fotmob-leagues.json
Contains:
- `popular` - Array of popular leagues
- `international` - Array of international competitions
- `countries` - Array of countries with their respective leagues

Structure:
```json
{
    "popular": [
        {
            "id": 47,
            "name": "Premier League",
            "localizedName": "Premier League",
            "pageUrl": "/leagues/47/overview/premier-league"
        }
    ],
    "international": [...],
    "countries": [...]
}
```

### unibet-leagues.json
Contains:
- `viewId` - API view identifier
- `session` - Session information
- `apiUrl` - Original API URL
- `layout` - Tournament layout with sections and widgets
- Tournament data with odds, participants, and match information

### unibet-leagues-by-country.json
Contains:
- Country-specific league data
- Organized by country for easier access
- Includes all major football countries

## 🔧 Features

### Error Handling
- Automatic retry logic (3 attempts by default)
- Graceful fallback to existing data if API fails
- Detailed error logging

### Rate Limiting
- Built-in delays between requests
- Respects API rate limits
- Prevents overwhelming the servers

### Data Validation
- Checks API response status
- Validates data structure
- Logs sample data for verification

## 🛠️ Customization

### Modify Retry Logic
```javascript
// In the script files, change maxRetries
const leaguesData = await fetchFotmobLeaguesWithRetry(5); // 5 retries instead of 3
```

### Add More Countries
```javascript
// In fetch-unibet-leagues.js, modify the countries array
const countries = [
    'england', 'spain', 'germany', 'italy', 'france',
    'your-new-country' // Add here
];
```

### Change Output Format
```javascript
// Modify the JSON.stringify options
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2)); // 2 spaces instead of 4
```

## 📝 Logs

The scripts provide detailed logging:
- ✅ Success messages
- ❌ Error messages
- 📊 Data statistics
- 🌍 Country information
- 🏆 Sample league names

## 🔄 Automation

You can set up automated fetching using:

### Cron Job (Linux/Mac)
```bash
# Run every 6 hours
0 */6 * * * cd /path/to/leagues-data && node fetch-fotmob-leagues.js && node fetch-unibet-leagues.js
```

### Windows Task Scheduler
Create a scheduled task to run the scripts periodically.

### GitHub Actions
Set up a workflow to fetch data automatically and commit changes.

## 🐛 Troubleshooting

### Common Issues

1. **Network Errors**
   - Check internet connection
   - Verify API endpoints are accessible
   - Try running with VPN if blocked

2. **Rate Limiting**
   - Increase delays between requests
   - Reduce the number of countries fetched
   - Run scripts less frequently

3. **Data Format Issues**
   - Check if API responses have changed
   - Verify JSON structure
   - Update parsing logic if needed

### Debug Mode
Add `console.log` statements in the scripts to debug issues:

```javascript
console.log('API Response:', response.status);
console.log('Data sample:', JSON.stringify(data, null, 2));
```

## 📈 Data Usage

The generated JSON files can be used for:
- League management systems
- Betting applications
- Sports data analysis
- API integrations
- Database seeding

## 🔒 Security

- No API keys required (public endpoints)
- No sensitive data stored
- Rate limiting to prevent abuse
- Error handling to prevent crashes

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify your internet connection
3. Try running the scripts individually
4. Check if the APIs are accessible from your location

## 🔄 Updates

To update the scripts:
1. Modify the API endpoints if they change
2. Update the data parsing logic
3. Add new countries or leagues as needed
4. Test thoroughly before deployment
