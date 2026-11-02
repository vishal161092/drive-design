import { LightningElement, track, wire } from 'lwc';
import { IsConsoleNavigation, EnclosingTabId, setTabLabel } from 'lightning/platformWorkspaceApi';
import VELO_VEHICLES from '@salesforce/resourceUrl/veloVehicleImages';
import searchVehicles from '@salesforce/apex/de_Vehicle360Controller.searchVehicles';
import getVehicle360 from '@salesforce/apex/de_Vehicle360Controller.getVehicle360';
import listVehicles from '@salesforce/apex/de_Vehicle360Controller.listVehicles';

export default class De_vehicle360 extends LightningElement {
    @track results = [];
    @track fleet;
    @track collapsed = {};
    @track activeFilter = 'all';
    @track data;
    searchTerm = '';
    loading = false;
    error;
    activeTab = 'health';
    imgFailed = false;
    _debounce;

    /* ---------- console tab label (fixes "Loading…" workspace tab) ---------- */
    @wire(IsConsoleNavigation) isConsoleNavigation;
    @wire(EnclosingTabId) enclosingTabId;
    _tabInit = false;

    renderedCallback() {
        if (this._tabInit || !this.isConsoleNavigation || !this.enclosingTabId) return;
        this._tabInit = true;
        this.setConsoleTab('Vehicle 360');
    }
    setConsoleTab(label) {
        if (!this.isConsoleNavigation || !this.enclosingTabId) return;
        setTabLabel(this.enclosingTabId, label);
    }

    /* ---------- fleet dashboard (shown before a search) ---------- */
    connectedCallback() {
        listVehicles()
            .then((res) => { this.fleet = res; })
            .catch(() => { this.fleet = null; });
    }
    get showDirectory() { return this.showEmpty && this.fleet && this.fleet.total > 0; }
    get showEmptyText() { return this.showEmpty && (!this.fleet || this.fleet.total === 0); }

    /* model accent colors (match reference UI) */
    _accent(key) {
        const map = {
            nova: '#3B8BEB', spark: '#9B59B6', hawk: '#E67E22', savanna: '#D9822B',
            tern: '#2F9E8F', aero: '#E91E8C', crest: '#00C8B8', summit: '#00C8B8'
        };
        return map[key] || '#00C8B8';
    }
    _match(r, f) {
        if (f === 'all') return true;
        if (f === 'ev') return r.isEv;
        return r.status === f;
    }
    get displayGroups() {
        if (!this.fleet || !this.fleet.groups) return [];
        const f = this.activeFilter;
        const out = [];
        for (const g of this.fleet.groups) {
            const rows = (g.rows || []).filter((r) => this._match(r, f));
            if (!rows.length) continue;
            const accent = this._accent(g.modelKey);
            out.push({
                model: g.model,
                modelKey: g.modelKey,
                count: g.count,
                hasEv: g.hasEv,
                evLabel: g.evLabel,
                rows,
                groupClass: 'group' + (this.collapsed[g.modelKey] ? ' collapsed' : ''),
                accentStyle: `border-left:3px solid ${accent}`,
                nameStyle: `color:${accent}`
            });
        }
        return out;
    }
    get showingCount() {
        if (!this.fleet || !this.fleet.groups) return 0;
        const f = this.activeFilter;
        let n = 0;
        for (const g of this.fleet.groups) n += (g.rows || []).filter((r) => this._match(r, f)).length;
        return n;
    }
    get totalCount() { return this.fleet ? this.fleet.total : 0; }
    get onlinePct() { return this.fleet && this.fleet.total ? Math.round((this.fleet.online * 100) / this.fleet.total) : 0; }
    get evPct() { return this.fleet && this.fleet.total ? Math.round((this.fleet.evUnits * 100) / this.fleet.total) : 0; }

    toggleGroup(event) {
        const key = event.currentTarget.dataset.key;
        this.collapsed = { ...this.collapsed, [key]: !this.collapsed[key] };
    }
    setFilter(event) { this.activeFilter = event.currentTarget.dataset.f; }
    chipClass(f, activeCls) { return 'filter-chip' + (this.activeFilter === f ? ' ' + activeCls : ''); }
    get allChipClass() { return this.chipClass('all', 'active'); }
    get onlineChipClass() { return this.chipClass('online', 'active-online'); }
    get offlineChipClass() { return this.chipClass('offline', 'active-offline'); }
    get alertChipClass() { return this.chipClass('alert', 'active-alert'); }
    get evChipClass() { return this.chipClass('ev', 'active-ev'); }

    /* ---------- search ---------- */
    handleSearch(event) {
        const term = event.target.value;
        this.searchTerm = term;
        window.clearTimeout(this._debounce);
        if (!term || term.trim().length < 2) { this.results = []; return; }
        this._debounce = window.setTimeout(() => {
            searchVehicles({ term })
                .then((res) => { this.results = (res || []).map((r) => ({ ...r, icon: r.isEv ? '⚡' : '🚗' })); })
                .catch(() => { this.results = []; });
        }, 250);
    }
    handleSelect(event) {
        const id = event.currentTarget.dataset.id;
        this.results = [];
        this.searchTerm = '';
        this.loadProfile(id);
    }
    loadProfile(vehId) {
        this.loading = true;
        this.error = undefined;
        this.imgFailed = false;
        getVehicle360({ vehId })
            .then((res) => { this.data = res; this.activeTab = 'health'; this.setConsoleTab(res && res.title ? res.title : 'Vehicle 360'); })
            .catch((e) => { this.error = (e && e.body && e.body.message) || 'Unable to load vehicle'; })
            .finally(() => { this.loading = false; });
    }
    get showResults() { return this.results && this.results.length > 0; }
    goBack() {
        this.data = undefined;
        this.error = undefined;
        this.results = [];
        this.searchTerm = '';
        this.activeTab = 'health';
        this.setConsoleTab('Vehicle 360');
    }

    /* ---------- states ---------- */
    get hasData() { return !!this.data; }
    get showEmpty() { return !this.data && !this.loading && !this.error; }

    /* ---------- hero image ---------- */
    get heroImg() {
        if (!this.data || !this.data.imageName || this.imgFailed) return null;
        return `${VELO_VEHICLES}/${this.data.imageName}.svg`;
    }
    get showHeroImg() { return !!this.heroImg; }
    handleImgError() { this.imgFailed = true; }

    /* ---------- tabs ---------- */
    handleTab(event) { this.activeTab = event.currentTarget.dataset.tab; }
    get isHealth() { return this.activeTab === 'health'; }
    get isSvc()    { return this.activeTab === 'svc'; }
    get isTel()    { return this.activeTab === 'tel'; }
    get isOwn()    { return this.activeTab === 'own'; }
    get isUp()     { return this.activeTab === 'up'; }
    tabClass(id) { return 'tab' + (this.activeTab === id ? ' active' : ''); }
    get healthTabClass() { return this.tabClass('health'); }
    get svcTabClass()    { return this.tabClass('svc'); }
    get telTabClass()    { return this.tabClass('tel'); }
    get ownTabClass()    { return this.tabClass('own'); }
    get upTabClass()     { return this.tabClass('up'); }

    /* ---------- derived ---------- */
    get gaugeStyle() {
        if (!this.data) return '--val:0;--col:var(--green)';
        return `--val:${this.data.health};--col:${this.data.healthTone}`;
    }
    get householdLine() {
        if (!this.data) return '';
        const parts = [];
        if (this.data.garageCount) parts.push(`1 of ${this.data.garageCount} vehicles in household`);
        if (this.data.ownerLeadLine) parts.push(this.data.ownerLeadLine);
        return parts.join(' · ');
    }
    _statusRows(list) {
        if (!list) return [];
        return list.map((s, i) => ({
            key: `s-${i}`,
            k: s.k,
            v: s.v,
            cls: s.tone ? `st ${s.tone}` : 'st'
        }));
    }
    _telRows(list) {
        if (!list) return [];
        return list.map((t, i) => ({
            key: `t-${i}`,
            dateLine: t.dateLine,
            text: t.text,
            cls: t.tone ? `tl ${t.tone}` : 'tl'
        }));
    }
    get healthTileRows() { return this._statusRows(this.data && this.data.healthTiles); }
    get telTileRows()    { return this._statusRows(this.data && this.data.telTiles); }
    get ownershipRows()  { return this._statusRows(this.data && this.data.ownershipTiles); }
    get telStreamRows()  { return this._telRows(this.data && this.data.telStream); }
    get alertRows()      { return this._telRows(this.data && this.data.alerts); }
    get alertCount()     { return this.data && this.data.alerts ? this.data.alerts.length : 0; }
    get garageRows() {
        if (!this.data || !this.data.garage) return [];
        return this.data.garage.map((g, i) => ({
            key: `g-${i}`,
            modelLabel: g.isThis ? `${g.model} (this)` : g.model,
            variant: g.variant,
            fuel: g.fuel,
            reg: g.reg,
            status: g.status,
            statusClass: g.statusClass
        }));
    }
}
