import { LightningElement } from 'lwc';

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DATA_SOURCE_TABS = [
    { key: 'fb', name: 'Facebook Ads' },
    { key: 'mc', name: 'Marketing Cloud' },
    { key: 'dl', name: 'Data Lake' },
    { key: 'ga', name: 'Google Analytics' },
    { key: 'gads', name: 'Google Ads' },
    { key: 'ig', name: 'Instagram Ads' },
    { key: 'an', name: 'App Nexus' },
    { key: 'yt', name: 'YouTube' },
    { key: 'bing', name: 'Bing Ads' }
].map((tab) => ({ ...tab, updated: 'Last Updated Sep 28' }));

const KPI_CARDS = [
    {
        key: 'accounts',
        value: '141',
        caption: 'NEW LEADS CAPTURED',
        percent: 80.6,
        status: 'ON TARGET',
        statusClass: 'ad-status--on',
        helper: 'to reaching your 175 goal',
        delta: '+4.1%',
        deltaClass: 'ad-delta--pos',
        color: '#0067b1'
    },
    {
        key: 'aum',
        value: '$249M',
        caption: 'ATTRIBUTED SALES',
        percent: 83,
        status: 'ON TARGET',
        statusClass: 'ad-status--on',
        helper: 'to reaching your $300 goal',
        delta: '+$2.4M',
        deltaClass: 'ad-delta--pos',
        color: '#003d7a'
    },
    {
        key: 'visits',
        value: '1.5M',
        caption: 'WEBSITE VISITS',
        percent: 46.9,
        status: 'OFF TARGET',
        statusClass: 'ad-status--off',
        helper: 'to reaching your 3.2M goal',
        delta: '-1.1K',
        deltaClass: 'ad-delta--neg',
        color: '#d0021b'
    },
    {
        key: 'subs',
        value: '266',
        caption: 'NEW EMAIL SUBSCRIBERS',
        percent: 88.7,
        status: 'ON TARGET',
        statusClass: 'ad-status--on',
        helper: 'to reaching your 300 goal',
        delta: '+17',
        deltaClass: 'ad-delta--pos',
        color: '#009fda'
    }
];

const METRIC_TILES = [
    { key: 'deliv', value: '97.9%', label: 'Deliverability Rate', delta: '+0.3% vs last period', deltaClass: 'ad-delta--pos' },
    { key: 'open', value: '22.5%', label: 'Email Open Rate', delta: '+1.2% vs last period', deltaClass: 'ad-delta--pos' },
    { key: 'click', value: '3.1%', label: 'Email Click Rate', delta: '+0.4% vs last period', deltaClass: 'ad-delta--pos' },
    { key: 'unsub', value: '0.21%', label: 'Unsubscribe Rate', delta: '-0.02% vs last period', deltaClass: 'ad-delta--pos' },
    { key: 'engage', value: '45%', label: 'Consumer Engagement Rate', delta: '+2.1% vs last period', deltaClass: 'ad-delta--pos' }
];

// 12-month leads trend (ties to 141 current leads)
const TREND_MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const TREND_LEADS = [78, 86, 92, 101, 96, 110, 118, 124, 131, 128, 139, 141];

// Attributed sales by quarter (sums to $249M)
const SALES_QUARTERS = [
    { key: 'q1', label: 'Q1', value: 52, display: '$52M' },
    { key: 'q2', label: 'Q2', value: 61, display: '$61M' },
    { key: 'q3', label: 'Q3', value: 68, display: '$68M' },
    { key: 'q4', label: 'Q4', value: 68, display: '$68M' }
];

// Leads by Velo model (sums to 141)
const MODEL_LEADS = [
    { key: 'nova', label: 'Nova', value: 38 },
    { key: 'spark', label: 'Spark', value: 29 },
    { key: 'hawk', label: 'Hawk', value: 22 },
    { key: 'savanna', label: 'Savanna', value: 18 },
    { key: 'crest', label: 'Crest', value: 16 },
    { key: 'aero', label: 'Aero', value: 12 },
    { key: 'tern', label: 'Tern', value: 6 }
];

// Powertrain mix of attributed sales
const POWERTRAIN = [
    { key: 'petrol', label: 'Petrol', percent: 46, color: '#003d7a' },
    { key: 'diesel', label: 'Diesel', percent: 21, color: '#0067b1' },
    { key: 'cng', label: 'CNG', percent: 14, color: '#3a8dd0' },
    { key: 'ev', label: 'EV', percent: 19, color: '#009fda' }
];

// Marketing funnel (widths are visual taper; conv = step conversion)
const FUNNEL = [
    { key: 'impr', label: 'Ad Impressions', value: '4.82M', width: 100, conv: '—' },
    { key: 'visits', label: 'Website Visits', value: '1.52M', width: 80, conv: '31.6%' },
    { key: 'leads', label: 'Qualified Leads', value: '141K', width: 61, conv: '9.3%' },
    { key: 'td', label: 'Test Drives', value: '38.4K', width: 43, conv: '27.2%' },
    { key: 'sales', label: 'Vehicles Sold', value: '9.6K', width: 27, conv: '25.0%' }
];

const EMAIL_CLIENTS = [
    { key: 'outlook', label: 'Outlook', value: 104349 },
    { key: 'iphone', label: 'Apple iPhone', value: 47337 },
    { key: 'gmail', label: 'Gmail', value: 43009 },
    { key: 'applemail', label: 'Apple Mail', value: 28483 }
];

const DEVICE_DATA = [
    { key: 'mobile', label: 'Mobile', percent: 58.41, color: '#0067b1' },
    { key: 'desktop', label: 'Desktop', percent: 22.61, color: '#003d7a' },
    { key: 'tablet', label: 'Tablet', percent: 18.98, color: '#3a8dd0' }
];

const CREATIVE_ROWS = [
    { key: 'n18', creative: 'Nova Festive Drive', sends: '906,956', sales: '$23.1M', clickRate: '2.4%', openRate: '22.2%' },
    { key: 'n22', creative: 'Spark Monsoon Offer', sends: '845,214', sales: '$21.4M', clickRate: '2.1%', openRate: '21.5%' },
    { key: 'n09', creative: 'Hawk Warrior Edition', sends: '793,880', sales: '$19.8M', clickRate: '2.7%', openRate: '23.6%' },
    { key: 'n31', creative: 'Savanna Reclaim Life', sends: '712,065', sales: '$17.2M', clickRate: '1.9%', openRate: '20.1%' },
    { key: 'n14', creative: 'Nova.ev Charge Ahead', sends: '658,432', sales: '$15.9M', clickRate: '3.0%', openRate: '24.8%' },
    { key: 'n27', creative: 'Crest Launch Teaser', sends: '601,778', sales: '$13.6M', clickRate: '2.2%', openRate: '21.9%' }
];

// Trend chart geometry
const T_W = 460;
const T_H = 170;
const T_X0 = 10;
const T_X1 = 450;
const T_Y0 = 14;
const T_Y1 = 140;

export default class De_analyzeDashboard extends LightningElement {
    dateRangeLabel = 'On Going (Jan 1, 2019 - Sep 27, 2026)';
    dataSourceTabs = DATA_SOURCE_TABS;
    metricTiles = METRIC_TILES;
    creativeRows = CREATIVE_ROWS;

    get kpiCards() {
        return KPI_CARDS.map((kpi) => {
            const fillLength = (kpi.percent / 100) * CIRCUMFERENCE;
            return {
                ...kpi,
                dashArray: `${fillLength.toFixed(2)} ${CIRCUMFERENCE.toFixed(2)}`,
                progressStyle: `stroke:${kpi.color};`
            };
        });
    }

    // Leads — 12-month area + line trend
    get leadsTrend() {
        const max = Math.max(...TREND_LEADS) * 1.12;
        const n = TREND_LEADS.length;
        const pts = TREND_LEADS.map((v, i) => {
            const x = T_X0 + (i * (T_X1 - T_X0)) / (n - 1);
            const y = T_Y1 - (v / max) * (T_Y1 - T_Y0);
            return { x, y };
        });
        const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        const area = `${T_X0},${T_Y1} ${line} ${T_X1},${T_Y1}`;
        const dots = pts.map((p, i) => ({ key: `d${i}`, cx: p.x.toFixed(1), cy: p.y.toFixed(1) }));
        const labels = TREND_MONTHS.map((m, i) => ({
            key: `l${i}`,
            label: m,
            x: (T_X0 + (i * (T_X1 - T_X0)) / (n - 1)).toFixed(1)
        }));
        const grid = [0.25, 0.5, 0.75].map((f, i) => ({
            key: `g${i}`,
            y: (T_Y0 + f * (T_Y1 - T_Y0)).toFixed(1)
        }));
        return { viewBox: `0 0 ${T_W} ${T_H}`, line, area, dots, labels, grid, baseY: T_Y1, baseX0: T_X0, baseX1: T_X1 };
    }

    get salesColumns() {
        const max = Math.max(...SALES_QUARTERS.map((q) => q.value)) * 1.1;
        return SALES_QUARTERS.map((q) => ({
            ...q,
            barStyle: `height:${((q.value / max) * 100).toFixed(1)}%;`
        }));
    }

    get modelBars() {
        const max = Math.max(...MODEL_LEADS.map((m) => m.value));
        return MODEL_LEADS.map((m) => ({
            ...m,
            barStyle: `width:${((m.value / max) * 100).toFixed(1)}%;`
        }));
    }

    get powertrainSegments() {
        let cumulative = 0;
        return POWERTRAIN.map((segment) => {
            const length = (segment.percent / 100) * CIRCUMFERENCE;
            const dashArray = `${length.toFixed(2)} ${CIRCUMFERENCE.toFixed(2)}`;
            const dashOffset = -cumulative;
            cumulative += length;
            return {
                ...segment,
                dashArray,
                dashOffset,
                swatchStyle: `background-color:${segment.color};`,
                strokeStyle: `stroke:${segment.color};`,
                displayPercent: `${segment.percent}%`
            };
        });
    }

    get funnelStages() {
        return FUNNEL.map((stage) => ({
            ...stage,
            barStyle: `width:${stage.width}%;`
        }));
    }

    get deviceSegments() {
        let cumulative = 0;
        return DEVICE_DATA.map((segment) => {
            const length = (segment.percent / 100) * CIRCUMFERENCE;
            const dashArray = `${length.toFixed(2)} ${CIRCUMFERENCE.toFixed(2)}`;
            const dashOffset = -cumulative;
            cumulative += length;
            return {
                ...segment,
                dashArray,
                dashOffset,
                swatchStyle: `background-color:${segment.color};`,
                strokeStyle: `stroke:${segment.color};`,
                displayPercent: `${segment.percent.toFixed(2)}%`
            };
        });
    }

    get emailClientBars() {
        const max = Math.max(...EMAIL_CLIENTS.map((c) => c.value));
        return EMAIL_CLIENTS.map((client) => ({
            ...client,
            formattedValue: client.value.toLocaleString('en-US'),
            barStyle: `width:${((client.value / max) * 100).toFixed(1)}%;`
        }));
    }
}
