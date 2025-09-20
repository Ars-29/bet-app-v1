import BetOutcomeCalculator from './src/unibet-calc/bet-outcome-calculator.js';

const calculator = new BetOutcomeCalculator();

// Create a test bet with our specific event ID that should use fotmob-11.json
const testBet = {
  _id: 'test-bet-1022853538',
  matchId: '1022853538', // This is the key - our test event ID
  start: '2025-08-11T23:00:00Z', // August 11, 2025 date
  leagueId: '1000094569',
  leagueName: 'Brasileirao Serie A',
  homeName: 'Juventude',
  awayName: 'Corinthians',
  marketName: 'Match Result',
  outcomeLabel: 'Corinthians',
  selection: 'Corinthians',
  odds: 2.5,
  stake: 10,
  eventName: 'Juventude vs Corinthians'
};

try {
  console.log('🧪 Testing manual bet processing with test event ID 1022853538...');
  console.log('📋 Test bet details:');
  console.log(`   - Event ID: ${testBet.matchId}`);
  console.log(`   - Date: ${testBet.start}`);
  console.log(`   - Teams: ${testBet.homeName} vs ${testBet.awayName}`);
  console.log(`   - League: ${testBet.leagueName} (${testBet.leagueId})`);
  
  const result = await calculator.processBet(testBet);
  console.log('\n✅ Final Result:', JSON.stringify(result, null, 2));
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
