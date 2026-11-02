global class Velo_CarConfiguratorAction {

    global class Input {
        @InvocableVariable(required=false description='Velo model key to open the 3D configurator on, e.g. "summit", "spark", "tern", "aero", "pico". Defaults to Summit.')
        global String modelKey;
    }

    @InvocableMethod(
        label='Get Car Configurator'
        description='Returns the interactive 3D car configurator card (veloCarConfigurator lightning type) so the customer can personalize a Velo model live in chat — paint, wheels, interior, and more. Call this whenever the customer wants to customize, configure, personalize, build, or see a car in 3D.'
    )
    global static List<Velo_CarConfiguratorResponse> getConfigurator(List<Input> inputs) {
        List<Velo_CarConfiguratorResponse> outputList = new List<Velo_CarConfiguratorResponse>();
        if (inputs == null || inputs.isEmpty()) {
            outputList.add(buildResponse(null));
            return outputList;
        }
        for (Input inp : inputs) {
            outputList.add(buildResponse(inp));
        }
        return outputList;
    }

    private static Velo_CarConfiguratorResponse buildResponse(Input inp) {
        String key = (inp != null && String.isNotBlank(inp.modelKey))
            ? inp.modelKey.toLowerCase().trim().replace(' ', '_')
            : 'summit';

        // Map the friendly model key to the glb static-resource API name the configurator uses.
        Map<String, String> keyToResource = new Map<String, String>{
            'summit'  => 'de_carModel_summit',
            'spark'   => 'de_carModel_spark',
            'tern'   => 'de_carModel_tern',
            'aero'  => 'de_carModel_aero',
            'pico'    => 'de_carModel_pico',
            'hawk' => 'de_carModel_hawk',
            'crest'   => 'de_carModel_crest',
            'nova'   => 'de_carModel_nova',
            'nova_ev'=> 'de_carModel_nova'
        };
        String resourceName = keyToResource.containsKey(key)
            ? keyToResource.get(key)
            : 'de_carModel_summit';

        Velo_CarConfiguratorInfo info = new Velo_CarConfiguratorInfo();
        info.heading = 'Customize your Velo';
        info.prompt = 'Personalize your car below — paint, finish, wheels, and interior. Rotate to view it from every angle, then save your build.';
        info.defaultResourceName = resourceName;

        // Serialize the locked model server-side so the embedded configurator renders
        // without a client Apex callout (which fails for the web-messaging session user).
        List<Vehicle_Model__c> models = [
            SELECT Id, Name, de_ResourceName__c, de_Tagline__c,
                   de_Customizable__c, de_MaterialMap__c
            FROM Vehicle_Model__c
            WHERE de_ResourceName__c = :resourceName
            LIMIT 1
        ];
        if (!models.isEmpty()) {
            Vehicle_Model__c m = models[0];
            info.modelJson = JSON.serialize(new Map<String, Object>{
                'Id' => m.Id,
                'Name' => m.Name,
                'de_ResourceName__c' => m.de_ResourceName__c,
                'de_Tagline__c' => m.de_Tagline__c,
                'de_Customizable__c' => m.de_Customizable__c,
                'de_MaterialMap__c' => m.de_MaterialMap__c
            });
        }

        Velo_CarConfiguratorResponse resp = new Velo_CarConfiguratorResponse();
        resp.result = info;
        return resp;
    }
}
