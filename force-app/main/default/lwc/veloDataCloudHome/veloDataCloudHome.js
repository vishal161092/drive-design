import { LightningElement, wire } from 'lwc';
import getDashboard from '@salesforce/apex/VeloHomeController.getDashboard';

export default class VeloDataCloudHome extends LightningElement {
    data;
    error;
    loading = true;

    @wire(getDashboard)
    wiredDashboard({ data, error }) {
        if (data) {
            this.data = data;
            this.error = undefined;
            this.loading = false;
        } else if (error) {
            this.error = (error && error.body && error.body.message) || 'Unable to load dashboard.';
            this.loading = false;
        }
    }

    get hasData() {
        return !!this.data && !this.loading;
    }
}