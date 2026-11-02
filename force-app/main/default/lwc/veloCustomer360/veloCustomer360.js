import { LightningElement, track, wire } from 'lwc';
import { IsConsoleNavigation, EnclosingTabId, setTabLabel } from 'lightning/platformWorkspaceApi';
import VELO_VEHICLES from '@salesforce/resourceUrl/veloVehicleImages';
import searchIndividuals from '@salesforce/apex/VeloMotors360Controller.searchIndividuals';
import getCustomer360 from '@salesforce/apex/VeloMotors360Controller.getCustomer360';
import listIndividuals from '@salesforce/apex/VeloMotors360Controller.listIndividuals';

const SRC = {
    CAMPAIGN: { cls: 'camp', label: 'CAMPAIGN' },
    DIGITAL:  { cls: 'dig',  label: 'DIGITAL' },
    SERVICE:  { cls: 'svc',  label: 'SERVICE' },
    WEB:      { cls: 'web',  label: 'WEB' }
};

// Lead status progression for the stepper (real Lead_Status__c values -> display labels)
const STATUS_STEPS = [
    { match: 'New',       label: 'New' },
    { match: 'Contacted', label: 'Working' },
    { match: 'Qualified', label: 'Qualified' },
    { match: 'Converted', label: 'Converted' }
];

export default class VeloCustomer360 extends LightningElement {
    @track results = [];
    @track dir;
    @track data;
    @track activeTier = 'all';
    @track sortCol = 'name';
    @track sortDir = 'asc';
    searchTerm = '';
    loading = false;
    error;
    activeTab = 'ov';
    _debounce;

    /* ---------- console tab label (fixes "Loading…" workspace tab) ---------- */
    @wire(IsConsoleNavigation) isConsoleNavigation;
    @wire(EnclosingTabId) enclosingTabId;
    _tabInit = false;

    renderedCallback() {
        if (this._tabInit || !this.isConsoleNavigation || !this.enclosingTabId) return;
        this._tabInit = true;
        this.setConsoleTab('Customer 360');
    }
    setConsoleTab(label) {
        if (!this.isConsoleNavigation || !this.enclosingTabId) return;
        setTabLabel(this.enclosingTabId, label);
    }

    /* ---------- directory table (shown before a search) ---------- */
    connectedCallback() {
        listIndividuals()
            .then((res) => { this.dir = res; })
            .catch(() => { this.dir = null; });
    }
    get showDirectory() { return this.showEmpty && this.dir && this.dir.total > 0; }
    get showEmptyText() { return this.showEmpty && (!this.dir || this.dir.total === 0); }

    /* ---------- stats strip ---------- */
    get totalCount()    { return this.dir ? this.dir.total : 0; }
    get platinumCount() { return this.dir ? this.dir.platinum : 0; }
    get goldCount()     { return this.dir ? this.dir.gold : 0; }
    get silverCount()   { return this.dir ? this.dir.silver : 0; }
    get bronzeCount()   { return this.dir ? this.dir.bronze : 0; }

    /* ---------- tier filter pills ---------- */
    setTier(event) { this.activeTier = event.currentTarget.dataset.tier; }
    pillClass(tier, tone) {
        const base = 'filter-pill' + (tone ? ' ' + tone : '');
        return base + (this.activeTier === tier ? ' active' : '');
    }
    get allPillClass()      { return this.pillClass('all', ''); }
    get platinumPillClass() { return this.pillClass('Platinum', 'platinum'); }
    get goldPillClass()     { return this.pillClass('Gold', 'gold'); }
    get silverPillClass()   { return this.pillClass('Silver', 'silver'); }
    get bronzePillClass()   { return this.pillClass('Bronze', 'bronze'); }

    /* ---------- sorting ---------- */
    sortBy(event) {
        const col = event.currentTarget.dataset.col;
        if (this.sortCol === col) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortCol = col;
            this.sortDir = 'asc';
        }
    }
    thClass(col) {
        if (this.sortCol !== col) return '';
        return 'sorted';
    }
    get thName()     { return this.thClass('name'); }
    get thCity()     { return this.thClass('city'); }
    get thMobile()   { return this.thClass('mobile'); }
    get thCustId()   { return this.thClass('customerId'); }
    get thTier()     { return this.thClass('tierRank'); }
    get thVehicles() { return this.thClass('vehicles'); }
    get thActivity() { return this.thClass('activitySort'); }

    /* ---------- rendered rows (filter + sort) ---------- */
    get displayRows() {
        if (!this.dir || !this.dir.rows) return [];
        const rows = this.dir.rows.filter((r) => this.activeTier === 'all' || r.tier === this.activeTier);
        const col = this.sortCol, dir = this.sortDir === 'asc' ? 1 : -1;
        const numeric = col === 'tierRank' || col === 'vehicles' || col === 'activitySort';
        const sorted = [...rows].sort((a, b) => {
            let va = a[col], vb = b[col];
            if (numeric) { va = Number(va); vb = Number(vb); }
            else { va = String(va == null ? '' : va).toLowerCase(); vb = String(vb == null ? '' : vb).toLowerCase(); }
            if (va < vb) return -1 * dir;
            if (va > vb) return 1 * dir;
            return 0;
        });
        return sorted.map((r) => ({ ...r, activityClass: r.recent ? 'activity recent' : 'activity' }));
    }
    get showingCount() { return this.displayRows.length; }

    /* ---------- search (case-insensitive + spaces handled server-side) ---------- */
    handleSearch(event) {
        const term = event.target.value;
        this.searchTerm = term;
        window.clearTimeout(this._debounce);
        if (!term || term.trim().length < 2) { this.results = []; return; }
        this._debounce = window.setTimeout(() => {
            searchIndividuals({ term })
                .then((res) => { this.results = res || []; })
                .catch(() => { this.results = []; });
        }, 250);
    }

    handleSelect(event) {
        const id = event.currentTarget.dataset.id;
        this.results = [];
        this.searchTerm = '';
        this.loadProfile(id);
    }

    loadProfile(unifiedId) {
        this.loading = true;
        this.error = undefined;
        getCustomer360({ unifiedId })
            .then((res) => { this.data = res; this.activeTab = 'ov'; this.setConsoleTab(res && res.name ? res.name : 'Customer 360'); })
            .catch((e) => { this.error = (e && e.body && e.body.message) || 'Unable to load profile'; })
            .finally(() => { this.loading = false; });
    }

    get showResults() { return this.results && this.results.length > 0; }

    /* ---------- back to directory ---------- */
    goBack() {
        this.data = undefined;
        this.error = undefined;
        this.results = [];
        this.searchTerm = '';
        this.activeTab = 'ov';
        this.setConsoleTab('Customer 360');
    }

    /* ---------- tabs ---------- */
    handleTab(event) { this.activeTab = event.currentTarget.dataset.tab; }
    get isOv()   { return this.activeTab === 'ov'; }
    get isVeh()  { return this.activeTab === 'veh'; }
    get isSvc()  { return this.activeTab === 'svc'; }
    get isCamp() { return this.activeTab === 'camp'; }
    get isAi()   { return this.activeTab === 'ai'; }
    tabClass(id) { return 'tabs__item' + (this.activeTab === id ? ' slds-is-active' : ''); }
    get ovTabClass()   { return this.tabClass('ov'); }
    get vehTabClass()  { return this.tabClass('veh'); }
    get svcTabClass()  { return this.tabClass('svc'); }
    get campTabClass() { return this.tabClass('camp'); }
    get aiTabClass()   { return this.tabClass('ai'); }

    /* ---------- state ---------- */
    get hasData() { return !!this.data; }
    get showEmpty() { return !this.data && !this.loading && !this.error; }

    /* ---------- profile display lines ---------- */
    get addressLine() {
        if (!this.data) return '';
        const parts = [this.data.address, this.data.city, this.data.state].filter(Boolean);
        let line = parts.join(', ');
        if (this.data.pincode) line += (line ? ' · ' : '') + this.data.pincode;
        return line || '—';
    }
    get dobLine() {
        if (!this.data) return '';
        const d = this.data.dob ? this.fmtDate(this.data.dob) : '';
        const g = this.data.gender || '';
        return [d, g].filter(Boolean).join(' · ');
    }
    get sinceLine() {
        if (!this.data || !this.data.customerSince) return '';
        const m = this.fmtMonthYear(this.data.customerSince);
        const src = this.data.leadSource ? ' · Source: ' + this.data.leadSource : '';
        return m ? 'Customer since ' + m + src : '';
    }

    /* ---------- consent chips ---------- */
    get emailConsentClass() { return 'badge ' + (this.data && this.data.consentEmail ? 'success' : 'light'); }
    get waConsentClass()    { return 'badge ' + (this.data && this.data.consentWhatsApp ? 'success' : 'light'); }
    get smsConsentClass()   { return 'badge ' + (this.data && this.data.consentSMS ? 'success' : 'light'); }
    get emailConsentMark()  { return this.data && this.data.consentEmail ? '✓' : '✕'; }
    get waConsentMark()     { return this.data && this.data.consentWhatsApp ? '✓' : '✕'; }
    get smsConsentMark()    { return this.data && this.data.consentSMS ? '✓' : '✕'; }

    /* ---------- lead score ---------- */
    get ringStyle() {
        const s = this.data ? this.data.leadScore : 0;
        const col = s >= 60 ? 'var(--green)' : s >= 30 ? 'var(--gold)' : 'var(--red)';
        return `--val:${s};--col:${col}`;
    }
    get leadFactors() {
        if (!this.data || !this.data.leadFactors) return [];
        return this.data.leadFactors.map((f, i) => ({ ...f, key: `lf-${i}` }));
    }
    get hasFactors() { return this.leadFactors.length > 0; }

    /* ---------- lead status stepper ---------- */
    get steps() {
        const cur = this.data ? (this.data.leadStatus || '') : '';
        let curIdx = STATUS_STEPS.findIndex((s) => s.match.toLowerCase() === cur.toLowerCase());
        if (curIdx < 0) curIdx = 0; // e.g. Lost -> show at start
        return STATUS_STEPS.map((s, i) => {
            let cls = 'step';
            if (i < curIdx) cls += ' done';
            else if (i === curIdx) cls += ' cur';
            return { key: `st-${i}`, label: s.label, cls };
        });
    }

    /* ---------- vehicles ---------- */
    get vehicleCards() {
        if (!this.data || !this.data.vehicleList) return [];
        return this.data.vehicleList.map((v, i) => ({
            ...v,
            key: v.reg || `veh-${i}`,
            title: `Velo ${v.model || ''}${v.variant ? ' · ' + v.variant : ''}${(v.year && !this.data.hideVehicleYear) ? ' (' + v.year + ')' : ''}`.trim(),
            img: v.imageName ? `${VELO_VEHICLES}/${v.imageName}.svg` : null,
            specLine: [v.reg, v.odometer].filter(Boolean).join(' · '),
            tags: this.vehicleTags(v)
        }));
    }
    vehicleTags(v) {
        const tags = [];
        let n = 0;
        const now = new Date();
        if (v.isEv) tags.push({ key: `t${n++}`, cls: 'badge success', label: 'EV' });
        if (v.warranty) {
            const w = new Date(v.warranty);
            const expired = !isNaN(w) && w < now;
            tags.push({ key: `t${n++}`, cls: 'badge ' + (expired ? 'warn' : 'success'),
                label: expired ? 'Warranty expired' : 'Warranty to ' + this.fmtMonthYear(v.warranty) });
        }
        if (v.amc) {
            const active = /active|yes|true/i.test(v.amc);
            tags.push({ key: `t${n++}`, cls: 'badge ' + (active ? 'success' : 'light'),
                label: active ? 'AMC active' : 'AMC ' + v.amc });
        }
        if (v.insurance) {
            tags.push({ key: `t${n++}`, cls: 'badge light', label: 'Insured to ' + this.fmtMonthYear(v.insurance) });
        }
        return tags;
    }

    /* ---------- service table ---------- */
    get serviceRows() {
        if (!this.data || !this.data.services) return [];
        return this.data.services.map((s, i) => ({
            ...s, key: `svc-${i}`, svcDate: this.fmtDate(s.svcDate)
        }));
    }

    /* ---------- campaign table ---------- */
    get campaignRows() {
        if (!this.data || !this.data.campaigns) return [];
        return this.data.campaigns.map((c, i) => ({
            key: `cmp-${i}`,
            sentDate: this.fmtDate(c.sentDate),
            campaignId: c.campaignId,
            channel: c.channel,
            deliveredMark: c.delivered ? '✓' : '—',
            openedMark: c.opened ? '✓' : '—',
            clickedMark: c.clicked ? '✓' : '—'
        }));
    }

    /* ---------- timeline ---------- */
    get timelineItems() {
        if (!this.data || !this.data.timeline) return [];
        return this.data.timeline.map((a, i) => {
            const meta = SRC[a.source] || SRC.DIGITAL;
            return {
                key: `tl-${i}`,
                itemClass: `item ${meta.cls}`,
                srcClass: `src src-${meta.cls}`,
                srcLabel: meta.label,
                dateLine: [this.fmtDate(a.actDate), a.channel].filter(Boolean).join(' · '),
                title: a.title
            };
        });
    }

    /* ---------- segments / recently browsed ---------- */
    get segmentBadges() {
        if (!this.data || !this.data.segments) return [];
        return this.data.segments.map((s, i) => ({ key: `seg-${i}`, label: s }));
    }
    get recentlyBrowsed() {
        if (!this.data || !this.data.recentlyBrowsed) return [];
        return this.data.recentlyBrowsed.map((m, i) => ({ key: `rb-${i}`, label: m }));
    }

    /* ---------- NBA ---------- */
    get nbaCards() {
        if (!this.data || !this.data.nbas) return [];
        return this.data.nbas.map((n, i) => ({ ...n, key: `nba-${i}` }));
    }
    get topNba() { return this.nbaCards.length ? this.nbaCards[0] : null; }

    /* ---------- overview "at a glance" ---------- */
    get glance() {
        const svc = this.serviceRows;
        if (svc.length) {
            return {
                serviceTitle: `Last visit ${svc[0].svcDate}`,
                serviceSub: `${svc.length} visit${svc.length > 1 ? 's' : ''} total`
            };
        }
        return { serviceTitle: 'No service history', serviceSub: 'Not yet serviced with us' };
    }

    /* ---------- sales opportunity (dash fallbacks) ---------- */
    get prefModelDisp()  { return (this.data && this.data.preferredModel) || '—'; }
    get leadSourceDisp() { return (this.data && this.data.leadSource) || '—'; }
    get leadStatusDisp() { return (this.data && this.data.leadStatus) || '—'; }
    get tradeInDisp()    { return (this.data && this.data.tradeIn) || '—'; }
    get homeDealerDisp() { return (this.data && this.data.homeDealer) || '—'; }

    /* ---------- formatting ---------- */
    fmtDate(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    fmtMonthYear(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }
}