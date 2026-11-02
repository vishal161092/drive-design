@JsonAccess(serializable='always' deserializable='always')
global class Velo_AccessoriesInfo {
    @AuraEnabled
    global String heading;

    @AuraEnabled
    global String modelName;

    // Static-resource key of the accessorized hero shot for this model.
    @AuraEnabled
    global String heroImageKey;

    @AuraEnabled
    global String currencySymbol;

    @AuraEnabled
    global List<Velo_AccessoryItem> items;

    public Velo_AccessoriesInfo() {
        this.currencySymbol = '₹';
        this.items = new List<Velo_AccessoryItem>();
    }
}
