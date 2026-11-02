import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getActiveCampaigns from '@salesforce/apex/de_CampaignController.getActiveCampaigns';

const COLLATERAL_ITEMS = [
    { id: 'col-1', name: 'Velo Motors Dealer Onboarding Deck.pptx' },
    { id: 'col-2', name: 'Nova & Spark Product Roadmap.pdf' },
    { id: 'col-3', name: 'Co-Branded Campaign Flyer Template.docx' },
    { id: 'col-4', name: 'Hawk & Savanna Pricing One-Pager.pdf' }
];

const SHARED_NAV_ITEMS = [
    { id: 'nav-1', label: 'Owned by Me' },
    { id: 'nav-2', label: 'Shared with Me' },
    { id: 'nav-3', label: 'Recent' },
    { id: 'nav-4', label: 'Following' },
    { id: 'nav-5', label: 'Libraries' }
];

const SHARED_FILES = [
    { id: 'file-1', title: 'Velo Motors Dealer Enablement Kit.zip', owner: 'Jordan Lee' },
    { id: 'file-2', title: 'Regional Showroom Sales Deck.pptx', owner: 'Amara Singh' }
];

export default class De_activeCampaignsRail extends NavigationMixin(LightningElement) {
    @api maxRows = 12;

    activeTab = 'Campaigns';
    campaigns = [];
    campaignError;

    collateralItems = COLLATERAL_ITEMS;
    sharedNavItems = SHARED_NAV_ITEMS;
    sharedFiles = SHARED_FILES;
    activeNavId = 'nav-1';

    @wire(getActiveCampaigns, { maxRows: '$maxRows' })
    wiredCampaigns({ data, error }) {
        if (data) {
            this.campaigns = data.map((campaign) => ({
                Id: campaign.Id,
                Name: campaign.Name,
                StartDate: this.formatDate(campaign.StartDate),
                EndDate: this.formatDate(campaign.EndDate),
                Type: campaign.Type || '—'
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

    get tabs() {
        return [
            { label: 'Campaigns', value: 'Campaigns' },
            { label: 'Collateral', value: 'Collateral' },
            { label: 'Shared Files', value: 'Shared Files' }
        ].map((tab) => ({
            ...tab,
            cssClass: tab.value === this.activeTab
                ? 'ccr-tab ccr-tab_active'
                : 'ccr-tab'
        }));
    }

    get isCampaignsTab() {
        return this.activeTab === 'Campaigns';
    }

    get isCollateralTab() {
        return this.activeTab === 'Collateral';
    }

    get isSharedFilesTab() {
        return this.activeTab === 'Shared Files';
    }

    get hasCampaigns() {
        return !this.campaignError && this.campaigns && this.campaigns.length > 0;
    }

    get showCampaignsEmpty() {
        return !this.campaignError && (!this.campaigns || this.campaigns.length === 0);
    }

    get hasCampaignError() {
        return !!this.campaignError;
    }

    get sharedNavItemsFormatted() {
        return this.sharedNavItems.map((item) => ({
            ...item,
            cssClass: item.id === this.activeNavId
                ? 'ccr-sidenav__item ccr-sidenav__item_active'
                : 'ccr-sidenav__item'
        }));
    }

    handleTabClick(event) {
        this.activeTab = event.currentTarget.dataset.value;
    }

    handleNavClick(event) {
        this.activeNavId = event.currentTarget.dataset.id;
    }

    handleLinkClick(event) {
        event.preventDefault();
    }

    // Open the clicked campaign's detail record page (marketing/campaign/<id>).
    handleCampaignClick(event) {
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
