import { LightningElement, api } from 'lwc';

// Lead 360 — Activity Timeline (vertical omnichannel)
// Mock-first: static data mirrors the customer-360.html "Activity Timeline".
export default class De_lead360Timeline extends LightningElement {
    @api recordId;

    events = [
        { key: 'e1', eventClass: 'vtl-event whatsapp', label: 'Order Confirm', date: "Jul 28, '26", channelClass: 'vtl-channel whatsapp', channelLabel: 'WhatsApp' },
        { key: 'e2', eventClass: 'vtl-event web', label: 'Website Purchase', date: "Jul 28, '26", channelClass: 'vtl-channel web', channelLabel: 'Web' },
        { key: 'e3', eventClass: 'vtl-event rcs', label: 'Summer Sale Promo', date: "Jul 25, '26", channelClass: 'vtl-channel rcs', channelLabel: 'RCS' },
        { key: 'e4', eventClass: 'vtl-event app', label: 'App Browsing', date: "Jul 24, '26", channelClass: 'vtl-channel app', channelLabel: 'App' },
        { key: 'e5', eventClass: 'vtl-event whatsapp', label: 'Points Expiry Alert', date: "Jul 20, '26", channelClass: 'vtl-channel whatsapp', channelLabel: 'WhatsApp' },
        { key: 'e6', eventClass: 'vtl-event sms', label: 'Pickup Ready', date: "Jul 18, '26", channelClass: 'vtl-channel sms', channelLabel: 'SMS' },
        { key: 'e7', eventClass: 'vtl-event store', label: 'In-Store Pickup', date: "Jul 15, '26", channelClass: 'vtl-channel store', channelLabel: 'Store' },
        { key: 'e8', eventClass: 'vtl-event rcs', label: 'Cart Recovery', date: "Jul 13, '26", channelClass: 'vtl-channel rcs', channelLabel: 'RCS' },
        { key: 'e9', eventClass: 'vtl-event web', label: 'Cart Abandoned', date: "Jul 12, '26", channelClass: 'vtl-channel web', channelLabel: 'Web' },
        { key: 'e10', eventClass: 'vtl-event app', label: 'App Purchase', date: "Jun 22, '26", channelClass: 'vtl-channel app', channelLabel: 'App' },
        { key: 'e11', eventClass: 'vtl-event store', label: 'Ethnic Wear Buy', date: "May 30, '26", channelClass: 'vtl-channel store', channelLabel: 'Store' },
        { key: 'e12', eventClass: 'vtl-event web', label: 'Website Purchase', date: "Apr 12, '26", channelClass: 'vtl-channel web', channelLabel: 'Web' },
        { key: 'e13', eventClass: 'vtl-event store', label: 'In-Store Purchase', date: "Mar 5, '26", channelClass: 'vtl-channel store', channelLabel: 'Store' },
        { key: 'e14', eventClass: 'vtl-event app', label: 'App Purchase', date: "Jan 18, '26", channelClass: 'vtl-channel app', channelLabel: 'App' },
        { key: 'e15', eventClass: 'vtl-event store', label: 'In-Store Purchase', date: "Dec 20, '25", channelClass: 'vtl-channel store', channelLabel: 'Store' }
    ];
}
