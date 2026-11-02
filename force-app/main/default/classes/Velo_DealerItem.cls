@JsonAccess(serializable='always' deserializable='always')
global class Velo_DealerItem {
    @AuraEnabled
    global String name;

    @AuraEnabled
    global String category;

    @AuraEnabled
    global String address;

    @AuraEnabled
    global String phone;

    @AuraEnabled
    global String mapsUrl;

    public Velo_DealerItem() {}
}
