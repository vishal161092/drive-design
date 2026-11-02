import { LightningElement, api } from 'lwc';

// Lead 360 — AI-Powered Insights
// Mock-first: static data mirrors the customer-360.html "AI-Powered Insights" card.
export default class De_lead360Insights extends LightningElement {
    @api recordId;

    tiles = [
        {
            key: 'clv',
            itemClass: 'insight-item',
            label: 'Customer Lifetime Value',
            value: '₹2,45,000',
            valueClass: 'insight-value red',
            valueStyle: '',
            sub: 'Top 12% of customers',
            showSub: true,
            showBar: false,
            barClass: '',
            barStyle: ''
        },
        {
            key: 'rfm',
            itemClass: 'insight-item',
            label: 'RFM Score',
            value: '4-4-3',
            valueClass: 'insight-value',
            valueStyle: '',
            sub: 'High Value Loyal',
            showSub: true,
            showBar: false,
            barClass: '',
            barStyle: ''
        },
        {
            key: 'propensity',
            itemClass: 'insight-item',
            label: 'Propensity to Purchase',
            value: '82%',
            valueClass: 'insight-value high',
            valueStyle: '',
            sub: '',
            showSub: false,
            showBar: true,
            barClass: 'fill green',
            barStyle: 'width:82%'
        },
        {
            key: 'engagement',
            itemClass: 'insight-item',
            label: 'Engagement Score',
            value: '78/100',
            valueClass: 'insight-value',
            valueStyle: '',
            sub: '',
            showSub: false,
            showBar: true,
            barClass: 'fill',
            barStyle: 'width:78%'
        },
        {
            key: 'channel',
            itemClass: 'insight-item',
            label: 'Preferred Channel',
            value: '💬 WhatsApp',
            valueClass: 'insight-value',
            valueStyle: 'font-size:13px',
            sub: '62% open rate',
            showSub: true,
            showBar: false,
            barClass: '',
            barStyle: ''
        },
        {
            key: 'churn',
            itemClass: 'insight-item',
            label: 'Churn Risk',
            value: 'Low (8%)',
            valueClass: 'insight-value high',
            valueStyle: 'font-size:13px',
            sub: '',
            showSub: false,
            showBar: true,
            barClass: 'fill green',
            barStyle: 'width:8%'
        },
        {
            key: 'nba',
            itemClass: 'insight-item full-width',
            label: '✨ Next Best Action',
            value: 'Park Avenue Summer Collection — 20% Exclusive Offer',
            valueClass: 'insight-value',
            valueStyle: 'font-size:12px;color:#c41e3a',
            sub: 'Based on browsing history + seasonal affinity pattern',
            showSub: true,
            showBar: false,
            barClass: '',
            barStyle: ''
        }
    ];
}
