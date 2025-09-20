// Market normalizer: produce canonical fields and hints from raw bet data

export function normalizeBet(rawBet) {
    const bet = rawBet || {};
    const marketName = String(bet.marketName || '').trim();
    const criterionEnglishLabel = String(bet.criterionEnglishLabel || '').trim();
    const criterionLabel = String(bet.criterionLabel || '').trim();
    const outcomeLabel = String(bet.outcomeLabel || bet.outcomeEnglishLabel || '').trim();
    const marketNameLower = marketName.toLowerCase();
    const criterionLower = (criterionEnglishLabel || criterionLabel).toLowerCase();
    const outcomeLower = outcomeLabel.toLowerCase();
    const betOfferTypeId = Number(bet.betOfferTypeId || bet.betOfferType?.id || NaN);

    const hasParticipantId = Number.isFinite(Number(bet.participantId));
    const hasParticipantName = !!(bet.participant || bet.playerName);
    
    // Don't treat Over/Under as player names
    const isOverUnderParticipant = ['over', 'under', 'yes', 'no'].includes(String(bet.participant || '').toLowerCase());
    const hasExplicitPlayer = (hasParticipantId || hasParticipantName) && !isOverUnderParticipant;

    const isPlayerOccurrenceLine = betOfferTypeId === 127;
    const hasTimeWindow = /\b(\d{1,2})[:\-](\d{2})\s*[-–]\s*(\d{1,2})[:\-](\d{2})\b/.test(marketNameLower) || /\b\d+\.\s*minute\b/.test(marketNameLower);

    // Line normalization
    const line = typeof bet.handicapLine === 'number'
        ? bet.handicapLine
        : (typeof bet.line === 'number'
            ? (isProbablyMilli(bet.line) ? (bet.line / 1000) : bet.line)
            : (typeof bet.handicapRaw === 'number'
                ? (bet.handicapRaw / 1000)
                : null));

    const selection = outcomeLower;

    // Heuristics to determine market nature
    const isPlayerScorer = (marketNameLower.includes('to score') || criterionLower.includes('to score')) && !marketNameLower.includes('team');
    const isPlayerShotsOnTarget = marketNameLower.includes("player's shots on target") || criterionLower.includes('shots on target');
    const isPlayerCard = marketNameLower.includes('to get a card') || marketNameLower.includes('to get a red card') || criterionLower.includes('to get a card');
    
    // Don't treat Over/Under as player markets for Total Goals
    const isOverUnderSelection = ['over', 'under', 'yes', 'no'].includes(outcomeLower);
    const maybePlayerTotalGoals = marketNameLower.includes('total goals') && 
        (marketNameLower.includes('by ') || marketNameLower.includes('by player') || isPlayerOccurrenceLine) &&
        !isOverUnderSelection; // Exclude Over/Under selections from being treated as player markets

    const isPlayerMarket = Boolean(
        isPlayerOccurrenceLine || hasExplicitPlayer || isPlayerScorer || isPlayerShotsOnTarget || isPlayerCard || maybePlayerTotalGoals
    );

    const hints = {
        isPlayerMarket,
        isPlayerOccurrenceLine,
        hasExplicitPlayer,
        hasTimeWindow,
        maybePlayerTotalGoals,
        selection,
        line
    };

    return {
        marketName,
        marketNameLower,
        criterionLower,
        outcomeLower,
        betOfferTypeId,
        hints
    };
}

function isProbablyMilli(n) {
    // Many Unibet lines are 7500 -> 7.5; treat large integers as milli-based
    return Number.isInteger(n) && Math.abs(n) >= 100 && Math.abs(n) % 25 === 0;
}