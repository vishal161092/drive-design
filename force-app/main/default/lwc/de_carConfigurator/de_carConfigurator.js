import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getModels from '@salesforce/apex/de_CarConfiguratorController.getModels';
import saveConfiguration from '@salesforce/apex/de_CarConfiguratorController.saveConfiguration';

import THREE_CORE from '@salesforce/resourceUrl/de_three';
import THREE_LOADERS from '@salesforce/resourceUrl/de_threeLoaders';
import ENV_HDR from '@salesforce/resourceUrl/de_env_venice';
import SHOWROOM_BG from '@salesforce/resourceUrl/de_showroom_velo';

// All car models are imported statically (dynamic @salesforce/resourceUrl isn't
// possible) and looked up by the Vehicle_Model__c.de_ResourceName__c string.
import M_SPARK from '@salesforce/resourceUrl/de_carModel_spark';
import M_TERN from '@salesforce/resourceUrl/de_carModel_tern';
import M_AERO from '@salesforce/resourceUrl/de_carModel_aero';
import M_PICO from '@salesforce/resourceUrl/de_carModel_pico';
import M_HAWK from '@salesforce/resourceUrl/de_carModel_hawk';
import M_CREST from '@salesforce/resourceUrl/de_carModel_crest';
import M_SUMMIT from '@salesforce/resourceUrl/de_carModel_summit';
// Nova EV placeholder model.
import M_NOVA from '@salesforce/resourceUrl/de_carModel_nova';

const MODEL_URLS = {
    de_carModel_spark: M_SPARK,
    de_carModel_tern: M_TERN,
    de_carModel_aero: M_AERO,
    de_carModel_pico: M_PICO,
    de_carModel_hawk: M_HAWK,
    de_carModel_crest: M_CREST,
    de_carModel_summit: M_SUMMIT,
    de_carModel_nova: M_NOVA
};

// Cars hidden from the picker for now (their 360°-view-only handling stays fully
// intact — just clear this set to bring them back as selectable options).
const HIDDEN_MODELS = new Set(['de_carModel_hawk', 'de_carModel_crest']);

// Bump when any model .glb is re-deployed, to bust stale CDN/browser copies of the
// static resource (appended as a ?mv= query param on the loader fetch).
const MODEL_VERSION = 'placeholder-v1';

// 3D models (bring your own .glb; procedural placeholders ship in the repo).
// Materials are targeted BY NAME via each car's de_MaterialMap__c
// (role -> name-substrings); every model names materials differently, so the
// map is DATA, not hardcoded. Live 360 orbit + paint, dual-tone roof, gloss/matte,
// alloy finishes, blackout trim, caliper colour, glass tint, interior, camera
// presets and day/night lights — each shown only when the car actually has it.
const PAINTS = [
    { label: 'Midnight Black', hex: '#0c0c0e' },
    { label: 'Coral Red', hex: '#b81f24' },
    { label: 'Solar Orange', hex: '#df5a25' },
    { label: 'Mist White', hex: '#eef0f2' },
    { label: 'Slate Grey', hex: '#6b6f73' },
    { label: 'Copper Bronze', hex: '#8a6f4c' },
    { label: 'Polar White', hex: '#f4f5f3' }
];

// Summit-specific exterior colours (fictional).
const SUMMIT_PAINTS = [
    { label: 'Obsidian Black', hex: '#15171b' },
    { label: 'Sunlit Amber', hex: '#dca31f' },
    { label: 'Crimson Rouge', hex: '#6f1d24' },
    { label: 'Polar White', hex: '#f2f4f5' },
    { label: 'Frost Silver', hex: '#9ba1a7' },
    { label: 'Lagoon Teal', hex: '#2c5f5a' }
];

// Dual-tone roof / contrast panel. id 'body' = follow the main paint (monotone).
const ROOFS = [
    { label: 'Body colour', id: 'body', hex: null },
    { label: 'Black', id: 'black', hex: '#0c0c0e' },
    { label: 'White', id: 'white', hex: '#eef0f2' },
    { label: 'Grey', id: 'grey', hex: '#5c6064' }
];

// metalness kept < 1 on purpose: a fully-metallic PBR material has no diffuse
// term, so its colour comes only from tinted reflections and silver/black/bronze
// look nearly identical under a neutral HDRI. Lower metalness lets albedo read.
const WHEELS = [
    // Gloss black alloy — the default finish.
    { label: 'Gloss black', id: 'black', color: '#0c0c0e', metalness: 0.7, roughness: 0.14 },
    // Dark diamond-cut alloy
    { label: 'Graphite (dark machined)', id: 'graphite', color: '#565b62', metalness: 1.0, roughness: 0.2 },
    { label: 'Silver alloy', id: 'silver', color: '#dfe3e7', metalness: 0.85, roughness: 0.3 },
    { label: 'Bronze', id: 'bronze', color: '#9a6a2c', metalness: 0.8, roughness: 0.34 },
    { label: 'Machined', id: 'machined', color: '#c4cad0', metalness: 1.0, roughness: 0.1 }
];

const CALIPERS = [
    { label: 'Silver', id: 'silver', hex: '#b8bcc0' },
    { label: 'Red', id: 'red', hex: '#c1121c' },
    { label: 'Yellow', id: 'yellow', hex: '#f2c200' },
    { label: 'Orange', id: 'orange', hex: '#df5a25' }
];

const TINTS = [
    { label: 'Clear', id: 'clear', opacity: 0.35, shade: '#dfe6ea' },
    { label: 'Light', id: 'light', opacity: 0.58, shade: '#8b969c' },
    { label: 'Privacy', id: 'dark', opacity: 0.85, shade: '#1c2026' }
];

const INTERIORS = [
    { label: 'Sand Beige', hex: '#c8b391' },
    { label: 'Carbon Black', hex: '#1a1a1c' },
    { label: 'Terracotta', hex: '#8a3b25' },
    { label: 'Cool Grey', hex: '#9aa0a6' }
];

// Summit cabin themes: dual-tone ivory, all-black, and a matched terracotta.
const SUMMIT_INTERIORS = [
    { label: 'Ivory', hex: '#d9d2c4' },
    { label: 'Carbon Black', hex: '#1a1a1c' },
    { label: 'Rouge Terracotta', hex: '#8a3b25' }
];

// Per-car palettes keyed by de_ResourceName__c; anything absent uses the generic set.
const PAINT_PALETTES = {
    de_carModel_summit: SUMMIT_PAINTS
};
const INTERIOR_PALETTES = {
    de_carModel_summit: SUMMIT_INTERIORS
};

const VIEWS = [
    { label: '¾ Front', view: '3q' },
    { label: 'Side', view: 'side' },
    { label: 'Rear', view: 'rear' },
    { label: 'Top', view: 'top' },
    { label: 'Wheels', view: 'wheel' },
    { label: 'Interior', view: 'int' }
];

// Role priority — roof BEFORE body because a roof material name like
// "EXT_COLORBODY_2" also contains the body substring "ext_colorbody"; testing
// roof first lets it win. Light before interior likewise avoids overlaps.
const ROLE_ORDER = ['roof', 'body', 'glass', 'rim', 'caliper', 'trim', 'light', 'interior'];

// Build a name->role classifier from a car's de_MaterialMap__c ({role:[substrings]}).
function makeClassifier(map) {
    const m = map || {};
    return (name) => {
        const n = (name || '').toLowerCase();
        for (const role of ROLE_ORDER) {
            const subs = m[role];
            if (subs && subs.some((s) => n.indexOf(String(s).toLowerCase()) !== -1)) {
                return role;
            }
        }
        return null;
    };
}

export default class De_carConfigurator extends LightningElement {
    paints = PAINTS;
    roofs = ROOFS;
    wheels = WHEELS;
    calipers = CALIPERS;
    tints = TINTS;
    interiors = INTERIORS;
    views = VIEWS;

    // When set (e.g. by the Agentforce card wrapper via the `car-resource`
    // attribute), lock the configurator to ONE car: load only that model and hide
    // the car picker so the customer sees just the car they asked about.
    _lockResource = null;
    @api
    get carResource() {
        return this._lockResource;
    }
    set carResource(v) {
        this._lockResource = v || null;
        // if the catalog is already loaded, apply the lock immediately (the value
        // can arrive after mount, once the agent card sets it)
        if (this._models && this._models.length) {
            this.applyLock();
        }
    }

    // When the agent card supplies the locked model's record data (JSON) up front,
    // the configurator renders from it directly — no client-side getModels() Apex
    // call, which the web-messaging session user isn't allowed to make.
    _seedModel = null;
    @api
    get seedModel() {
        return this._seedModel;
    }
    set seedModel(v) {
        if (!v) {
            this._seedModel = null;
            return;
        }
        try {
            this._seedModel = typeof v === 'string' ? JSON.parse(v) : v;
        } catch (e) {
            this._seedModel = null;
        }
        // If the 3D scene is ready but the catalog hasn't loaded yet, seed it now.
        if (this._scene && !this.currentId) {
            this.seedCatalog();
        }
    }

    // Render the single seeded model without any Apex call.
    seedCatalog() {
        const m = this._seedModel;
        if (!m || !MODEL_URLS[m.de_ResourceName__c]) {
            return false;
        }
        this._models = [m];
        this.cars = [m];
        this.selectModel(m);
        return true;
    }

    // Catalog / selection.
    cars = [];
    currentId;
    currentName = '';
    currentTagline = '';
    meshBadge = '(no model yet)';

    get buildBadge() {
        return MODEL_VERSION;
    }
    currentCustomizable = false;

    // Which control groups this car supports (set after each model loads).
    hasBody = false;
    hasRoof = false;
    hasRim = false;
    hasCaliper = false;
    hasGlass = false;
    hasTrim = false;
    hasLight = false;
    hasInterior = false;

    activePaint = PAINTS[0].hex;
    activeRoof = 'body';
    activeWheel = 'black';
    activeCaliper = 'silver';
    activeTint = 'clear';
    activeInterior = INTERIORS[0].hex;
    finishGloss = true; // gloss by default
    trimBlackout = false;
    lightsOn = true; // Signature "Light Saber" LEDs glow by default
    autoRotate = true;
    loading = true;
    saving = false;
    statusMsg = 'Loading 3D engine…';

    _initialized = false;
    _three;
    _renderer;
    _scene;
    _camera;
    _controls;
    _raf;
    _resizeObserver;
    _tween = null;
    _models = [];
    _car = null;
    _classify = () => null;

    // Material role references.
    _bodyMat;
    _roofMat;
    _rimMats = [];
    _glassMats = [];
    _trimMats = [];
    _caliperMats = [];
    _lightMats = [];
    _leatherMats = [];

    // Framing.
    _size = { x: 2, y: 1.6, z: 4 };
    _dist = 6;
    _targetY = 0.7;
    _homeCam;
    _homeTarget;

    renderedCallback() {
        if (this._initialized) {
            return;
        }
        this._initialized = true;
        loadScript(this, THREE_CORE)
            .then(() => loadScript(this, THREE_LOADERS))
            .then(() => this.initScene())
            .catch((e) => this.fail('Engine load failed: ' + (e && e.message ? e.message : e)));
    }

    disconnectedCallback() {
        this.teardown();
    }

    // ---- catalog getters ----
    get carChips() {
        return this.cars.map((c) => ({
            id: c.Id,
            name: c.Name,
            cls: c.Id === this.currentId ? 'cc-chip cc-chip-on' : 'cc-chip'
        }));
    }
    // Hide the car picker entirely when locked to a single car, or when there's
    // only one selectable car anyway.
    get showPicker() {
        return !this._lockResource && this.cars.length > 1;
    }
    get showFinishRow() {
        return this.hasBody || this.hasTrim;
    }
    // panel content is withheld until the car + options are ready, so nothing
    // (e.g. the view-only note) flashes while the model is still loading
    get ready() {
        return !this.loading;
    }

    // Velo showroom photo painted behind the transparent WebGL canvas (CSS cover),
    // so the car reads as sitting on the showroom's circular turntable platform.
    get stageStyle() {
        return `background-image:url(${SHOWROOM_BG});background-size:cover;background-position:center 42%;background-repeat:no-repeat;`;
    }

    // ---- swatch getters ----
    get paintSwatches() {
        return this.paints.map((p) => ({
            ...p,
            style: `background:${p.hex}`,
            cls: p.hex === this.activePaint ? 'cc-swatch cc-selected' : 'cc-swatch'
        }));
    }
    get roofSwatches() {
        return this.roofs.map((r) => ({
            ...r,
            style: `background:${r.hex || this.activePaint}`,
            cls: r.id === this.activeRoof ? 'cc-swatch cc-selected' : 'cc-swatch'
        }));
    }
    get wheelOptions() {
        return this.wheels.map((w) => ({
            ...w,
            style: `background:${w.color}`,
            cls: w.id === this.activeWheel ? 'cc-swatch cc-selected' : 'cc-swatch'
        }));
    }
    get caliperSwatches() {
        return this.calipers.map((c) => ({
            ...c,
            style: `background:${c.hex}`,
            cls: c.id === this.activeCaliper ? 'cc-swatch cc-selected' : 'cc-swatch'
        }));
    }
    get tintOptions() {
        return this.tints.map((t) => ({
            ...t,
            cls: t.id === this.activeTint ? 'cc-chip cc-chip-on' : 'cc-chip'
        }));
    }
    get interiorSwatches() {
        return this.interiors.map((p) => ({
            ...p,
            style: `background:${p.hex}`,
            cls: p.hex === this.activeInterior ? 'cc-swatch cc-selected' : 'cc-swatch'
        }));
    }
    get finishLabel() {
        return this.finishGloss ? 'Gloss' : 'Matte';
    }
    get trimLabel() {
        return this.trimBlackout ? 'Blackout' : 'Chrome';
    }
    get lightsLabel() {
        return this.lightsOn ? '☀ Lights on' : '☾ Lights off';
    }
    // Segmented single-select buttons for finish + trim (label-left / controls-right row style).
    get finishOptions() {
        return [
            { id: 'gloss', label: 'Gloss', cls: this.finishGloss ? 'cc-seg cc-seg-on' : 'cc-seg' },
            { id: 'matte', label: 'Matte', cls: this.finishGloss ? 'cc-seg' : 'cc-seg cc-seg-on' }
        ];
    }
    get trimOptions() {
        return [
            { id: 'chrome', label: 'Chrome', cls: this.trimBlackout ? 'cc-seg' : 'cc-seg cc-seg-on' },
            { id: 'black', label: 'Blackout', cls: this.trimBlackout ? 'cc-seg cc-seg-on' : 'cc-seg' }
        ];
    }

    initScene() {
        const THREE = window.THREE;
        if (!THREE || !THREE.GLTFLoader) {
            this.fail('THREE not available on window after load.');
            return;
        }
        this._three = THREE;
        const canvas = this.template.querySelector('canvas.cc-viewport');
        const host = this.template.querySelector('.cc-stage');
        const w = host.clientWidth || 800;
        const h = host.clientHeight || 480;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h, false);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        this._renderer = renderer;

        const scene = new THREE.Scene();
        // transparent scene: the Velo showroom photo is painted behind the canvas via
        // CSS (see stageStyle), so the car composites onto the showroom turntable
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
        this._scene = scene;

        // key + fill on top of the HDRI env — warm, showroom-style lighting to match
        // the sunlit interior in the backdrop photo
        const key = new THREE.DirectionalLight(0xfff2e0, 0.7);
        key.position.set(4, 9, -6);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xdfe6f0, 0.3);
        fill.position.set(-5, 4, 6);
        scene.add(fill);

        // soft feathered contact shadow so the car reads as grounded on the grey backdrop
        this._shadow = this.makeContactShadow(THREE);
        scene.add(this._shadow);

        const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
        camera.position.set(4.5, 1.6, -5.2);
        this._camera = camera;

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.maxPolarAngle = Math.PI / 2 + 0.08;
        controls.target.set(0, 0.6, 0);
        controls.autoRotate = this.autoRotate;
        controls.autoRotateSpeed = 0.9;
        controls.update();
        this._controls = controls;

        this.statusMsg = 'Lighting the studio…';
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();
        new THREE.RGBELoader().load(
            ENV_HDR,
            (tex) => {
                // HDRI drives reflections only (scene.environment); the visible
                // backdrop stays the designed studio sweep + floor for a clean,
                // realistic look rather than a busy real-world photo
                const envMap = pmrem.fromEquirectangular(tex).texture;
                scene.environment = envMap;
                tex.dispose();
                pmrem.dispose();
                this.loadCatalog();
            },
            undefined,
            () => {
                const hemi = new THREE.HemisphereLight(0xffffff, 0x333333, 1.1);
                scene.add(hemi);
                const dir = new THREE.DirectionalLight(0xffffff, 1.4);
                dir.position.set(5, 8, -5);
                scene.add(dir);
                this.loadCatalog();
            }
        );

        this.animate();
        this.observeResize(host, renderer, camera);
    }

    loadCatalog() {
        // Agent-embedded path: render the model the action already handed us, no Apex.
        if (this._seedModel && this.seedCatalog()) {
            return;
        }
        this.statusMsg = 'Loading cars…';
        getModels()
            .then((models) => {
                this._models = (models || []).filter(
                    (m) => MODEL_URLS[m.de_ResourceName__c] && !HIDDEN_MODELS.has(m.de_ResourceName__c)
                );
                if (!this._models.length) {
                    this.fail('No vehicle models available.');
                    return;
                }
                // Locked to a single car (agent asked for a specific model): load only that.
                if (this._lockResource) {
                    const locked = this._models.find(
                        (m) => m.de_ResourceName__c === this._lockResource
                    );
                    if (locked) {
                        this.cars = [locked];
                        this.selectModel(locked);
                        return;
                    }
                }
                // Summit is the focus — show it first in the picker and load it by default
                const summit = this._models.find(
                    (m) => m.de_ResourceName__c === 'de_carModel_summit'
                );
                this.cars = summit
                    ? [summit, ...this._models.filter((m) => m !== summit)]
                    : this._models;
                this.selectModel(summit || this._models[0]);
            })
            .catch((e) => this.fail('Could not load cars: ' + (e && e.body ? e.body.message : e)));
    }

    // Restrict the (already-loaded) catalog to the locked car and select it.
    applyLock() {
        if (!this._lockResource) {
            return;
        }
        const locked = this._models.find(
            (m) => m.de_ResourceName__c === this._lockResource
        );
        if (locked) {
            this.cars = [locked];
            if (this.currentId !== locked.Id) {
                this.selectModel(locked);
            }
        }
    }

    selectModel(model) {
        const url = MODEL_URLS[model.de_ResourceName__c];
        if (!url) {
            return;
        }
        this.currentId = model.Id;
        this.currentName = model.Name;
        this.currentTagline = model.de_Tagline__c || '';
        this.currentCustomizable = !!model.de_Customizable__c;
        let map = {};
        try {
            map = model.de_MaterialMap__c ? JSON.parse(model.de_MaterialMap__c) : {};
        } catch (e) {
            map = {};
        }
        this._classify = makeClassifier(this.currentCustomizable ? map : {});

        // per-car real-world palettes (fall back to the generic set)
        this.paints = PAINT_PALETTES[model.de_ResourceName__c] || PAINTS;
        this.interiors = INTERIOR_PALETTES[model.de_ResourceName__c] || INTERIORS;

        // reset selections to defaults for the new car
        this.activePaint = this.paints[0].hex;
        this.activeRoof = 'body';
        this.activeWheel = 'black';
        this.activeCaliper = 'silver';
        this.activeTint = 'clear';
        this.activeInterior = this.interiors[0].hex;
        this.finishGloss = true; // gloss by default
        this.trimBlackout = false;
        this.lightsOn = true; // Signature "Light Saber" LEDs glow by default

        // drop the previous car
        if (this._car && this._scene) {
            this._scene.remove(this._car);
            this.disposeObject(this._car);
            this._car = null;
        }

        this.loading = true;
        this.statusMsg = 'Loading ' + this.currentName + '…';
        this.loadCar(url);
    }

    loadCar(url) {
        const THREE = this._three;
        const loader = new THREE.GLTFLoader();
        const meshopt = window.MeshoptDecoder;
        if (meshopt) {
            loader.setMeshoptDecoder(meshopt);
        }
        // Cache-buster: force a fresh fetch when a model .glb is re-deployed but the
        // CDN/browser is still holding the previous bytes. Bump MODEL_VERSION on redeploy.
        // NOTE: on the embedded-messaging / Experience (LWR) surface, resourceUrl resolves
        // to an immutable, content-addressed `/webruntime/org-asset/…` URL that 404s if any
        // extra query string is appended — so only bust on the console/Aura surface.
        const isOrgAsset = /\/(webruntime|org-asset)\//.test(url);
        const bust = isOrgAsset
            ? ''
            : (url.indexOf('?') === -1 ? '?' : '&') + 'mv=' + MODEL_VERSION;
        // eslint-disable-next-line no-console
        console.log('[SummitDBG] BUNDLE=' + MODEL_VERSION + ' | base url=', url, '| fetching=', url + bust);
        loader.load(
            url + bust,
            (gltf) => this.onCarLoaded(gltf),
            undefined,
            (err) => this.fail('Model load failed: ' + (err && err.message ? err.message : err))
        );
    }

    onCarLoaded(gltf) {
        const THREE = this._three;
        const car = gltf.scene;

        // eslint-disable-next-line no-console
        try {
            let meshCount = 0;
            const matNames = new Set();
            car.traverse((o) => { if (o.isMesh) { meshCount++; if (o.material) matNames.add(o.material.name); } });
            const size = new THREE.Box3().setFromObject(car).getSize(new THREE.Vector3());
            this.meshBadge = meshCount + ' meshes, ' + size.z.toFixed(1) + 'm long';
            // eslint-disable-next-line no-console
            console.log('[SummitDBG] LOADED car=' + this.currentName + ' | meshes=' + meshCount +
                ' | materials=[' + Array.from(matNames).join(', ') + '] | bbox=' +
                size.x.toFixed(2) + 'x' + size.y.toFixed(2) + 'x' + size.z.toFixed(2));
        } catch (e) { /* diag only */ }

        this._bodyMat = null;
        this._roofMat = null;
        this._rimMats = [];
        this._glassMats = [];
        this._trimMats = [];
        this._caliperMats = [];
        this._lightMats = [];
        this._leatherMats = [];

        // honour the current finish (matte by default) so the initial material
        // matches the toggle state, not just after the user flips it
        const paintMat = () =>
            new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(this.activePaint),
                metalness: 0.85,
                roughness: this.finishGloss ? 0.34 : 0.55,
                clearcoat: this.finishGloss ? 0.65 : 0.3,
                clearcoatRoughness: this.finishGloss ? 0.12 : 0.4,
                envMapIntensity: 1.05
            });

        const cloneMap = new Map(); // original material uuid -> cloned instance
        const pushed = new Set();
        const shared = (o, arr) => {
            const orig = o.material;
            if (cloneMap.has(orig.uuid)) {
                o.material = cloneMap.get(orig.uuid);
                return null;
            }
            const c = orig.clone();
            cloneMap.set(orig.uuid, c);
            o.material = c;
            if (arr && !pushed.has(c.uuid)) {
                pushed.add(c.uuid);
                arr.push(c);
            }
            return c;
        };

        car.traverse((o) => {
            if (!o.isMesh || !o.material) {
                return;
            }
            switch (this._classify(o.material.name)) {
                case 'body':
                    if (!this._bodyMat) {
                        this._bodyMat = paintMat();
                    }
                    o.material = this._bodyMat;
                    break;
                case 'roof':
                    if (!this._roofMat) {
                        this._roofMat = paintMat();
                    }
                    o.material = this._roofMat;
                    break;
                case 'rim': {
                    const c = shared(o, this._rimMats);
                    if (c) {
                        c.metalness = 0.85;
                        c.roughness = 0.3;
                        c.envMapIntensity = 1.1;
                    }
                    break;
                }
                case 'glass': {
                    const c = shared(o, this._glassMats);
                    if (c) {
                        c.transparent = true;
                        c.metalness = 0;
                        c.roughness = 0.05; // glossy glass picks up crisp reflections
                        c.envMapIntensity = 1.2;
                        c.needsUpdate = true;
                    }
                    break;
                }
                case 'caliper':
                    shared(o, this._caliperMats);
                    break;
                case 'trim': {
                    const c = shared(o, this._trimMats);
                    if (c) {
                        c.userData.baseColor = c.color.clone();
                        c.userData.baseRough = c.roughness;
                        c.userData.baseMetal = c.metalness;
                    }
                    break;
                }
                case 'light': {
                    const c = shared(o, this._lightMats);
                    if (c) {
                        const nm = (c.name || '').toLowerCase();
                        const red = ['tail', 'stop', 'rear', 'red'].some((k) => nm.indexOf(k) !== -1);
                        const amber = nm.indexOf('indicator') !== -1;
                        c.userData.litColor = new THREE.Color(red ? 0xff2b1a : amber ? 0xff9500 : 0xfff2d6);
                        c.emissive = new THREE.Color(0x000000);
                        c.emissiveIntensity = 0;
                        c.needsUpdate = true;
                    }
                    break;
                }
                case 'interior': {
                    const c = shared(o, this._leatherMats);
                    if (c) {
                        c.color = new THREE.Color(this.activeInterior);
                    }
                    break;
                }
                default: {
                    // Tyres aren't in the material map (so they'd stay the GLB's
                    // pale default) — darken any tyre/rubber material to black rubber.
                    const nm = (o.material.name || '').toLowerCase();
                    if (
                        nm.indexOf('tire') !== -1 ||
                        nm.indexOf('tyre') !== -1 ||
                        nm.indexOf('rubber') !== -1
                    ) {
                        const c = shared(o, null);
                        if (c) {
                            c.color = new THREE.Color(0x0b0b0d);
                            c.metalness = 0.0;
                            c.roughness = 0.9;
                            c.needsUpdate = true;
                        }
                    }
                    break;
                }
            }
        });

        // publish capabilities so the panel shows only the relevant controls
        this.hasBody = !!this._bodyMat;
        this.hasRoof = !!this._roofMat;
        this.hasRim = this._rimMats.length > 0;
        this.hasCaliper = this._caliperMats.length > 0;
        this.hasGlass = this._glassMats.length > 0;
        this.hasTrim = this._trimMats.length > 0;
        this.hasLight = this._lightMats.length > 0;
        this.hasInterior = this._leatherMats.length > 0;

        this._car = car;
        this._scene.add(car);
        this.frameModel(car);
        this.applyRoof();
        this.applyWheel();
        this.applyCaliper();
        this.applyTint();
        this.applyLights();
        this.loading = false;
        this.statusMsg = '';
    }

    // Soft grey studio backdrop: a radial gradient with a brighter centre behind the
    // car easing to a darker grey vignette at the edges, so the car sits in a lit
    // seamless grey space (no floor plane, no hard horizon line). Drawn screen-space.
    makeStudioBackground(THREE) {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 1024;
        const ctx = cv.getContext('2d');
        // vignette centred slightly above middle (behind the car), grey → darker grey
        const g = ctx.createRadialGradient(512, 430, 80, 512, 512, 760);
        g.addColorStop(0.0, '#c9ced5');  // soft light grey glow behind the car
        g.addColorStop(0.5, '#9aa1aa');  // mid grey
        g.addColorStop(1.0, '#5c626b');  // darker grey vignette at the edges
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1024, 1024);
        const tex = new THREE.CanvasTexture(cv);
        tex.encoding = THREE.sRGBEncoding;
        this._bgTex = tex;
        return tex;
    }

    // Radial-gradient blob used as a soft, feathered contact shadow on the ground.
    // Feathered edge (no hard rim) so it reads as a natural surrounding shadow.
    makeContactShadow(THREE) {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 256;
        const ctx = cv.getContext('2d');
        const g = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
        g.addColorStop(0, 'rgba(0,0,0,0.55)');
        g.addColorStop(0.35, 'rgba(0,0,0,0.38)');
        g.addColorStop(0.65, 'rgba(0,0,0,0.16)');
        g.addColorStop(0.85, 'rgba(0,0,0,0.05)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(cv);
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            depthWrite: false,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        mesh.rotation.x = -Math.PI / 2; // lay flat: local x -> world x, local y -> world -z
        mesh.position.y = 0.002;
        mesh.renderOrder = -1;
        this._shadowTex = tex;
        return mesh;
    }

    frameModel(car) {
        const THREE = this._three;
        const box = new THREE.Box3().setFromObject(car);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        car.position.x += -center.x;
        car.position.z += -center.z;
        car.position.y += -box.min.y;

        // fit the contact shadow to this car's footprint (elongated along length,
        // spread wide so the feathered edge surrounds the car softly)
        if (this._shadow) {
            this._shadow.scale.set(size.x * 2.0, size.z * 1.45, 1);
            this._shadow.position.set(0, 0.002, 0);
        }

        const maxDim = Math.max(size.x, size.y, size.z);
        const fitDist = maxDim / (2 * Math.tan((Math.PI * this._camera.fov) / 360));
        // Smaller multiplier = camera sits closer = the car fills more of the frame.
        const dist = fitDist * 1.25;
        const targetY = size.y * 0.45;

        this._size = { x: size.x, y: size.y, z: size.z };
        this._dist = dist;
        this._targetY = targetY;
        this._homeCam = { x: dist * 0.72, y: targetY + size.y * 0.35, z: -dist * 0.85 };
        this._homeTarget = { x: 0, y: targetY, z: 0 };

        this._camera.near = maxDim / 100;
        this._camera.far = maxDim * 100;
        this._camera.updateProjectionMatrix();
        this._camera.position.set(this._homeCam.x, this._homeCam.y, this._homeCam.z);
        this._controls.target.set(0, targetY, 0);
        // small enough that the cockpit preset (camera near its in-cabin target)
        // isn't clamped/pushed back out when OrbitControls re-enables post-tween
        this._controls.minDistance = dist * 0.12;
        this._controls.maxDistance = dist * 2.4;
        this._controls.autoRotate = this.autoRotate;
        this._controls.update();
    }

    _presets() {
        const d = this._dist;
        const s = this._size;
        const ty = this._targetY;
        return {
            '3q': { pos: [d * 0.72, ty + s.y * 0.35, -d * 0.85], tgt: [0, ty, 0] },
            side: { pos: [d * 1.05, ty, 0.01], tgt: [0, ty, 0] },
            rear: { pos: [-d * 0.72, ty + s.y * 0.35, d * 0.85], tgt: [0, ty, 0] },
            top: { pos: [0.01, d * 1.5, 0.01], tgt: [0, ty, 0] },
            wheel: { pos: [s.x * 0.82, s.y * 0.26, -s.z * 0.28], tgt: [s.x * 0.12, s.y * 0.16, -s.z * 0.3] },
            // cockpit view: camera at driver-seat eye height toward the rear of the
            // cabin (+z, since the front of the car faces -z), looking forward and
            // slightly down at the dashboard. Backfaces of the far panels/roof are
            // culled so we see through to the interior.
            int: { pos: [s.x * 0.16, s.y * 0.62, s.z * 0.16], tgt: [0, s.y * 0.42, -s.z * 0.3] }
        };
    }

    animate() {
        this._raf = window.requestAnimationFrame(() => this.animate());
        const THREE = this._three;
        if (this._tween && this._camera && this._controls) {
            const t = this._tween;
            const k = Math.min(1, (window.performance.now() - t.start) / t.dur);
            const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // easeInOutQuad
            this._camera.position.lerpVectors(t.fromP, t.toP, e);
            const tgt = new THREE.Vector3().lerpVectors(t.fromT, t.toT, e);
            this._camera.lookAt(tgt);
            if (k >= 1) {
                this._controls.target.copy(t.toT);
                this._controls.enabled = true;
                this._controls.autoRotate = this.autoRotate;
                this._tween = null;
                this._controls.update();
            }
        } else if (this._controls) {
            this._controls.update();
        }
        if (this._renderer && this._scene && this._camera) {
            this._renderer.render(this._scene, this._camera);
        }
    }

    _tweenCamera(pos, tgt) {
        const THREE = this._three;
        if (!this._camera || !this._controls) {
            return;
        }
        this._controls.enabled = false;
        this._controls.autoRotate = false;
        this._tween = {
            fromP: this._camera.position.clone(),
            toP: new THREE.Vector3(pos[0], pos[1], pos[2]),
            fromT: this._controls.target.clone(),
            toT: new THREE.Vector3(tgt[0], tgt[1], tgt[2]),
            start: window.performance.now(),
            dur: 650
        };
    }

    observeResize(host, renderer, camera) {
        this._resizeObserver = new ResizeObserver(() => {
            const w = host.clientWidth;
            const h = host.clientHeight;
            if (w && h) {
                renderer.setSize(w, h, false);
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            }
        });
        this._resizeObserver.observe(host);
    }

    // ---- appliers ----
    applyRoof() {
        if (!this._roofMat) {
            return;
        }
        const opt = ROOFS.find((r) => r.id === this.activeRoof);
        const hex = opt && opt.hex ? opt.hex : this.activePaint;
        this._roofMat.color = new this._three.Color(hex);
    }
    applyWheel() {
        const w = WHEELS.find((x) => x.id === this.activeWheel);
        if (!w) {
            return;
        }
        this._rimMats.forEach((m) => {
            m.color = new this._three.Color(w.color);
            m.metalness = w.metalness;
            m.roughness = w.roughness;
            m.needsUpdate = true;
        });
    }
    applyCaliper() {
        const c = CALIPERS.find((x) => x.id === this.activeCaliper);
        if (!c) {
            return;
        }
        this._caliperMats.forEach((m) => {
            m.color = new this._three.Color(c.hex);
            m.metalness = 0.6;
            m.roughness = 0.4;
        });
    }
    applyTint() {
        const t = TINTS.find((x) => x.id === this.activeTint);
        if (!t) {
            return;
        }
        this._glassMats.forEach((m) => {
            m.color = new this._three.Color(t.shade);
            m.opacity = t.opacity;
            m.transparent = true;
            m.needsUpdate = true;
        });
    }

    // ---- UI handlers ----
    handleSelectCar(event) {
        const id = event.currentTarget.dataset.id;
        if (id === this.currentId) {
            return;
        }
        const model = this._models.find((m) => m.Id === id);
        if (model) {
            this.selectModel(model);
        }
    }
    handlePaint(event) {
        this.activePaint = event.currentTarget.dataset.hex;
        if (this._bodyMat) {
            this._bodyMat.color = new this._three.Color(this.activePaint);
        }
        this.applyRoof();
    }
    handleRoof(event) {
        this.activeRoof = event.currentTarget.dataset.id;
        this.applyRoof();
    }
    handleWheel(event) {
        this.activeWheel = event.currentTarget.dataset.id;
        this.applyWheel();
    }
    handleCaliper(event) {
        this.activeCaliper = event.currentTarget.dataset.id;
        this.applyCaliper();
    }
    handleTint(event) {
        this.activeTint = event.currentTarget.dataset.id;
        this.applyTint();
    }
    handleInterior(event) {
        this.activeInterior = event.currentTarget.dataset.hex;
        const c = new this._three.Color(this.activeInterior);
        this._leatherMats.forEach((m) => {
            m.color = c;
        });
    }
    handleFinish() {
        this.finishGloss = !this.finishGloss;
        [this._bodyMat, this._roofMat].forEach((m) => {
            if (m) {
                m.roughness = this.finishGloss ? 0.34 : 0.55;
                m.clearcoat = this.finishGloss ? 0.65 : 0.3;
                m.clearcoatRoughness = this.finishGloss ? 0.12 : 0.4;
                m.needsUpdate = true;
            }
        });
    }
    handleTrim() {
        this.trimBlackout = !this.trimBlackout;
        this._trimMats.forEach((m) => {
            if (this.trimBlackout) {
                m.color = new this._three.Color(0x111214);
                m.metalness = 1.0;
                m.roughness = 0.4;
            } else if (m.userData.baseColor) {
                m.color = m.userData.baseColor.clone();
                m.metalness = m.userData.baseMetal;
                m.roughness = m.userData.baseRough;
            }
            m.needsUpdate = true;
        });
    }
    // Segmented finish selector (Gloss / Matte) — flips only when a different one is picked.
    handleFinishSel(event) {
        const wantGloss = event.currentTarget.dataset.id === 'gloss';
        if (wantGloss !== this.finishGloss) {
            this.handleFinish();
        }
    }
    // Segmented trim selector (Chrome / Blackout).
    handleTrimSel(event) {
        const wantBlackout = event.currentTarget.dataset.id === 'black';
        if (wantBlackout !== this.trimBlackout) {
            this.handleTrim();
        }
    }
    handleLights() {
        this.lightsOn = !this.lightsOn;
        this.applyLights();
    }

    // Reset all customization choices for the current car back to defaults + reapply.
    handleResetConfig() {
        this.activePaint = this.paints[0].hex;
        this.activeRoof = 'body';
        this.activeWheel = 'black';
        this.activeCaliper = 'silver';
        this.activeTint = 'clear';
        this.activeInterior = this.interiors[0].hex;
        if (this.trimBlackout) {
            this.handleTrim();
        }
        this.finishGloss = false; // force the applier below to set gloss cleanly
        this.handleFinish();
        if (this._bodyMat) {
            this._bodyMat.color = new this._three.Color(this.activePaint);
        }
        this.applyRoof();
        this.applyWheel();
        this.applyCaliper();
        this.applyTint();
        const ic = new this._three.Color(this.activeInterior);
        this._leatherMats.forEach((m) => {
            m.color = ic;
        });
    }
    // drive the Signature Light Saber LED glow from the current lightsOn state
    applyLights() {
        if (!this._lightMats) {
            return;
        }
        this._lightMats.forEach((m) => {
            if (this.lightsOn && m.userData.litColor) {
                m.emissive = m.userData.litColor.clone();
                m.emissiveIntensity = 2.2;
            } else {
                m.emissive = new this._three.Color(0x000000);
                m.emissiveIntensity = 0;
            }
            m.needsUpdate = true;
        });
    }
    handleView(event) {
        const view = event.currentTarget.dataset.view;
        const p = this._presets()[view];
        if (p) {
            // detail views (cockpit / wheels) shouldn't keep spinning
            if (view === 'int' || view === 'wheel') {
                this.autoRotate = false;
            }
            this._tweenCamera(p.pos, p.tgt);
        }
    }
    handleAutoRotate() {
        this.autoRotate = !this.autoRotate;
        if (this._controls && !this._tween) {
            this._controls.autoRotate = this.autoRotate;
        }
    }
    handleResetView() {
        if (this._homeCam) {
            this._tweenCamera(
                [this._homeCam.x, this._homeCam.y, this._homeCam.z],
                [this._homeTarget.x, this._homeTarget.y, this._homeTarget.z]
            );
        }
    }

    handleSave() {
        if (!this.currentId || this.saving) {
            return;
        }
        this.saving = true;
        const paint = this.paints.find((p) => p.hex === this.activePaint);
        const selections = {
            car: this.currentName,
            customizable: this.currentCustomizable
        };
        const parts = [this.currentName];
        if (this.currentCustomizable) {
            selections.paint = paint ? paint.label : this.activePaint;
            selections.roof = this.activeRoof;
            selections.wheel = this.activeWheel;
            selections.caliper = this.activeCaliper;
            selections.tint = this.activeTint;
            selections.interior = this.activeInterior;
            selections.finish = this.finishGloss ? 'Gloss' : 'Matte';
            selections.trim = this.trimBlackout ? 'Blackout' : 'Chrome';
            if (paint) {
                parts.push(paint.label);
            }
            if (this.hasRoof && this.activeRoof !== 'body') {
                parts.push(this.activeRoof + ' roof');
            }
            parts.push((this.finishGloss ? 'Gloss' : 'Matte') + ' finish');
        }
        const summary = parts.join(' · ').slice(0, 255);
        saveConfiguration({
            vehicleId: this.currentId,
            selectionsJson: JSON.stringify(selections),
            summary
        })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Build saved',
                        message: summary,
                        variant: 'success'
                    })
                );
            })
            .catch((e) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Could not save',
                        message: e && e.body ? e.body.message : String(e),
                        variant: 'error'
                    })
                );
            })
            .finally(() => {
                this.saving = false;
                // Advance the chat flow to accessory shopping for this build.
                this.sendMessageToChat(
                    `Shop for accessories for my ${this.currentName}`
                );
            });
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
                embeddedservice_configuration.util
                    .sendTextMessage(message)
                    .catch(() => {});
            }
        } catch (error) {
            // silent — only the embedded/enhanced chat client supports this
        }
    }

    fail(msg) {
        // eslint-disable-next-line no-console
        console.error('[de_carConfigurator]', msg);
        this.loading = false;
        this.statusMsg = msg;
    }

    disposeObject(obj) {
        obj.traverse((o) => {
            if (o.isMesh) {
                if (o.geometry) {
                    o.geometry.dispose();
                }
                const mats = Array.isArray(o.material) ? o.material : [o.material];
                mats.forEach((m) => m && m.dispose && m.dispose());
            }
        });
    }

    teardown() {
        if (this._raf) {
            window.cancelAnimationFrame(this._raf);
        }
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
        if (this._shadowTex) {
            this._shadowTex.dispose();
        }
        if (this._bgTex) {
            this._bgTex.dispose();
        }
        if (this._renderer) {
            this._renderer.dispose();
        }
    }
}
