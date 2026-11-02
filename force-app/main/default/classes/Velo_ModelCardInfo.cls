@JsonAccess(serializable='always' deserializable='always')
global class Velo_ModelCardInfo {
    @AuraEnabled
    global String modelName;

    @AuraEnabled
    global String tagline;

    // Either a full https URL, or a bare key (e.g. 'nova') resolved
    // against the veloVehicleImages static resource by the LWC.
    @AuraEnabled
    global String imageUrl;

    @AuraEnabled
    global String priceRange;

    @AuraEnabled
    global List<String> fuelOptions;

    @AuraEnabled
    global List<String> keySpecs;

    @AuraEnabled
    global List<String> features;

    @AuraEnabled
    global String ctaLabel;

    @AuraEnabled
    global String ctaUrl;

    public Velo_ModelCardInfo() {}
}
