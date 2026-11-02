import { LightningElement, api } from 'lwc';

// Lead 360 — Engagement History (omnichannel feed)
// Mock-first: static data mirrors the customer-360.html "Engagement History" tab.
export default class De_lead360Engagement extends LightningElement {
    @api recordId;

    items = [
        { key: 'g1', iconClass: 'eng-icon whatsapp', icon: '💬', title: 'Order confirmation sent via WhatsApp', detail: 'Order #RL-88213 — Park Avenue Formal Shirt', date: "Jul 28, '26", statusLabel: 'Delivered', statusStyle: 'color:#2e844a' },
        { key: 'g2', iconClass: 'eng-icon rcs', icon: '📲', title: 'Summer Sale RCS campaign', detail: 'Rich card with product carousel — 3 items viewed', date: "Jul 25, '26", statusLabel: 'Opened', statusStyle: 'color:#2e844a' },
        { key: 'g3', iconClass: 'eng-icon app', icon: '📱', title: 'Push notification — App browsing', detail: 'Viewed Ethnic Wear collection for 6 min', date: "Jul 24, '26", statusLabel: 'Clicked', statusStyle: 'color:#2e844a' },
        { key: 'g4', iconClass: 'eng-icon whatsapp', icon: '💬', title: 'Loyalty points expiry reminder', detail: '1,250 points expiring — WhatsApp broadcast', date: "Jul 20, '26", statusLabel: 'Read', statusStyle: 'color:#2e844a' },
        { key: 'g5', iconClass: 'eng-icon sms', icon: '✉', title: 'Store pickup ready — SMS alert', detail: 'Order ready at Phoenix Mall, Mumbai', date: "Jul 18, '26", statusLabel: 'Delivered', statusStyle: 'color:#2e844a' },
        { key: 'g6', iconClass: 'eng-icon rcs', icon: '📲', title: 'Cart recovery RCS message', detail: '2 items left in cart — reminder with offer', date: "Jul 13, '26", statusLabel: 'Opened', statusStyle: 'color:#2e844a' },
        { key: 'g7', iconClass: 'eng-icon email', icon: '📧', title: 'Monthly newsletter — New Arrivals', detail: 'Autumn/Winter collection preview', date: "Jul 5, '26", statusLabel: 'Not opened', statusStyle: 'color:#c0392b' },
        { key: 'g8', iconClass: 'eng-icon email', icon: '📧', title: 'Post-purchase feedback request', detail: 'CSAT survey — rated 4.8/5', date: "Jun 24, '26", statusLabel: 'Completed', statusStyle: 'color:#2e844a' }
    ];
}
