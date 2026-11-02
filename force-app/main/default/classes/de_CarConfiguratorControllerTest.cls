@isTest
private class de_CarConfiguratorControllerTest {

    @testSetup
    static void setup() {
        insert new Vehicle_Model__c(
            Name = 'Velo Spark',
            de_ResourceName__c = 'de_carModel_spark',
            de_Customizable__c = true,
            de_MaterialMap__c = '{"body":["ext_colorbody"]}',
            de_SortOrder__c = 1
        );
    }

    @isTest
    static void testGetModels() {
        Test.startTest();
        List<Vehicle_Model__c> models = de_CarConfiguratorController.getModels();
        Test.stopTest();
        System.assertEquals(1, models.size(), 'Expected the seeded model');
        System.assertEquals('de_carModel_spark', models[0].de_ResourceName__c);
    }

    @isTest
    static void testSaveConfiguration() {
        Vehicle_Model__c v = [SELECT Id FROM Vehicle_Model__c LIMIT 1];
        Test.startTest();
        Id cfgId = de_CarConfiguratorController.saveConfiguration(
            v.Id,
            '{"paint":"#b81f24","roof":"black"}',
            'Spark · Coral Red · Black roof'
        );
        Test.stopTest();
        System.assertNotEquals(null, cfgId, 'Configuration should be inserted');
        Vehicle_Configuration__c cfg = [
            SELECT de_Vehicle__c, de_Summary__c, de_SelectionsJSON__c
            FROM Vehicle_Configuration__c WHERE Id = :cfgId
        ];
        System.assertEquals(v.Id, cfg.de_Vehicle__c);
        System.assertEquals('Spark · Coral Red · Black roof', cfg.de_Summary__c);
    }
}
