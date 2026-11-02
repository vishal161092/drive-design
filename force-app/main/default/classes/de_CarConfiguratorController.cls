/**
 * Backend for the de_carConfigurator LWC.
 *  - getModels(): the cars available in the picker (glTF resource + material map).
 *  - saveConfiguration(): persist a customer's build as a Vehicle_Configuration__c.
 */
public with sharing class de_CarConfiguratorController {

    @AuraEnabled(cacheable=true)
    public static List<Vehicle_Model__c> getModels() {
        return [
            SELECT Id, Name, de_ResourceName__c, de_Tagline__c,
                   de_Customizable__c, de_MaterialMap__c, de_SortOrder__c
            FROM Vehicle_Model__c
            ORDER BY de_SortOrder__c NULLS LAST, Name
        ];
    }

    @AuraEnabled
    public static Id saveConfiguration(String vehicleId, String selectionsJson, String summary) {
        Vehicle_Configuration__c cfg = new Vehicle_Configuration__c(
            de_SelectionsJSON__c = selectionsJson,
            de_Summary__c        = summary
        );
        if (String.isNotBlank(vehicleId)) {
            cfg.de_Vehicle__c = (Id) vehicleId;
        }
        insert cfg;
        return cfg.Id;
    }
}
