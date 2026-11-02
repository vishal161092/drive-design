import { LightningElement, api } from 'lwc';

// Lead 360 — Purchase History
// Mock-first: static data mirrors the customer-360.html Purchase History table.
// recordId is wired for a future swap to real Lead data.
export default class De_lead360PurchaseHistory extends LightningElement {
    @api recordId;

    rows = [
        { key: 'p1', date: "Jul 28, '26", brand: 'Park Avenue', channelClass: 'channel-badge web', channelLabel: '🌐 Web', items: 'Linen Shirt (x2), Chinos', amount: '₹8,490', points: '+170' },
        { key: 'p2', date: "Jul 15, '26", brand: 'The Raymond Shop', channelClass: 'channel-badge store', channelLabel: '🏪 Store', items: 'Premium Suit (Tailored)', amount: '₹32,000', points: '+640' },
        { key: 'p3', date: "Jun 22, '26", brand: 'Park Avenue', channelClass: 'channel-badge app', channelLabel: '📱 App', items: 'Formal Shoes, Belt', amount: '₹6,200', points: '+124' },
        { key: 'p4', date: "May 30, '26", brand: 'The Raymond Shop', channelClass: 'channel-badge store', channelLabel: '🏪 Store', items: 'Ethnic Wear — Bandhgala', amount: '₹18,500', points: '+370' },
        { key: 'p5', date: "Apr 12, '26", brand: 'Park Avenue', channelClass: 'channel-badge web', channelLabel: '🌐 Web', items: 'Polo T-shirts (x3)', amount: '₹4,470', points: '+89' },
        { key: 'p6', date: "Mar 5, '26", brand: 'The Raymond Shop', channelClass: 'channel-badge store', channelLabel: '🏪 Store', items: 'Formal Trousers (x2), Shirt', amount: '₹9,800', points: '+196' },
        { key: 'p7', date: "Jan 18, '26", brand: 'Park Avenue', channelClass: 'channel-badge app', channelLabel: '📱 App', items: 'Winter Jacket, Sweater', amount: '₹7,990', points: '+160' },
        { key: 'p8', date: "Dec 20, '25", brand: 'The Raymond Shop', channelClass: 'channel-badge store', channelLabel: '🏪 Store', items: 'Premium Gift Hamper', amount: '₹12,000', points: '+240' }
    ];
}
