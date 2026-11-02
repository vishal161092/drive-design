import { LightningElement, api } from 'lwc';
import VELO_IMAGES from '@salesforce/resourceUrl/veloVehicleImages';

export default class AgentVeloModelComparison extends LightningElement {
    @api value;

    get heading() {
        return this.value?.heading || 'Comparing Velo models';
    }

    get models() {
        const list = this.value?.models;
        if (!list || !list.length) {
            return [];
        }
        return list.map((m, i) => ({
            id: `model-${i}`,
            name: m.name,
            imageUrl: this.resolveImg(m.imageUrl),
            price: m.price,
            ctaUrl: m.ctaUrl || 'https://velomotors.example/'
        }));
    }

    // Transpose specLabels x models into table rows for aligned columns.
    get rows() {
        const labels = this.value?.specLabels;
        const list = this.value?.models;
        if (!labels || !labels.length || !list || !list.length) {
            return [];
        }
        return labels.map((label, r) => ({
            id: `row-${r}`,
            label,
            values: list.map((m, c) => ({
                id: `cell-${r}-${c}`,
                text: m.specValues && m.specValues.length > r ? m.specValues[r] : '—'
            }))
        }));
    }

    resolveImg(url) {
        const u = url || 'nova';
        if (u.startsWith('http')) {
            return u;
        }
        return `${VELO_IMAGES}/${u}.svg`;
    }

    handleExplore(event) {
        const name = event.currentTarget.dataset.name;
        if (!name) {
            return;
        }
        this.sendMessageToChat(`Explore - ${name}`);
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
                embeddedservice_configuration.util.sendTextMessage(message).catch(() => {});
            }
        } catch (error) {
            // silent — surface only supports this in the embedded/enhanced chat client
        }
    }
}
