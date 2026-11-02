import { LightningElement, api } from 'lwc';

// Lead 360 — AI Recommendations (Recommended tab)
// Mock-first: static data mirrors the customer-360.html "Recommended" tab cards.
export default class De_lead360Recommendations extends LightningElement {
    @api recordId;

    recs = [
        { key: 'r1', cardClass: 'rec-card', badge: 'Product', badgeClass: 'rec-badge product', title: 'Raymond Structured Blazer', detail: 'Complements recent formal shirt purchases. High propensity based on premium menswear affinity.', score: '92% match', barClass: 'rec-fill', barStyle: 'width:92%', cta: 'Recommend via WhatsApp' },
        { key: 'r2', cardClass: 'rec-card', badge: 'Product', badgeClass: 'rec-badge product', title: 'Park Avenue Chino Trousers', detail: 'Frequently bought together with recent shirts. Preferred fit and size on file.', score: '87% match', barClass: 'rec-fill', barStyle: 'width:87%', cta: 'Add to next offer' },
        { key: 'r3', cardClass: 'rec-card', badge: 'Offer', badgeClass: 'rec-badge offer', title: 'Loyalty Points Redemption', detail: '1,250 points expiring soon. Nudge redemption with a bonus multiplier to drive a repeat purchase.', score: '84% match', barClass: 'rec-fill', barStyle: 'width:84%', cta: 'Send reminder' },
        { key: 'r4', cardClass: 'rec-card', badge: 'Channel', badgeClass: 'rec-badge channel', title: 'Festive Ethnic Wear Collection', detail: 'Festival Shopper segment active. Push new Autumn/Winter ethnic range via RCS carousel.', score: '79% match', barClass: 'rec-fill', barStyle: 'width:79%', cta: 'Launch RCS campaign' },
        { key: 'r5', cardClass: 'rec-card full-width', badge: 'Next Best Action', badgeClass: 'rec-badge nba', title: 'Invite to Premium Styling Session', detail: 'High-value repeat buyer with strong menswear affinity. Personal styling invite at Phoenix Mall store is likely to lift AOV and deepen loyalty. Pair with a curated blazer + chino bundle preview.', score: '95% match', barClass: 'rec-fill', barStyle: 'width:95%', cta: 'Book styling appointment' }
    ];
}
