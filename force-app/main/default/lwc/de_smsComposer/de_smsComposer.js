import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const MAX_LENGTH = 160;

export default class De_smsComposer extends LightningElement {
    @api recipientName = '';
    @track message = '';

    maxLength = MAX_LENGTH;

    get remainingCharacters() {
        return MAX_LENGTH - this.message.length;
    }

    get remainingLabel() {
        return `Remaining characters: ${this.remainingCharacters}`;
    }

    get hasMessage() {
        return this.message && this.message.length > 0;
    }

    get previewText() {
        return this.hasMessage
            ? this.message
            : 'Hi! Book your Velo Nova test drive this weekend at our showroom. Reply YES to confirm.';
    }

    get previewClass() {
        return this.hasMessage
            ? 'cc-sms__bubble-text'
            : 'cc-sms__bubble-text cc-sms__bubble-text--placeholder';
    }

    handleMessageChange(event) {
        this.message = event.target.value.slice(0, MAX_LENGTH);
    }

    handleCancel() {
        this.message = '';
    }

    handleSaveAndClose() {
        this.showToast('Saved', 'Your quick send message has been saved.', 'success');
    }

    handleSend() {
        const to = this.recipientName ? ` to ${this.recipientName}` : '';
        this.showToast(
            'Message sent',
            `Your SMS${to} has been queued for delivery.`,
            'success'
        );
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }
}
