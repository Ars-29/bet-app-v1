// Unibet Calculator Processing Controller
// Admin-only endpoints for processing bets using unibet-api calculator

import BetOutcomeCalculator from '../unibet-calc/bet-outcome-calculator.js';
import { BetSchemaAdapter } from '../services/betSchemaAdapter.service.js';
import Bet from '../models/Bet.js';
import User from '../models/User.js';
import financeService from '../services/finance.service.js';

export class UnibetCalcController {
    constructor() {
        this.calculator = new BetOutcomeCalculator(null); // No DB needed for calculator
        this.financeService = financeService;
    }

    // Process all pending bets (batch processing)
    processAll = async (req, res) => {
        try {
            const { limit = 200, onlyPending = true } = req.body;
            
            console.log(`Starting batch processing: limit=${limit}, onlyPending=${onlyPending}`);

            // Get pending bets
            const query = onlyPending ? { status: 'pending' } : {};
            const bets = await Bet.find(query)
                .sort({ createdAt: 1 })
                .limit(parseInt(limit));

            console.log('bets%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%', bets);
            if (bets.length === 0) {
                return res.json({
                    success: true,
                    message: 'No bets found for processing',
                    stats: {
                        total: 0,
                        processed: 0,
                        failed: 0,
                        won: 0,
                        lost: 0,
                        canceled: 0
                    }
                });
            }

            console.log(`Found ${bets.length} bets to process`);

            const stats = {
                total: bets.length,
                processed: 0,
                failed: 0,
                won: 0,
                lost: 0,
                canceled: 0,
                errors: []
            };

            const results = [];

            // Process each bet
            for (const bet of bets) {
                try {
                    const result = await this.processSingleBet(bet);
                    results.push(result);
                    
                    stats.processed++;
                    if (result.status === 'won') stats.won++;
                    else if (result.status === 'lost') stats.lost++;
                    else if (result.status === 'canceled') stats.canceled++;
                    
                } catch (error) {
                    console.error(`Error processing bet ${bet._id}:`, error);
                    stats.failed++;
                    stats.errors.push({
                        betId: bet._id,
                        error: error.message
                    });
                }
            }

            console.log(`Batch processing completed:`, stats);

            res.json({
                success: true,
                message: `Processed ${stats.processed} out of ${stats.total} bets`,
                stats: stats,
                results: results.slice(0, 10) // Return first 10 results for review
            });

        } catch (error) {
            console.error('Error in batch processing:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process bets',
                error: error.message
            });
        }
    };

    // Process single bet
    processOne = async (req, res) => {
        try {
            const { betId } = req.params;
            
            console.log(`Processing single bet: ${betId}`);

            const bet = await Bet.findById(betId);
            if (!bet) {
                return res.status(404).json({
                    success: false,
                    message: 'Bet not found'
                });
            }

            const result = await this.processSingleBet(bet);

            res.json({
                success: true,
                message: 'Bet processed successfully',
                result: result
            });

        } catch (error) {
            console.error('Error processing single bet:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process bet',
                error: error.message
            });
        }
    };

    // Process single bet with known match ID
    processWithMatch = async (req, res) => {
        try {
            const { betId, matchId } = req.params;
            
            console.log(`Processing bet ${betId} with match ${matchId}`);

            const bet = await Bet.findById(betId);
            if (!bet) {
                return res.status(404).json({
                    success: false,
                    message: 'Bet not found'
                });
            }

            const result = await this.processSingleBetWithMatch(bet, matchId);

            res.json({
                success: true,
                message: 'Bet processed with match successfully',
                result: result
            });

        } catch (error) {
            console.error('Error processing bet with match:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process bet with match',
                error: error.message
            });
        }
    };

    // Internal method to process a single bet
    async processSingleBet(bet) {
        console.log('bet+++++++++++++++++++++++', bet);
        try {
            // Validate bet for calculator
            const validation = BetSchemaAdapter.validateBetForCalculator(bet);
            if (!validation.isValid) {
                throw new Error(`Bet validation failed: ${validation.errors.join(', ')}`);
            }

            // Adapt bet for calculator
            const adaptedBet = BetSchemaAdapter.adaptBetForCalculator(bet);
            
            console.log('adaptedBet+++++++++++++++++++++++', adaptedBet);
            console.log(`Processing bet ${bet._id}: ${adaptedBet.marketName} - ${adaptedBet.outcomeLabel}`);

            // Process with calculator (calculator already updates the database)
            const calculatorResult = await this.calculator.processBetWithMatchId(adaptedBet, adaptedBet.eventId);
            
            // No need to update database again - calculator already did it
            // The calculator handles the database update with proper transaction and write concern

            // Update user balance if bet was won or lost
            if (calculatorResult.outcome?.status === 'won' || calculatorResult.outcome?.status === 'lost') {
                await this.updateUserBalance(bet.userId, calculatorResult.outcome);
            }

            return {
                betId: bet._id,
                status: calculatorResult.outcome?.status || 'pending',
                payout: calculatorResult.outcome?.payout || 0,
                reason: calculatorResult.outcome?.reason || 'Processing completed',
                processedAt: new Date(),
                debugInfo: calculatorResult.debugInfo || {}
            };

        } catch (error) {
            console.error(`Error processing bet ${bet._id}:`, error);
            
            // Update bet with error status
            await Bet.findByIdAndUpdate(bet._id, {
                status: 'error',
                result: {
                    status: 'error',
                    reason: error.message,
                    processedAt: new Date(),
                    error: true
                },
                updatedAt: new Date()
            });

            throw error;
        }
    }

    // Internal method to process bet with known match ID
    async processSingleBetWithMatch(bet, matchId) {
        try {
            // Validate bet for calculator
            const validation = BetSchemaAdapter.validateBetForCalculator(bet);
            if (!validation.isValid) {
                throw new Error(`Bet validation failed: ${validation.errors.join(', ')}`);
            }

            // Adapt bet for calculator
            const adaptedBet = BetSchemaAdapter.adaptBetForCalculator(bet);
            
            console.log(`Processing bet ${bet._id} with match ${matchId}: ${adaptedBet.marketName} - ${adaptedBet.outcomeLabel}`);

            // Process with calculator using specific match ID
            const calculatorResult = await this.calculator.processBetWithMatchId(adaptedBet, matchId);
            
            // Adapt result back to bet-app format
            const updatedBet = BetSchemaAdapter.adaptCalculatorResult(calculatorResult, bet);
            
            // Update bet in database
            const savedBet = await Bet.findByIdAndUpdate(
                bet._id,
                updatedBet,
                { new: true }
            );

            // Update user balance if bet was won or lost
            if (calculatorResult.status === 'won' || calculatorResult.status === 'lost') {
                await this.updateUserBalance(bet.userId, calculatorResult);
            }

            return {
                betId: bet._id,
                matchId: matchId,
                status: calculatorResult.status,
                payout: calculatorResult.payout,
                reason: calculatorResult.reason,
                processedAt: new Date(),
                debugInfo: calculatorResult.debugInfo || {}
            };

        } catch (error) {
            console.error(`Error processing bet ${bet._id} with match ${matchId}:`, error);
            
            // Update bet with error status
            await Bet.findByIdAndUpdate(bet._id, {
                status: 'error',
                result: {
                    status: 'error',
                    reason: error.message,
                    processedAt: new Date(),
                    error: true,
                    matchId: matchId
                },
                updatedAt: new Date()
            });

            throw error;
        }
    }

    // Update user balance based on bet result
    async updateUserBalance(userId, calculatorResult) {
        try {
            if (!userId) {
                console.warn('No userId provided for balance update');
                return;
            }

            const user = await User.findById(userId);
            if (!user) {
                console.warn(`User ${userId} not found for balance update`);
                return;
            }

            let balanceChange = 0;
            let transactionType = '';

            if (calculatorResult.status === 'won') {
                balanceChange = calculatorResult.payout || 0;
                transactionType = 'bet_win';
            } else if (calculatorResult.status === 'lost') {
                // Balance was already deducted when bet was placed
                balanceChange = 0;
                transactionType = 'bet_loss';
            } else if (calculatorResult.status === 'canceled') {
                // Refund the stake
                balanceChange = calculatorResult.stake || 0;
                transactionType = 'bet_cancel';
            }

            if (balanceChange !== 0) {
                await this.financeService.updateBalance(
                    userId,
                    balanceChange,
                    transactionType,
                    `Bet ${calculatorResult.status}: ${calculatorResult.reason || 'No reason provided'}`
                );
                
                console.log(`Updated balance for user ${userId}: ${balanceChange > 0 ? '+' : ''}${balanceChange}`);
            }

        } catch (error) {
            console.error(`Error updating balance for user ${userId}:`, error);
            // Don't throw error here as it would fail the entire bet processing
        }
    }

    // Get processing status
    getProcessingStatus = async (req, res) => {
        try {
            const status = {
                isProcessing: this.calculator.isProcessingRunning,
                stats: this.calculator.processingStats,
                config: this.calculator.config
            };

            res.json({
                success: true,
                message: 'Processing status retrieved',
                status: status
            });

        } catch (error) {
            console.error('Error getting processing status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get processing status',
                error: error.message
            });
        }
    };
}
