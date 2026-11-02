@JsonAccess(serializable='always' deserializable='always')
global class Velo_BookingOption {
    @AuraEnabled
    global String label;

    @AuraEnabled
    global String description;

    @AuraEnabled
    global String value;

    public Velo_BookingOption() {}

    public Velo_BookingOption(String label, String description, String value) {
        this.label = label;
        this.description = description;
        this.value = value;
    }
}
