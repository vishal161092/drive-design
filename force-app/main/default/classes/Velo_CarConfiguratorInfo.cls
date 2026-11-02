@JsonAccess(serializable='always' deserializable='always')
global class Velo_CarConfiguratorInfo {
    @AuraEnabled
    global String heading;

    @AuraEnabled
    global String prompt;

    // Static-resource API name of the model to open on first, e.g. "de_carModel_summit".
    @AuraEnabled
    global String defaultResourceName;

    // The locked model's record data (Name, tagline, customizable flag, material map)
    // serialized server-side, so the embedded configurator can render WITHOUT a
    // client-side Apex call — which fails for the messaging site's session user.
    @AuraEnabled
    global String modelJson;

    public Velo_CarConfiguratorInfo() {}
}
