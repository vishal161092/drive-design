@JsonAccess(serializable='always' deserializable='always')
global class Velo_ModelComparisonInfo {
    @AuraEnabled
    global String heading;

    @AuraEnabled
    global List<String> specLabels;

    @AuraEnabled
    global List<Velo_ComparisonModel> models;

    public Velo_ModelComparisonInfo() {}
}
