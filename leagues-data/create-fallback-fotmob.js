const fs = require('fs');
const path = require('path');

/**
 * Create Fallback Fotmob Leagues Data
 * This script creates a fallback fotmob-leagues.json file based on your existing data
 */

function createFallbackFotmobData() {
    console.log('🔄 Creating fallback Fotmob leagues data...');
    
    // Use your existing fotmob-leagues.json as a template
    const existingPath = path.join(__dirname, '../fotmob-leagues.json');
    
    if (fs.existsSync(existingPath)) {
        console.log('📁 Found existing fotmob-leagues.json, using as template...');
        const existingData = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
        
        // Add timestamp to show when it was created
        const fallbackData = {
            ...existingData,
            _metadata: {
                created: new Date().toISOString(),
                source: 'fallback',
                note: 'This is a fallback file created when API calls failed'
            }
        };
        
        const outputPath = path.join(__dirname, 'fotmob-leagues.json');
        fs.writeFileSync(outputPath, JSON.stringify(fallbackData, null, 4));
        
        console.log('✅ Fallback fotmob-leagues.json created successfully!');
        console.log(`📁 Saved to: ${outputPath}`);
        
        return fallbackData;
    } else {
        console.log('❌ No existing fotmob-leagues.json found to use as template');
        return null;
    }
}

// Main execution
async function main() {
    try {
        console.log('🚀 Creating fallback Fotmob leagues data...');
        
        const fallbackData = createFallbackFotmobData();
        
        if (fallbackData) {
            console.log('✅ Fallback data created successfully!');
            console.log('📊 Data structure:', Object.keys(fallbackData));
        } else {
            console.log('❌ Failed to create fallback data');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Error creating fallback data:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { createFallbackFotmobData };
