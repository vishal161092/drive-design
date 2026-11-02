import { LightningElement, api } from 'lwc';
import VELO_IMAGES from '@salesforce/resourceUrl/veloVehicleImages';

export default class AgentVeloModelCard extends LightningElement {
    @api value;

    // Summit-only: play the dark banner video first, then settle on a black Summit.
    videoDone = false;

    get modelName() {
        return this.value?.modelName || 'Velo Nova';
    }

    get isSummit() {
        const name = (this.value?.modelName || '').toLowerCase();
        const key = (this.value?.imageUrl || '').toLowerCase();
        return name.includes('summit') || key === 'summit';
    }

    // Show the video only for Summit, and only until it has finished playing.
    get showVideo() {
        return false;
    }

    // No bundled video; add a video static resource and return its URL here to enable the intro clip.
    get videoUrl() {
        return '';
    }

    // Hero still image.
    get heroImageUrl() {
        return this.modelImageUrl;
    }

    handleVideoEnded() {
        this.videoDone = true;
    }

    handleVideoError() {
        // If the video can't play, fall straight through to the still image.
        this.videoDone = true;
    }

    get tagline() {
        return this.value?.tagline || '';
    }

    get modelImageUrl() {
        const url = this.value?.imageUrl || 'nova';
        if (url.startsWith('http')) {
            return url;
        }
        // Bare key resolved against the veloVehicleImages static resource folder.
        return `${VELO_IMAGES}/${url}.svg`;
    }

    get priceRange() {
        return this.value?.priceRange || '';
    }

    get fuelOptions() {
        const opts = this.value?.fuelOptions;
        if (opts && opts.length) {
            return opts.map((o, i) => ({ id: `fuel-${i}`, text: o }));
        }
        return [];
    }

    get hasFuelOptions() {
        return this.fuelOptions.length > 0;
    }

    get keySpecs() {
        const specs = this.value?.keySpecs;
        if (specs && specs.length) {
            return specs.map((s, i) => ({ id: `spec-${i}`, text: s }));
        }
        return [];
    }

    get hasKeySpecs() {
        return this.keySpecs.length > 0;
    }

    get features() {
        const feats = this.value?.features;
        if (feats && feats.length) {
            return feats.map((f, i) => ({ id: `feat-${i}`, text: f }));
        }
        return [];
    }

    get hasFeatures() {
        return this.features.length > 0;
    }

    get ctaLabel() {
        return `Customize ${this.modelName}`;
    }

    handleCtaClick() {
        // Send a chat message so the agent opens the 3D configurator for this model.
        this.sendMessageToChat(`Customize - ${this.modelName}`);
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
            // silent — only the embedded/enhanced chat client supports this
        }
    }
}
