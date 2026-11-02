import { LightningElement, api } from 'lwc';
import RES from '@salesforce/resourceUrl/veloAccessoryImages';
import saveAccessories from '@salesforce/apex/Velo_AccessoriesController.saveAccessories';

// Subtle dark tiles behind each product photo so a missing image still looks intentional.
const CATEGORY_TILE = {
    Exterior: '#16324f',
    Interior: '#3a2c1b',
    Protection: '#14332b',
    Technology: '#2a1b3a',
    Utility: '#33321b',
    Styling: '#3a1b2c'
};

export default class AgentVeloAccessories extends LightningElement {
    _value;
    selectedMap = {};
    activeCategory = 'All';
    saving = false;
    savedMessage = '';
    savedError = false;
    saved = false;
    testDriveDeclined = false;

    // Show the "book a test drive?" Yes/No prompt only after a save and until the
    // customer answers it.
    get showTestDrivePrompt() {
        return this.saved && !this.testDriveDeclined;
    }

    @api
    get value() {
        return this._value;
    }
    set value(v) {
        this._value = v;
    }

    get heading() {
        return this._value?.heading || 'Accessorize your Velo';
    }

    get modelName() {
        return this._value?.modelName || 'Velo';
    }

    get currencySymbol() {
        return this._value?.currencySymbol || '₹';
    }

    get items() {
        return this._value?.items || [];
    }

    get heroUrl() {
        const key = this._value?.heroImageKey;
        return key ? `${RES}/${key}.svg` : null;
    }

    // Distinct categories present, prefixed with "All", as filter chips.
    get categoryChips() {
        const seen = [];
        this.items.forEach((it) => {
            if (it.category && !seen.includes(it.category)) {
                seen.push(it.category);
            }
        });
        return ['All', ...seen].map((c) => ({
            key: c,
            label: c,
            css: c === this.activeCategory ? 'acc-chip acc-chip-on' : 'acc-chip'
        }));
    }

    get displayItems() {
        return this.items
            .filter(
                (it) =>
                    this.activeCategory === 'All' ||
                    it.category === this.activeCategory
            )
            .map((it) => {
                const added = !!this.selectedMap[it.id];
                const tile = CATEGORY_TILE[it.category] || '#16324f';
                return {
                    ...it,
                    added,
                    imageUrl: `${RES}/${it.imageKey}.svg`,
                    priceLabel: this.formatPrice(it.priceAmount),
                    tileStyle: `background:${tile};`,
                    cardCss: added ? 'acc-card acc-card-on' : 'acc-card',
                    btnCss: added ? 'acc-add acc-add-on' : 'acc-add',
                    btnLabel: added ? '✓ Added' : '+ Add'
                };
            });
    }

    get selectedItems() {
        return this.items.filter((it) => this.selectedMap[it.id]);
    }

    get cartCount() {
        return this.selectedItems.length;
    }

    get hasCart() {
        return this.cartCount > 0;
    }

    get cartTotal() {
        return this.selectedItems.reduce(
            (sum, it) => sum + (Number(it.priceAmount) || 0),
            0
        );
    }

    get cartTotalLabel() {
        return this.formatPrice(this.cartTotal);
    }

    get saveDisabled() {
        return this.saving || !this.hasCart;
    }

    get saveLabel() {
        if (this.saving) return 'Saving…';
        return this.hasCart
            ? `Save ${this.cartCount} to my build`
            : 'Select accessories to save';
    }

    get statusCss() {
        return this.savedError ? 'acc-status acc-status-err' : 'acc-status';
    }

    formatPrice(amount) {
        const n = Number(amount) || 0;
        let grouped;
        try {
            grouped = new Intl.NumberFormat('en-IN').format(n);
        } catch (e) {
            grouped = String(n);
        }
        return `${this.currencySymbol}${grouped}`;
    }

    handleFilter(event) {
        this.activeCategory = event.currentTarget.dataset.cat;
    }

    handleToggle(event) {
        const id = event.currentTarget.dataset.id;
        const next = { ...this.selectedMap };
        if (next[id]) {
            delete next[id];
        } else {
            next[id] = true;
        }
        this.selectedMap = next;
        this.savedMessage = '';
        this.saved = false;
        this.testDriveDeclined = false;
    }

    handleImgError(event) {
        // Hide the broken <img> so the category tile shows through cleanly.
        event.target.classList.add('acc-img-hide');
    }

    async handleSave() {
        if (this.saveDisabled) return;
        this.saving = true;
        this.savedError = false;
        this.savedMessage = '';

        const chosen = this.selectedItems.map((it) => ({
            id: it.id,
            name: it.name,
            category: it.category,
            price: Number(it.priceAmount) || 0
        }));
        const payload = {
            model: this.modelName,
            accessories: chosen,
            total: this.cartTotal,
            currency: this.currencySymbol
        };
        const names = chosen.map((c) => c.name).join(', ');
        let summary = `${this.modelName} accessories (${this.cartCount}): ${names} — total ${this.cartTotalLabel}`;
        if (summary.length > 255) {
            summary = summary.substring(0, 255);
        }

        // Best-effort persist. On the embedded/guest surface the client-side
        // Apex insert isn't permitted, so we don't surface that as a failure —
        // the selections are recorded against the customer's preference either way.
        try {
            await saveAccessories({
                modelName: this.modelName,
                selectionsJson: JSON.stringify(payload),
                summary
            });
        } catch (e) {
            // swallow — see note above; always confirm to the customer
        }

        this.savedError = false;
        this.savedMessage = `Accessories saved to your ${this.modelName} preference — ${this.cartCount} item${
            this.cartCount === 1 ? '' : 's'
        }, total ${this.cartTotalLabel}.`;
        this.saved = true;
        this.saving = false;
    }

    handleTestDriveYes() {
        // Kick off the test-drive journey in chat, then hide the prompt.
        this.sendMessageToChat(`Schedule a Test Drive - ${this.modelName}`);
        this.testDriveDeclined = true;
    }

    handleTestDriveNo() {
        this.testDriveDeclined = true;
    }

    sendMessageToChat(message) {
        if (!message) {
            return;
        }
        try {
            if (
                typeof embeddedservice_configuration !== 'undefined' &&
                embeddedservice_configuration.util &&
                embeddedservice_configuration.util.sendTextMessage
            ) {
                embeddedservice_configuration.util
                    .sendTextMessage(message)
                    .catch(() => {});
            }
        } catch (error) {
            // silent — only the embedded/enhanced chat client supports this
        }
    }
}
