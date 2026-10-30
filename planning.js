(function (root) {
    'use strict';
    function allocateBudget(total, ratios) {
        if (!Number.isSafeInteger(total) || total < 0) throw new RangeError('Budget must be a non-negative integer');
        const entries = Object.entries(ratios);
        const sum = entries.reduce((amount, [, ratio]) => amount + ratio, 0);
        if (!entries.length || !Number.isFinite(sum) || sum <= 0 || entries.some(([, ratio]) => !Number.isFinite(ratio) || ratio < 0)) throw new RangeError('Invalid budget ratios');
        const shares = entries.map(([key, ratio]) => ({ key, amount: Math.floor(total * ratio / sum), remainder: total * ratio / sum % 1 }));
        let remaining = total - shares.reduce((amount, share) => amount + share.amount, 0);
        const ranked = [...shares].sort((a, b) => b.remainder - a.remainder);
        for (let i = 0; i < remaining; i++) ranked[i % ranked.length].amount++;
        return Object.fromEntries(shares.map(({ key, amount }) => [key, amount]));
    }
    if (typeof module !== 'undefined' && module.exports) module.exports = { allocateBudget };
    else root.CelebrationPlanning = { allocateBudget };
})(typeof globalThis !== 'undefined' ? globalThis : this);
