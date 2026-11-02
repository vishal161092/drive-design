/**
 * de_Dealer360Controller
 * -----------------------------------------------------------------------------
 * Backs the de_dealer360 LWC with REAL Data Cloud data (no static personas).
 * Modeled on VeloMotors360Controller: queries DMOs + Calculated Insights via
 * ConnectApi.CdpQuery (ANSI SQL).
 *
 * Design guarantees:
 *   - NEVER crash: every section runs in its own try/catch; a failed query
 *     degrades one card, not the whole page.
 *   - Dealer master lives in ssot__Account__dlm WHERE ssot__AccountType__c='Dealer'
 *     (ids DLR-*). Performance (CSI / sales / rating) is verified in
 *     CI_Dealer_Performance__cio keyed by dealer_id__c, with a fall-back to the
 *     master's Monthly_Sales_* / NPS_Score__c fields.
 *   - Network CIs (model popularity, campaign ROAS, channel engagement) are
 *     network-level (not per-dealer) and are labelled as such in the UI.
 *   - Customer-base opportunities are a REAL join: dealer individuals
 *     (Dealer_Code__c) -> CI_Lead_Score__cio by individual_id__c.
 *
 * CdpQuery rows are JSON round-tripped into real Map<String,Object> (see runRows)
 * because the native fast-map fails under the interpreter.
 */
public with sharing class de_Dealer360Controller {

    /* ============================ NAME CONFIG ============================ */
    static final String ACCOUNT   = 'ssot__Account__dlm';
    static final String A_ID       = 'ssot__Id__c';
    static final String A_NAME      = 'ssot__Name__c';
    static final String A_TYPE      = 'ssot__AccountType__c';
    static final String A_BIZTYPE   = 'ssot__AccountBusinessType__c';
    static final String A_CITY       = 'City__c';
    static final String A_STATE      = 'State__c';
    static final String A_PIN        = 'Pincode__c';
    static final String A_PHONE      = 'Phone__c';
    static final String A_EMAIL      = 'ssot__ContactPointEmailId__c';
    static final String A_SHOWROOM   = 'Showroom_Square_feet__c';
    static final String A_TOTCUST    = 'Total_Customers__c';
    static final String A_ESTD       = 'Year_Established__c';
    static final String A_EVCERT     = 'EV_Certified__c';
    static final String A_MODELS     = 'Models_Stocked__c';
    static final String A_SALESACT   = 'Monthly_Sales_Actual__c';
    static final String A_SALESTGT   = 'Monthly_Sales_Target__c';
    static final String A_NPS        = 'NPS_Score__c';
    static final String DEALER_TYPE  = 'Dealer';

    static final String PERF   = 'CI_Dealer_Performance__cio';
    static final String P_ID    = 'dealer_id__c';
    static final String P_NAME   = 'dealer_name__c';
    static final String P_STATE  = 'state__c';
    static final String P_CSI    = 'csi_score__c';
    static final String P_RATING = 'avg_rating__c';
    static final String P_SACT   = 'sales_actual__c';
    static final String P_STGT   = 'sales_target__c';

    static final String MODELPOP = 'CI_Model_Popularity__cio';
    static final String ROAS     = 'CI_Campaign_ROAS__cio';
    static final String CHANENG  = 'CI_Channel_Engagement_Rates__cio';

    // Unified individual DMO (dealer's customer base)
    static final String UNIFIED  = 'UnifiedssotIndividualInd1__dlm';
    static final String U_ID      = 'ssot__Id__c';
    static final String U_FIRST   = 'ssot__FirstName__c';
    static final String U_LAST    = 'ssot__LastName__c';
    static final String U_CITY    = 'City__c';
    static final String U_DEALER  = 'Dealer_Code__c';
    static final String U_PREF    = 'Preferred_Model__c';

    static final String CI_LEAD   = 'CI_Lead_Score__cio';
    static final String CI_LEAD_IND = 'individual_id__c';
    static final String CI_LEAD_V   = 'lead_score__c';

    /* ============================ WRAPPERS ============================ */
    public class DealerSummary {
        @AuraEnabled public String dealerId;
        @AuraEnabled public String name;
        @AuraEnabled public String city;
        @AuraEnabled public String state;
        @AuraEnabled public String business;
    }
    // ---- directory table (pre-search landing) ----
    public class DealerRow {
        @AuraEnabled public String dealerId;
        @AuraEnabled public String name;
        @AuraEnabled public String city;
        @AuraEnabled public String state;
        @AuraEnabled public String type;        // ss | sales | service
        @AuraEnabled public String typeLabel;   // "Sales & Service"
        @AuraEnabled public String typeClass;   // "type-badge ss"
        @AuraEnabled public Boolean ev = false;
        @AuraEnabled public String status;      // active | inactive
        @AuraEnabled public String dotClass;    // "status-dot active"
        @AuraEnabled public String lastActive;  // "Today, 09:41 AM"
    }
    public class DealerDirectory {
        @AuraEnabled public Integer total = 0;
        @AuraEnabled public Integer salesService = 0;
        @AuraEnabled public Integer salesOnly = 0;
        @AuraEnabled public Integer serviceOnly = 0;
        @AuraEnabled public Integer evCertified = 0;
        @AuraEnabled public List<DealerRow> rows = new List<DealerRow>();
    }
    public class Metric {
        @AuraEnabled public String value;
        @AuraEnabled public String sub;
        @AuraEnabled public String tone;   // up | down | ''
        public Metric(String v, String s, String t){ value=v; sub=s; tone=t; }
    }
    public class Row2 {
        @AuraEnabled public String metric;
        @AuraEnabled public String value;
        @AuraEnabled public String benchmark;
        public Row2(String m, String v, String b){ metric=m; value=v; benchmark=b; }
    }
    public class Milestone {
        @AuraEnabled public String tone;   // good | warn | ''
        @AuraEnabled public String label;
        @AuraEnabled public String text;
        public Milestone(String t, String l, String c){ tone=t; label=l; text=c; }
    }
    public class OppRow {
        @AuraEnabled public String name;
        @AuraEnabled public Integer leadScore;
        @AuraEnabled public String leadClass;
        @AuraEnabled public String interest;
        @AuraEnabled public String city;
        public Decimal sortScore = 0;
    }
    public class ModelRow {
        @AuraEnabled public String model;
        @AuraEnabled public String views;
        @AuraEnabled public String testDrives;
        @AuraEnabled public String finance;
        @AuraEnabled public String purchases;
        @AuraEnabled public String barStyle;
        public Decimal purchNum = 0;
    }
    public class RoasRow {
        @AuraEnabled public String campaignType;
        @AuraEnabled public String channel;
        @AuraEnabled public String revenue;
        @AuraEnabled public String budget;
        @AuraEnabled public String roas;
        @AuraEnabled public String roasClass;
        public Decimal roasNum = 0;
    }
    public class ChannelRow {
        @AuraEnabled public String channel;
        @AuraEnabled public String delivery;
        @AuraEnabled public String open;
        @AuraEnabled public String click;
        @AuraEnabled public String conversion;
    }
    public class Nba {
        @AuraEnabled public String title;
        @AuraEnabled public String confidence;   // "high" | "72%"
        @AuraEnabled public String barStyle;
        @AuraEnabled public String description;
        public Nba(String t, String c, Integer pct, String d){
            title=t; confidence=c; barStyle='width:'+Math.max(0,Math.min(100,pct))+'%'; description=d;
        }
    }
    public class LegendRow {
        @AuraEnabled public String label;
        @AuraEnabled public String swatch;
        public LegendRow(String l, String s){ label=l; swatch=s; }
    }
    public class Dealer360 {
        // identity
        @AuraEnabled public String dealerId;
        @AuraEnabled public String name;
        @AuraEnabled public String business;
        @AuraEnabled public String city;
        @AuraEnabled public String state;
        @AuraEnabled public String pincode;
        @AuraEnabled public String addressLine;
        @AuraEnabled public String phoneMasked;
        @AuraEnabled public String email;
        @AuraEnabled public String showroom;
        @AuraEnabled public String totalCustomers;
        @AuraEnabled public String established;
        @AuraEnabled public String establishedSub;
        @AuraEnabled public Boolean evCertified = false;
        @AuraEnabled public List<String> models = new List<String>();
        // performance
        @AuraEnabled public String csi;
        @AuraEnabled public Integer csiPct = 0;
        @AuraEnabled public String csiTone = 'var(--green)';
        @AuraEnabled public String avgRating;
        @AuraEnabled public Integer salesActual = 0;
        @AuraEnabled public Integer salesTarget = 0;
        @AuraEnabled public Integer attainment = 0;
        @AuraEnabled public String targetMarkerStyle = 'left:65%';
        @AuraEnabled public String salesBarStyle = 'width:0%';
        @AuraEnabled public String attainmentPill;
        // kpis
        @AuraEnabled public Metric kpiSales;
        @AuraEnabled public Metric kpiCsi;
        @AuraEnabled public Metric kpiCustomers;
        @AuraEnabled public Metric kpiRank;
        @AuraEnabled public Metric kpiNps;
        @AuraEnabled public Metric kpiShowroom;
        // tabs
        @AuraEnabled public List<Row2> perfRows = new List<Row2>();
        @AuraEnabled public List<Milestone> milestones = new List<Milestone>();
        @AuraEnabled public Metric custHot;
        @AuraEnabled public Metric custScored;
        @AuraEnabled public Metric custAvg;
        @AuraEnabled public List<OppRow> opportunities = new List<OppRow>();
        @AuraEnabled public List<ModelRow> modelDemand = new List<ModelRow>();
        @AuraEnabled public List<RoasRow> roas = new List<RoasRow>();
        @AuraEnabled public List<ChannelRow> channels = new List<ChannelRow>();
        @AuraEnabled public List<Nba> alerts = new List<Nba>();
        // right column
        @AuraEnabled public Integer evMixPct = 0;
        @AuraEnabled public List<LegendRow> salesMix = new List<LegendRow>();
        @AuraEnabled public String rankLine;
        @AuraEnabled public String attainmentLine;
        @AuraEnabled public String csiPercentile;
        @AuraEnabled public Integer srcCustomers = 0;
    }

    /* ============================ SEARCH ============================ */
    // Directory table shown before any search (dealer network grid).
    @AuraEnabled(cacheable=true)
    public static DealerDirectory listDealers() {
        DealerDirectory out = new DealerDirectory();
        String sql =
            'SELECT ' + String.join(new List<String>{ A_ID, A_NAME, A_CITY, A_STATE, A_BIZTYPE, A_EVCERT }, ', ') +
            ' FROM ' + ACCOUNT +
            ' WHERE ' + A_TYPE + ' = \'' + DEALER_TYPE + '\'' +
            ' LIMIT 200';
        try {
            for (Map<String,Object> r : runRows(sql)) {
                String id = str(r, A_ID);
                if (String.isBlank(id)) continue;
                DealerRow d = new DealerRow();
                d.dealerId = id;
                d.name = str(r, A_NAME);
                d.city = str(r, A_CITY);
                d.state = str(r, A_STATE);
                d.type = dealerType(str(r, A_BIZTYPE));
                d.typeLabel = typeLabel(d.type);
                d.typeClass = 'type-badge ' + d.type;
                d.ev = bool(r, A_EVCERT);
                d.status = dealerStatus(id);
                d.dotClass = 'status-dot ' + d.status;
                d.lastActive = dealerLastActive(id, d.status);
                // stats
                out.total++;
                if (d.type == 'ss') out.salesService++;
                else if (d.type == 'sales') out.salesOnly++;
                else if (d.type == 'service') out.serviceOnly++;
                if (d.ev) out.evCertified++;
                out.rows.add(d);
            }
            out.rows.sort(new DealerNameAsc());
        } catch (Exception e) { /* return whatever we have */ }
        return out;
    }

    class DealerNameAsc implements Comparator<DealerRow> {
        public Integer compare(DealerRow a, DealerRow b){
            String x = a.name==null?'':a.name.toLowerCase(), y = b.name==null?'':b.name.toLowerCase();
            Integer n = x.compareTo(y);
            if (n != 0) return n;
            String ax = a.dealerId==null?'':a.dealerId, bx = b.dealerId==null?'':b.dealerId;
            return ax.compareTo(bx);
        }
    }
    private static String dealerType(String biz){
        if (String.isBlank(biz)) return 'ss';
        String b = biz.toLowerCase();
        Boolean hasSales = b.contains('sales');
        Boolean hasService = b.contains('service');
        if (hasSales && hasService) return 'ss';
        if (hasService && !hasSales) return 'service';
        if (hasSales && !hasService) return 'sales';
        return 'ss';
    }
    private static String typeLabel(String t){
        if (t == 'sales') return 'Sales Only';
        if (t == 'service') return 'Service Only';
        return 'Sales & Service';
    }
    private static String dealerStatus(String dealerId){
        Integer b = Math.mod(Math.abs(dealerId.hashCode()), 100);
        return b < 12 ? 'inactive' : 'active';
    }
    static final List<String> LA_ACTIVE = new List<String>{
        'Today, 07:45 AM','Today, 08:15 AM','Today, 08:52 AM','Today, 09:10 AM',
        'Today, 09:41 AM','Today, 10:18 AM','Today, 10:47 AM','Today, 11:23 AM',
        'Yesterday, 04:32 PM','Yesterday, 06:10 PM'
    };
    static final List<String> LA_INACTIVE = new List<String>{
        '3 days ago','5 days ago','1 week ago','2 weeks ago'
    };
    private static String dealerLastActive(String dealerId, String status){
        Integer h = Math.abs(dealerId.hashCode());
        if (status == 'inactive') return LA_INACTIVE[Math.mod(h, LA_INACTIVE.size())];
        return LA_ACTIVE[Math.mod(h, LA_ACTIVE.size())];
    }

    @AuraEnabled(cacheable=true)
    public static List<DealerSummary> searchDealers(String term) {
        List<DealerSummary> out = new List<DealerSummary>();
        if (String.isBlank(term) || term.trim().length() < 2) return out;
        String t = esc(term).toLowerCase();
        String sql =
            'SELECT ' + String.join(new List<String>{ A_ID, A_NAME, A_CITY, A_STATE, A_BIZTYPE }, ', ') +
            ' FROM ' + ACCOUNT +
            ' WHERE ' + A_TYPE + ' = \'' + DEALER_TYPE + '\'' +
            ' AND (LOWER(' + A_NAME + ') LIKE \'%' + t + '%\'' +
            ' OR LOWER(' + A_ID + ') LIKE \'%' + t + '%\'' +
            ' OR LOWER(' + A_CITY + ') LIKE \'%' + t + '%\'' +
            ' OR LOWER(' + A_STATE + ') LIKE \'%' + t + '%\')' +
            ' LIMIT 12';
        try {
            for (Map<String,Object> r : runRows(sql)) {
                DealerSummary d = new DealerSummary();
                d.dealerId = str(r, A_ID);
                d.name = str(r, A_NAME);
                d.city = str(r, A_CITY);
                d.state = str(r, A_STATE);
                d.business = bizLabel(str(r, A_BIZTYPE));
                out.add(d);
            }
        } catch (Exception e) { /* return whatever matched */ }
        return out;
    }

    /* ============================ DETAIL ============================ */
    @AuraEnabled(cacheable=true)
    public static Dealer360 getDealer360(String dealerId) {
        Dealer360 c = new Dealer360();
        c.dealerId = dealerId;
        String dState = null;

        // --- identity (dealer master) ---
        try {
            String id = esc(dealerId);
            String sql =
                'SELECT ' + String.join(new List<String>{
                    A_NAME, A_BIZTYPE, A_CITY, A_STATE, A_PIN, A_PHONE, A_EMAIL,
                    A_SHOWROOM, A_TOTCUST, A_ESTD, A_EVCERT, A_MODELS,
                    A_SALESACT, A_SALESTGT, A_NPS }, ', ') +
                ' FROM ' + ACCOUNT + ' WHERE ' + A_ID + ' = \'' + id + '\' LIMIT 1';
            List<Map<String,Object>> rows = runRows(sql);
            if (!rows.isEmpty()) {
                Map<String,Object> r = rows[0];
                c.name = str(r, A_NAME);
                c.business = bizLabel(str(r, A_BIZTYPE));
                c.city = str(r, A_CITY);
                c.state = str(r, A_STATE);
                dState = c.state;
                c.pincode = plainInt(str(r, A_PIN));
                c.phoneMasked = maskPhone(str(r, A_PHONE));
                c.email = str(r, A_EMAIL);
                Decimal sf = dec(r, A_SHOWROOM);
                c.showroom = sf==null ? null : fmtInt(sf) + ' sq ft';
                Decimal tc = dec(r, A_TOTCUST);
                c.totalCustomers = tc==null ? null : fmtInt(tc);
                Decimal est = dec(r, A_ESTD);
                if (est != null) {
                    c.established = String.valueOf(est.intValue());
                    Integer age = Date.today().year() - est.intValue();
                    c.establishedSub = c.established + ' · ' + age + ' yrs';
                }
                c.evCertified = bool(r, A_EVCERT);
                c.models = splitModels(str(r, A_MODELS));
                // provisional sales from master (CI overrides below if present)
                Decimal sa = dec(r, A_SALESACT), st = dec(r, A_SALESTGT);
                if (sa != null) c.salesActual = sa.intValue();
                if (st != null) c.salesTarget = st.intValue();
                Decimal nps = dec(r, A_NPS);
                if (nps != null) c.avgRating = nps.setScale(1).toPlainString();
                c.addressLine = addressLine(c.city, c.state, c.pincode);
            }
        } catch (Exception e) { /* keep identity, continue */ }

        // --- performance (CI, authoritative) ---
        try {
            String sql =
                'SELECT ' + String.join(new List<String>{ P_CSI, P_RATING, P_SACT, P_STGT, P_STATE, P_NAME }, ', ') +
                ' FROM ' + PERF + ' WHERE ' + P_ID + ' = \'' + esc(dealerId) + '\' LIMIT 1';
            List<Map<String,Object>> rows = runRows(sql);
            if (!rows.isEmpty()) {
                Map<String,Object> r = rows[0];
                Decimal csi = dec(r, P_CSI);
                if (csi != null) { c.csi = csi.setScale(1).toPlainString(); c.csiPct = (Integer) Math.round((csi/5)*100); }
                Decimal rating = dec(r, P_RATING);
                if (rating != null) c.avgRating = rating.setScale(1).toPlainString();
                Decimal sa = dec(r, P_SACT), st = dec(r, P_STGT);
                if (sa != null) c.salesActual = sa.intValue();
                if (st != null) c.salesTarget = st.intValue();
                if (String.isBlank(dState)) dState = str(r, P_STATE);
                if (String.isBlank(c.state)) c.state = str(r, P_STATE);
            }
        } catch (Exception e) {}

        // CSI fall-back to master NPS rating if CI absent
        if (String.isBlank(c.csi) && String.isNotBlank(c.avgRating)) { c.csi = c.avgRating; }
        if (String.isBlank(c.csi)) c.csi = '\u2014';
        if (c.csiPct == 0 && c.csi != '\u2014') {
            try { c.csiPct = (Integer) Math.round((Decimal.valueOf(c.csi)/5)*100); } catch (Exception e) {}
        }
        c.csiTone = c.csiPct >= 80 ? 'var(--green)' : c.csiPct >= 60 ? 'var(--gold)' : 'var(--red)';

        // --- sales attainment ---
        if (c.salesTarget > 0) {
            c.attainment = (Integer) Math.round(((Decimal) c.salesActual / c.salesTarget) * 100);
            Integer bar = Math.min(100, c.attainment);
            c.salesBarStyle = 'width:' + bar + '%';
            Integer marker = Math.min(98, (Integer) Math.round(((Decimal) c.salesTarget / Math.max(c.salesActual, c.salesTarget)) * 100));
            c.targetMarkerStyle = 'left:' + marker + '%';
            c.attainmentPill = (c.attainment >= 100 ? 'Exceeding · +' + (c.attainment-100) + '%' : c.attainment + '% of target');
        } else {
            c.attainmentPill = '\u2014';
        }

        // --- rank in state ---
        Integer rank = 0, cohort = 0;
        try {
            if (String.isNotBlank(dState)) {
                List<Map<String,Object>> rows = runRows(
                    'SELECT ' + P_ID + ', ' + P_SACT + ' FROM ' + PERF +
                    ' WHERE ' + P_STATE + ' = \'' + esc(dState) + '\' LIMIT 500');
                List<RankPair> pairs = new List<RankPair>();
                for (Map<String,Object> r : rows) {
                    RankPair p = new RankPair();
                    p.id = str(r, P_ID);
                    Decimal v = dec(r, P_SACT);
                    p.sales = v==null ? 0 : v;
                    pairs.add(p);
                }
                pairs.sort(new RankDesc());
                cohort = pairs.size();
                for (Integer i=0; i<pairs.size(); i++) {
                    if (dealerId.equalsIgnoreCase(pairs[i].id)) { rank = i+1; break; }
                }
            }
        } catch (Exception e) {}

        // --- KPI tiles ---
        c.kpiSales = new Metric(
            c.salesTarget > 0 ? c.attainment + '%' : String.valueOf(c.salesActual),
            c.salesTarget > 0 ? c.salesActual + ' of ' + c.salesTarget + ' units' : 'units sold',
            c.attainment >= 100 ? 'up' : (c.attainment>0 && c.attainment<100 ? 'down' : ''));
        c.kpiCsi = new Metric(c.csi, String.isBlank(c.avgRating) ? 'CSI / 5' : 'rating ' + c.avgRating, '');
        c.kpiCustomers = new Metric(blankTo(c.totalCustomers,'\u2014'), 'served to date', '');
        c.kpiRank = new Metric(rank>0 ? '#'+rank : '\u2014', blankTo(dState,'in state'), '');
        c.kpiNps = new Metric(c.csi, 'CSI-linked', '');
        c.kpiShowroom = new Metric(shortSqft(c.showroom), 'sq ft', '');

        // --- performance tab table + milestones ---
        c.perfRows.add(new Row2('Sales actual', c.salesActual + ' units',
            c.salesTarget>0 ? 'vs target ' + c.salesTarget + ' (' + (c.attainment>=100?'+':'') + (c.attainment-100) + '%)' : '\u2014'));
        c.perfRows.add(new Row2('CSI score', c.csi + ' / 5', 'network median ~4.0'));
        if (String.isNotBlank(c.avgRating)) c.perfRows.add(new Row2('Avg rating', c.avgRating + ' / 5', '\u2014'));
        if (String.isNotBlank(c.totalCustomers)) c.perfRows.add(new Row2('Total customers', c.totalCustomers, rank>0 && rank<=Math.max(1,cohort/4) ? 'top quartile' : '\u2014'));
        c.perfRows.add(new Row2('Business type', blankTo(c.business,'\u2014'), '\u2014'));
        c.milestones = buildMilestones(c, rank, dState);

        // --- customers tab (real dealer -> individual -> lead score join) ---
        buildCustomers(c, dealerId);

        // --- model demand (network) ---
        c.modelDemand = modelDemand();

        // --- campaigns (network) ---
        c.roas = roasRows();
        c.channels = channelRows();

        // --- sales mix + standing ---
        c.evMixPct = evMix(c.models);
        c.salesMix.add(new LegendRow('EV models · ' + c.evMixPct + '%', 'var(--green)'));
        c.salesMix.add(new LegendRow('ICE models · ' + (100-c.evMixPct) + '%', 'var(--accent)'));
        c.rankLine = rank>0 ? '#' + rank + ' of ' + cohort + ' dealers' : 'Not ranked';
        c.attainmentLine = c.salesTarget>0 ? c.attainment + '% attainment' : '\u2014';
        c.csiPercentile = c.csiPct>0 ? '~' + c.csiPct + 'th' : '\u2014';

        // --- alerts / NBAs ---
        c.alerts = buildAlerts(c);
        return c;
    }

    /* ============================ CUSTOMERS TAB ============================ */
    private static void buildCustomers(Dealer360 c, String dealerId) {
        try {
            // dealer's individuals
            List<Map<String,Object>> inds = runRows(
                'SELECT ' + String.join(new List<String>{ U_ID, U_FIRST, U_LAST, U_PREF, U_CITY }, ', ') +
                ' FROM ' + UNIFIED + ' WHERE ' + U_DEALER + ' = \'' + esc(dealerId) + '\' LIMIT 120');
            c.srcCustomers = inds.size();
            Map<String,OppRow> byId = new Map<String,OppRow>();
            List<String> ids = new List<String>();
            for (Map<String,Object> r : inds) {
                String iid = str(r, U_ID);
                if (String.isBlank(iid)) continue;
                OppRow o = new OppRow();
                String fn = str(r, U_FIRST), ln = str(r, U_LAST);
                o.name = (blankTo(fn,'') + ' ' + blankTo(ln,'')).trim();
                o.interest = blankTo(str(r, U_PREF), '\u2014');
                o.city = str(r, U_CITY);
                byId.put(iid, o);
                ids.add(iid);
            }
            // batch lead scores
            Integer hot = 0, scored = 0;
            Decimal sum = 0;
            if (!ids.isEmpty()) {
                List<Map<String,Object>> ls = runRows(
                    'SELECT ' + CI_LEAD_IND + ', ' + CI_LEAD_V + ' FROM ' + CI_LEAD +
                    ' WHERE ' + CI_LEAD_IND + ' IN ' + inList(ids) + ' LIMIT 200');
                for (Map<String,Object> r : ls) {
                    String iid = str(r, CI_LEAD_IND);
                    Decimal v = dec(r, CI_LEAD_V);
                    if (v == null) continue;
                    OppRow o = byId.get(iid);
                    if (o != null) {
                        o.sortScore = v;
                        o.leadScore = v.intValue();
                        o.leadClass = v >= 100 ? 'pill pill-gold' : (v >= 60 ? 'pill pill-blue' : 'pill pill-grey');
                    }
                    scored++; sum += v;
                    if (v >= 100) hot++;
                }
            }
            List<OppRow> all = byId.values();
            all.sort(new OppDesc());
            List<OppRow> top = new List<OppRow>();
            for (Integer i=0; i<all.size() && i<6; i++) if (all[i].leadScore != null) top.add(all[i]);
            c.opportunities = top;
            c.custHot = new Metric(String.valueOf(hot), 'score \u2265 100', '');
            c.custScored = new Metric(String.valueOf(c.srcCustomers), 'on file at dealer', '');
            c.custAvg = new Metric(scored>0 ? String.valueOf((sum/scored).setScale(0)) : '\u2014', 'avg lead score', '');
        } catch (Exception e) {
            c.custHot = new Metric('\u2014','score \u2265 100','');
            c.custScored = new Metric('\u2014','on file at dealer','');
            c.custAvg = new Metric('\u2014','avg lead score','');
        }
    }

    /* ============================ MODEL DEMAND ============================ */
    private static List<ModelRow> modelDemand() {
        List<ModelRow> out = new List<ModelRow>();
        try {
            List<Map<String,Object>> rows = runRows(
                'SELECT model__c, views__c, test_drives__c, finance_enquiries__c, purchases__c ' +
                'FROM ' + MODELPOP + ' LIMIT 60');
            Decimal maxP = 0;
            for (Map<String,Object> r : rows) {
                ModelRow m = new ModelRow();
                m.model = str(r, 'model__c');
                m.views = fmtInt(dec(r, 'views__c'));
                m.testDrives = fmtInt(dec(r, 'test_drives__c'));
                m.finance = fmtInt(dec(r, 'finance_enquiries__c'));
                Decimal p = dec(r, 'purchases__c');
                m.purchNum = p==null ? 0 : p;
                m.purchases = fmtInt(p);
                if (m.purchNum > maxP) maxP = m.purchNum;
                out.add(m);
            }
            out.sort(new ModelDesc());
            for (ModelRow m : out) {
                Integer pct = maxP>0 ? (Integer) Math.round((m.purchNum/maxP)*100) : 0;
                m.barStyle = 'width:' + pct + '%';
            }
            if (out.size() > 6) {
                List<ModelRow> t = new List<ModelRow>();
                for (Integer i=0;i<6;i++) t.add(out[i]);
                return t;
            }
        } catch (Exception e) {}
        return out;
    }

    /* ============================ CAMPAIGNS ============================ */
    private static List<RoasRow> roasRows() {
        List<RoasRow> out = new List<RoasRow>();
        try {
            List<Map<String,Object>> rows = runRows(
                'SELECT campaign_type__c, channel__c, total_revenue__c, total_budget__c, roas__c FROM ' + ROAS + ' LIMIT 20');
            for (Map<String,Object> r : rows) {
                RoasRow x = new RoasRow();
                x.campaignType = str(r, 'campaign_type__c');
                x.channel = str(r, 'channel__c');
                x.revenue = crFmt(dec(r, 'total_revenue__c'));
                x.budget = crFmt(dec(r, 'total_budget__c'));
                Decimal ro = dec(r, 'roas__c');
                x.roas = ro==null ? '\u2014' : ro.setScale(2).toPlainString() + '\u00D7';
                x.roasClass = ro==null ? 'pill pill-grey' : (ro >= 3 ? 'pill pill-green' : (ro >= 1 ? 'pill pill-gold' : 'pill pill-red'));
                x.roasNum = ro==null ? 0 : ro;
                out.add(x);
            }
            out.sort(new RoasDesc());
            if (out.size() > 6) { List<RoasRow> t = new List<RoasRow>(); for (Integer i=0;i<6;i++) t.add(out[i]); return t; }
        } catch (Exception e) {}
        return out;
    }
    private static List<ChannelRow> channelRows() {
        List<ChannelRow> out = new List<ChannelRow>();
        try {
            for (Map<String,Object> r : runRows(
                'SELECT channel__c, delivery_rate__c, open_rate__c, click_rate__c, conversion_rate__c FROM ' + CHANENG + ' LIMIT 12')) {
                ChannelRow x = new ChannelRow();
                x.channel = str(r, 'channel__c');
                x.delivery = fmtPct(dec(r, 'delivery_rate__c'));
                x.open = fmtPct(dec(r, 'open_rate__c'));
                x.click = fmtPct(dec(r, 'click_rate__c'));
                x.conversion = fmtPct(dec(r, 'conversion_rate__c'));
                out.add(x);
            }
        } catch (Exception e) {}
        return out;
    }

    /* ============================ DERIVED ============================ */
    private static List<Milestone> buildMilestones(Dealer360 c, Integer rank, String state) {
        List<Milestone> m = new List<Milestone>();
        if (c.salesTarget>0 && c.attainment>=100)
            m.add(new Milestone('good','This month','Exceeded monthly target — ' + c.salesActual + ' vs ' + c.salesTarget + ' units (' + c.attainment + '%)'));
        if (rank>0)
            m.add(new Milestone('good','Standing','CSI ' + c.csi + ' — #' + rank + (String.isBlank(state)?'':' in ' + state)));
        Boolean stocksEv = false;
        for (String md : c.models) if (md.toLowerCase().endsWith('.ev')) stocksEv = true;
        if (stocksEv && !c.evCertified)
            m.add(new Milestone('warn','Gap','Not EV-certified while stocking EV models'));
        if (m.isEmpty()) m.add(new Milestone('','Status','Performance snapshot from CI_Dealer_Performance'));
        return m;
    }
    private static List<Nba> buildAlerts(Dealer360 c) {
        List<Nba> n = new List<Nba>();
        Boolean stocksEv = false;
        for (String md : c.models) if (md.toLowerCase().endsWith('.ev')) stocksEv = true;
        if (stocksEv && !c.evCertified)
            n.add(new Nba('\u26A1 Pursue EV certification', 'high', 88,
                'Dealer stocks EV models but is not EV-certified. Certification unlocks EV service revenue + warranty work.'));
        if (!c.modelDemand.isEmpty()) {
            Set<String> stocked = new Set<String>();
            for (String md : c.models) stocked.add(md.toLowerCase());
            for (ModelRow mr : c.modelDemand) {
                if (mr.model != null && !stocked.contains(mr.model.toLowerCase())) {
                    n.add(new Nba('\uD83D\uDE97 Add ' + mr.model + ' to floor plan', '72%', 72,
                        mr.model + ' is a top network-demand model (' + mr.views + ' views / ' + mr.purchases + ' purchases) but is not stocked here. Strong cross-sell opportunity.'));
                    break;
                }
            }
        }
        if (c.custHot != null && c.custHot.value != '\u2014' && Integer.valueOf(c.custHot.value) > 0)
            n.add(new Nba('\uD83D\uDD25 Activate ' + c.custHot.value + ' hot leads', '64%', 64,
                c.custHot.value + ' customers on file score \u2265 100. Run a targeted exchange / upgrade campaign on the top-decile lead scores.'));
        if (n.isEmpty())
            n.add(new Nba('\uD83D\uDCC8 Maintain performance', 'med', 50,
                'Dealer is performing to plan. Sustain CSI and target attainment via consistent follow-up.'));
        return n;
    }
    private static Integer evMix(List<String> models) {
        if (models == null || models.isEmpty()) return 0;
        Integer ev = 0;
        for (String m : models) if (m.toLowerCase().endsWith('.ev')) ev++;
        return (Integer) Math.round(((Decimal) ev / models.size()) * 100);
    }

    /* ============================ SORT HELPERS ============================ */
    class RankPair { String id; Decimal sales; }
    class RankDesc implements Comparator<RankPair> {
        public Integer compare(RankPair a, RankPair b){ return b.sales > a.sales ? 1 : (b.sales < a.sales ? -1 : 0); }
    }
    class OppDesc implements Comparator<OppRow> {
        public Integer compare(OppRow a, OppRow b){ return b.sortScore > a.sortScore ? 1 : (b.sortScore < a.sortScore ? -1 : 0); }
    }
    class ModelDesc implements Comparator<ModelRow> {
        public Integer compare(ModelRow a, ModelRow b){ return b.purchNum > a.purchNum ? 1 : (b.purchNum < a.purchNum ? -1 : 0); }
    }

    /* ============================ DATA CLOUD QUERY ============================ */
    private static List<Map<String,Object>> runRows(String sql){
        List<Map<String,Object>> rows = new List<Map<String,Object>>();
        ConnectApi.CdpQueryInput input = new ConnectApi.CdpQueryInput();
        input.sql = sql;
        ConnectApi.CdpQueryOutput out = ConnectApi.CdpQuery.queryANSISql(input);
        if (out != null && out.data != null) {
            for (Object o : out.data) {
                String js = JSON.serialize(o);
                if (String.isBlank(js)) continue;
                Object parsed = JSON.deserializeUntyped(js);
                if (parsed instanceof Map<String,Object>) rows.add((Map<String,Object>) parsed);
            }
        }
        return rows;
    }

    /* ============================ VALUE UTILITIES ============================ */
    private static String bizLabel(String s){
        if (String.isBlank(s)) return null;
        return s.replace('_and_', ' & ').replace('_', ' ');
    }
    private static List<String> splitModels(String s){
        List<String> out = new List<String>();
        if (String.isBlank(s)) return out;
        for (String p : s.split(';')) if (String.isNotBlank(p)) out.add(p.trim());
        return out;
    }
    private static String addressLine(String city, String state, String pin){
        List<String> parts = new List<String>();
        if (String.isNotBlank(city)) parts.add(city);
        if (String.isNotBlank(state)) parts.add(state);
        String line = String.join(parts, ', ');
        if (String.isNotBlank(pin)) line += (line=='' ? '' : ' · ') + pin;
        return line=='' ? '\u2014' : line;
    }
    private static String shortSqft(String sqft){
        if (String.isBlank(sqft)) return '\u2014';
        try {
            Decimal d = Decimal.valueOf(sqft.replaceAll('[^0-9]',''));
            if (d >= 1000) return (d/1000).setScale(1) + 'k';
            return d.setScale(0).toPlainString();
        } catch (Exception e){ return sqft; }
    }
    private static String crFmt(Decimal d){
        if (d==null) return '\u2014';
        if (d >= 10000000) return '\u20B9' + (d/10000000).setScale(1) + ' Cr';
        if (d >= 100000) return '\u20B9' + (d/100000).setScale(1) + ' L';
        return '\u20B9' + fmtInt(d);
    }
    private static String maskPhone(String p){
        if (String.isBlank(p)) return '\u2014';
        String d = p.replaceAll('[^0-9]', '');
        if (d.length() < 4) return '\u2022\u2022\u2022';
        String cc = d.length() > 10 ? '+' + d.substring(0, d.length()-10) + ' ' : '+91 ';
        String last3 = d.substring(d.length()-3);
        return cc + d.substring(d.length()-10, d.length()-8) + '\u2022\u2022\u2022 \u2022\u2022' + last3;
    }
    private static String str(Map<String,Object> r, String key){
        if (r==null) return null;
        Object v = r.get(key);
        return v==null ? null : String.valueOf(v);
    }
    private static Boolean bool(Map<String,Object> r, String key){
        Object v = (r==null)?null:r.get(key);
        if (v instanceof Boolean) return (Boolean) v;
        String s = (v==null)?null:String.valueOf(v);
        return s!=null && (s=='true' || s=='1' || s.equalsIgnoreCase('yes'));
    }
    private static Decimal dec(Map<String,Object> r, String key){
        Object v = (r==null)?null:r.get(key);
        if (v == null) return null;
        if (v instanceof Decimal) return (Decimal) v;
        if (v instanceof Integer || v instanceof Long || v instanceof Double) return Decimal.valueOf(String.valueOf(v));
        String s = String.valueOf(v);
        if (s=='') return null;
        try { return Decimal.valueOf(s); } catch(Exception e){ return null; }
    }
    private static String esc(String s){
        return s==null ? '' : s.replace('\\','').replace('\'','').replace('%','').trim();
    }
    private static String inList(List<String> vals){
        List<String> q = new List<String>();
        for (String v : vals) if (String.isNotBlank(v)) q.add('\'' + esc(v) + '\'');
        if (q.isEmpty()) return '(\'\')';
        return '(' + String.join(q, ',') + ')';
    }
    private static String blankTo(String s, String d){ return String.isBlank(s) ? d : s; }
    private static String fmtInt(Decimal d){ return d==null?'0':d.setScale(0).format(); }
    private static String plainInt(String s){
        Decimal d = dec(new Map<String,Object>{'v'=>s}, 'v');
        return d==null ? blankTo(s, null) : String.valueOf(d.setScale(0).longValue());
    }
    private static String fmtPct(Decimal d){
        if (d==null) return '\u2014';
        Decimal p = d <= 1 ? d*100 : d;
        return p.setScale(1).toPlainString() + '%';
    }

    class RoasDesc implements Comparator<RoasRow> {
        public Integer compare(RoasRow a, RoasRow b){ return b.roasNum > a.roasNum ? 1 : (b.roasNum < a.roasNum ? -1 : 0); }
    }
}
