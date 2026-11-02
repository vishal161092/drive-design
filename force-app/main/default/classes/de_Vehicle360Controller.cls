/**
 * de_Vehicle360Controller
 * -----------------------------------------------------------------------------
 * Backs the de_vehicle360 LWC with REAL Data Cloud data (no static personas).
 * Modeled on VeloMotors360Controller: queries DMOs + Calculated Insights via
 * ConnectApi.CdpQuery (ANSI SQL).
 *
 * Design guarantees:
 *   - NEVER crash: every section runs in its own try/catch; a failed query
 *     degrades one card, not the whole page.
 *   - Vehicle master is ssot__Vehicle__dlm (ids VEH-*). Owner is a CUST-* id
 *     resolved to a unified individual through UnifiedLinkssotIndividualInd1__dlm
 *     (SourceRecordId__c -> UnifiedRecordId__c) for owner name + lead score.
 *   - Telematics DTCs from ssot__VehicleTelematicsEvent__dlm (ssot__VehicleId__c),
 *     service history from ssot__ServiceAppointment__dlm (Vehicle_ID__c).
 *   - EV battery SoC/SoH/range/cycles are DERIVED from odometer/age (flagged
 *     illustrative in the UI); everything else is real.
 *
 * CdpQuery rows are JSON round-tripped into real Map<String,Object> (see runRows).
 */
public with sharing class de_Vehicle360Controller {

    /* ============================ NAME CONFIG ============================ */
    static final String VEHICLE = 'ssot__Vehicle__dlm';
    static final String V_ID      = 'ssot__Id__c';
    static final String V_MODEL   = 'ssot__Name__c';
    static final String V_VARIANT = 'Variant__c';
    static final String V_FUEL    = 'Fuel_Type__c';
    static final String V_REG     = 'ssot__RegistrationNumber__c';
    static final String V_VIN     = 'ssot__VehicleIdentificationNumber__c';
    static final String V_ODO     = 'ssot__LastOdometerReadingNumber__c';
    static final String V_OWNER   = 'ssot__CurrentOwnerId__c';
    static final String V_DEALER  = 'Dealer_Code__c';
    static final String V_COLOR   = 'ssot__ExteriorColorText__c';
    static final String V_COND    = 'ssot__ConditionType__c';
    static final String V_PURCH   = 'Purchase_Date__c';
    static final String V_WARR    = 'Warranty_Expiry_Date__c';
    static final String V_EXTWARR = 'Extended_Warranty__c';
    static final String V_AMC     = 'AMC_Status__c';
    static final String V_INS     = 'Insurance_Expiry__c';
    static final String V_FIN     = 'Financing_Partner__c';
    static final String V_EMI     = 'EMI_Amount__c';
    static final String V_LOANEND = 'Loan_End_Date__c';

    static final String TEL     = 'ssot__VehicleTelematicsEvent__dlm';
    static final String T_ID      = 'ssot__Id__c';
    static final String T_VEH     = 'ssot__VehicleId__c';
    static final String T_TYPE    = 'ssot__EventType__c';
    static final String T_CAT     = 'ssot__EventCategory__c';
    static final String T_PRIO    = 'ssot__Priority__c';
    static final String T_SPEED   = 'ssot__SpeedNumber__c';
    static final String T_WHEN    = 'ssot__TriggeredDateTime__c';
    static final String T_LAT     = 'ssot__Latitude__c';
    static final String T_LONG    = 'ssot__Longitude__c';

    static final String SERVICE = 'ssot__ServiceAppointment__dlm';
    static final String S_VEH     = 'Vehicle_ID__c';

    static final String LINK    = 'UnifiedLinkssotIndividualInd1__dlm';
    static final String LINK_SRC = 'SourceRecordId__c';
    static final String LINK_UNI = 'UnifiedRecordId__c';
    static final String UNIFIED = 'UnifiedssotIndividualInd1__dlm';
    static final String U_ID      = 'ssot__Id__c';
    static final String U_FIRST   = 'ssot__FirstName__c';
    static final String U_LAST    = 'ssot__LastName__c';
    static final String U_CITY    = 'City__c';
    static final String U_STATE   = 'State__c';
    static final String U_TIER    = 'Loyalty_Tier__c';

    static final String CI_LEAD   = 'CI_Lead_Score__cio';
    static final String CI_LEAD_IND = 'individual_id__c';
    static final String CI_LEAD_V   = 'lead_score__c';
    static final String LEAD_MAX    = '131';   // display scale used in mock

    static final String MODELPOP = 'CI_Model_Popularity__cio';
    static final String ACCOUNT  = 'ssot__Account__dlm';
    static final String A_ID      = 'ssot__Id__c';
    static final String A_NAME    = 'ssot__Name__c';
    static final String A_CITY    = 'City__c';
    static final String A_STATE   = 'State__c';

    /* ============================ WRAPPERS ============================ */
    public class VehicleSummary {
        @AuraEnabled public String vehId;
        @AuraEnabled public String title;
        @AuraEnabled public String detail;
        @AuraEnabled public Boolean isEv = false;
    }
    // ---- Fleet dashboard (pre-search landing) ----
    public class FleetRow {
        @AuraEnabled public String vehId;
        @AuraEnabled public String variant;    // "Nova.ev Elite"
        @AuraEnabled public String plate;       // registration
        @AuraEnabled public String vin;         // VEH-* id
        @AuraEnabled public String customer;    // CUST-* owner id
        @AuraEnabled public String fuel;         // Electric / Petrol / Diesel / CNG
        @AuraEnabled public String odo;          // "62,410 km"
        @AuraEnabled public String year;         // purchase year
        @AuraEnabled public String dealer;       // selling dealer code
        @AuraEnabled public Boolean isEv = false;
        @AuraEnabled public String status;      // online | offline | alert
        @AuraEnabled public String dotClass;    // "status-dot online"
        @AuraEnabled public String lastSeen;    // "Just now"
    }
    public class FleetGroup {
        @AuraEnabled public String model;       // "Nova"
        @AuraEnabled public String modelKey;    // "nova"
        @AuraEnabled public Integer count = 0;
        @AuraEnabled public Integer evCount = 0;
        @AuraEnabled public Boolean hasEv = false;
        @AuraEnabled public String evLabel;     // "3 EV"
        @AuraEnabled public List<FleetRow> rows = new List<FleetRow>();
    }
    public class FleetView {
        @AuraEnabled public Integer total = 0;
        @AuraEnabled public Integer online = 0;
        @AuraEnabled public Integer offline = 0;
        @AuraEnabled public Integer alerts = 0;
        @AuraEnabled public Integer evUnits = 0;
        @AuraEnabled public List<FleetGroup> groups = new List<FleetGroup>();
    }
    public class Chip {
        @AuraEnabled public String label;
        @AuraEnabled public String cls;
        public Chip(String l, String c){ label=l; cls=c; }
    }
    public class Spec {
        @AuraEnabled public String k;
        @AuraEnabled public String v;
        public Spec(String key, String val){ k=key; v=val; }
    }
    public class Status {
        @AuraEnabled public String tone;   // ok | warn | bad | ''
        @AuraEnabled public String k;
        @AuraEnabled public String v;
        public Status(String t, String key, String val){ tone=t; k=key; v=val; }
    }
    public class DtcRow {
        @AuraEnabled public String code;
        @AuraEnabled public String sysName;
        @AuraEnabled public String severity;
        @AuraEnabled public String sevClass;
        @AuraEnabled public String detected;
        @AuraEnabled public String speed;
    }
    public class SvcRow {
        @AuraEnabled public String svcDate;
        @AuraEnabled public String category;
        @AuraEnabled public String svcType;
        @AuraEnabled public String typeClass;
        @AuraEnabled public String dealer;
        @AuraEnabled public String odo;
        @AuraEnabled public String amount;
        @AuraEnabled public String nps;
    }
    public class TelRow {
        @AuraEnabled public String tone;   // warn | alert | ''
        @AuraEnabled public String dateLine;
        @AuraEnabled public String text;
    }
    public class GarageRow {
        @AuraEnabled public String model;
        @AuraEnabled public String variant;
        @AuraEnabled public String fuel;
        @AuraEnabled public String reg;
        @AuraEnabled public String status;
        @AuraEnabled public String statusClass;
        @AuraEnabled public Boolean isThis = false;
    }
    public class Nba {
        @AuraEnabled public String title;
        @AuraEnabled public String confidence;
        @AuraEnabled public String barStyle;
        @AuraEnabled public String description;
        public Nba(String t, Integer c, String d){ title=t; confidence=c+'%'; barStyle='width:'+c+'%'; description=d; }
    }
    public class Vehicle360 {
        // identity
        @AuraEnabled public String vehId;
        @AuraEnabled public String model;
        @AuraEnabled public String title;         // "Velo Nova.ev"
        @AuraEnabled public String subLine;       // "Bold · Electric · 2018"
        @AuraEnabled public Boolean isEv = false;
        @AuraEnabled public String imageName;
        @AuraEnabled public List<Chip> chips = new List<Chip>();
        @AuraEnabled public List<Spec> specs = new List<Spec>();
        // owner
        @AuraEnabled public String ownerName;
        @AuraEnabled public String ownerInitials;
        @AuraEnabled public String ownerSub;      // "Bronze · Howrah · CUST-005385"
        @AuraEnabled public String ownerId;
        @AuraEnabled public Integer garageCount = 0;
        @AuraEnabled public String ownerLeadLine;
        // dealer
        @AuraEnabled public String dealerCode;
        @AuraEnabled public String dealerName;
        @AuraEnabled public String dealerSub;
        @AuraEnabled public String financier;
        @AuraEnabled public String emi;
        // health
        @AuraEnabled public Integer health = 0;
        @AuraEnabled public String healthTone = 'var(--green)';
        @AuraEnabled public String healthPill;
        @AuraEnabled public List<Status> healthTiles = new List<Status>();
        @AuraEnabled public String healthNote;
        // battery
        @AuraEnabled public Boolean showBattery = false;
        @AuraEnabled public Integer soc = 0;
        @AuraEnabled public String socStyle = 'width:0%';
        @AuraEnabled public Integer soh = 0;
        @AuraEnabled public String range;
        @AuraEnabled public String cycles;
        // tabs
        @AuraEnabled public List<DtcRow> dtcs = new List<DtcRow>();
        @AuraEnabled public List<SvcRow> services = new List<SvcRow>();
        @AuraEnabled public List<Status> telTiles = new List<Status>();
        @AuraEnabled public List<TelRow> telStream = new List<TelRow>();
        @AuraEnabled public List<Status> ownershipTiles = new List<Status>();
        @AuraEnabled public List<GarageRow> garage = new List<GarageRow>();
        @AuraEnabled public List<Nba> recommendations = new List<Nba>();
        // right column
        @AuraEnabled public String modelViews;
        @AuraEnabled public String modelBuys;
        @AuraEnabled public String modelTestDrives;
        @AuraEnabled public String modelFinance;
        @AuraEnabled public List<TelRow> alerts = new List<TelRow>();
        @AuraEnabled public Integer srcServices = 0;
        @AuraEnabled public Integer srcTelematics = 0;
    }

    /* ============================ SEARCH ============================ */
    // Fleet dashboard shown before any search: vehicles grouped by model with
    // live-status + last-seen (status/last-seen derived from the id — illustrative).
    @AuraEnabled(cacheable=true)
    public static FleetView listVehicles() {
        FleetView fv = new FleetView();
        Map<String, FleetGroup> byModel = new Map<String, FleetGroup>();
        String sql =
            'SELECT ' + String.join(new List<String>{ V_ID, V_MODEL, V_VARIANT, V_FUEL, V_REG, V_OWNER, V_ODO, V_PURCH, V_DEALER }, ', ') +
            ' FROM ' + VEHICLE +
            ' LIMIT 120';
        try {
            for (Map<String,Object> r : runRows(sql)) {
                String vehId = str(r, V_ID);
                if (String.isBlank(vehId)) continue;
                String rawModel = blankTo(str(r, V_MODEL), 'Other');
                String variant = str(r, V_VARIANT);
                Boolean ev = isEvFuel(str(r, V_FUEL), rawModel);

                FleetRow row = new FleetRow();
                row.vehId = vehId;
                row.vin = vehId;
                row.plate = blankTo(str(r, V_REG), '—');
                row.customer = blankTo(str(r, V_OWNER), '—');
                row.fuel = blankTo(fuelLabel(str(r, V_FUEL), ev), '—');
                Decimal odo = dec(r, V_ODO);
                row.odo = odo == null ? '—' : fmtInt(odo) + ' km';
                row.year = blankTo(yearOf(str(r, V_PURCH)), '—');
                row.dealer = blankTo(str(r, V_DEALER), '—');
                row.isEv = ev;
                row.variant = (rawModel + (String.isBlank(variant) ? '' : ' ' + variant)).trim();
                String st = fleetStatus(vehId);
                row.status = st;
                row.dotClass = 'status-dot ' + st;
                row.lastSeen = fleetLastSeen(vehId, st);

                String base = baseModel(rawModel);
                String key = base.toLowerCase();
                FleetGroup g = byModel.get(key);
                if (g == null) {
                    g = new FleetGroup();
                    g.model = base;
                    g.modelKey = key;
                    byModel.put(key, g);
                }
                g.rows.add(row);
                g.count++;
                if (ev) g.evCount++;

                fv.total++;
                if (st == 'online') fv.online++;
                else if (st == 'offline') fv.offline++;
                else if (st == 'alert') fv.alerts++;
                if (ev) fv.evUnits++;
            }
        } catch (Exception e) { /* return whatever we have */ }

        List<FleetGroup> groups = new List<FleetGroup>(byModel.values());
        groups.sort(new GroupNameAsc());
        for (FleetGroup g : groups) {
            g.hasEv = g.evCount > 0;
            g.evLabel = g.evCount + ' EV';
        }
        fv.groups = groups;
        return fv;
    }
    class GroupNameAsc implements Comparator<FleetGroup> {
        public Integer compare(FleetGroup a, FleetGroup b){
            String x = a.model==null?'':a.model.toLowerCase(), y = b.model==null?'':b.model.toLowerCase();
            return x.compareTo(y);
        }
    }
    private static String baseModel(String m){
        if (String.isBlank(m)) return 'Other';
        String s = m.trim();
        if (s.toLowerCase().endsWith('.ev')) s = s.substring(0, s.length()-3);
        return capitalize(s);
    }
    private static String fleetStatus(String vehId){
        Integer b = Math.mod(Math.abs(vehId.hashCode()), 100);
        if (b < 9) return 'alert';
        if (b < 23) return 'offline';
        return 'online';
    }
    private static final List<String> LS_ONLINE = new List<String>{
        'Just now','2 min ago','1 min ago','5 min ago','12 min ago','9 min ago' };
    private static final List<String> LS_ALERT = new List<String>{
        '8 min ago','15 min ago','22 min ago' };
    private static final List<String> LS_OFF = new List<String>{
        '1h ago','2h ago','3h ago','5h ago' };
    private static String fleetLastSeen(String vehId, String st){
        Integer h = Math.abs(vehId.hashCode());
        if (st == 'alert') return LS_ALERT[Math.mod(h, LS_ALERT.size())];
        if (st == 'offline') return LS_OFF[Math.mod(h, LS_OFF.size())];
        return LS_ONLINE[Math.mod(h, LS_ONLINE.size())];
    }

    @AuraEnabled(cacheable=true)
    public static List<VehicleSummary> searchVehicles(String term) {
        List<VehicleSummary> out = new List<VehicleSummary>();
        if (String.isBlank(term) || term.trim().length() < 2) return out;
        String t = esc(term).toLowerCase();
        String sql =
            'SELECT ' + String.join(new List<String>{ V_ID, V_MODEL, V_VARIANT, V_FUEL, V_REG, V_VIN, V_OWNER }, ', ') +
            ' FROM ' + VEHICLE +
            ' WHERE LOWER(' + V_MODEL + ') LIKE \'%' + t + '%\'' +
            ' OR LOWER(' + V_REG + ') LIKE \'%' + t + '%\'' +
            ' OR LOWER(' + V_VIN + ') LIKE \'%' + t + '%\'' +
            ' OR LOWER(' + V_ID + ') LIKE \'%' + t + '%\'' +
            ' OR LOWER(' + V_OWNER + ') LIKE \'%' + t + '%\'' +
            ' LIMIT 12';
        try {
            for (Map<String,Object> r : runRows(sql)) {
                VehicleSummary v = new VehicleSummary();
                v.vehId = str(r, V_ID);
                String model = str(r, V_MODEL), variant = str(r, V_VARIANT);
                v.isEv = isEvFuel(str(r, V_FUEL), model);
                v.title = ('Velo ' + blankTo(model,'') + (String.isBlank(variant)?'':' ' + variant)).trim();
                v.detail = filterJoin(new List<String>{ str(r, V_REG), str(r, V_ID), str(r, V_OWNER) });
                out.add(v);
            }
        } catch (Exception e) { /* return whatever matched */ }
        return out;
    }

    /* ============================ DETAIL ============================ */
    @AuraEnabled(cacheable=true)
    public static Vehicle360 getVehicle360(String vehId) {
        Vehicle360 c = new Vehicle360();
        c.vehId = vehId;
        String warranty=null, amc=null, insurance=null, cond=null, purchase=null;
        Decimal odo = null;

        // --- identity ---
        try {
            String id = esc(vehId);
            String sql =
                'SELECT ' + String.join(new List<String>{
                    V_MODEL, V_VARIANT, V_FUEL, V_REG, V_VIN, V_ODO, V_OWNER, V_DEALER,
                    V_COLOR, V_COND, V_PURCH, V_WARR, V_EXTWARR, V_AMC, V_INS,
                    V_FIN, V_EMI, V_LOANEND }, ', ') +
                ' FROM ' + VEHICLE + ' WHERE ' + V_ID + ' = \'' + id + '\' LIMIT 1';
            List<Map<String,Object>> rows = runRows(sql);
            if (!rows.isEmpty()) {
                Map<String,Object> r = rows[0];
                c.model = str(r, V_MODEL);
                String variant = str(r, V_VARIANT);
                String fuel = str(r, V_FUEL);
                c.isEv = isEvFuel(fuel, c.model);
                c.imageName = imageKey(c.model);
                c.title = 'Velo ' + blankTo(c.model,'');
                purchase = str(r, V_PURCH);
                String year = yearOf(purchase);
                c.subLine = filterJoin(new List<String>{ variant, fuelLabel(fuel, c.isEv), year });
                cond = str(r, V_COND);
                warranty = str(r, V_WARR);
                amc = str(r, V_AMC);
                insurance = str(r, V_INS);
                odo = dec(r, V_ODO);
                c.ownerId = str(r, V_OWNER);
                c.dealerCode = str(r, V_DEALER);
                c.financier = str(r, V_FIN);
                Decimal emi = dec(r, V_EMI);
                c.emi = emi==null ? null : '\u20B9' + fmtInt(emi);

                // chips
                String color = str(r, V_COLOR);
                if (String.isNotBlank(color)) c.chips.add(new Chip(color, 'pill pill-grey'));
                if (String.isNotBlank(cond)) c.chips.add(new Chip(cond + ' condition', 'pill pill-bronze'));
                if (String.isNotBlank(warranty)) {
                    Boolean exp = isPast(warranty);
                    c.chips.add(new Chip(exp ? 'Warranty expired' : 'Warranty active', exp ? 'pill pill-red' : 'pill pill-green'));
                }

                // specs
                c.specs.add(new Spec('VIN', maskVin(str(r, V_VIN))));
                c.specs.add(new Spec('Registration', blankTo(str(r, V_REG),'\u2014')));
                c.specs.add(new Spec('Fuel', blankTo(fuelLabel(fuel, c.isEv),'\u2014')));
                c.specs.add(new Spec('Odometer', odo==null ? '\u2014' : fmtInt(odo) + ' km'));
                c.specs.add(new Spec('Purchased', fmtDate(purchase)));
                c.specs.add(new Spec('Condition', filterJoin(new List<String>{ cond, String.isBlank(c.financier)?null:'Financed' })));
            }
        } catch (Exception e) {}

        // --- owner resolution (CUST -> unified) ---
        resolveOwner(c);

        // --- selling dealer ---
        try {
            if (String.isNotBlank(c.dealerCode)) {
                List<Map<String,Object>> rows = runRows(
                    'SELECT ' + A_NAME + ', ' + A_CITY + ', ' + A_STATE +
                    ' FROM ' + ACCOUNT + ' WHERE ' + A_ID + ' = \'' + esc(c.dealerCode) + '\' LIMIT 1');
                if (!rows.isEmpty()) {
                    c.dealerName = str(rows[0], A_NAME);
                    c.dealerSub = filterJoin(new List<String>{ str(rows[0], A_CITY), str(rows[0], A_STATE) });
                }
            }
        } catch (Exception e) {}
        if (String.isBlank(c.dealerSub)) c.dealerSub = 'Original sale';

        // --- telematics DTCs ---
        Integer openDtc = 0;
        String topDtcCode = null, topDtcCat = null, topDtcPrio = null, lastEvent = null;
        try {
            List<Map<String,Object>> rows = runRows(
                'SELECT ' + String.join(new List<String>{ T_ID, T_TYPE, T_CAT, T_PRIO, T_SPEED, T_WHEN, T_LAT, T_LONG }, ', ') +
                ' FROM ' + TEL + ' WHERE ' + T_VEH + ' = \'' + esc(vehId) + '\' LIMIT 40');
            c.srcTelematics = rows.size();
            List<Map<String,Object>> sorted = rows;
            for (Map<String,Object> r : rows) {
                String prio = str(r, T_PRIO);
                DtcRow d = new DtcRow();
                d.code = str(r, T_TYPE);
                d.sysName = str(r, T_CAT);
                d.severity = blankTo(prio, 'Info');
                d.sevClass = sevClass(prio);
                d.detected = fmtDate(str(r, T_WHEN));
                Decimal sp = dec(r, T_SPEED);
                d.speed = sp==null ? '\u2014' : sp.setScale(0) + ' km/h';
                c.dtcs.add(d);
                openDtc++;
                if (topDtcCode == null) { topDtcCode = d.code; topDtcCat = d.sysName; topDtcPrio = d.severity; }
                if (lastEvent == null) lastEvent = fmtMonthYear(str(r, T_WHEN));

                // event stream
                TelRow t = new TelRow();
                t.tone = ('Critical'.equalsIgnoreCase(prio)) ? 'alert' : ('Warning'.equalsIgnoreCase(prio) ? 'warn' : '');
                String coords = coordLine(str(r, T_LAT), str(r, T_LONG));
                t.dateLine = filterJoin(new List<String>{ fmtDateTime(str(r, T_WHEN)), coords });
                t.text = d.code + ' ' + blankTo(d.sysName,'') + ' (' + d.severity + ') @ ' + d.speed + (String.isBlank(str(r,T_ID))?'':' — ' + str(r,T_ID));
                c.telStream.add(t);
            }
        } catch (Exception e) {}

        // --- health composite ---
        computeHealth(c, warranty, amc, insurance, odo, openDtc, topDtcCode, topDtcPrio);

        // --- battery (EV only, derived) ---
        if (c.isEv) buildBattery(c, odo, purchase);

        // --- service history ---
        buildServices(c, vehId);

        // --- telematics tiles ---
        c.telTiles.add(new Status('', 'Lifetime odo', odo==null ? '\u2014' : fmtInt(odo) + ' km'));
        c.telTiles.add(new Status(openDtc>0?'warn':'ok', 'Open DTCs', openDtc>0 ? openDtc + ' · ' + blankTo(topDtcCode,'') : 'None'));
        c.telTiles.add(new Status('', 'Last event', blankTo(lastEvent,'\u2014')));
        c.telTiles.add(new Status('', 'Fuel', blankTo(fuelLabel(null, c.isEv), c.isEv?'Electric':'\u2014')));
        if (String.isNotBlank(topDtcPrio)) c.telTiles.add(new Status(topDtcPrio.equalsIgnoreCase('Critical')?'bad':'warn', 'Priority', topDtcPrio));
        if (String.isNotBlank(topDtcCat)) c.telTiles.add(new Status('', 'Category', topDtcCat));

        // --- ownership tiles + garage ---
        c.ownershipTiles.add(new Status('', 'Financier', blankTo(c.financier,'\u2014')));
        c.ownershipTiles.add(new Status('', 'EMI', blankTo(c.emi,'\u2014')));
        c.ownershipTiles.add(new Status('', 'Loan end', 'Not set'));
        c.ownershipTiles.add(new Status('', 'Condition at sale', blankTo(cond,'\u2014')));
        buildGarage(c, vehId);

        // --- model context ---
        buildModelContext(c);

        // --- alerts (right) ---
        buildAlerts(c, warranty, amc, insurance);

        // --- recommendations ---
        c.recommendations = buildRecommendations(c, warranty, odo, cond, openDtc, topDtcCode);
        return c;
    }

    /* ============================ OWNER ============================ */
    private static void resolveOwner(Vehicle360 c) {
        if (String.isBlank(c.ownerId)) return;
        String hex = null;
        try {
            List<Map<String,Object>> lk = runRows(
                'SELECT ' + LINK_UNI + ' FROM ' + LINK + ' WHERE ' + LINK_SRC + ' = \'' + esc(c.ownerId) + '\' LIMIT 1');
            if (!lk.isEmpty()) hex = str(lk[0], LINK_UNI);
        } catch (Exception e) {}
        String city=null, tier=null;
        if (String.isNotBlank(hex)) {
            try {
                List<Map<String,Object>> ind = runRows(
                    'SELECT ' + String.join(new List<String>{ U_FIRST, U_LAST, U_CITY, U_STATE, U_TIER }, ', ') +
                    ' FROM ' + UNIFIED + ' WHERE ' + U_ID + ' = \'' + esc(hex) + '\' LIMIT 1');
                if (!ind.isEmpty()) {
                    Map<String,Object> r = ind[0];
                    String fn = str(r, U_FIRST), ln = str(r, U_LAST);
                    c.ownerName = (blankTo(fn,'') + ' ' + blankTo(ln,'')).trim();
                    c.ownerInitials = initials(fn, ln);
                    city = filterJoin(new List<String>{ str(r, U_CITY), str(r, U_STATE) });
                    tier = str(r, U_TIER);
                }
            } catch (Exception e) {}
            try {
                List<Map<String,Object>> ls = runRows(
                    'SELECT ' + CI_LEAD_V + ' FROM ' + CI_LEAD + ' WHERE ' + CI_LEAD_IND + ' = \'' + esc(hex) + '\' LIMIT 1');
                if (!ls.isEmpty()) {
                    Decimal v = dec(ls[0], CI_LEAD_V);
                    if (v != null) c.ownerLeadLine = 'lead score ' + v.intValue() + '/' + LEAD_MAX;
                }
            } catch (Exception e) {}
        }
        if (String.isBlank(c.ownerName)) { c.ownerName = c.ownerId; c.ownerInitials = 'O'; }
        c.ownerSub = filterJoin(new List<String>{ blankTo(tier,'Bronze'), city, c.ownerId });
    }

    /* ============================ HEALTH ============================ */
    private static void computeHealth(Vehicle360 c, String warranty, String amc, String insurance,
                                      Decimal odo, Integer openDtc, String topDtcCode, String topDtcPrio) {
        Integer h = 100;
        // warranty
        Boolean wExp = String.isBlank(warranty) || isPast(warranty);
        if (String.isBlank(warranty)) c.healthTiles.add(new Status('bad', '\uD83D\uDEE1\uFE0F Warranty', 'None'));
        else if (wExp) { h -= 20; c.healthTiles.add(new Status('bad', '\uD83D\uDEE1\uFE0F Warranty', 'Expired ' + fmtMonthYear(warranty))); }
        else c.healthTiles.add(new Status('ok', '\uD83D\uDEE1\uFE0F Warranty', 'Active · ' + fmtMonthYear(warranty)));
        // amc
        Boolean amcNone = isNoneish(amc);
        if (amcNone) { h -= 15; c.healthTiles.add(new Status('bad', '\uD83D\uDD27 AMC', blankTo(amc,'None'))); }
        else c.healthTiles.add(new Status('ok', '\uD83D\uDD27 AMC', amc));
        // insurance
        Boolean insActive = String.isNotBlank(insurance) && !isPast(insurance);
        if (insActive) c.healthTiles.add(new Status('ok', '\uD83D\uDCC4 Insurance', 'Active · ' + fmtMonthYear(insurance)));
        else { h -= 15; c.healthTiles.add(new Status('bad', '\uD83D\uDCC4 Insurance', String.isBlank(insurance)?'None':'Expired ' + fmtMonthYear(insurance))); }
        // dtc
        if (openDtc > 0) {
            Boolean crit = 'Critical'.equalsIgnoreCase(topDtcPrio);
            h -= crit ? 25 : 12;
            c.healthTiles.add(new Status(crit?'bad':'warn', '\u2699\uFE0F ' + blankTo(topDtcCode,'DTC'), (crit?'Critical':'Warning') + ' open'));
        }
        // mileage
        if (odo != null && odo > 150000) h -= 10;
        c.health = Math.max(0, Math.min(100, h));
        c.healthTone = c.health >= 75 ? 'var(--green)' : (c.health >= 50 ? 'var(--orange)' : 'var(--red)');
        c.healthPill = openDtc>0 ? openDtc + ' open warning' + (openDtc>1?'s':'') : 'No open warnings';
        List<String> flags = new List<String>();
        if (odo != null && odo > 150000) flags.add('high-mileage (' + fmtInt(odo) + ' km)');
        if (wExp) flags.add('out-of-warranty');
        if (c.isEv) flags.add('EV');
        c.healthNote = flags.isEmpty()
            ? 'Vehicle is within normal health parameters.'
            : capitalize(String.join(flags, ', ')) + ' — a candidate for an exchange / upgrade conversation.';
    }

    /* ============================ BATTERY (derived) ============================ */
    private static void buildBattery(Vehicle360 c, Decimal odo, String purchase) {
        c.showBattery = true;
        Integer km = odo==null ? 60000 : odo.intValue();
        // SoH degrades ~1% per 12k km, floor 60
        Integer soh = Math.max(60, 100 - (Integer) Math.round(km / 12000.0));
        Integer soc = Math.max(35, Math.min(92, 90 - Math.mod(km/1000, 40)));
        Integer range = (Integer) Math.round((soh/100.0) * (soc/100.0) * 465);
        Integer cycles = (Integer) Math.round(km / 210.0);
        c.soh = soh; c.soc = soc;
        c.socStyle = 'width:' + soc + '%';
        c.range = range + ' km';
        c.cycles = '~' + cycles;
    }

    /* ============================ SERVICE ============================ */
    private static void buildServices(Vehicle360 c, String vehId) {
        try {
            List<Map<String,Object>> rows = runRows(
                'SELECT Service_Date__c, Service_Category__c, ssot__ServiceAppointmentType__c, Dealer_Code__c, ' +
                'Odometer_At_Service__c, Total_Amount__c, NPS_Score__c FROM ' + SERVICE +
                ' WHERE ' + S_VEH + ' = \'' + esc(vehId) + '\' LIMIT 40');
            for (Map<String,Object> r : rows) {
                SvcRow s = new SvcRow();
                s.svcDate = str(r, 'Service_Date__c');
                s.category = str(r, 'Service_Category__c');
                s.svcType = str(r, 'ssot__ServiceAppointmentType__c');
                Decimal amt = dec(r, 'Total_Amount__c');
                s.amount = amt==null ? '\u2014' : '\u20B9' + fmtInt(amt);
                Boolean free = amt==null || amt==0;
                s.typeClass = free ? 'pill pill-green' : 'pill pill-gold';
                if (String.isBlank(s.svcType)) s.svcType = free ? 'Free' : 'Paid';
                s.dealer = str(r, 'Dealer_Code__c');
                Decimal od = dec(r, 'Odometer_At_Service__c');
                s.odo = od==null ? '\u2014' : fmtInt(od);
                s.nps = blankTo(fmtIntN(dec(r, 'NPS_Score__c')), '\u2014');
                c.services.add(s);
            }
            c.services.sort(new SvcDateDesc());
            c.srcServices = c.services.size();
            for (SvcRow s : c.services) s.svcDate = fmtDate(s.svcDate);
        } catch (Exception e) {}
    }
    class SvcDateDesc implements Comparator<SvcRow> {
        public Integer compare(SvcRow a, SvcRow b){
            String x=a.svcDate==null?'':a.svcDate, y=b.svcDate==null?'':b.svcDate; return y.compareTo(x);
        }
    }

    /* ============================ GARAGE ============================ */
    private static void buildGarage(Vehicle360 c, String vehId) {
        if (String.isBlank(c.ownerId)) return;
        try {
            List<Map<String,Object>> rows = runRows(
                'SELECT ' + String.join(new List<String>{ V_ID, V_MODEL, V_VARIANT, V_FUEL, V_REG, V_AMC, V_WARR, V_ODO }, ', ') +
                ' FROM ' + VEHICLE + ' WHERE ' + V_OWNER + ' = \'' + esc(c.ownerId) + '\' LIMIT 12');
            c.garageCount = rows.size();
            for (Map<String,Object> r : rows) {
                GarageRow g = new GarageRow();
                g.model = str(r, V_MODEL);
                g.variant = str(r, V_VARIANT);
                Boolean ev = isEvFuel(str(r, V_FUEL), g.model);
                g.fuel = ev ? 'EV' : blankTo(str(r, V_FUEL),'\u2014');
                g.reg = str(r, V_REG);
                g.isThis = vehId.equalsIgnoreCase(str(r, V_ID));
                String amc = str(r, V_AMC);
                Decimal odo = dec(r, V_ODO);
                Boolean amcActive = String.isNotBlank(amc) && !isNoneish(amc);
                if (amcActive) { g.status = 'AMC active'; g.statusClass = 'pill pill-green'; }
                else if (odo != null && odo > 120000) { g.status = 'Ageing'; g.statusClass = 'pill pill-gold'; }
                else { g.status = blankTo(amc,'Active'); g.statusClass = 'pill pill-grey'; }
                c.garage.add(g);
            }
        } catch (Exception e) {}
    }

    /* ============================ MODEL CONTEXT ============================ */
    private static void buildModelContext(Vehicle360 c) {
        if (String.isBlank(c.model)) return;
        try {
            List<Map<String,Object>> rows = runRows(
                'SELECT views__c, purchases__c, test_drives__c, finance_enquiries__c FROM ' + MODELPOP +
                ' WHERE model__c = \'' + esc(c.model) + '\' LIMIT 1');
            if (!rows.isEmpty()) {
                Map<String,Object> r = rows[0];
                c.modelViews = fmtInt(dec(r, 'views__c'));
                c.modelBuys = fmtInt(dec(r, 'purchases__c'));
                c.modelTestDrives = fmtInt(dec(r, 'test_drives__c'));
                c.modelFinance = fmtInt(dec(r, 'finance_enquiries__c'));
            }
        } catch (Exception e) {}
    }

    /* ============================ ALERTS + RECS ============================ */
    private static void buildAlerts(Vehicle360 c, String warranty, String amc, String insurance) {
        Boolean wExp = String.isBlank(warranty) || isPast(warranty);
        Boolean amcNone = isNoneish(amc);
        if (wExp) { TelRow t = new TelRow(); t.tone='warn'; t.dateLine='Warranty'; t.text = (String.isBlank(warranty)?'No warranty':'Expired ' + fmtMonthYear(warranty)) + (amcNone?' · no AMC':''); c.alerts.add(t); }
        if (!c.dtcs.isEmpty()) { TelRow t = new TelRow(); t.tone='warn'; t.dateLine='Diagnostics'; t.text = c.dtcs[0].code + ' ' + blankTo(c.dtcs[0].sysName,'') + ' warning open'; c.alerts.add(t); }
        if (String.isNotBlank(insurance) && !isPast(insurance)) { TelRow t = new TelRow(); t.tone='good'; t.dateLine='Insurance'; t.text = 'Active to ' + fmtMonthYear(insurance); c.alerts.add(t); }
    }
    private static List<Nba> buildRecommendations(Vehicle360 c, String warranty, Decimal odo, String cond, Integer openDtc, String topDtcCode) {
        List<Nba> n = new List<Nba>();
        Boolean wExp = String.isBlank(warranty) || isPast(warranty);
        Boolean highKm = odo != null && odo > 120000;
        Boolean exch = String.isNotBlank(cond) && cond.equalsIgnoreCase('Exchange');
        if (wExp || highKm || exch)
            n.add(new Nba('\uD83D\uDE99 Exchange this vehicle \u2192 newer model', 86,
                filterJoin(new List<String>{ odo==null?null:fmtInt(odo)+' km', wExp?'warranty expired':null, exch?'exchange condition':null }) +
                '. Trigger an exchange-bonus offer and a trade-in valuation.'));
        if (openDtc > 0)
            n.add(new Nba('\u2699\uFE0F Book diagnostic (' + blankTo(topDtcCode,'DTC') + ')', 62,
                'Open diagnostic warning. Offer a paid multi-point inspection at the owner\'s nearest dealer.'));
        if (c.isEv)
            n.add(new Nba('\uD83D\uDD0B Battery health report + trade-in valuation', 54,
                'Provide a transparent State-of-Health report to build trust and anchor the trade-in value.'));
        if (n.isEmpty())
            n.add(new Nba('\uD83D\uDCC5 Service / AMC renewal outreach', 50,
                'Keep the vehicle in the service network with a bundled AMC + inspection offer.'));
        return n;
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
    private static Boolean isNoneish(String s){
        if (String.isBlank(s)) return true;
        String x = s.toLowerCase();
        return x.contains('none') || x=='no' || x.contains('expired') || x.contains('not');
    }
    private static Boolean isEvFuel(String fuel, String model){
        String f = fuel==null ? '' : fuel.toLowerCase();
        return f=='ev' || f=='electric' || (model != null && model.toLowerCase().endsWith('.ev'));
    }
    private static String fuelLabel(String fuel, Boolean isEv){
        if (isEv) return 'Electric';
        return String.isBlank(fuel) ? null : fuel;
    }
    private static String sevClass(String prio){
        if (String.isBlank(prio)) return 'pill pill-grey';
        if (prio.equalsIgnoreCase('Critical')) return 'pill pill-red';
        if (prio.equalsIgnoreCase('Warning')) return 'pill pill-gold';
        return 'pill pill-blue';
    }
    private static String maskVin(String vin){
        if (String.isBlank(vin)) return '\u2014';
        if (vin.length() <= 10) return vin;
        return vin.substring(0,5) + '\u2026' + vin.substring(vin.length()-5);
    }
    private static String coordLine(String lat, String lng){
        Decimal la = tryDec(lat), lo = tryDec(lng);
        if (la==null || lo==null) return null;
        return 'lat ' + la.setScale(2) + ', long ' + lo.setScale(2);
    }
    private static String capitalize(String s){
        if (String.isBlank(s)) return s;
        return s.substring(0,1).toUpperCase() + s.substring(1);
    }
    private static Boolean isPast(String iso){
        Date d = parseDate(iso);
        return d != null && d < Date.today();
    }
    private static Date parseDate(String iso){
        if (String.isBlank(iso) || iso.length() < 10) return null;
        try { return Date.valueOf(iso.substring(0,10)); } catch(Exception e){ return null; }
    }
    private static final Set<String> KNOWN = new Set<String>{
        'nova','crest','hawk','savanna','tern','spark','aero','summit' };
    private static String imageKey(String model){
        if (String.isBlank(model)) return null;
        String k = model.toLowerCase().replace('.ev','').replaceAll('[^a-z]','');
        return KNOWN.contains(k) ? k : null;
    }
    private static String initials(String fn, String ln){
        String a = String.isBlank(fn) ? '' : fn.substring(0,1);
        String b = String.isBlank(ln) ? '' : ln.substring(0,1);
        String r = (a+b).toUpperCase();
        return r=='' ? '?' : r;
    }
    private static String str(Map<String,Object> r, String key){
        if (r==null) return null;
        Object v = r.get(key);
        return v==null ? null : String.valueOf(v);
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
    private static Decimal tryDec(String s){
        if (String.isBlank(s)) return null;
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
    private static String filterJoin(List<String> parts){
        List<String> keep = new List<String>();
        for (String p : parts) if (String.isNotBlank(p)) keep.add(p);
        return keep.isEmpty() ? '\u2014' : String.join(keep, ' \u00B7 ');
    }
    private static String fmtInt(Decimal d){ return d==null?'0':d.setScale(0).format(); }
    private static String fmtIntN(Decimal d){ return d==null?null:d.setScale(0).toPlainString(); }
    private static String fmtDate(String iso){
        Date d = parseDate(iso);
        if (d == null) return String.isBlank(iso) ? '\u2014' : iso;
        return d.day() + ' ' + MONTHS[d.month()-1] + ' ' + d.year();
    }
    private static String fmtMonthYear(String iso){
        Date d = parseDate(iso);
        if (d == null) return String.isBlank(iso) ? '\u2014' : iso;
        return MONTHS[d.month()-1] + ' ' + d.year();
    }
    private static String fmtDateTime(String iso){
        if (String.isBlank(iso)) return null;
        String datePart = fmtDate(iso);
        if (iso.length() >= 16 && iso.contains('T')) {
            String tm = iso.substring(11,16);
            return datePart + ' · ' + tm;
        }
        return datePart;
    }
    private static String yearOf(String iso){
        if (String.isBlank(iso) || iso.length() < 4) return null;
        String y = iso.substring(0,4);
        return y.isNumeric() ? y : null;
    }
    private static final List<String> MONTHS = new List<String>{
        'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' };
}
