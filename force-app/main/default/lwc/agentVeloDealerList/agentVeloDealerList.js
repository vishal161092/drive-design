import { LightningElement, api } from 'lwc';

// Fixed test-drive slots offered for every dealership.
const TIME_SLOTS = [
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
    '06:00 PM'
];

export default class AgentVeloDealerList extends LightningElement {
    @api value;

    // Booking flow state
    activeDealerId = null; // dealer whose date/time form is open
    bookedDealerId = null; // dealer with a confirmed test drive
    bookedName = '';
    formDate = '';
    formTime = '';

    get heading() {
        return this.titleCase(this.value?.heading || 'Dealers near you');
    }

    get dealers() {
        const items = this.value?.dealers;
        if (items && items.length) {
            return items.map((d, i) => {
                const id = `dealer-${i}`;
                const confirmed = this.bookedDealerId === id;
                const selected = this.activeDealerId === id && !confirmed;
                return {
                    id,
                    cardClass: selected ? 'tdl-card tdl-card-selected' : 'tdl-card',
                    name: d.name,
                    category: d.category,
                    address: this.fixCityCase(d.address),
                    phone: d.phone,
                    telHref: d.phone
                        ? `tel:${d.phone.replace(/\s+/g, '')}`
                        : null,
                    mapsUrl: d.mapsUrl,
                    hasCategory: !!d.category,
                    hasPhone: !!d.phone,
                    hasMapsUrl: !!d.mapsUrl,
                    showForm: this.activeDealerId === id && !confirmed,
                    confirmed,
                    confirmMsg: confirmed ? this.confirmMessage(d.name) : ''
                };
            });
        }
        return [];
    }

    get hasDealers() {
        return this.dealers.length > 0;
    }

    // The date/time form is rendered ONCE below the grid (not inside a card) so
    // opening it never blanks out the neighbouring columns.
    get showFormPanel() {
        return !!this.activeDealerId && this.bookedDealerId !== this.activeDealerId;
    }

    get activeDealerName() {
        const dealer = this.dealers.find((d) => d.id === this.activeDealerId);
        return dealer ? dealer.name : '';
    }

    get timeOptions() {
        return TIME_SLOTS.map((t) => ({ label: t, value: t }));
    }

    // Block past dates in the date picker.
    get todayStr() {
        return new Date().toISOString().slice(0, 10);
    }

    get canConfirm() {
        return !!this.formDate && !!this.formTime;
    }

    get submitDisabled() {
        return !this.canConfirm;
    }

    confirmMessage(name) {
        const dateLabel = this.formatDate(this.formDate);
        return `✓ Your test drive at ${name} is scheduled for ${dateLabel} at ${this.formTime}. Our team will call you shortly to confirm the details.`;
    }

    handleChoose(event) {
        this.activeDealerId = event.currentTarget.dataset.id;
        this.formDate = '';
        this.formTime = '';
    }

    handleDateChange(event) {
        this.formDate = event.target.value;
    }

    handleTimeChange(event) {
        this.formTime = event.target.value;
    }

    handleConfirm(event) {
        const id = event.currentTarget.dataset.id;
        if (!this.canConfirm) {
            return;
        }
        const dealer = this.dealers.find((d) => d.id === id);
        this.bookedName = dealer ? dealer.name : '';
        this.bookedDealerId = id;
        this.activeDealerId = null;
        this.sendMessageToChat(
            `Test drive booked at ${this.bookedName} on ${this.formatDate(
                this.formDate
            )} at ${this.formTime}`
        );
    }

    handleMapsClick(event) {
        const url = event.currentTarget.dataset.url;
        if (!url) {
            return;
        }
        try {
            window.top.open(url, '_blank');
        } catch (e) {
            window.open(url, '_blank');
        }
    }

    // --- helpers ---

    // Capitalise the first letter of each word (e.g. "Velo dealers near hyderabad"
    // -> "Velo Dealers Near Hyderabad").
    titleCase(str) {
        return String(str).replace(/\b([a-z])/g, (m, c) => c.toUpperCase());
    }

    // Capitalise a trailing lower-case city on the address line without disturbing
    // things like "M.G. Road".
    fixCityCase(addr) {
        if (!addr) {
            return addr;
        }
        return addr.replace(
            /,\s*([a-z])([a-z]+)\s*$/,
            (m, a, b) => `, ${a.toUpperCase()}${b}`
        );
    }

    formatDate(iso) {
        if (!iso) {
            return '';
        }
        try {
            const d = new Date(iso + 'T00:00:00');
            return d.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return iso;
        }
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
