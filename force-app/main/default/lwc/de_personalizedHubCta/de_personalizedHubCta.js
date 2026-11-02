import { LightningElement, api } from 'lwc';
import VELO_IMAGES from '@salesforce/resourceUrl/veloVehicleImages';

const MODEL_KEYS = ['nova', 'hawk', 'savanna', 'crest', 'spark', 'tern', 'aero', 'pico', 'summit'];
// Local SVG placeholders from the veloVehicleImages static resource (replace with your own imagery).
const s7 = (path) => {
    const key = MODEL_KEYS.find((k) => String(path).includes(k));
    return `${VELO_IMAGES}/${key || 'placeholder'}.svg`;
};

const MODELS = [
    {
        id: 'nova',
        name: 'Velo Nova',
        tagline: 'Built for every day',
        badge: 'Compact SUV',
        specs: ['Petrol', 'Diesel', 'CNG', 'EV'],
        image: s7('navigation')
    },
    {
        id: 'hawk',
        name: 'Velo Hawk',
        tagline: 'We are Warriors, We are Hawks',
        badge: 'Mid-size SUV',
        specs: ['Diesel', 'EV'],
        image: s7('nitro-crimson-navigation')
    },
    {
        id: 'savanna',
        name: 'Velo Savanna',
        tagline: 'Reclaim Your Life',
        badge: '3-Row SUV',
        specs: ['Diesel', 'EV'],
        image: s7('savanna-red-dark-navigation')
    },
    {
        id: 'crest',
        name: 'Velo Crest',
        tagline: 'Where SUV muscle meets coupé finesse',
        badge: 'SUV Coupé',
        specs: ['Petrol', 'Diesel', 'EV'],
        image: s7('crest-new-pure-grey')
    },
    {
        id: 'nova-ev',
        name: 'Velo Nova.ev',
        tagline: 'The electric SUV that goes the distance',
        badge: 'Electric SUV',
        specs: ['100% Electric', 'Fast Charge'],
        image: s7('oxide')
    }
];

const STATS = [
    { key: 'kits', value: '120+', label: 'Campaign kits' },
    { key: 'models', value: '12', label: 'Models to promote' },
    { key: 'templates', value: '40+', label: 'Ready templates' }
];

export default class De_personalizedHubCta extends LightningElement {
    @api heading = 'Your Velo Motors Dealer Marketing Hub';
    @api description =
        'Welcome, Velo Motors dealer partner. Your marketing hub brings co-branded campaign kits, product launch materials and smart outreach tools together in one place — so you can promote the Velo Motors lineup and connect with buyers more professionally.';
    @api ctaLabel = 'Browse Campaign Content';
    @api ctaUrl = '/partnerhub/s/marketing/campaign-marketplace';

    activeIndex = 0;
    _timer;

    get hasCta() {
        return this.ctaLabel && this.ctaLabel.length > 0;
    }

    get stats() {
        return STATS;
    }

    get slides() {
        return MODELS.map((model, index) => ({
            ...model,
            specChips: model.specs.map((s, i) => ({ key: `${model.id}-${i}`, text: s })),
            cssClass:
                index === this.activeIndex
                    ? 'cc-cta__slide cc-cta__slide_active'
                    : 'cc-cta__slide'
        }));
    }

    get dots() {
        return MODELS.map((model, index) => ({
            key: model.id,
            index,
            cssClass:
                index === this.activeIndex
                    ? 'cc-cta__dot cc-cta__dot_active'
                    : 'cc-cta__dot'
        }));
    }

    connectedCallback() {
        this._timer = setInterval(() => {
            this.activeIndex = (this.activeIndex + 1) % MODELS.length;
        }, 4500);
    }

    disconnectedCallback() {
        if (this._timer) {
            clearInterval(this._timer);
        }
    }

    handlePrev() {
        this.activeIndex =
            (this.activeIndex - 1 + MODELS.length) % MODELS.length;
    }

    handleNext() {
        this.activeIndex = (this.activeIndex + 1) % MODELS.length;
    }

    handleDot(event) {
        this.activeIndex = Number(event.currentTarget.dataset.index);
    }
}
