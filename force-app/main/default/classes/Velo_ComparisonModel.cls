@JsonAccess(serializable='always' deserializable='always')
global class Velo_ComparisonModel {
    @AuraEnabled
    global String name;

    // Either a full https URL, or a bare key (e.g. 'nova') resolved
    // against the veloVehicleImages static resource by the LWC.
    @AuraEnabled
    global String imageUrl;

    @AuraEnabled
    global String price;

    @AuraEnabled
    global String ctaUrl;

    // Values aligned to the parent Velo_ModelComparisonInfo.specLabels order.
    @AuraEnabled
    global List<String> specValues;

    public Velo_ComparisonModel() {}
}
