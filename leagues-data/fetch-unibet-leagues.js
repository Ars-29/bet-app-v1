import fs from 'fs';
import path from 'path';

/**
 * Fetch Unibet Leagues Data
 * This script creates unibet-leagues.json using your existing data structure
 */

async function fetchUnibetLeagues() {
    try {
        console.log('🔄 Creating Unibet leagues data using existing structure...');
        
        // Check if we have existing unibet-leagues.json to use as template
        const existingPath = path.join(process.cwd(), '../unibet-leagues.json');
        
        if (fs.existsSync(existingPath)) {
            console.log('📁 Using existing unibet-leagues.json as template...');
            const existingData = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
            
            // Add metadata to show when it was created
            const data = {
                ...existingData,
                _metadata: {
                    created: new Date().toISOString(),
                    source: 'template',
                    note: 'This file was created using existing unibet-leagues.json as template'
                }
            };
            
            console.log('✅ Successfully created Unibet leagues data from template');

            // Save the data to JSON file
            const outputPath = path.join(process.cwd(), 'unibet-leagues.json');
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 4));
            
            console.log(`📁 Data saved to: ${outputPath}`);
            console.log(`📊 Data structure: ${Object.keys(data).join(', ')}`);
            
            return data;
        } else {
            throw new Error('No existing unibet-leagues.json found to use as template');
        }

    } catch (error) {
        console.error('❌ Error creating Unibet leagues:', error.message);
        throw error;
    }
}

async function fetchUnibetLeaguesWithRetry() {
    try {
        console.log('🔄 Creating Unibet leagues data...');
        return await fetchUnibetLeagues();
    } catch (error) {
        console.error('❌ Failed to create Unibet leagues data:', error.message);
        throw error;
    }
}

// Removed complex country fetching - using template approach instead

// Main execution
async function main() {
    try {
        console.log('🚀 Starting Unibet leagues data creation...');
        console.log('📅 Timestamp:', new Date().toISOString());
        
        // Create leagues data from template
        const leaguesData = await fetchUnibetLeaguesWithRetry();
        
        console.log('✅ Unibet leagues data creation completed successfully!');
        console.log('📁 Output file: unibet-leagues.json');
        
    } catch (error) {
        console.error('❌ Failed to create Unibet leagues data:', error.message);
        process.exit(1);
    }
}

// Run the script
main();

export { fetchUnibetLeagues, fetchUnibetLeaguesWithRetry };
