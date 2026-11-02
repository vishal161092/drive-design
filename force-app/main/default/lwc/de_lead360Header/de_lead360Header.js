import { LightningElement, api } from 'lwc';

// Lead 360 — Profile Card
// Mock-first: static data mirrors the customer-360.html profile card (Raj Malhotra).
// recordId is wired for a future swap to real Lead data.
export default class De_lead360Header extends LightningElement {
    @api recordId;

    name = 'Raj Malhotra';
    initials = 'RM';
    idLine = 'UCID: DC-2024-08291 • Raymond Rewards ID: RR-1847293';
    loyalty = '⭐ Gold Member • 1,250 pts';

    details = [
        { label: 'Age / Gender', value: '34 / Male' },
        { label: 'Location', value: 'Mumbai, Maharashtra' },
        { label: 'Income Bracket', value: '₹15L – 20L' },
        { label: 'Email', value: 'raj.malhotra@example.com' },
        { label: 'Phone', value: '+91 98XXX XXXXX' },
        { label: 'Member Since', value: 'Mar 2022' },
        { label: 'Preferred Language', value: 'English, Hindi' }
    ];
}
