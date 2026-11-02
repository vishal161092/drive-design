import { LightningElement, api, track } from 'lwc';
import searchContacts from '@salesforce/apex/de_PartnerHubController.searchContacts';

export default class De_quickSendMessage extends LightningElement {
    @api recordLabel = 'Quick Send Message';
    @api recordTitle = 'Free Form - SMS';

    @track searchTerm = '';
    @track results = [];
    selectedContact;
    showDropdown = false;
    hasSearched = false;
    _blurTimer;
    _debounce;

    get showNoResults() {
        return this.hasSearched && this.results.length === 0;
    }

    // --- Contact lookup ---
    handleSearchInput(event) {
        this.searchTerm = event.target.value;
        this.showDropdown = true;
        // Debounce the Apex call so we don't query on every keystroke.
        window.clearTimeout(this._debounce);
        const term = this.searchTerm;
        this._debounce = window.setTimeout(() => this.runSearch(term), 250);
    }

    handleSearchFocus() {
        this.showDropdown = true;
        if (!this.hasSearched) {
            this.runSearch(this.searchTerm);
        }
    }

    handleSearchBlur() {
        // Delay hiding so a click on a dropdown item still registers.
        this._blurTimer = window.setTimeout(() => {
            this.showDropdown = false;
        }, 200);
    }

    runSearch(term) {
        searchContacts({ term })
            .then((data) => {
                this.results = (data || []).map((c) => ({
                    Id: c.Id,
                    Name: c.Name,
                    detail: this.buildDetail(c)
                }));
                this.hasSearched = true;
            })
            .catch(() => {
                this.results = [];
                this.hasSearched = true;
            });
    }

    buildDetail(contact) {
        const parts = [];
        if (contact.Title) {
            parts.push(contact.Title);
        }
        if (contact.Account && contact.Account.Name) {
            parts.push(contact.Account.Name);
        }
        if (!parts.length && contact.Email) {
            parts.push(contact.Email);
        }
        if (!parts.length && contact.Phone) {
            parts.push(contact.Phone);
        }
        return parts.join(' • ');
    }

    handleSelectContact(event) {
        window.clearTimeout(this._blurTimer);
        const { id, name, detail } = event.currentTarget.dataset;
        this.selectedContact = { Id: id, Name: name, detail };
        this.showDropdown = false;
        this.searchTerm = '';
    }

    handleClearContact() {
        this.selectedContact = undefined;
        this.searchTerm = '';
        this.results = [];
        this.hasSearched = false;
    }

    // --- Decorative header/setting actions (no real backend) ---
    handleNewLeadReferral() {
        // eslint-disable-next-line no-console
        console.log('New Lead & Referral clicked');
    }

    handleEdit() {
        // eslint-disable-next-line no-console
        console.log('Edit clicked');
    }

    handlePrintableView() {
        // eslint-disable-next-line no-console
        console.log('Printable View clicked');
    }

    handleMoreActions() {
        // eslint-disable-next-line no-console
        console.log('More actions dropdown clicked');
    }

    handleAudienceEdit() {
        // Focus the lookup input so the user can start searching.
        const input = this.template.querySelector('.cc-qsm__lookup-input');
        if (input) {
            input.focus();
        }
    }

    handleSettingEdit() {
        // eslint-disable-next-line no-console
        console.log('Quick Send Setting edit clicked');
    }

    handleClearDefaults() {
        // eslint-disable-next-line no-console
        console.log('Clear Defaults clicked');
    }

    handleToggleFavorite() {
        // eslint-disable-next-line no-console
        console.log('Favorite star toggled');
    }
}
