import { LightningElement, api } from 'lwc';
import VELO_IMAGES from '@salesforce/resourceUrl/veloVehicleImages';
import { NavigationMixin } from 'lightning/navigation';

const PAGE_SIZE = 9;

const QUICK_SEND_URL = '/partnerhub/s/marketing';

const MODEL_KEYS = ['nova', 'hawk', 'savanna', 'crest', 'spark', 'tern', 'aero', 'pico', 'summit'];
// Local SVG placeholders from the veloVehicleImages static resource (replace with your own imagery).
const s7 = (path) => {
    const key = MODEL_KEYS.find((k) => String(path).includes(k));
    return `${VELO_IMAGES}/${key || 'placeholder'}.svg`;
};

const TAB_LABELS = ['All', 'SUVs', 'Electric Vehicles', 'Hatchbacks', 'Accessories', 'Offers & Finance'];

// Each tile combines real Velo imagery + real model data (segment, powertrain, tagline)
// sourced from the Velo Motors site — a mix of visual tile and factual data.
const ALL_ITEMS = [
    {
        id: '1',
        title: 'Nova Festive Campaign Kit',
        description: 'Ready-to-run festive creatives, banners and offer scripts for the Velo Nova.',
        category: 'SUVs',
        model: 'Nova',
        tagline: 'Built for every day',
        segment: 'Compact SUV',
        fuel: ['Petrol', 'Diesel', 'CNG'],
        path: 'navigation'
    },
    {
        id: '2',
        title: 'Hawk Warrior Test-Drive Flyer',
        description: 'Print and digital flyer to drive weekend test-drive bookings for the Velo Hawk.',
        category: 'SUVs',
        model: 'Hawk',
        tagline: 'We are Warriors, We are Hawks',
        segment: 'Mid-size SUV',
        fuel: ['Diesel'],
        path: 'nitro-crimson-navigation'
    },
    {
        id: '3',
        title: 'Spark No-Compromise Social Pack',
        description: 'Social-ready posts and reels to promote the Velo Spark across your local channels.',
        category: 'SUVs',
        model: 'Spark',
        tagline: 'The no-compromise SUV',
        segment: 'Micro SUV',
        fuel: ['Petrol', 'CNG'],
        path: 'spark-mce-navigation'
    },
    {
        id: '4',
        title: 'Savanna Reclaim-Your-Life Brochure',
        description: 'Full product brochure and spec sheet for the Velo Savanna, ready for the showroom.',
        category: 'SUVs',
        model: 'Savanna',
        tagline: 'Reclaim Your Life',
        segment: '3-Row SUV',
        fuel: ['Diesel'],
        path: 'savanna-red-dark-navigation'
    },
    {
        id: '5',
        title: 'Nova.ev Charge-Ahead Bundle',
        description: 'Campaign bundle highlighting range, charging and savings for the Velo Nova.ev.',
        category: 'Electric Vehicles',
        model: 'Nova.ev',
        tagline: 'The electric SUV that goes the distance',
        segment: 'Electric SUV',
        fuel: ['100% Electric'],
        path: 'oxide'
    },
    {
        id: '6',
        title: 'Crest.ev Launch Teaser',
        description: 'Teaser assets and launch-day templates for the Velo Crest.ev reveal.',
        category: 'Electric Vehicles',
        model: 'Crest.ev',
        tagline: 'Where SUV muscle meets coupé finesse',
        segment: 'Electric SUV Coupé',
        fuel: ['100% Electric'],
        path: 'crest-ev'
    },
    {
        id: '7',
        title: 'Spark.ev City Pack',
        description: 'Bold, fearless creatives to position the Velo Spark.ev for young city buyers.',
        category: 'Electric Vehicles',
        model: 'Spark.ev',
        tagline: 'Bold, electric, ready',
        segment: 'Electric Micro SUV',
        fuel: ['100% Electric'],
        path: 'spark-ev-fearlessyellow-new'
    },
    {
        id: '8',
        title: 'Tern WOW Ad Kit',
        description: 'Short-form ad creatives positioning the Velo Tern for young city buyers.',
        category: 'Hatchbacks',
        model: 'Tern',
        tagline: 'Unexpected Tech. Unmissable WOW!',
        segment: 'Hatchback',
        fuel: ['Petrol', 'CNG'],
        path: 'the-next-gen-tern-navigation'
    },
    {
        id: '9',
        title: 'Aero Feel-Special Poster',
        description: 'Premium poster set showcasing the Velo Aero for showroom display.',
        category: 'Hatchbacks',
        model: 'Aero',
        tagline: 'Feel Special',
        segment: 'Premium Hatchback',
        fuel: ['Petrol', 'CNG'],
        path: 'all-new-aero-navigation'
    },
    {
        id: '10',
        title: 'Aero Finance Offer',
        description: 'EMI and exchange offer one-pager for the Velo Aero, ready to share with buyers.',
        category: 'Offers & Finance',
        model: 'Aero',
        tagline: 'Feel Special',
        segment: 'Premium Hatchback',
        fuel: ['EMI Offer'],
        path: 'all-new-aero-navigation'
    },
    {
        id: '11',
        title: 'Spark Festive EMI Offer',
        description: 'Festive finance creatives with sample EMI tables for the Velo Spark.',
        category: 'Offers & Finance',
        model: 'Spark',
        tagline: 'The no-compromise SUV',
        segment: 'Micro SUV',
        fuel: ['Festive EMI'],
        path: 'spark-mce-navigation'
    },
    {
        id: '12',
        title: 'Nova Exchange Bonanza',
        description: 'Exchange-bonus creatives and sample savings tables for the Velo Nova.',
        category: 'Offers & Finance',
        model: 'Nova',
        tagline: 'Built for every day',
        segment: 'Compact SUV',
        fuel: ['Exchange Bonus'],
        path: 'navigation'
    },
    // --- Velo Genuine Accessories & more (real accessory photography) ---
    {
        id: '13',
        title: 'Genuine Alloy Wheels',
        description: 'Diamond-cut alloy wheel range with point-of-sale creatives and fitment guide.',
        category: 'Accessories',
        model: 'Velo Genuine',
        tagline: 'Style that turns heads',
        segment: 'Styling',
        fuel: ['16” & 17”', 'Diamond Cut'],
        path: 'alloy-wheels',
        photo: true
    },
    {
        id: '14',
        title: 'Premium Seat Covers',
        description: 'Tailored leatherette seat-cover collection with showroom display posters.',
        category: 'Accessories',
        model: 'Velo Genuine',
        tagline: 'Cabin comfort, elevated',
        segment: 'Interior',
        fuel: ['Leatherette', 'Custom Fit'],
        path: 'seat-covers',
        photo: true
    },
    {
        id: '15',
        title: 'Car Care Detailing Kit',
        description: 'Bundle offer creatives for the genuine car-care and detailing range.',
        category: 'Accessories',
        model: 'Velo Genuine',
        tagline: 'Showroom shine, every day',
        segment: 'Care',
        fuel: ['Clean', 'Shine', 'Protect'],
        path: 'car-care',
        photo: true
    },
    {
        id: '16',
        title: 'All-Weather Floor Mats',
        description: 'Custom-fit floor-mat assets — perfect for the monsoon accessory push.',
        category: 'Accessories',
        model: 'Velo Genuine',
        tagline: 'Built for every season',
        segment: 'Interior',
        fuel: ['All-Weather', 'Easy Clean'],
        path: 'floor-mat',
        photo: true
    },
    {
        id: '17',
        title: 'Door Visor Set',
        description: 'Aero door-visor creatives with a set-of-4 fitment offer template.',
        category: 'Accessories',
        model: 'Velo Genuine',
        tagline: 'Fresh air, no rain',
        segment: 'Exterior',
        fuel: ['Set of 4'],
        path: 'door-visor',
        photo: true
    },
    {
        id: '18',
        title: 'EV Home Fast Charger',
        description: 'Home AC fast-charger campaign kit to bundle with every Velo.ev sale.',
        category: 'Accessories',
        model: 'Velo.ev',
        tagline: 'Charge up at home',
        segment: 'EV Charging',
        fuel: ['7.2 kW AC'],
        path: 'charger',
        photo: true
    },
    {
        id: '19',
        title: 'Mud Flap Set',
        description: 'Contoured mud-flap creatives with a monsoon-ready fitment offer template.',
        category: 'Accessories',
        model: 'Velo Genuine',
        tagline: 'Guard every journey',
        segment: 'Exterior',
        fuel: ['Front & Rear', 'All Models'],
        path: 'mud-flap',
        photo: true
    },
    {
        id: '20',
        title: 'Door Scuff Plates',
        description: 'Illuminated scuff-plate range with point-of-sale display assets.',
        category: 'Accessories',
        model: 'Velo Genuine',
        tagline: 'A premium first step',
        segment: 'Interior',
        fuel: ['Illuminated', 'Set of 4'],
        path: 'scuff-plate',
        photo: true
    }
];

export default class De_contentMarketplace extends NavigationMixin(LightningElement) {
    @api heading = 'Content Marketplace';

    activeTab = 'All';
    currentPage = 1;
    favoriteIds = new Set();

    get tabs() {
        return TAB_LABELS.map((label) => ({
            label,
            value: label,
            cssClass: label === this.activeTab
                ? 'ccm-tab ccm-tab_active'
                : 'ccm-tab'
        }));
    }

    get filteredItems() {
        if (this.activeTab !== 'All') {
            return ALL_ITEMS.filter((item) => item.category === this.activeTab);
        }
        // "All" shows an even blend of vehicles and accessories rather than
        // all cars first and accessories last (roughly 2 vehicles : 1 accessory).
        const cars = ALL_ITEMS.filter((item) => !item.photo);
        const accessories = ALL_ITEMS.filter((item) => item.photo);
        const blended = [];
        let ci = 0;
        let ai = 0;
        while (ci < cars.length || ai < accessories.length) {
            if (ci < cars.length) blended.push(cars[ci++]);
            if (ci < cars.length) blended.push(cars[ci++]);
            if (ai < accessories.length) blended.push(accessories[ai++]);
        }
        return blended;
    }

    get totalPages() {
        return Math.max(1, Math.ceil(this.filteredItems.length / PAGE_SIZE));
    }

    get pageItems() {
        const start = (this.currentPage - 1) * PAGE_SIZE;
        return this.filteredItems
            .slice(start, start + PAGE_SIZE)
            .map((item) => ({
                ...item,
                image: s7(item.path, item.photo ? 640 : 600),
                coverClass: item.photo
                    ? 'ccm-card__cover ccm-card__cover_photo'
                    : 'ccm-card__cover',
                imgClass: item.photo
                    ? 'ccm-card__img ccm-card__img_photo'
                    : 'ccm-card__img',
                chips: item.fuel.map((f, i) => ({ key: `${item.id}-f${i}`, text: f })),
                starClass: this.favoriteIds.has(item.id)
                    ? 'ccm-card__star ccm-card__star_active'
                    : 'ccm-card__star'
            }));
    }

    get pageLabel() {
        return `Page ${this.currentPage} of ${this.totalPages}`;
    }

    get isFirstPage() {
        return this.currentPage <= 1;
    }

    get isLastPage() {
        return this.currentPage >= this.totalPages;
    }

    // Clicking a marketplace card opens the send/compose screen directly
    // (compose=1 tells the Quick Send workspace to skip the list view).
    handleCardClick(event) {
        event.preventDefault();
        const title = event.currentTarget.dataset.title;
        const url = title
            ? `${QUICK_SEND_URL}?compose=1&item=${encodeURIComponent(title)}`
            : `${QUICK_SEND_URL}?compose=1`;
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url
            }
        });
    }

    handleTabClick(event) {
        const value = event.currentTarget.dataset.value;
        this.activeTab = value;
        this.currentPage = 1;
    }

    handlePrevious() {
        if (!this.isFirstPage) {
            this.currentPage -= 1;
        }
    }

    handleNext() {
        if (!this.isLastPage) {
            this.currentPage += 1;
        }
    }

    handleViewAll(event) {
        event.preventDefault();
        this.activeTab = 'All';
        this.currentPage = 1;
    }

    handleToggleFavorite(event) {
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        const next = new Set(this.favoriteIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        this.favoriteIds = next;
    }
}
