import { LightningElement, api } from 'lwc';

export default class De_marketingHubHero extends LightningElement {
    @api title = 'Velo Motors Partner Hub';
    @api subtitle =
        'Launch Velo Motors campaigns, track your leads and grow dealership sales across the Nova, Spark, Hawk and Savanna lineup — all from one hub.';
    // Used as the video poster / fallback still frame while the video loads.
    @api imageUrl =
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80';
    @api ctaLabel = '';
    @api ctaUrl = '';

    get heroStyle() {
        return `background-image: url('${this.imageUrl}')`;
    }

    get hasCta() {
        return this.ctaLabel && this.ctaLabel.length > 0;
    }
}
