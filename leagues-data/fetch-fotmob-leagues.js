import fs from 'fs';
import path from 'path';
import Fotmob from '@max-xoo/fotmob';

/**
 * Fetch Fotmob Leagues Data
 * This script fetches all available leagues using the @max-xoo/fotmob package and saves them to fotmob-leagues.json
 */

async function fetchFotmobLeagues() {
    try {
        console.log('🔄 Fetching Fotmob leagues data using @max-xoo/fotmob package...');
        
        // Create an instance of the Fotmob class
        const fotmob = new Fotmob();
        
        // Use the getAllLeagues method to get all leagues
        const data = await fotmob.getAllLeagues();
        console.log('✅ Successfully fetched Fotmob leagues data using package');

        // Save the data to JSON file
        const outputPath = path.join(process.cwd(), 'fotmob-leagues.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 4));
        
        console.log(`📁 Data saved to: ${outputPath}`);
        console.log(`📊 Total leagues fetched: ${data.countries ? data.countries.length : 'Unknown'}`);
        
        // Log some sample data
        if (data.popular && data.popular.length > 0) {
            console.log('🌟 Popular leagues:', data.popular.slice(0, 3).map(league => league.name).join(', '));
        }

        if (data.countries && data.countries.length > 0) {
            console.log('🌍 Countries with leagues:', data.countries.slice(0, 5).map(country => country.name).join(', '));
        }

        return data;

    } catch (error) {
        console.error('❌ Error fetching Fotmob leagues:', error.message);
        
        // If API fails, try to use a fallback or cached data
        console.log('🔄 Attempting to use fallback data...');
        
        // Check if we have existing data to use as fallback
        const existingPath = path.join(process.cwd(), 'fotmob-leagues.json');
        if (fs.existsSync(existingPath)) {
            console.log('📁 Using existing fotmob-leagues.json as fallback');
            const existingData = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
            return existingData;
        }
        
        // Try to use the original fotmob-leagues.json from parent directory
        const originalPath = path.join(process.cwd(), '../fotmob-leagues.json');
        if (fs.existsSync(originalPath)) {
            console.log('📁 Using original fotmob-leagues.json as fallback');
            const originalData = JSON.parse(fs.readFileSync(originalPath, 'utf8'));
            
            // Add metadata to show it's a fallback
            const fallbackData = {
                ...originalData,
                _metadata: {
                    created: new Date().toISOString(),
                    source: 'fallback',
                    note: 'This is a fallback file created when API calls failed'
                }
            };
            
            // Save the fallback data
            fs.writeFileSync(existingPath, JSON.stringify(fallbackData, null, 4));
            console.log('📁 Fallback data saved to fotmob-leagues.json');
            
            return fallbackData;
        }
        
        throw error;
    }
}

async function fetchFotmobLeaguesWithRetry(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Attempt ${attempt}/${maxRetries} to fetch Fotmob leagues...`);
            return await fetchFotmobLeagues();
        } catch (error) {
            console.error(`❌ Attempt ${attempt} failed:`, error.message);
            
            if (attempt === maxRetries) {
                console.error('❌ All attempts failed. Please check your internet connection and try again.');
                throw error;
            }
            
            // Wait before retrying
            const waitTime = attempt * 2000; // 2s, 4s, 6s
            console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

// Main execution
async function main() {
    try {
        console.log('🚀 Starting Fotmob leagues data fetch...');
        console.log('📅 Timestamp:', new Date().toISOString());
        
        const leaguesData = await fetchFotmobLeaguesWithRetry();
        
        console.log('✅ Fotmob leagues data fetch completed successfully!');
        console.log('📁 Output file: fotmob-leagues.json');
        
    } catch (error) {
        console.error('❌ Failed to fetch Fotmob leagues data:', error.message);
        process.exit(1);
    }
}

// Run the script
main();

export { fetchFotmobLeagues, fetchFotmobLeaguesWithRetry };
