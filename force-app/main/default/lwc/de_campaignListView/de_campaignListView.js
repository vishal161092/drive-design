import { LightningElement, api, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getActiveCampaigns from '@salesforce/apex/de_CampaignController.getActiveCampaigns';

export default class De_campaignListView extends NavigationMixin(LightningElement) {
    @api heading = 'All Campaigns';
    @api maxRows = 50;

    @track searchTerm = '';
    campaigns = [];
    campaignError;

    @wire(getActiveCampaigns, { maxRows: '$maxRows' })
    wiredCampaigns({ data, error }) {
        if (data) {
            this.campaigns = data.map((campaign) => ({
                Id: campaign.Id,
                Name: campaign.Name,
                Type: campaign.Type || '—',
                Status: campaign.Status || '—',
                StartDate: this.formatDate(campaign.StartDate),
                EndDate: this.formatDate(campaign.EndDate)
            }));
            this.campaignError = undefined;
        } else if (error) {
            this.campaigns = [];
            this.campaignError = this.extractErrorMessage(error);
        }
    }

    formatDate(value) {
        if (!value) {
            return '—';
        }
        const parsed = new Date(`${value}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        return parsed.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    extractErrorMessage(error) {
        if (error && error.body && error.body.message) {
            return error.body.message;
        }
        if (error && error.message) {
            return error.message;
        }
        return 'An error occurred while loading campaigns.';
    }

    get filteredRows() {
        const term = (this.searchTerm || '').trim().toLowerCase();
        if (!term) {
            return this.campaigns;
        }
        return this.campaigns.filter((row) => row.Name.toLowerCase().includes(term));
    }

    get metaLine() {
        const count = this.filteredRows.length;
        return `${count} item${count === 1 ? '' : 's'} • Sorted by Start Date`;
    }

    get hasCampaigns() {
        return !this.campaignError && this.filteredRows.length > 0;
    }

    get hasNoResults() {
        return !this.campaignError && this.filteredRows.length === 0;
    }

    get hasError() {
        return !!this.campaignError;
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
    }

    // Clicking a campaign opens its detail record page (marketing/campaign/<id>).
    handleRowSelect(event) {
        event.preventDefault();
        const recordId = event.currentTarget.dataset.id;
        if (!recordId) {
            return;
        }
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId,
                objectApiName: 'Campaign',
                actionName: 'view'
            }
        });
    }
}
