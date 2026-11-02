// Seed / re-seed the configurator car list. Safe to re-run (clears + inserts).
// All models are fictional. The bundled de_carModel_* static resources are tiny
// procedural placeholder GLBs that share one material naming scheme, so a single
// MaterialMap works for all. If you swap in your own GLBs, update de_MaterialMap__c
// per model (role -> material-name substrings).
delete [SELECT Id FROM Vehicle_Model__c];

String MAT = '{"body":["body"],"roof":["roof"],"glass":["glass"],"rim":["rim"],"caliper":["caliper"],"trim":["trim"],"light":["light"],"interior":["interior"]}';
List<Vehicle_Model__c> cars = new List<Vehicle_Model__c>{
    new Vehicle_Model__c(
        Name = 'Velo Spark',
        de_ResourceName__c = 'de_carModel_spark',
        de_Tagline__c = 'Compact SUV · Built for the city',
        de_Customizable__c = true,
        de_SortOrder__c = 1,
        de_MaterialMap__c = MAT
    ),
    new Vehicle_Model__c(
        Name = 'Velo Tern',
        de_ResourceName__c = 'de_carModel_tern',
        de_Tagline__c = 'The stylish hatchback',
        de_Customizable__c = true,
        de_SortOrder__c = 2,
        de_MaterialMap__c = MAT
    ),
    new Vehicle_Model__c(
        Name = 'Velo Aero',
        de_ResourceName__c = 'de_carModel_aero',
        de_Tagline__c = 'The premium hatch',
        de_Customizable__c = true,
        de_SortOrder__c = 3,
        de_MaterialMap__c = MAT
    ),
    new Vehicle_Model__c(
        Name = 'Velo Pico',
        de_ResourceName__c = 'de_carModel_pico',
        de_Tagline__c = 'The friendly city car',
        de_Customizable__c = true,
        de_SortOrder__c = 4,
        de_MaterialMap__c = MAT
    ),
    new Vehicle_Model__c(
        Name = 'Velo Hawk',
        de_ResourceName__c = 'de_carModel_hawk',
        de_Tagline__c = 'Made for those who dare',
        de_Customizable__c = true,
        de_SortOrder__c = 5,
        de_MaterialMap__c = MAT
    ),
    new Vehicle_Model__c(
        Name = 'Velo Crest',
        de_ResourceName__c = 'de_carModel_crest',
        de_Tagline__c = 'The SUV coupé',
        de_Customizable__c = true,
        de_SortOrder__c = 6,
        de_MaterialMap__c = MAT
    ),
    new Vehicle_Model__c(
        Name = 'Velo Summit',
        de_ResourceName__c = 'de_carModel_summit',
        de_Tagline__c = 'Command every road',
        de_Customizable__c = true,
        de_SortOrder__c = 7,
        de_MaterialMap__c = MAT
    ),
    new Vehicle_Model__c(
        Name = 'Velo Nova EV',
        de_ResourceName__c = 'de_carModel_nova',
        de_Tagline__c = 'Electric SUV · 360° view',
        de_Customizable__c = true,
        de_SortOrder__c = 8,
        de_MaterialMap__c = MAT
    )
};
insert cars;
System.debug('Seeded ' + cars.size() + ' vehicle models.');
