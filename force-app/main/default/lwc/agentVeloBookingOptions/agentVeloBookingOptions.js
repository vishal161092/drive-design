import { LightningElement, api } from 'lwc';

// Keyword -> swatch colour, so a colour picker shows a real colour chip.
const COLOUR_MAP = [
    ['white', '#f2f2f2'],
    ['black', '#151515'],
    ['grey', '#6b7280'],
    ['gray', '#6b7280'],
    ['silver', '#c4c8cc'],
    ['red', '#c62828'],
    ['blue', '#1e40af'],
    ['green', '#2f6d4f'],
    ['gold', '#c9a227'],
    ['champagne', '#c9a227'],
    ['orange', '#d35400'],
    ['brown', '#6d4c41'],
    ['bronze', '#8c6a43'],
    ['purple', '#6b3fa0'],
    ['teal', '#0f766e']
];

export default class AgentVeloBookingOptions extends LightningElement {
    @api value;

    selectedValue = null;

    get heading() {
        return this.value?.heading || 'Choose an option';
    }

    get prompt() {
        return this.value?.prompt || '';
    }

    // Treat this as a colour picker when the heading/prompt talks about colour.
    get isColourPicker() {
        const text = `${this.value?.heading || ''} ${
            this.value?.prompt || ''
        }`.toLowerCase();
        return text.includes('colour') || text.includes('color');
    }

    swatchFor(label) {
        const l = (label || '').toLowerCase();
        const hit = COLOUR_MAP.find(([kw]) => l.includes(kw));
        return hit ? hit[1] : null;
    }

    get options() {
        const opts = this.value?.options;
        if (opts && opts.length) {
            return opts.map((o, i) => {
                const hex = this.isColourPicker ? this.swatchFor(o.label) : null;
                return {
                    id: `opt-${i}`,
                    label: o.label,
                    description: o.description,
                    value: o.value,
                    hasSwatch: !!hex,
                    swatchStyle: hex ? `background:${hex};` : '',
                    cssClass:
                        this.selectedValue === o.value
                            ? 'tbo-option tbo-option-selected'
                            : 'tbo-option'
                };
            });
        }
        return [];
    }

    get hasOptions() {
        return this.options.length > 0;
    }

    handleOptionClick(event) {
        if (this.selectedValue) {
            return;
        }
        const val = event.currentTarget.dataset.value;
        this.selectedValue = val;
        this.sendMessageToChat(val);
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
            // silent
        }
    }
}
