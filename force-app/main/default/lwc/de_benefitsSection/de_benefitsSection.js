import { LightningElement, api } from 'lwc';
import VELO_IMAGES from '@salesforce/resourceUrl/veloVehicleImages';

const MODEL_KEYS = ['nova', 'hawk', 'savanna', 'crest', 'spark', 'tern', 'aero', 'pico', 'summit'];
// Local SVG placeholders from the veloVehicleImages static resource (replace with your own imagery).
const s7 = (path) => {
    const key = MODEL_KEYS.find((k) => String(path).includes(k));
    return `${VELO_IMAGES}/${key || 'placeholder'}.svg`;
};

const DEFAULT_BENEFITS = [
    'Co-branded Velo Motors campaign kits for every model launch',
    'Marketing Development Funds to power your local outreach',
    'Lead management for showroom and test-drive enquiries',
    'Easy deal registration across the Velo Motors lineup',
    'Product, sales and EV training for your team',
    'Ready-to-use launch kits for Nova, Spark, Hawk and Savanna',
    'Idea sharing with fellow Velo Motors dealer partners',
    'Direct collaboration with the Velo Motors marketing team'
].join('\n');

const FEATURE_MODELS = [
    { key: 'nova', label: 'Nova', tagline: 'Built for every day', path: 'navigation' },
    { key: 'hawk', label: 'Hawk', tagline: 'We are Warriors', path: 'nitro-crimson-navigation' },
    { key: 'savanna', label: 'Savanna', tagline: 'Reclaim Your Life', path: 'savanna-red-dark-navigation' },
    { key: 'spark', label: 'Spark', tagline: 'No-compromise SUV', path: 'spark-mce-navigation' },
    { key: 'crest', label: 'Crest', tagline: 'Muscle meets finesse', path: 'crest-new-pure-grey' }
];

export default class De_benefitsSection extends LightningElement {
    @api heading = 'Benefits of the Velo Motors Partner Hub';
    @api description =
        'This is not your typical portal. It is built around what Velo Motors dealers need — with benefits to strengthen every part of your business, from marketing to the showroom floor.';
    @api benefitsList = DEFAULT_BENEFITS;

    // Optional embedded film URL (e.g. a YouTube/Vidyard embed). Empty = no video.
    videoUrl = '';

    get hasVideo() {
        return !!this.videoUrl;
    }

    get benefits() {
        return (this.benefitsList || '')
            .split(/\n+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
            .map((item, index) => ({ key: `benefit-${index}`, text: item }));
    }

    get models() {
        return FEATURE_MODELS.map((model) => ({
            ...model,
            image: s7(model.path)
        }));
    }
}
