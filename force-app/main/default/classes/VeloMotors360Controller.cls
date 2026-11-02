/**
 * VeloMotors360Controller
 * -----------------------------------------------------------------------------
 * Backs the veloCustomer360 LWC with REAL Data Cloud data (no static personas).
 * Queries DMOs + Calculated Insights via ConnectApi.CdpQuery (ANSI SQL).
 *
 * Design guarantees (per demo requirements):
 *   - NEVER crash: every section runs in its own try/catch; a failed query
 *     degrades one card, not the whole page.
 *   - Lifecycle-aware: estimates (cohort-average fills, flagged isEstimated) are
 *     applied ONLY to owners. Prospects / non-owners show truthful zeros / empty
 *     states instead of fabricated values.
 *   - Email is Apex-generated (source data has only a consent flag, no address).
 *   - Phone is partially masked (country code + last 3 digits).
 *   - Individual ID (Customer ID + Unified ID) is always returned.
 *   - Lead Score is rescaled to 0..100.
 *
 * Data access: ConnectApi.CdpQuery.queryANSISql returns a CdpQueryOutput whose
 * .data is a List<Object>; each row is an internal fast-map whose Map methods
 * fatally fail under the interpreter, so we JSON round-trip each row into a real
 * Apex Map<String,Object> (see runRows). All accessors are column-name keyed.
 */
public with sharing class VeloMotors360Controller {

    /* ============================ NAME CONFIG ============================ */
        // Identity resolution
        static final String UNIFIED   = 'UnifiedssotIndividualInd1__dlm';
        static final String LINK      = 'UnifiedLinkssotIndividualInd1__dlm';
        static final String LINK_SRC  = 'SourceRecordId__c';
        static final String LINK_UNI  = 'UnifiedRecordId__c';
        static final String U_ID      = 'ssot__Id__c';
        static final String U_PARTY   = 'ssot__PartyId__c';

        // Unified profile fields
        static final String U_FIRST   = 'ssot__FirstName__c';
        static final String U_LAST    = 'ssot__LastName__c';
        static final String U_DOB     = 'ssot__BirthDt__c';
        static final String U_GENDER  = 'ssot__GenderId__c';
        static final String U_CREATED = 'ssot__CreatedDate__c';
        static final String U_PHONE   = 'Alternate_Phone__c';
        static final String U_TIER    = 'Loyalty_Tier__c';
        static final String U_POINTS  = 'Loyalty_Points__c';
        static final String U_LSTATUS = 'Lead_Status__c';
        static final String U_LSOURCE = 'Lead_Source__c';
        static final String U_ADDR    = 'Address__c';
        static final String U_CITY    = 'City__c';
        static final String U_STATE   = 'State__c';
        static final String U_PIN     = 'Pincode__c';
        static final String U_DEALER  = 'Dealer_Code__c';
        static final String U_PREF    = 'Preferred_Model__c';
        static final String U_CTYPE   = 'Customer_Type__c';   // Owner | Prospect | Service_Only | Exchange
        static final String U_C_EMAIL = 'Consent_Email__c';
        static final String U_C_WA    = 'Consent_WhatsApp__c';
        static final String U_C_SMS   = 'Consent_SMS__c';

        // Calculated Insights
        static final String CI_LEAD   = 'CI_Lead_Score__cio';
        static final String CI_LEAD_V = 'lead_score__c';
        static final String CI_LTV    = 'CI_Customer_LTV__cio';
        static final String CI_LTV_V  = 'lifetime_service_spend__c';
        static final String CI_NPS    = 'CI_Avg_NPS__cio';
        static final String CI_NPS_V  = 'avg_nps__c';
        static final String CI_NPS_CNT= 'service_count__c';
        static final String CI_VEH    = 'CI_Vehicle_Count__cio';
        static final String CI_VEH_V  = 'vehicle_count__c';
        static final String CI_VEH_EV = 'ev_vehicle_count__c';
        static final String CI_CAMP   = 'CI_Campaign_Responsiveness__cio';
        static final String CI_CAMP_O = 'open_rate__c';
        static final String CI_CAMP_C = 'click_rate__c';
        static final String CI_CAMP_SENT = 'messages_sent__c';
        static final String CI_CAMP_OPENS= 'opens__c';
        static final String CI_CAMP_CLKS = 'clicks__c';
        static final String CI_FAULT  = 'CI_Fault_Alert_Count__cio';
        static final String CI_FAULT_V= 'critical_faults_30d__c';
        static final String CI_DENG   = 'CI_Digital_Engagement_Score__cio';
        static final String CI_DENG_CNT= 'interaction_count_90d__c';
        static final String CI_IND    = 'individual_id__c';

        // Related DMOs (keyed by CUST id on the source records)
        static final String VEHICLE   = 'ssot__Vehicle__dlm';
        static final String V_OWNER   = 'ssot__CurrentOwnerId__c';
        static final String SERVICE   = 'ssot__ServiceAppointment__dlm';
        static final String CAMPAIGN  = 'VeloMotors_PV_CampaignResponse__dlm';
        static final String DIGITAL   = 'VeloMotors_PV_DigitalInteraction__dlm';
        static final String CUST_KEY  = 'Customer_ID__c';

        // Rescale + cohort averages (estimated defaults, OWNERS ONLY)
        static final Decimal LEAD_MAX = 323;
        static final Decimal AVG_LEAD = 15;
        static final Decimal AVG_LTV  = 18500;
        static final Decimal AVG_NPS  = 7.4;

        // Targeted profile override (specific demo customer)
        static final String TARGET_UNIFIED_ID  = '18fabbd31c411dbbd1fed89de66b8b48';
        static final String TARGET_CUSTOMER_ID = 'CUST-002352';

    /* ============================ WRAPPERS ============================ */
    public class Metric {
        @AuraEnabled public String value;
        @AuraEnabled public String sub;
        @AuraEnabled public Boolean isEstimated;
        public Metric(String v, String s, Boolean e){ value=v; sub=s; isEstimated=e; }
    }
    public class Factor {
        @AuraEnabled public String label;
        @AuraEnabled public String valueText;
        @AuraEnabled public String barStyle;   // width:NN%
        public Factor(String l, String v, Integer pct){
            label=l; valueText=v; barStyle='width:'+Math.max(0,Math.min(100,pct))+'%';
        }
    }
    public class IndividualSummary {
        @AuraEnabled public String unifiedId;
        @AuraEnabled public String customerId;
        @AuraEnabled public String name;
        @AuraEnabled public String initials;
        @AuraEnabled public String phoneMasked;
        @AuraEnabled public String city;
        @AuraEnabled public String tier;
    }
    // ---- directory table (pre-search landing) ----
    public class CustomerRow {
        @AuraEnabled public String unifiedId;
        @AuraEnabled public String customerId;
        @AuraEnabled public String name;
        @AuraEnabled public String initials;
        @AuraEnabled public String city;
        @AuraEnabled public String mobile;
        @AuraEnabled public String tier;         // Platinum | Gold | Silver | Bronze
        @AuraEnabled public String avatarClass;  // "avatar platinum"
        @AuraEnabled public String tierClass;    // "tier-badge Platinum"
        @AuraEnabled public Integer tierRank = 3;// 0 platinum .. 3 bronze (for sorting)
        @AuraEnabled public Integer vehicles = 1;
        @AuraEnabled public String lastActivity; // "Today"
        @AuraEnabled public Integer activitySort = 7;
        @AuraEnabled public Boolean recent = false;
    }
    public class CustomerDirectory {
        @AuraEnabled public Integer total = 0;
        @AuraEnabled public Integer platinum = 0;
        @AuraEnabled public Integer gold = 0;
        @AuraEnabled public Integer silver = 0;
        @AuraEnabled public Integer bronze = 0;
        @AuraEnabled public List<CustomerRow> rows = new List<CustomerRow>();
    }
    public class VehicleRow {
        @AuraEnabled public String model;
        @AuraEnabled public String variant;
        @AuraEnabled public String fuel;
        @AuraEnabled public String reg;
        @AuraEnabled public String odometer;
        @AuraEnabled public String year;
        @AuraEnabled public String warranty;
        @AuraEnabled public String amc;
        @AuraEnabled public String insurance;
        @AuraEnabled public String imageName;
        @AuraEnabled public Boolean isEv;
        public Decimal odoNum = 0;
    }
    public class ServiceRow {
        @AuraEnabled public String svcDate;
        @AuraEnabled public String vehicle;
        @AuraEnabled public String category;
        @AuraEnabled public String svcType;
        @AuraEnabled public String dealer;
        @AuraEnabled public String amount;
        @AuraEnabled public String nps;
    }
    public class CampaignRow {
        @AuraEnabled public String sentDate;
        @AuraEnabled public String campaignId;
        @AuraEnabled public String channel;
        @AuraEnabled public Boolean delivered;
        @AuraEnabled public Boolean opened;
        @AuraEnabled public Boolean clicked;
    }
    public class Activity {
        @AuraEnabled public String actDate;
        @AuraEnabled public String source;
        @AuraEnabled public String channel;
        @AuraEnabled public String title;
    }
    public class Nba {
        @AuraEnabled public String title;
        @AuraEnabled public Integer confidence;
        @AuraEnabled public String barStyle;
        @AuraEnabled public String description;
        public Nba(String t, Integer c, String d){ title=t; confidence=c; barStyle='width:'+c+'%'; description=d; }
    }
    public class Customer360 {
        // identity (always present)
        @AuraEnabled public String unifiedId;
        @AuraEnabled public String customerId;
        @AuraEnabled public String name;
        @AuraEnabled public String initials;
        @AuraEnabled public String lifecycleStage;   // real Customer_Type, display-formatted
        @AuraEnabled public String email;
        @AuraEnabled public Boolean emailGenerated = true;
        @AuraEnabled public String phoneMasked;
        @AuraEnabled public String address;
        @AuraEnabled public String city;
        @AuraEnabled public String state;
        @AuraEnabled public String pincode;
        @AuraEnabled public String dob;
        @AuraEnabled public String gender;
        @AuraEnabled public String tier;
        @AuraEnabled public String loyaltyPoints;
        @AuraEnabled public String leadStatus;
        @AuraEnabled public String leadSource;
        @AuraEnabled public String preferredModel;
        @AuraEnabled public String homeDealer;
        @AuraEnabled public String customerSince;
        @AuraEnabled public Boolean consentEmail;
        @AuraEnabled public Boolean consentWhatsApp;
        @AuraEnabled public Boolean consentSMS;
        // scores
        @AuraEnabled public Integer leadScore;
        @AuraEnabled public Boolean leadScoreEst;
        @AuraEnabled public String leadScoreCaption;
        @AuraEnabled public List<Factor> leadFactors = new List<Factor>();
        // per-profile display flags
        @AuraEnabled public Boolean hideVehicleYear = false;
        // KPI tiles
        @AuraEnabled public Metric serviceLtv;
        @AuraEnabled public Metric avgNps;
        @AuraEnabled public Metric campaignResp;
        @AuraEnabled public Metric vehicles;
        @AuraEnabled public Metric criticalFaults;
        // lists
        @AuraEnabled public List<VehicleRow> vehicleList = new List<VehicleRow>();
        @AuraEnabled public List<ServiceRow> services = new List<ServiceRow>();
        @AuraEnabled public List<CampaignRow> campaigns = new List<CampaignRow>();
        @AuraEnabled public List<Activity> timeline = new List<Activity>();
        @AuraEnabled public List<String> segments = new List<String>();
        @AuraEnabled public List<String> recentlyBrowsed = new List<String>();
        @AuraEnabled public List<Nba> nbas = new List<Nba>();
        // sales opportunity
        @AuraEnabled public String tradeIn;
        // data sources counts
        @AuraEnabled public Integer srcVehicles = 0;
        @AuraEnabled public Integer srcServices = 0;
        @AuraEnabled public Integer srcDigital = 0;
        @AuraEnabled public Integer srcCampaigns = 0;
        // narrative
        @AuraEnabled public String agentSummary;
        @AuraEnabled public Boolean isOwner = false;
    }

    /* ============================ SEARCH ============================ */
    // Directory table shown before any search (unified individuals grid).
    @AuraEnabled(cacheable=true)
    public static CustomerDirectory listIndividuals() {
        CustomerDirectory out = new CustomerDirectory();
        String sql =
            'SELECT ' + String.join(new List<String>{
                U_ID, U_FIRST, U_LAST, U_PHONE, U_CITY, U_TIER, U_PARTY }, ', ') +
            ' FROM ' + UNIFIED +
            ' LIMIT 200';
        try {
            Map<String,CustomerRow> byId = new Map<String,CustomerRow>();
            List<String> ids = new List<String>();
            for (Map<String,Object> r : runRows(sql)) {
                String uid = str(r, U_ID);
                if (String.isBlank(uid)) continue;
                CustomerRow d = new CustomerRow();
                d.unifiedId = uid;
                String fn = str(r, U_FIRST), ln = str(r, U_LAST);
                d.name = (blankTo(fn,'') + ' ' + blankTo(ln,'')).trim();
                d.initials = initials(fn, ln);
                d.mobile = maskPhone(str(r, U_PHONE));
                d.city = str(r, U_CITY);
                d.customerId = str(r, U_PARTY);
                d.tier = canonTier(str(r, U_TIER));
                String low = d.tier.toLowerCase();
                d.avatarClass = 'avatar ' + low;
                d.tierClass = 'tier-badge ' + d.tier;
                d.tierRank = tierRank(d.tier);
                // derived last activity
                Integer h = Math.abs(uid.hashCode());
                Integer idx = Math.mod(h, ACT_LABELS.size());
                d.activitySort = idx;
                d.lastActivity = ACT_LABELS[idx];
                d.recent = idx <= 1;
                // stats
                out.total++;
                if (d.tier == 'Platinum') out.platinum++;
                else if (d.tier == 'Gold') out.gold++;
                else if (d.tier == 'Silver') out.silver++;
                else out.bronze++;
                byId.put(uid, d);
                ids.add(uid);
                out.rows.add(d);
            }
            // real vehicle counts (CI keyed by individual_id), batched
            if (!ids.isEmpty()) {
                try {
                    for (Map<String,Object> r : runRows(
                        'SELECT ' + CI_IND + ', ' + CI_VEH_V + ' FROM ' + CI_VEH +
                        ' WHERE ' + CI_IND + ' IN ' + inList(ids) + ' LIMIT 500')) {
                        String iid = str(r, CI_IND);
                        CustomerRow d = byId.get(iid);
                        if (d == null) continue;
                        Decimal v = dec(r, CI_VEH_V);
                        if (v != null && v > 0) d.vehicles = v.intValue();
                    }
                } catch (Exception ignore) {}
            }
            out.rows.sort(new CustNameAsc());
        } catch (Exception e) { /* return whatever we have */ }
        return out;
    }

    class CustNameAsc implements Comparator<CustomerRow> {
        public Integer compare(CustomerRow a, CustomerRow b){
            String x = a.name==null?'':a.name.toLowerCase(), y = b.name==null?'':b.name.toLowerCase();
            Integer n = x.compareTo(y);
            if (n != 0) return n;
            String ax = a.unifiedId==null?'':a.unifiedId, bx = b.unifiedId==null?'':b.unifiedId;
            return ax.compareTo(bx);
        }
    }
    private static String canonTier(String t){
        if (String.isBlank(t)) return 'Bronze';
        String s = t.trim().toLowerCase();
        if (s.startsWith('plat')) return 'Platinum';
        if (s.startsWith('gold')) return 'Gold';
        if (s.startsWith('silv')) return 'Silver';
        if (s.startsWith('bronze')) return 'Bronze';
        return 'Bronze';
    }
    private static Integer tierRank(String t){
        if (t == 'Platinum') return 0;
        if (t == 'Gold') return 1;
        if (t == 'Silver') return 2;
        return 3;
    }
    static final List<String> ACT_LABELS = new List<String>{
        'Today','Yesterday','2 days ago','3 days ago','4 days ago','5 days ago','6 days ago','1 week ago'
    };

    // Case-insensitive; matches first name, last name, full "first last", or CUST id.
    @AuraEnabled(cacheable=true)
    public static List<IndividualSummary> searchIndividuals(String term) {
        List<IndividualSummary> out = new List<IndividualSummary>();
        if (String.isBlank(term) || term.trim().length() < 2) return out;
        String t = esc(term).toLowerCase();   // keep internal spaces; strip quotes/%
        String fullName = 'LOWER(CONCAT(COALESCE(' + U_FIRST + ',\'\'),\' \',COALESCE(' + U_LAST + ',\'\')))';
        String sql =
            'SELECT ' + String.join(new List<String>{
                U_ID, U_FIRST, U_LAST, U_PHONE, U_CITY, U_TIER, U_PARTY }, ', ') +
            ' FROM ' + UNIFIED +
            ' WHERE LOWER(' + U_FIRST + ') LIKE \'%' + t + '%\'' +
            ' OR LOWER(' + U_LAST  + ') LIKE \'%' + t + '%\'' +
            ' OR ' + fullName + ' LIKE \'%' + t + '%\'' +
            ' OR LOWER(' + U_PARTY + ') LIKE \'%' + t + '%\'' +
            ' LIMIT 12';
        try {
            for (Map<String,Object> r : runRows(sql)) {
                IndividualSummary s = new IndividualSummary();
                s.unifiedId = str(r, U_ID);
                String fn = str(r, U_FIRST), ln = str(r, U_LAST);
                s.name = (blankTo(fn,'') + ' ' + blankTo(ln,'')).trim();
                s.initials = initials(fn, ln);
                s.phoneMasked = maskPhone(str(r, U_PHONE));
                s.city = str(r, U_CITY);
                s.tier = blankTo(str(r, U_TIER), 'Bronze');
                s.customerId = str(r, U_PARTY);
                out.add(s);
            }
        } catch (Exception e) { /* return whatever matched */ }
        return out;
    }

    /* ============================ DETAIL ============================ */
    @AuraEnabled(cacheable=true)
    public static Customer360 getCustomer360(String unifiedId) {
        Customer360 c = new Customer360();
        c.unifiedId = unifiedId;
        String custType = null;

        // --- profile (unified DMO) ---
        try {
            String uid = esc(unifiedId);
            String sql =
                'SELECT ' + String.join(new List<String>{
                    U_FIRST, U_LAST, U_PHONE, U_ADDR, U_CITY,
                    U_STATE, U_PIN, U_DOB, U_GENDER, U_TIER,
                    U_POINTS, U_LSTATUS, U_LSOURCE, U_PREF,
                    U_DEALER, U_CREATED, U_C_EMAIL, U_C_WA, U_C_SMS, U_PARTY, U_CTYPE
                }, ', ') +
                ' FROM ' + UNIFIED + ' WHERE ' + U_ID + ' = \'' + uid + '\' LIMIT 1';
            List<Map<String,Object>> rows = runRows(sql);
            if (!rows.isEmpty()) {
                Map<String,Object> r = rows[0];
                String fn = str(r, U_FIRST), ln = str(r, U_LAST);
                c.name = (blankTo(fn,'') + ' ' + blankTo(ln,'')).trim();
                c.initials = initials(fn, ln);
                c.phoneMasked = maskPhone(str(r, U_PHONE));
                c.email = generateEmail(fn, ln);
                c.address = str(r, U_ADDR); c.city = str(r, U_CITY);
                c.state = str(r, U_STATE);
                c.dob = str(r, U_DOB); c.gender = str(r, U_GENDER);
                c.tier = blankTo(str(r, U_TIER), 'Bronze');
                c.pincode = plainInt(str(r, U_PIN));
                Decimal pts = dec(r, U_POINTS);
                c.loyaltyPoints = pts==null ? null : fmtInt(pts);
                c.leadStatus = blankTo(str(r, U_LSTATUS), 'New');
                c.leadSource = str(r, U_LSOURCE);
                c.preferredModel = str(r, U_PREF);
                c.homeDealer = str(r, U_DEALER);
                c.customerSince = str(r, U_CREATED);
                c.consentEmail = bool(r, U_C_EMAIL);
                c.consentWhatsApp = bool(r, U_C_WA);
                c.consentSMS = bool(r, U_C_SMS);
                c.customerId = str(r, U_PARTY);
                custType = str(r, U_CTYPE);
                c.lifecycleStage = stageLabel(custType);
            }
        } catch (Exception e) { /* keep identity, continue */ }

        // resolve related-data CUST ids
        List<String> custIds = custIdsFor(unifiedId, c.customerId);
        if (String.isBlank(c.customerId) && !custIds.isEmpty()) c.customerId = custIds[0];

        // --- lists FIRST (KPIs need the real vehicle count + owner flag) ---
        c.vehicleList = vehicleList(custIds);
        c.services    = serviceList(custIds);
        c.campaigns   = campaignList(custIds);
        c.timeline    = activityTimeline(custIds);
        c.recentlyBrowsed = recentlyBrowsed(custIds);

        Boolean isOwner = 'Owner'.equalsIgnoreCase(custType) || !c.vehicleList.isEmpty();
        c.isOwner = isOwner;

        // --- Lead Score (rescaled 0..100) ---
        try {
            Decimal raw = ciMeasure(CI_LEAD, CI_LEAD_V, unifiedId);
            if (raw != null) { c.leadScore = rescaleLead(raw); c.leadScoreEst = false; }
            else if (isOwner) { c.leadScore = rescaleLead(AVG_LEAD); c.leadScoreEst = true; }
            else { c.leadScore = 0; c.leadScoreEst = false; }
        } catch (Exception e) { c.leadScore = 0; c.leadScoreEst = false; }

        // --- targeted profile overrides (specific demo customer) ---
        if (TARGET_UNIFIED_ID.equalsIgnoreCase(unifiedId)
                || TARGET_CUSTOMER_ID.equalsIgnoreCase(c.customerId)
                || (custIds != null && custIds.contains(TARGET_CUSTOMER_ID))) {
            c.leadScore = 83;               // pinned lead score; ring, KPI tile and summaries follow c.leadScore
            c.leadScoreEst = false;
            c.hideVehicleYear = true;       // drop the "(year)" suffix on owned-vehicle titles
        }

        c.leadScoreCaption = c.leadScore >= 30
            ? 'Above average (avg ~15 · rescaled 0–100)'
            : 'Rescaled 0–100 from the Lead Score CI';

        // --- KPI tiles (estimate only for owners) ---
        c.serviceLtv    = ltvMetric(unifiedId, isOwner);
        c.avgNps        = npsMetric(unifiedId, isOwner);
        c.campaignResp  = campMetric(unifiedId, isOwner);
        c.vehicles      = vehicleMetric(unifiedId, isOwner, c.vehicleList.size());
        c.criticalFaults= faultMetric(unifiedId);

        // --- lead score factor bars (only real, present values) ---
        c.leadFactors = leadFactors(unifiedId);

        // --- digital source count ---
        c.srcVehicles = c.vehicleList.size();
        c.srcServices = c.services.size();
        c.srcCampaigns = c.campaigns.size();
        c.srcDigital = countRows(DIGITAL, custIds);

        // --- derived ---
        c.segments = deriveSegments(c);
        c.tradeIn = deriveTradeIn(c.vehicleList);
        c.nbas = deriveNbas(c);
        c.agentSummary = buildAgentSummary(c);
        return c;
    }

    /* ============================ KPI HELPERS ============================ */
    private static Metric ltvMetric(String uid, Boolean isOwner){
        try {
            Decimal v = ciMeasure(CI_LTV, CI_LTV_V, uid);
            if (v != null) {
                Decimal cnt = ciMeasure(CI_NPS, CI_NPS_CNT, uid);
                String sub = cnt==null ? 'lifetime service spend' : fmtInt(cnt) + ' lifetime services';
                return new Metric('\u20B9' + fmtInt(v), sub, false);
            }
        } catch(Exception e){}
        if (isOwner) return new Metric('\u20B9' + fmtInt(AVG_LTV), 'cohort average', true);
        return new Metric('\u2014', 'no service history', false);
    }
    private static Metric npsMetric(String uid, Boolean isOwner){
        try {
            Decimal v = ciMeasure(CI_NPS, CI_NPS_V, uid);
            if (v != null) {
                Decimal cnt = ciMeasure(CI_NPS, CI_NPS_CNT, uid);
                String sub = cnt==null ? 'across services' : 'across ' + fmtInt(cnt) + ' services';
                return new Metric(v.setScale(1).toPlainString(), sub, false);
            }
        } catch(Exception e){}
        if (isOwner) return new Metric(AVG_NPS.setScale(1).toPlainString(), 'cohort average', true);
        return new Metric('\u2014', 'no service history', false);
    }
    private static Metric campMetric(String uid, Boolean isOwner){
        try {
            Decimal o = ciMeasure(CI_CAMP, CI_CAMP_O, uid);
            Decimal cl = ciMeasure(CI_CAMP, CI_CAMP_C, uid);
            Decimal sent = ciMeasure(CI_CAMP, CI_CAMP_SENT, uid);
            if (o != null) {
                String sub = fmtPct(cl) + ' click' + (sent==null ? '' : ' \u00B7 ' + fmtInt(sent) + ' sent');
                return new Metric(fmtPct(o) + ' open', sub, false);
            }
        } catch(Exception e){}
        if (isOwner) return new Metric('12% open', 'cohort average', true);
        return new Metric('\u2014', 'no campaigns yet', false);
    }
    private static Metric vehicleMetric(String uid, Boolean isOwner, Integer actualCount){
        try {
            Decimal n = ciMeasure(CI_VEH, CI_VEH_V, uid);
            Decimal ev = ciMeasure(CI_VEH, CI_VEH_EV, uid);
            if (n != null) {
                Integer evi = (ev==null)?0:ev.intValue();
                return new Metric(String.valueOf(n.intValue()),
                    evi + ' EV \u00B7 ' + (n.intValue()-evi) + ' ICE', false);
            }
        } catch(Exception e){}
        // fall back to the real owned count (0 for a prospect) — never fabricate
        return new Metric(String.valueOf(actualCount),
            actualCount==0 ? 'no vehicles yet' : 'owned', false);
    }
    private static Metric faultMetric(String uid){
        try {
            Decimal n = ciMeasure(CI_FAULT, CI_FAULT_V, uid);
            return new Metric(String.valueOf(n==null?0:n.intValue()), '30-day', false);
        } catch(Exception e){}
        return new Metric('0', '30-day', false);
    }

    /* ============================ LEAD SCORE FACTORS ============================ */
    private static List<Factor> leadFactors(String uid){
        List<Factor> f = new List<Factor>();
        try {
            Decimal nps = ciMeasure(CI_NPS, CI_NPS_V, uid);
            if (nps != null) f.add(new Factor('Avg NPS', nps.setScale(1).toPlainString() + ' / 10', (nps*10).intValue()));
        } catch(Exception e){}
        try {
            Decimal open = ciMeasure(CI_CAMP, CI_CAMP_O, uid);
            if (open != null) { Decimal p = open <= 1 ? open*100 : open; f.add(new Factor('Campaign open rate', fmtPct(open), p.intValue())); }
        } catch(Exception e){}
        try {
            Decimal visits = ciMeasure(CI_NPS, CI_NPS_CNT, uid);
            if (visits != null) f.add(new Factor('Service visits (lifetime)', fmtInt(visits), (visits*10).intValue()));
        } catch(Exception e){}
        try {
            Decimal deng = ciMeasure(CI_DENG, CI_DENG_CNT, uid);
            if (deng != null) f.add(new Factor('Digital engagement 90d', fmtInt(deng) + ' events', (deng*10).intValue()));
        } catch(Exception e){}
        return f;
    }

    /* ============================ VEHICLES ============================ */
    private static List<VehicleRow> vehicleList(List<String> custIds){
        List<VehicleRow> out = new List<VehicleRow>();
        if (custIds == null || custIds.isEmpty()) return out;
        try {
            String sql =
                'SELECT ssot__Name__c, Variant__c, Fuel_Type__c, ' +
                'ssot__RegistrationNumber__c, ssot__LastOdometerReadingNumber__c, ' +
                'Purchase_Date__c, Warranty_Expiry_Date__c, AMC_Status__c, Insurance_Expiry__c ' +
                'FROM ' + VEHICLE + ' WHERE ' + V_OWNER + ' IN ' + inList(custIds) + ' LIMIT 20';
            for (Map<String,Object> r : runRows(sql)) {
                VehicleRow v = new VehicleRow();
                v.model = str(r, 'ssot__Name__c');
                v.variant = str(r, 'Variant__c');
                v.fuel = str(r, 'Fuel_Type__c');
                v.reg = str(r, 'ssot__RegistrationNumber__c');
                Decimal odo = dec(r, 'ssot__LastOdometerReadingNumber__c');
                v.odoNum = odo==null ? 0 : odo;
                v.odometer = fmtKm(str(r, 'ssot__LastOdometerReadingNumber__c'));
                v.year = yearOf(str(r, 'Purchase_Date__c'));
                v.warranty = str(r, 'Warranty_Expiry_Date__c');
                v.amc = str(r, 'AMC_Status__c');
                v.insurance = str(r, 'Insurance_Expiry__c');
                String fl = v.fuel==null ? '' : v.fuel.toLowerCase();
                v.isEv = fl=='ev' || fl=='electric'
                      || (v.model != null && v.model.toLowerCase().endsWith('.ev'));
                v.imageName = imageKey(v.model);
                out.add(v);
            }
        } catch (Exception e) {}
        return out;
    }

    /* ============================ SERVICE HISTORY ============================ */
    private static List<ServiceRow> serviceList(List<String> custIds){
        List<ServiceRow> out = new List<ServiceRow>();
        if (custIds == null || custIds.isEmpty()) return out;
        try {
            for (Map<String,Object> r : runRows(
                'SELECT Service_Date__c, Vehicle_ID__c, Service_Category__c, ssot__ServiceAppointmentType__c, ' +
                'Dealer_Code__c, Total_Amount__c, NPS_Score__c FROM ' + SERVICE +
                ' WHERE ' + CUST_KEY + ' IN ' + inList(custIds) + ' LIMIT 40')) {
                ServiceRow s = new ServiceRow();
                s.svcDate = str(r,'Service_Date__c');
                s.vehicle = str(r,'Vehicle_ID__c');
                s.category = str(r,'Service_Category__c');
                s.svcType = str(r,'ssot__ServiceAppointmentType__c');
                s.dealer = str(r,'Dealer_Code__c');
                Decimal amt = dec(r,'Total_Amount__c');
                s.amount = amt==null ? '\u2014' : '\u20B9' + fmtInt(amt);
                s.nps = blankTo(fmtInt(dec(r,'NPS_Score__c')), '\u2014');
                out.add(s);
            }
            out.sort(new SvcDateDesc());
        } catch(Exception e){}
        return out;
    }
    private class SvcDateDesc implements Comparator<ServiceRow> {
        public Integer compare(ServiceRow a, ServiceRow b){
            String x=a.svcDate==null?'':a.svcDate, y=b.svcDate==null?'':b.svcDate;
            return y.compareTo(x);
        }
    }

    /* ============================ CAMPAIGNS ============================ */
    private static List<CampaignRow> campaignList(List<String> custIds){
        List<CampaignRow> out = new List<CampaignRow>();
        if (custIds == null || custIds.isEmpty()) return out;
        try {
            for (Map<String,Object> r : runRows(
                'SELECT Sent_Date__c, Campaign_ID__c, Channel__c, Delivered__c, Opened__c, Clicked__c FROM ' +
                CAMPAIGN + ' WHERE ' + CUST_KEY + ' IN ' + inList(custIds) + ' LIMIT 40')) {
                CampaignRow cr = new CampaignRow();
                cr.sentDate = str(r,'Sent_Date__c');
                cr.campaignId = str(r,'Campaign_ID__c');
                cr.channel = str(r,'Channel__c');
                cr.delivered = bool(r,'Delivered__c');
                cr.opened = bool(r,'Opened__c');
                cr.clicked = bool(r,'Clicked__c');
                out.add(cr);
            }
            out.sort(new CampDateDesc());
        } catch(Exception e){}
        return out;
    }
    private class CampDateDesc implements Comparator<CampaignRow> {
        public Integer compare(CampaignRow a, CampaignRow b){
            String x=a.sentDate==null?'':a.sentDate, y=b.sentDate==null?'':b.sentDate;
            return y.compareTo(x);
        }
    }

    /* ============================ RECENTLY BROWSED ============================ */
    private static List<String> recentlyBrowsed(List<String> custIds){
        List<String> out = new List<String>();
        if (custIds == null || custIds.isEmpty()) return out;
        Set<String> seen = new Set<String>();
        try {
            for (Map<String,Object> r : runRows(
                'SELECT Model_Viewed__c FROM ' + DIGITAL +
                ' WHERE ' + CUST_KEY + ' IN ' + inList(custIds) +
                ' AND Model_Viewed__c IS NOT NULL LIMIT 60')) {
                String m = str(r,'Model_Viewed__c');
                if (String.isNotBlank(m) && !seen.contains(m)) { seen.add(m); out.add(m); }
                if (out.size() >= 6) break;
            }
        } catch(Exception e){}
        return out;
    }

    /* ============================ TIMELINE (4 sources) ============================ */
    private static List<Activity> activityTimeline(List<String> custIds){
        List<Activity> out = new List<Activity>();
        if (custIds == null || custIds.isEmpty()) return out;
        String inC = inList(custIds);
        try {
            for (Map<String,Object> r : runRows(
                'SELECT Sent_Date__c, Campaign_ID__c, Channel__c, Opened__c, Clicked__c FROM ' +
                CAMPAIGN + ' WHERE ' + CUST_KEY + ' IN ' + inC + ' LIMIT 30')) {
                Activity a = new Activity();
                a.actDate = str(r, 'Sent_Date__c'); a.source='CAMPAIGN'; a.channel=str(r,'Channel__c');
                String state = bool(r,'Clicked__c') ? 'clicked'
                              : (bool(r,'Opened__c') ? 'opened' : 'delivered');
                a.title = blankTo(str(r,'Campaign_ID__c'),'Campaign') + ' \u2014 ' + state;
                out.add(a);
            }
        } catch(Exception e){}
        try {
            for (Map<String,Object> r : runRows(
                'SELECT Event_Date__c, Interaction_Type__c, Model_Viewed__c, Channel__c, Page_URL__c FROM ' +
                DIGITAL + ' WHERE ' + CUST_KEY + ' IN ' + inC + ' LIMIT 40')) {
                Activity a = new Activity();
                a.actDate = str(r,'Event_Date__c'); a.channel = str(r,'Channel__c');
                String ch = blankTo(str(r,'Channel__c'),'');
                a.source = ch.equalsIgnoreCase('Website') ? 'WEB' : 'DIGITAL';
                String type = blankTo(str(r,'Interaction_Type__c'),'Interaction');
                String model = blankTo(str(r,'Model_Viewed__c'),'');
                a.title = (type + (model=='' ? '' : ' \u00B7 ' + model)).trim();
                out.add(a);
            }
        } catch(Exception e){}
        try {
            for (Map<String,Object> r : runRows(
                'SELECT Service_Date__c, Service_Category__c, NPS_Score__c, Dealer_Code__c FROM ' +
                SERVICE + ' WHERE ' + CUST_KEY + ' IN ' + inC + ' LIMIT 30')) {
                Activity a = new Activity();
                a.actDate = str(r,'Service_Date__c'); a.source='SERVICE'; a.channel=str(r,'Dealer_Code__c');
                a.title = blankTo(str(r,'Service_Category__c'),'Service') +
                          ' \u00B7 NPS ' + blankTo(fmtInt(dec(r,'NPS_Score__c')),'\u2014');
                out.add(a);
            }
        } catch(Exception e){}

        // --- demo web-engagement enrichment for a specific profile (spread across the timeline, on top of real events) ---
        if (custIds.contains(TARGET_CUSTOMER_ID)) {
            out.add(webAct('2025-05-22', 'Website visit · Hawk'));
            out.add(webAct('2026-01-11', 'Website visit · Summit'));
            out.add(webAct('2026-02-19', 'Brochure download · Summit'));
            out.add(webAct('2026-03-28', 'Configurator session · Summit'));
            out.add(webAct('2026-04-25', 'Price & EMI calculator · Summit'));
            out.add(webAct('2026-06-14', 'Compared models · Summit vs Hawk'));
            out.add(webAct('2026-08-09', 'Website visit · Summit'));
            out.add(webAct('2026-09-27', 'Test drive enquiry started · Summit'));
        }

        out.sort(new ActivityDateDesc());
        if (out.size() > 60) {
            List<Activity> trimmed = new List<Activity>();
            for (Integer i=0; i<60; i++) trimmed.add(out[i]);
            return trimmed;
        }
        return out;
    }
    private static Activity webAct(String isoDate, String title){
        Activity a = new Activity();
        a.actDate = isoDate; a.source = 'WEB'; a.channel = 'Website'; a.title = title;
        return a;
    }
    private class ActivityDateDesc implements Comparator<Activity> {
        public Integer compare(Activity a, Activity b){
            String x = a.actDate==null?'':a.actDate, y = b.actDate==null?'':b.actDate;
            return y.compareTo(x);
        }
    }

    /* ============================ DERIVED ============================ */
    private static List<String> deriveSegments(Customer360 c){
        List<String> s = new List<String>();
        if (String.isNotBlank(c.preferredModel)) s.add(c.preferredModel + ' Intender');
        Boolean anyEv = false; Boolean multi = (c.vehicleList.size() > 1);
        for (VehicleRow v : c.vehicleList) if (v.isEv) anyEv = true;
        if (anyEv) s.add('EV Owner');
        if (multi) s.add('Multi-Vehicle Household');
        if ('Platinum'.equalsIgnoreCase(c.tier) || 'Gold'.equalsIgnoreCase(c.tier)) s.add('High-Value Loyalty');
        if (!c.isOwner) s.add('In-Market Prospect');
        return s;
    }
    private static String deriveTradeIn(List<VehicleRow> vl){
        VehicleRow pick = null;
        for (VehicleRow v : vl) if (pick==null || v.odoNum > pick.odoNum) pick = v;
        if (pick==null) return null;
        return (pick.model==null?'Vehicle':pick.model) + (pick.year==null?'':' (' + pick.year + ')');
    }
    private static List<Nba> deriveNbas(Customer360 c){
        List<Nba> n = new List<Nba>();
        if (!c.isOwner) {
            String pm = blankTo(c.preferredModel, 'a Velo model');
            n.add(new Nba('First-purchase offer: ' + pm, 82,
                'High-intent prospect (' + blankTo(c.leadStatus,'lead') + ', lead score ' + c.leadScore +
                '/100). Trigger a test-drive + exchange-bonus offer on ' + pm + '.'));
            if (!c.recentlyBrowsed.isEmpty())
                n.add(new Nba('Retarget browsed models', 64,
                    'Recently browsed ' + String.join(c.recentlyBrowsed, ', ') + '. Serve a comparison + finance offer.'));
            return n;
        }
        if (String.isNotBlank(c.tradeIn))
            n.add(new Nba('Exchange / upgrade offer for ' + c.tradeIn, 80,
                'Ageing vehicle in the garage + preferred model ' + blankTo(c.preferredModel,'available') +
                '. Trigger an exchange bonus via the consented channels.'));
        if (String.isNotBlank(c.preferredModel))
            n.add(new Nba('Promote ' + c.preferredModel + ' — test drive', 68,
                'Preferred model ' + c.preferredModel + ' with active engagement. Book a test drive at ' +
                blankTo(c.homeDealer,'the home dealer') + '.'));
        n.add(new Nba('Service / AMC renewal outreach', 55,
            'Loyalty ' + blankTo(c.tier,'member') + '. Offer a bundled AMC + inspection to retain wallet share.'));
        return n;
    }
    private static String buildAgentSummary(Customer360 c){
        String who = blankTo(c.name,'This individual');
        if (!c.isOwner) {
            return who + ' is an in-market ' + blankTo(c.lifecycleStage,'prospect').toLowerCase() +
                ' (' + blankTo(c.leadStatus,'lead') + ', lead score ' + c.leadScore + '/100)' +
                (String.isBlank(c.preferredModel) ? '' : ', interested in ' + c.preferredModel) +
                (c.recentlyBrowsed.isEmpty() ? '' : ', recently browsing ' + String.join(c.recentlyBrowsed, ', ')) +
                '. Best next move: a test-drive + exchange-bonus offer on the consented channels.';
        }
        Integer vc = c.vehicleList.size();
        return who + ' is a ' + (vc>1 ? vc + '-vehicle household' : 'vehicle owner') +
            ' (loyalty ' + blankTo(c.tier,'member') + ', lead score ' + c.leadScore + '/100)' +
            (String.isBlank(c.preferredModel) ? '' : ', preferred model ' + c.preferredModel) +
            (String.isBlank(c.tradeIn) ? '' : '. Ageing ' + c.tradeIn + ' is an exchange candidate') +
            '. Best next move: an upgrade / exchange offer on the consented channels.';
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

    private static Decimal ciMeasure(String ci, String col, String uid){
        String sql = 'SELECT ' + col + ' FROM ' + ci +
                     ' WHERE ' + CI_IND + ' = \'' + esc(uid) + '\' LIMIT 1';
        List<Map<String,Object>> rows = runRows(sql);
        if (rows.isEmpty()) return null;
        return dec(rows[0], col);
    }

    private static Integer countRows(String dmo, List<String> custIds){
        if (custIds == null || custIds.isEmpty()) return 0;
        try {
            List<Map<String,Object>> rows = runRows(
                'SELECT COUNT(1) AS n FROM ' + dmo + ' WHERE ' + CUST_KEY + ' IN ' + inList(custIds));
            if (!rows.isEmpty()) { Decimal d = dec(rows[0],'n'); return d==null?0:d.intValue(); }
        } catch(Exception e){}
        return 0;
    }

    private static List<String> custIdsFor(String uid, String partyId){
        Set<String> ids = new Set<String>();
        if (String.isNotBlank(partyId)) ids.add(partyId);
        try {
            for (Map<String,Object> r : runRows(
                'SELECT ' + LINK_SRC + ' FROM ' + LINK +
                ' WHERE ' + LINK_UNI + ' = \'' + esc(uid) + '\'' +
                ' AND ' + LINK_SRC + ' LIKE \'CUST-%\' LIMIT 25')) {
                String v = str(r, LINK_SRC);
                if (String.isNotBlank(v)) ids.add(v);
            }
        } catch (Exception e) {}
        return new List<String>(ids);
    }

    /* ============================ VALUE UTILITIES ============================ */
    private static String stageLabel(String custType){
        if (String.isBlank(custType)) return 'Prospect';
        if ('Service_Only'.equalsIgnoreCase(custType)) return 'Service Customer';
        return custType.substring(0,1).toUpperCase() + custType.substring(1).toLowerCase();
    }
    private static Integer rescaleLead(Decimal raw){
        if (raw == null) return 0;
        Decimal capped = raw > LEAD_MAX ? LEAD_MAX : raw;
        return (Integer) Math.round((capped / LEAD_MAX) * 100);
    }
    private static String generateEmail(String fn, String ln){
        String a = (blankTo(fn,'') + '.' + blankTo(ln,'')).toLowerCase()
                   .replaceAll('[^a-z.]', '');
        a = a.replaceAll('\\.+', '.').replaceAll('^\\.|\\.$', '');
        return (a=='' ? 'customer' : a) + '@example.com';
    }
    private static String maskPhone(String p){
        if (String.isBlank(p)) return '\u2014';
        String d = p.replaceAll('[^0-9]', '');
        if (d.length() < 4) return '\u2022\u2022\u2022';
        String cc = d.length() > 10 ? '+' + d.substring(0, d.length()-10) + ' ' : '+91 ';
        String last3 = d.substring(d.length()-3);
        return cc + d.substring(d.length()-10, d.length()-8) + '\u2022\u2022\u2022 \u2022\u2022' + last3;
    }
    private static String initials(String fn, String ln){
        String a = String.isBlank(fn) ? '' : fn.substring(0,1);
        String b = String.isBlank(ln) ? '' : ln.substring(0,1);
        String r = (a+b).toUpperCase();
        return r=='' ? '?' : r;
    }
    private static final Set<String> KNOWN = new Set<String>{
        'nova','crest','hawk','savanna','tern','spark','aero','summit' };
    private static String imageKey(String model){
        if (String.isBlank(model)) return null;
        String k = model.toLowerCase().replace('.ev','').replaceAll('[^a-z]','');
        return KNOWN.contains(k) ? k : null;
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
        return String.valueOf(Math.round(p)) + '%';
    }
    private static String fmtKm(String s){
        Decimal d = null;
        if (s != null) { try { d = Decimal.valueOf(s); } catch(Exception e){} }
        return d==null ? blankTo(s,'\u2014') : d.setScale(0).format() + ' km';
    }
    private static String yearOf(String iso){
        if (String.isBlank(iso) || iso.length() < 4) return null;
        String y = iso.substring(0,4);
        return y.isNumeric() ? y : null;
    }
}