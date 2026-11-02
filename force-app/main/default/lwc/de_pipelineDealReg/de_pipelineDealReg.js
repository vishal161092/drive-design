import { LightningElement, wire } from 'lwc';
import getLeads from '@salesforce/apex/de_PartnerHubController.getLeads';

const COLUMNS = [
    {
        label: 'Name',
        fieldName: 'nameUrl',
        type: 'url',
        typeAttributes: { label: { fieldName: 'Name' }, target: '_self' }
    },
    { label: 'Phone', fieldName: 'Phone', type: 'phone' },
    { label: 'Email', fieldName: 'Email', type: 'email' },
    { label: 'Status', fieldName: 'Status' },
    { label: 'Company', fieldName: 'Company' },
    { label: 'Owner', fieldName: 'ownerName' },
    { label: 'Created Date', fieldName: 'CreatedDate', type: 'date' }
];

export default class De_pipelineDealReg extends LightningElement {
    activeTab = 'registered';
    leads = [];
    error;
    isLoading = true;
    columns = COLUMNS;

    @wire(getLeads, { maxRows: 50 })
    wiredLeads({ data, error }) {
        this.isLoading = false;
        if (data) {
            this.leads = data.map((row) => ({
                ...row,
                nameUrl: `/lightning/r/Lead/${row.Id}/view`,
                ownerName: row.Owner ? row.Owner.Name : ''
            }));
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.leads = [];
        }
    }

    get hasData() {
        return this.leads && this.leads.length > 0;
    }

    get showEmpty() {
        return !this.isLoading && !this.error && !this.hasData;
    }

    get registeredTabClass() {
        return this.tabClass('registered');
    }

    get approvedTabClass() {
        return this.tabClass('approved');
    }

    get rejectedTabClass() {
        return this.tabClass('rejected');
    }

    tabClass(name) {
        return 'cc-tab' + (this.activeTab === name ? ' cc-tab--active' : '');
    }

    handleTabClick(event) {
        this.activeTab = event.currentTarget.dataset.tab;
    }
}
