import { LightningElement, track } from 'lwc';

const ALL_ROWS = [
    {
        id: 'DM-QSJN-00099',
        name: 'Nova Festive Offer - Brandable',
        number: 'DM-QSJN-00099',
        description:
            'Share this festive-season offer on the Velo Nova with your prospects and walk-ins.',
        createdDate: '4/14/2022'
    },
    {
        id: 'DM-QSJN-00017',
        name: 'Free Form - SMS',
        number: 'DM-QSJN-00017',
        description: 'Send a free-form text message to your prospects and customers.',
        createdDate: '4/14/2022'
    },
    {
        id: 'DM-QSJN-00069',
        name: 'Test Drive Follow Up',
        number: 'DM-QSJN-00069',
        description: 'Send a follow up message to customers after a Velo Motors test drive.',
        createdDate: '4/14/2022'
    },
    {
        id: 'DM-QSJN-00023',
        name: 'Service Camp Reminder',
        number: 'DM-QSJN-00023',
        description: 'Remind owners it is time to book their vehicle for the service camp.',
        createdDate: '3/02/2022'
    },
    {
        id: 'DM-QSJN-00041',
        name: 'Birthday Greeting - Brandable',
        number: 'DM-QSJN-00041',
        description: 'Send a personalized happy birthday message to your customers.',
        createdDate: '2/18/2022'
    },
    {
        id: 'DM-QSJN-00052',
        name: 'Booking Status Update',
        number: 'DM-QSJN-00052',
        description: 'Notify a customer that there has been an update to their vehicle booking.',
        createdDate: '1/27/2022'
    },
    {
        id: 'DM-QSJN-00078',
        name: 'Hawk Quote Follow Up',
        number: 'DM-QSJN-00078',
        description: 'Follow up with a prospect after sharing a Velo Hawk price quote.',
        createdDate: '5/09/2022'
    },
    {
        id: 'DM-QSJN-00034',
        name: 'Nova EV Awareness',
        number: 'DM-QSJN-00034',
        description: 'Educate customers on the range, savings and features of the Velo Nova EV.',
        createdDate: '5/22/2022'
    },
    {
        id: 'DM-QSJN-00061',
        name: 'Missed Test Drive Follow Up',
        number: 'DM-QSJN-00061',
        description: 'Reach out to a customer who missed a scheduled test drive.',
        createdDate: '6/03/2022'
    },
    {
        id: 'DM-QSJN-00088',
        name: 'New Owner Welcome',
        number: 'DM-QSJN-00088',
        description: 'Welcome a new Velo Motors owner and introduce your service team.',
        createdDate: '6/15/2022'
    },
    {
        id: 'DM-QSJN-00012',
        name: 'Exchange Offer Reminder',
        number: 'DM-QSJN-00012',
        description: 'Remind a customer that their exchange and EMI offer is about to expire.',
        createdDate: '2/09/2022'
    },
    {
        id: 'DM-QSJN-00045',
        name: 'Referral Request - Brandable',
        number: 'DM-QSJN-00045',
        description: 'Ask a happy Velo Motors owner for a referral to friends or family.',
        createdDate: '3/28/2022'
    }
];

export default class De_quickSendList extends LightningElement {
    @track searchTerm = '';

    rows = ALL_ROWS;

    get itemCount() {
        return 32;
    }

    get metaLine() {
        return `${this.itemCount} items • Sorted by Message Name`;
    }

    get filteredRows() {
        const term = (this.searchTerm || '').trim().toLowerCase();
        if (!term) {
            return this.rows;
        }
        return this.rows.filter((row) => row.name.toLowerCase().includes(term));
    }

    get hasNoResults() {
        return this.filteredRows.length === 0;
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
    }

    handleTitleCaretClick() {
        // eslint-disable-next-line no-console
        console.log('All Quick Sends caret clicked');
    }

    handleRowSelect(event) {
        event.preventDefault();
        const { id, name, number, description } = event.currentTarget.dataset;
        this.dispatchEvent(
            new CustomEvent('select', {
                detail: { id, name, number, description }
            })
        );
    }
}
