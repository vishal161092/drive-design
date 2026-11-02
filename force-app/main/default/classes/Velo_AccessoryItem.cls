@JsonAccess(serializable='always' deserializable='always')
global class Velo_AccessoryItem {
    @AuraEnabled
    global String id;

    @AuraEnabled
    global String name;

    // One of: Exterior, Interior, Protection, Technology, Utility, Styling
    @AuraEnabled
    global String category;

    @AuraEnabled
    global String description;

    // Static-resource image key (file name without extension) inside veloAccessoryImages.
    @AuraEnabled
    global String imageKey;

    @AuraEnabled
    global Decimal priceAmount;

    // Flag a few popular picks so the card can badge them.
    @AuraEnabled
    global Boolean recommended;

    public Velo_AccessoryItem() {
        this.recommended = false;
    }
}
