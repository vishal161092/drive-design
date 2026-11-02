import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { CurrentPageReference } from 'lightning/navigation';

export default class De_quickSendWorkspace extends NavigationMixin(LightningElement) {
    @track selected;

    // When the page is opened with ?compose=1 (e.g. from a Content Marketplace
    // card), jump straight to the send/compose screen instead of the list.
    startCompose = false;
    composeName;
    // True when we arrived here from a Content Marketplace tile, so "Back"
    // should return to the marketplace page rather than the Quick Sends list.
    fromMarketplace = false;

    @wire(CurrentPageReference)
    setPageRef(ref) {
        if (!ref || !ref.state) {
            return;
        }
        const compose = ref.state.compose || ref.state.c__compose;
        if (compose === '1' || compose === 'true') {
            this.startCompose = true;
            this.fromMarketplace = true;
            const item = ref.state.item || ref.state.c__item;
            this.composeName = item ? decodeURIComponent(item) : 'Free Form - SMS';
        }
    }

    get showList() {
        return !this.showCompose;
    }

    get backLabel() {
        return this.fromMarketplace ? 'Back to Content Marketplace' : 'Back to Quick Sends';
    }

    get showCompose() {
        return !!this.selected || this.startCompose;
    }

    get selectedName() {
        if (this.selected) {
            return this.selected.name;
        }
        if (this.startCompose && this.composeName) {
            return this.composeName;
        }
        return 'Free Form - SMS';
    }

    handleSelect(event) {
        this.selected = event.detail;
    }

    handleBack() {
        if (this.fromMarketplace) {
            // Return to the Content Marketplace page we came from.
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: '/partnerhub/s/marketing/campaign-marketplace'
                }
            });
            return;
        }
        this.selected = undefined;
        this.startCompose = false;
    }
}
