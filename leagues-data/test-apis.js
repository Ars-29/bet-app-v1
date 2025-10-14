const fs = require('fs');
const path = require('path');

/**
 * Test API Endpoints
 * This script tests various API endpoints to see which ones work
 */

async function testFotmobEndpoints() {
    console.log('🧪 Testing Fotmob API endpoints...');
    
    const endpoints = [
        'https://www.fotmob.com/api/leagues',
        'https://www.fotmob.com/api/leagues?type=league',
        'https://www.fotmob.com/api/leagues?type=all',
        'https://www.fotmob.com/api/leagues?type=popular',
        'https://www.fotmob.com/api/leagues?type=international'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`\n🔄 Testing: ${endpoint}`);
            
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://www.fotmob.com/',
                    'Origin': 'https://www.fotmob.com'
                }
            });

            console.log(`Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Success! Data keys: ${Object.keys(data).join(', ')}`);
                
                if (data.popular) console.log(`📊 Popular leagues: ${data.popular.length}`);
                if (data.countries) console.log(`🌍 Countries: ${data.countries.length}`);
                if (data.international) console.log(`🌐 International: ${data.international.length}`);
                
                return { endpoint, data };
            } else {
                console.log(`❌ Failed: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    return null;
}

async function testUnibetEndpoints() {
    console.log('\n🧪 Testing Unibet API endpoints...');
    
    const endpoints = [
        'https://www.unibet.com.au/sportsbook-feeds/views/filter/football/all/allGroups?includeParticipants=true&useCombined=true',
        'https://www.unibet.com.au/sportsbook-feeds/views/filter/football/england/allGroups?includeParticipants=true&useCombined=true',
        'https://www.unibet.com.au/sportsbook-feeds/views/filter/football/spain/allGroups?includeParticipants=true&useCombined=true'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`\n🔄 Testing: ${endpoint}`);
            
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': '*/*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://www.unibet.com.au/betting/sports/filter/football',
                    'Origin': 'https://www.unibet.com.au'
                }
            });

            console.log(`Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Success! Data keys: ${Object.keys(data).join(', ')}`);
                
                if (data.layout && data.layout.sections) {
                    console.log(`📊 Sections: ${data.layout.sections.length}`);
                    const mainSection = data.layout.sections.find(s => s.position === 'MAIN');
                    if (mainSection && mainSection.widgets) {
                        console.log(`🎯 Widgets: ${mainSection.widgets.length}`);
                    }
                }
                
                return { endpoint, data };
            } else {
                console.log(`❌ Failed: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    return null;
}

async function main() {
    try {
        console.log('🚀 Testing API endpoints...');
        console.log('📅 Timestamp:', new Date().toISOString());
        
        // Test Fotmob endpoints
        const fotmobResult = await testFotmobEndpoints();
        
        // Test Unibet endpoints
        const unibetResult = await testUnibetEndpoints();
        
        console.log('\n📊 Test Results:');
        console.log(`Fotmob: ${fotmobResult ? '✅ Working' : '❌ Failed'}`);
        console.log(`Unibet: ${unibetResult ? '✅ Working' : '❌ Failed'}`);
        
        if (fotmobResult) {
            console.log(`\n✅ Fotmob working endpoint: ${fotmobResult.endpoint}`);
        }
        
        if (unibetResult) {
            console.log(`\n✅ Unibet working endpoint: ${unibetResult.endpoint}`);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { testFotmobEndpoints, testUnibetEndpoints };
