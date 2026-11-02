import { LightningElement, track, wire } from 'lwc';
import { IsConsoleNavigation, EnclosingTabId, setTabLabel } from 'lightning/platformWorkspaceApi';
import searchDealers from '@salesforce/apex/de_Dealer360Controller.searchDealers';
import getDealer360 from '@salesforce/apex/de_Dealer360Controller.getDealer360';
import listDealers from '@salesforce/apex/de_Dealer360Controller.listDealers';

export default class De_dealer360 extends LightningElement {
    @track results = [];
    @track dir;
    @track data;
    @track activeFilter = 'all';
    @track sortCol = 'name';
    @track sortDir = 'asc';
    searchTerm = '';
    loading = false;
    error;
    activeTab = 'perf';
    _debounce;

    /* ---------- console tab label (fixes "Loading…" workspace tab) ---------- */
    @wire(IsConsoleNavigation) isConsoleNavigation;
    @wire(EnclosingTabId) enclosingTabId;
    _tabInit = false;

    renderedCallback() {
        if (this._tabInit || !this.isConsoleNavigation || !this.enclosingTabId) return;
        this._tabInit = true;
        this.setConsoleTab('Dealer 360');
    }
    setConsoleTab(label) {
        if (!this.isConsoleNavigation || !this.enclosingTabId) return;
        setTabLabel(this.enclosingTabId, label);
    }

    /* ---------- directory table (shown before a search) ---------- */
    connectedCallback() {
        listDealers()
            .then((res) => { this.dir = res; })
            .catch(() => { this.dir = null; });
    }
    get showDirectory() { return this.showEmpty && this.dir && this.dir.total > 0; }
    get showEmptyText() { return this.showEmpty && (!this.dir || this.dir.total === 0); }

    /* ---------- stats strip ---------- */
    get totalCount()   { return this.dir ? this.dir.total : 0; }
    get ssCount()      { return this.dir ? this.dir.salesService : 0; }
    get salesCount()   { return this.dir ? this.dir.salesOnly : 0; }
    get serviceCount() { return this.dir ? this.dir.serviceOnly : 0; }
    get evCount()      { return this.dir ? this.dir.evCertified : 0; }

    /* ---------- filter chips ---------- */
    setFilter(event) { this.activeFilter = event.currentTarget.dataset.f; }
    _match(r, f) {
        if (f === 'all') return true;
        if (f === 'ev') return !!r.ev;
        return r.type === f;
    }
    chipClass(f) { return 'chip' + (this.activeFilter === f ? ' active' : ''); }
    get allChipClass()     { return this.chipClass('all'); }
    get ssChipClass()      { return this.chipClass('ss'); }
    get salesChipClass()   { return this.chipClass('sales'); }
    get serviceChipClass() { return this.chipClass('service'); }
    get evChipClass()      { return this.chipClass('ev'); }

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
        if (this.sortCol !== col) return 'th';
        return 'th ' + (this.sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }
    get thName()       { return this.thClass('name'); }
    get thCity()       { return this.thClass('city'); }
    get thState()      { return this.thClass('state'); }
    get thCode()       { return this.thClass('dealerId'); }
    get thType()       { return this.thClass('typeLabel'); }
    get thEv()         { return this.thClass('ev'); }
    get thLastActive() { return this.thClass('lastActive'); }

    /* ---------- rendered rows (filter + sort) ---------- */
    get displayRows() {
        if (!this.dir || !this.dir.rows) return [];
        const rows = this.dir.rows.filter((r) => this._match(r, this.activeFilter));
        const col = this.sortCol, dir = this.sortDir === 'asc' ? 1 : -1;
        const sorted = [...rows].sort((a, b) => {
            let va = a[col], vb = b[col];
            if (typeof va === 'boolean') { va = va ? 1 : 0; vb = vb ? 1 : 0; }
            else { va = String(va == null ? '' : va).toLowerCase(); vb = String(vb == null ? '' : vb).toLowerCase(); }
            if (va < vb) return -1 * dir;
            if (va > vb) return 1 * dir;
            return 0;
        });
        return sorted.map((r) => ({ ...r, evMark: r.ev ? '✓' : '—', evClass: r.ev ? 'ev-check' : 'ev-dash' }));
    }
    get showingCount() { return this.displayRows.length; }

    /* ---------- search ---------- */
    handleSearch(event) {
        const term = event.target.value;
        this.searchTerm = term;
        window.clearTimeout(this._debounce);
        if (!term || term.trim().length < 2) { this.results = []; return; }
        this._debounce = window.setTimeout(() => {
            searchDealers({ term })
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
    loadProfile(dealerId) {
        this.loading = true;
        this.error = undefined;
        getDealer360({ dealerId })
            .then((res) => { this.data = res; this.activeTab = 'perf'; this.setConsoleTab(res && res.name ? res.name : 'Dealer 360'); })
            .catch((e) => { this.error = (e && e.body && e.body.message) || 'Unable to load dealer'; })
            .finally(() => { this.loading = false; });
    }
    get showResults() { return this.results && this.results.length > 0; }

    /* ---------- back to network ---------- */
    goBack() {
        this.data = undefined;
        this.error = undefined;
        this.results = [];
        this.searchTerm = '';
        this.activeTab = 'perf';
        this.setConsoleTab('Dealer 360');
    }

    /* ---------- states ---------- */
    get hasData() { return !!this.data; }
    get showEmpty() { return !this.data && !this.loading && !this.error; }

    /* ---------- tabs ---------- */
    handleTab(event) { this.activeTab = event.currentTarget.dataset.tab; }
    get isPerf()   { return this.activeTab === 'perf'; }
    get isCust()   { return this.activeTab === 'cust'; }
    get isInv()    { return this.activeTab === 'inv'; }
    get isCamp()   { return this.activeTab === 'camp'; }
    get isAlerts() { return this.activeTab === 'alerts'; }
    tabClass(id) { return 'tab' + (this.activeTab === id ? ' active' : ''); }
    get perfTabClass()   { return this.tabClass('perf'); }
    get custTabClass()   { return this.tabClass('cust'); }
    get invTabClass()    { return this.tabClass('inv'); }
    get campTabClass()   { return this.tabClass('camp'); }
    get alertsTabClass() { return this.tabClass('alerts'); }

    /* ---------- derived styles ---------- */
    get gaugeStyle() {
        if (!this.data) return '--val:0;--col:var(--green)';
        return `--val:${this.data.csiPct};--col:${this.data.csiTone}`;
    }
    get donutStyle() {
        return `--a:${this.data ? this.data.evMixPct : 0}`;
    }
    get evCertLabel() {
        return this.data && this.data.evCertified ? '✓ EV certified' : '✕ EV certified';
    }
    get evCertClass() {
        return this.data && this.data.evCertified ? 'pill pill-green' : 'pill pill-grey';
    }
    get modelChips() {
        if (!this.data || !this.data.models) return [];
        return this.data.models.map((m, i) => ({
            key: `m-${i}`,
            label: m,
            cls: m.toLowerCase().endsWith('.ev') ? 'pill pill-green' : 'pill pill-blue'
        }));
    }
    get kpiSalesSubClass() {
        const tone = this.data && this.data.kpiSales ? this.data.kpiSales.tone : '';
        return tone ? `sub ${tone}` : 'sub';
    }
    get milestoneRows() {
        if (!this.data || !this.data.milestones) return [];
        return this.data.milestones.map((m, i) => ({
            key: `ms-${i}`,
            label: m.label,
            text: m.text,
            cls: m.tone ? `tl ${m.tone}` : 'tl'
        }));
    }
    get mixLegend() {
        if (!this.data || !this.data.salesMix) return [];
        return this.data.salesMix.map((s, i) => ({
            key: `mix-${i}`,
            label: s.label,
            style: `background:${s.swatch}`
        }));
    }
}
