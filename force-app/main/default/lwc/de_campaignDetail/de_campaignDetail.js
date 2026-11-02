import { LightningElement, api, wire } from 'lwc';
import getCampaign from '@salesforce/apex/de_CampaignController.getCampaign';
import getCampaignMembers from '@salesforce/apex/de_CampaignController.getCampaignMembers';

// Sample/fallback data — used when there is no recordId (e.g. the component
// is dropped on a non-record page) or while real data has not resolved yet.
const SAMPLE_CAMPAIGN = {
    Name: 'Velo Nova Festive Launch 2026',
    Type: 'Email',
    Status: 'In Progress',
    StartDate: '2026-06-01',
    EndDate: '2026-08-31'
};

const SAMPLE_MEMBERS = [
    { Id: 'sample-1', Type: 'Contact', Status: 'Sent', Name: 'Jane Cooper', Title: 'VP, Marketing' },
    { Id: 'sample-2', Type: 'Lead', Status: 'Responded', Name: 'Michael Torres', Title: 'IT Director' },
    { Id: 'sample-3', Type: 'Contact', Status: 'Sent', Name: 'Priya Nair', Title: 'Procurement Manager' },
    { Id: 'sample-4', Type: 'Lead', Status: 'Sent', Name: 'David Kim', Title: 'Operations Lead' }
];

// Campaign Messages panel is always sample data (no Apex wiring requested for it).
const SAMPLE_MESSAGES = [
    {
        Id: 'msg-1',
        name: 'Festive Offer Announcement',
        channel: 'Email',
        message: 'The festive season is here — special benefits on the Velo Nova at your nearest showroom.'
    },
    {
        Id: 'msg-2',
        name: 'Test Drive Reminder',
        channel: 'SMS',
        message: 'Reminder: your Velo Nova test-drive slot is this weekend. Reply YES to confirm.'
    },
    {
        Id: 'msg-3',
        name: 'Brochure Follow-up',
        channel: 'WhatsApp',
        message: 'Thanks for visiting! Here is the Velo Nova brochure you asked about, plus current offers.'
    }
];

const SEND_STATS = { submitted: 221, failed: 0, rejected: 3, waiting: 0 };

export default class De_campaignDetail extends LightningElement {
    @api recordId;

    campaign;
    campaignError;
    members;
    membersError;

    sendStats = SEND_STATS;

    @wire(getCampaign, { campaignId: '$recordId' })
    wiredCampaign({ data, error }) {
        if (data) {
            this.campaign = data;
            this.campaignError = undefined;
        } else if (error) {
            this.campaign = undefined;
            this.campaignError = this.extractError(error);
        }
    }

    @wire(getCampaignMembers, { campaignId: '$recordId', maxRows: 6 })
    wiredMembers({ data, error }) {
        if (data) {
            this.members = data;
            this.membersError = undefined;
        } else if (error) {
            this.members = undefined;
            this.membersError = this.extractError(error);
        }
    }

    extractError(error) {
        return (error && error.body && error.body.message) || 'Unable to load data right now.';
    }

    truncate(text, len = 62) {
        if (!text) {
            return '';
        }
        return text.length > len ? `${text.substring(0, len).trim()}…` : text;
    }

    /* ---------- header / highlights (wired, sample fallback) ---------- */

    get hasRecordId() {
        return !!this.recordId;
    }

    get showPlaceholder() {
        return !this.hasRecordId;
    }

    get showLoadError() {
        return this.hasRecordId && !!this.campaignError;
    }

    get displayCampaign() {
        return this.campaign || SAMPLE_CAMPAIGN;
    }

    get campaignName() {
        return this.displayCampaign.Name || 'Untitled Campaign';
    }

    get campaignType() {
        return this.displayCampaign.Type || '—';
    }

    get campaignStatus() {
        return this.displayCampaign.Status || '—';
    }

    get campaignStartDate() {
        return this.formatDate(this.displayCampaign.StartDate);
    }

    get campaignEndDate() {
        return this.formatDate(this.displayCampaign.EndDate);
    }

    formatDate(value) {
        if (!value) {
            return '—';
        }
        const parsed = new Date(`${value}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    /* ---------- campaign members (wired, sample fallback) ---------- */

    get displayMembers() {
        if (this.hasRecordId && this.members && this.members.length) {
            return this.members.map((m) => ({
                Id: m.Id,
                Type: m.Type || '—',
                Status: m.Status || '—',
                Name: m.Name,
                Title: m.Title || '—'
            }));
        }
        return SAMPLE_MEMBERS;
    }

    /* ---------- campaign messages (always sample) ---------- */

    get messages() {
        return SAMPLE_MESSAGES.map((m) => ({ ...m, preview: this.truncate(m.message) }));
    }

    /* ---------- decorative links/buttons (no real actions) ---------- */

    stopNav(event) {
        if (event) {
            event.preventDefault();
        }
    }
}
