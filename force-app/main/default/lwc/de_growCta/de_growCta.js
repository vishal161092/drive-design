import { LightningElement, api } from 'lwc';

export default class De_growCta extends LightningElement {
    @api heading = 'Grow your dealership with Velo Motors.';
    @api subtitle = 'Put the Velo Motors Partner Hub to work and turn campaigns into showroom footfall.';
    @api ctaLabel = 'Get Started Today';
    @api ctaUrl = '';

    get hasCta() {
        return this.ctaLabel && this.ctaLabel.length > 0;
    }
}
