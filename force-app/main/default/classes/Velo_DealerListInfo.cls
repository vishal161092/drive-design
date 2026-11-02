@JsonAccess(serializable='always' deserializable='always')
global class Velo_DealerListInfo {
    @AuraEnabled
    global String heading;

    @AuraEnabled
    global List<Velo_DealerItem> dealers;

    public Velo_DealerListInfo() {}
}
