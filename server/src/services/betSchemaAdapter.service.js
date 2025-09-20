// Bet Schema Adapter Service
// Maps bet-app Bet schema to unibet-api calculator format

import { normalizeBet } from '../unibet-calc/utils/market-normalizer.js';
import { identifyMarket } from '../unibet-calc/utils/market-registry.js';

export class BetSchemaAdapter {
    /**
     * Convert bet-app Bet document to calculator-compatible format
     * @param {Object} bet - bet-app Bet document
     * @returns {Object} - Calculator-compatible bet object
     */
    static adaptBetForCalculator(bet) {
        if (!bet) {
            throw new Error('Bet document is required');
        }

        // Extract data from bet-app schema
        const betDetails = bet.betDetails || {};
        const unibetMeta = bet.unibetMeta || {};

        // Build calculator-compatible bet object
        const calculatorBet = {
            // Core identifiers
            eventId: bet.matchId || unibetMeta.eventName,
            marketId: bet.marketId || betDetails.market_id || unibetMeta.marketName,
            outcomeId: bet.oddId,
            outcomeLabel: betDetails.label || bet.betOption || unibetMeta.outcomeEnglishLabel,
            outcomeEnglishLabel: betDetails.label || bet.betOption || unibetMeta.outcomeEnglishLabel,

            // Market information - prioritize market_name over market_description for better recognition
            marketName: unibetMeta.marketName || betDetails.market_name || betDetails.market_description,
            criterionLabel: unibetMeta.criterionLabel || betDetails.market_description,
            criterionEnglishLabel: unibetMeta.criterionEnglishLabel || betDetails.market_description,

            // Participant information
            participant: betDetails.name || unibetMeta.participant,
            participantId: unibetMeta.participantId,
            eventParticipantId: unibetMeta.eventParticipantId,

            // Bet details
            odds: bet.odds || betDetails.value,
            stake: bet.stake,
            payout: bet.payout || 0,
            potentialWin: bet.potentialWin || (bet.stake * (bet.odds || betDetails.value)),
            betType: bet.betType || 'single',
            betOfferTypeId: unibetMeta.betOfferTypeId,

            // Handicap/Line information
            handicapRaw: unibetMeta.handicapRaw || this.parseHandicap(betDetails.handicap),
            handicapLine: unibetMeta.handicapLine || this.parseHandicap(betDetails.handicap),
            line: this.parseHandicap(betDetails.handicap) || unibetMeta.handicapLine,

            // Match context
            leagueId: unibetMeta.leagueId,
            leagueName: unibetMeta.leagueName,
            homeName: unibetMeta.homeName || this.extractTeamName(bet.teams, 'home'),
            awayName: unibetMeta.awayName || this.extractTeamName(bet.teams, 'away'),
            start: unibetMeta.start || bet.matchDate,

            // Additional fields
            eventName: unibetMeta.eventName || `${unibetMeta.homeName || 'Home'} vs ${unibetMeta.awayName || 'Away'}`,
            userId: bet.userId,
            status: bet.status,
            createdAt: bet.createdAt,
            updatedAt: bet.updatedAt,

            // Original bet-app fields for reference
            _originalBet: {
                id: bet._id,
                matchId: bet.matchId,
                oddId: bet.oddId,
                betOption: bet.betOption,
                marketId: bet.marketId,
                betDetails: betDetails,
                unibetMeta: unibetMeta
            }
        };

        // Normalize the bet for calculator
        const normalizedBet = normalizeBet(calculatorBet);
        
        // Identify market type
        const marketCode = identifyMarket(calculatorBet, normalizedBet);

        return {
            ...calculatorBet,
            normalized: normalizedBet,
            marketCode: marketCode
        };
    }

    /**
     * Parse handicap value from various formats
     * @param {any} handicap - Handicap value (string, number, etc.)
     * @returns {number|null} - Parsed handicap value
     */
    static parseHandicap(handicap) {
        if (handicap === null || handicap === undefined) return null;
        
        const num = Number(handicap);
        if (Number.isNaN(num)) return null;
        
        return num;
    }

    /**
     * Extract team name from teams string
     * @param {string} teams - Teams string like "Team A vs Team B"
     * @param {string} side - 'home' or 'away'
     * @returns {string|null} - Team name
     */
    static extractTeamName(teams, side) {
        if (!teams || typeof teams !== 'string') return null;
        
        const parts = teams.split(' vs ');
        if (parts.length !== 2) return null;
        
        return side === 'home' ? parts[0].trim() : parts[1].trim();
    }

    /**
     * Convert calculator result back to bet-app format
     * @param {Object} calculatorResult - Result from calculator
     * @param {Object} originalBet - Original bet-app bet document
     * @returns {Object} - Updated bet-app bet document
     */
    static adaptCalculatorResult(calculatorResult, originalBet) {
        const updatedBet = {
            ...originalBet,
            status: calculatorResult.status || originalBet.status,
            payout: calculatorResult.payout || originalBet.payout,
            result: {
                status: calculatorResult.status,
                payout: calculatorResult.payout,
                reason: calculatorResult.reason,
                processedAt: new Date(),
                debugInfo: calculatorResult.debugInfo || {},
                calculatorVersion: 'unibet-api-v1'
            },
            updatedAt: new Date()
        };

        return updatedBet;
    }

    /**
     * Validate that bet has required fields for calculator
     * @param {Object} bet - bet-app Bet document
     * @returns {Object} - Validation result
     */
    static validateBetForCalculator(bet) {
        const errors = [];
        const warnings = [];

        // Required fields
        if (!bet.matchId && !bet.unibetMeta?.eventName) {
            errors.push('Missing matchId or eventName');
        }

        if (!bet.oddId) {
            errors.push('Missing oddId');
        }

        if (!bet.stake || bet.stake <= 0) {
            errors.push('Invalid or missing stake');
        }

        if (!bet.odds && !bet.betDetails?.value) {
            errors.push('Missing odds');
        }

        // Warnings for missing optional fields
        if (!bet.unibetMeta?.marketName && !bet.betDetails?.market_name) {
            warnings.push('Missing market name');
        }

        if (!bet.unibetMeta?.leagueName) {
            warnings.push('Missing league name');
        }

        if (!bet.unibetMeta?.homeName || !bet.unibetMeta?.awayName) {
            warnings.push('Missing team names');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Get market family for bet
     * @param {Object} bet - bet-app Bet document
     * @returns {string} - Market family
     */
    static getMarketFamily(bet) {
        const adaptedBet = this.adaptBetForCalculator(bet);
        const marketName = (adaptedBet.marketName || '').toLowerCase();
        
        if (!marketName) return 'unknown';
        
        if (marketName.includes('match') || marketName.includes('3-way') || marketName.includes('double chance') || marketName.includes('draw no bet')) {
            return 'result';
        }
        if (marketName.includes('total') || marketName.includes('over') || marketName.includes('under') || marketName.includes('odd/even')) {
            return 'totals';
        }
        if (marketName.includes('card')) {
            return 'cards';
        }
        if (marketName.includes('corner')) {
            return 'corners';
        }
        if (marketName.includes('player') || marketName.includes('to score')) {
            return 'player';
        }
        if (marketName.includes('half') || marketName.includes('interval') || marketName.includes('minute') || marketName.includes('next')) {
            return 'time';
        }
        
        return 'unknown';
    }
}
