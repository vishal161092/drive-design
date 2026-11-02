import { LightningElement, wire } from 'lwc';
import getContacts from '@salesforce/apex/de_PartnerHubController.getContacts';
import getLeads from '@salesforce/apex/de_PartnerHubController.getLeads';
import getAccounts from '@salesforce/apex/de_PartnerHubController.getAccounts';

const CONTACT_COLUMNS = [
    {
        label: 'Name',
        fieldName: 'nameUrl',
        type: 'url',
        typeAttributes: { label: { fieldName: 'Name' }, target: '_self' }
    },
    { label: 'Title', fieldName: 'Title' },
    { label: 'Account', fieldName: 'accountName' },
    { label: 'Email', fieldName: 'Email', type: 'email' },
    { label: 'Phone', fieldName: 'Phone', type: 'phone' }
];

const LEAD_COLUMNS = [
    {
        label: 'Name',
        fieldName: 'nameUrl',
        type: 'url',
        typeAttributes: { label: { fieldName: 'Name' }, target: '_self' }
    },
    { label: 'Company', fieldName: 'Company' },
    { label: 'Status', fieldName: 'Status' },
    { label: 'Email', fieldName: 'Email', type: 'email' },
    { label: 'Phone', fieldName: 'Phone', type: 'phone' }
];

const ACCOUNT_COLUMNS = [
    {
        label: 'Name',
        fieldName: 'nameUrl',
        type: 'url',
        typeAttributes: { label: { fieldName: 'Name' }, target: '_self' }
    },
    { label: 'Industry', fieldName: 'Industry' },
    { label: 'Type', fieldName: 'Type' },
    { label: 'Phone', fieldName: 'Phone', type: 'phone' },
    { label: 'Location', fieldName: 'location' }
];

export default class De_customersContacts extends LightningElement {
    activeTab = 'contacts';
    contactColumns = CONTACT_COLUMNS;
    leadColumns = LEAD_COLUMNS;
    accountColumns = ACCOUNT_COLUMNS;

    contacts = [];
    leads = [];
    accounts = [];

    contactsError;
    leadsError;
    accountsError;

    contactsLoading = true;
    leadsLoading = true;
    accountsLoading = true;

    @wire(getContacts, { maxRows: 50 })
    wiredContacts({ data, error }) {
        this.contactsLoading = false;
        if (data) {
            this.contacts = data.map((row) => ({
                ...row,
                nameUrl: `/lightning/r/Contact/${row.Id}/view`,
                accountName: row.Account ? row.Account.Name : ''
            }));
            this.contactsError = undefined;
        } else if (error) {
            this.contactsError = error;
            this.contacts = [];
        }
    }

    @wire(getLeads, { maxRows: 50 })
    wiredLeads({ data, error }) {
        this.leadsLoading = false;
        if (data) {
            this.leads = data.map((row) => ({
                ...row,
                nameUrl: `/lightning/r/Lead/${row.Id}/view`
            }));
            this.leadsError = undefined;
        } else if (error) {
            this.leadsError = error;
            this.leads = [];
        }
    }

    @wire(getAccounts, { maxRows: 50 })
    wiredAccounts({ data, error }) {
        this.accountsLoading = false;
        if (data) {
            this.accounts = data.map((row) => ({
                ...row,
                nameUrl: `/lightning/r/Account/${row.Id}/view`,
                location: [row.BillingCity, row.BillingState].filter(Boolean).join(', ')
            }));
            this.accountsError = undefined;
        } else if (error) {
            this.accountsError = error;
            this.accounts = [];
        }
    }

    get isContacts() {
        return this.activeTab === 'contacts';
    }

    get isLeads() {
        return this.activeTab === 'leads';
    }

    get isAccounts() {
        return this.activeTab === 'accounts';
    }

    get contactsTabClass() {
        return this.tabClass('contacts');
    }

    get leadsTabClass() {
        return this.tabClass('leads');
    }

    get accountsTabClass() {
        return this.tabClass('accounts');
    }

    tabClass(name) {
        return 'cc-tab' + (this.activeTab === name ? ' cc-tab--active' : '');
    }

    handleTabClick(event) {
        this.activeTab = event.currentTarget.dataset.tab;
    }

    get hasContacts() {
        return this.contacts && this.contacts.length > 0;
    }

    get showContactsEmpty() {
        return !this.contactsLoading && !this.contactsError && !this.hasContacts;
    }

    get hasLeads() {
        return this.leads && this.leads.length > 0;
    }

    get showLeadsEmpty() {
        return !this.leadsLoading && !this.leadsError && !this.hasLeads;
    }

    get hasAccounts() {
        return this.accounts && this.accounts.length > 0;
    }

    get showAccountsEmpty() {
        return !this.accountsLoading && !this.accountsError && !this.hasAccounts;
    }
}
