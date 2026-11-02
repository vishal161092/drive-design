import { LightningElement, api } from 'lwc';

// Lead 360 — Overview (Unified Identity + Data Sources + Key Metrics)
// Mock-first: static data mirrors the customer-360.html Overview tab.
// recordId is wired for a future swap to real Lead data.
export default class De_lead360Overview extends LightningElement {
    @api recordId;

    idNodes = [
        { key: 'unified', cls: 'id-node primary', label: 'Unified ID', value: 'DC-2024-08291' },
        { key: 'loyalty', cls: 'id-node', label: 'Loyalty', value: 'RR-1847293' },
        { key: 'ecom', cls: 'id-node', label: 'E-commerce', value: 'PA-USR-4821' },
        { key: 'mobile', cls: 'id-node', label: 'Mobile', value: '+91 98XXX' },
        { key: 'email', cls: 'id-node', label: 'Email', value: 'raj.m***@gmail' }
    ];

    dataSources = [
        { key: 'pos', text: 'Raymond Shop POS — In-store transactions' },
        { key: 'ecom', text: 'Park Avenue E-commerce — Web orders & browsing' },
        { key: 'app', text: 'Raymond Rewards App — Loyalty & app events' },
        { key: 'mc', text: 'Marketing Cloud — WhatsApp, RCS, SMS, Email' },
        { key: 'service', text: 'Service Cloud — Cases & interactions' }
    ];

    metrics = [
        { key: 'orders', value: '12', valueClass: 'metric-value', label: 'Total Orders' },
        { key: 'spend', value: '₹1.8L', valueClass: 'metric-value', label: 'Total Spend' },
        { key: 'aov', value: '₹15,200', valueClass: 'metric-value', label: 'Avg. Order Value' },
        { key: 'freq', value: '28 days', valueClass: 'metric-value green', label: 'Avg. Purchase Freq.' },
        { key: 'points', value: '1,250', valueClass: 'metric-value brand', label: 'Loyalty Points' }
    ];
}
