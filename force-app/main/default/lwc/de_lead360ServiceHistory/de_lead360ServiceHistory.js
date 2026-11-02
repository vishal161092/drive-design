import { LightningElement, api } from 'lwc';

// Lead 360 — Service History
// Mock-first: static data mirrors the customer-360.html Service History table + stats.
// recordId is wired for a future swap to real Lead data.
export default class De_lead360ServiceHistory extends LightningElement {
    @api recordId;

    rows = [
        { key: 'c1', caseNo: 'CS-00482', date: "Jul 10, '26", subject: 'Size exchange — Park Avenue Chinos', channelClass: 'channel-badge whatsapp', channelLabel: '💬 WA', statusClass: 'status-pill resolved', statusLabel: 'Resolved' },
        { key: 'c2', caseNo: 'CS-00391', date: "May 22, '26", subject: 'Delayed delivery — Online order', channelClass: 'channel-badge app', channelLabel: '📱 App', statusClass: 'status-pill resolved', statusLabel: 'Resolved' },
        { key: 'c3', caseNo: 'CS-00298', date: "Feb 14, '26", subject: 'Loyalty points not credited', channelClass: 'channel-badge email', channelLabel: '✉ Email', statusClass: 'status-pill resolved', statusLabel: 'Resolved' },
        { key: 'c4', caseNo: 'CS-00185', date: "Nov 5, '25", subject: 'Alteration request — Suit fitting', channelClass: 'channel-badge store', channelLabel: '🏪 Store', statusClass: 'status-pill closed', statusLabel: 'Closed' }
    ];

    stats = [
        { key: 's1', value: '4', valueClass: 'stat-value', label: 'Total Cases' },
        { key: 's2', value: '100%', valueClass: 'stat-value green', label: 'Resolved' },
        { key: 's3', value: '1.5d', valueClass: 'stat-value', label: 'Avg. Time' },
        { key: 's4', value: '4.8/5', valueClass: 'stat-value brand', label: 'CSAT' }
    ];
}
