/**
 * Backend for the agentVeloAccessories renderer LWC.
 * Persists a customer's chosen accessories as a Vehicle_Configuration__c so the
 * in-chat cart can be saved to their build.
 */
public with sharing class Velo_AccessoriesController {

    /**
     * @param modelName      display name of the model (e.g. "Velo Summit"); used to
     *                       resolve the optional Vehicle_Model__c lookup.
     * @param selectionsJson JSON blob of the chosen accessories + running total.
     * @param summary        short human-readable summary (<=255 chars).
     */
    @AuraEnabled
    public static Id saveAccessories(String modelName, String selectionsJson, String summary) {
        Vehicle_Configuration__c cfg = new Vehicle_Configuration__c(
            de_SelectionsJSON__c = selectionsJson,
            de_Summary__c        = summary != null && summary.length() > 255
                                       ? summary.substring(0, 255)
                                       : summary
        );

        if (String.isNotBlank(modelName)) {
            List<Vehicle_Model__c> models = [
                SELECT Id FROM Vehicle_Model__c
                WHERE Name = :modelName
                LIMIT 1
            ];
            if (!models.isEmpty()) {
                cfg.de_Vehicle__c = models[0].Id;
            }
        }

        insert cfg;
        return cfg.Id;
    }
}
