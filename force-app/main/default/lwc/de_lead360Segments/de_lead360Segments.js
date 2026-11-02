import { LightningElement, api } from 'lwc';

// Lead 360 — Segments & Clusters
// Mock-first: static data mirrors the customer-360.html "Segments & Clusters" card.
export default class De_lead360Segments extends LightningElement {
    @api recordId;

    clusters = [
        { key: 'c1', label: 'Premium Menswear Enthusiast' },
        { key: 'c2', label: 'Omnichannel Shopper' },
        { key: 'c3', label: 'Loyalty Advocate' }
    ];

    segments = [
        { key: 's1', label: 'High-Value Repeat Buyer' },
        { key: 's2', label: 'Digital-First Engager' },
        { key: 's3', label: 'Festival Season Shopper' },
        { key: 's4', label: 'Cross-Brand Explorer' }
    ];

    history = [
        { key: 'h1', name: 'Premium Menswear', when: 'Active since Jan 2023' },
        { key: 'h2', name: 'Festival Shopper', when: 'Added Oct 2024' },
        { key: 'h3', name: 'Cross-Brand Explorer', when: 'Added Mar 2025' }
    ];
}
