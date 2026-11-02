@JsonAccess(serializable='always' deserializable='always')
global class Velo_BookingOptionsInfo {
    @AuraEnabled
    global String heading;

    @AuraEnabled
    global String prompt;

    @AuraEnabled
    global List<Velo_BookingOption> options;

    public Velo_BookingOptionsInfo() {
        this.options = new List<Velo_BookingOption>();
    }
}
