global class Velo_ModelCardAction {

    global class Input {
        @InvocableVariable(required=false description='Velo model key, e.g. "nova", "hawk", "spark", "crest", "nova_ev", "summit". Defaults to Nova.')
        global String modelKey;
    }

    @InvocableMethod(
        label='Get Velo Model Card'
        description='Returns a rich detail card for a Velo model (image, price range, fuel options, key specs, and features) for the veloModelCard lightning type.'
    )
    global static List<Velo_ModelCardResponse> getModelCard(List<Input> inputs) {
        List<Velo_ModelCardResponse> outputList = new List<Velo_ModelCardResponse>();
        if (inputs == null || inputs.isEmpty()) {
            outputList.add(buildResponse(null));
            return outputList;
        }
        for (Input inp : inputs) {
            outputList.add(buildResponse(inp));
        }
        return outputList;
    }

    private static Velo_ModelCardResponse buildResponse(Input inp) {
        String key = (inp != null && String.isNotBlank(inp.modelKey))
            ? inp.modelKey.toLowerCase().trim().replace(' ', '_')
            : 'nova';

        Velo_ModelCardInfo info = new Velo_ModelCardInfo();

        switch on key {
            when 'hawk' {
                info.modelName = 'Velo Hawk';
                info.tagline = 'Bold. Powerful. Commanding.';
                info.imageUrl = 'hawk';
                info.priceRange = 'Rs. 13.00 - 26.05 Lakh';
                info.fuelOptions = new List<String>{ 'Diesel', 'Petrol' };
                info.keySpecs = new List<String>{
                    'Engine: 2.0L Diesel / 1.5L Turbo Petrol',
                    'Mileage: ~16.8 kmpl (ARAI, diesel)',
                    'Seating: 5',
                    'Safety: 5-Star safety rating',
                    'Transmission: 6MT / 6AT'
                };
                info.features = new List<String>{
                    '36.8 cm (14.5") OLED touchscreen with wireless Android Auto & Apple CarPlay',
                    'Panoramic sunroof',
                    'Level 2+ ADAS',
                    '10-speaker audio with surround sound'
                };
            }
            when 'spark' {
                info.modelName = 'Velo Spark';
                info.tagline = 'The SUV that lets you make a big impact.';
                info.imageUrl = 'spark';
                info.priceRange = 'Rs. 5.75 - 10.77 Lakh';
                info.fuelOptions = new List<String>{ 'Petrol', 'CNG' };
                info.keySpecs = new List<String>{
                    'Engine: 1.2L (NA / Turbo) / CNG',
                    'Seating: 5',
                    'Safety: 5-Star safety rating',
                    'Ground clearance: 187 mm'
                };
                info.features = new List<String>{
                    '26.03 cm (10.25") touchscreen infotainment',
                    'Single-pane electric sunroof',
                    '360-degree camera',
                    '6 airbags standard'
                };
            }
            when 'crest' {
                info.modelName = 'Velo Crest';
                info.tagline = 'Ahead of the curve.';
                info.imageUrl = 'crest';
                info.priceRange = 'Rs. 10.00 - 19.00 Lakh';
                info.fuelOptions = new List<String>{ 'Petrol', 'Diesel' };
                info.keySpecs = new List<String>{
                    'Engine: 1.2L Turbo Petrol / 1.5L Diesel',
                    'Seating: 5',
                    'Safety: 5-Star safety rating',
                    'Transmission: 6MT / 7DCT'
                };
                info.features = new List<String>{
                    '31.24 cm touchscreen & digital cluster',
                    'Level 2 ADAS',
                    'Panoramic sunroof',
                    'Ventilated front seats'
                };
            }
            when 'nova_ev', 'novaev' {
                info.modelName = 'Velo Nova.ev';
                info.tagline = 'The electric SUV that moves you.';
                info.imageUrl = 'nova';
                info.priceRange = 'Rs. 12.49 - 17.89 Lakh';
                info.fuelOptions = new List<String>{ 'Electric' };
                info.keySpecs = new List<String>{
                    'Range: up to 489 km (MIDC, 45 kWh)',
                    'Seating: 5',
                    'Safety: 5-Star safety rating',
                    'Fast charge: 10-80% in ~40 min'
                };
                info.features = new List<String>{
                    '31.24 cm touchscreen with Arcade.ev app suite',
                    'V2L & V2V charging',
                    'Level 2 ADAS',
                    'Multi-mode regen'
                };
            }
            when 'summit' {
                info.modelName = 'Velo Summit';
                info.tagline = 'The legend returns, reimagined.';
                info.imageUrl = 'summit';
                info.priceRange = 'Rs. 11.49 - 21.29 Lakh';
                info.fuelOptions = new List<String>{ 'Petrol', 'Diesel' };
                info.keySpecs = new List<String>{
                    'Engine: 1.5L NA / Turbo Petrol / 1.5L Diesel',
                    'Seating: 5',
                    'Safety: 5-Star safety rating',
                    'Transmission: 6MT / 6AT / 7DCT'
                };
                info.features = new List<String>{
                    'Triple 12.3" screens with AR head-up display',
                    'Largest-in-segment panoramic sunroof',
                    'Level 2 ADAS (~22 features)',
                    '12-speaker audio with surround sound'
                };
            }
            when else {
                info.modelName = 'Velo Nova';
                info.tagline = 'Set the benchmark.';
                info.imageUrl = 'nova';
                info.priceRange = 'Rs. 7.39 - 14.52 Lakh';
                info.fuelOptions = new List<String>{ 'Petrol', 'Diesel', 'CNG' };
                info.keySpecs = new List<String>{
                    'Engine: 1.2L Turbo / 1.5L Diesel / 1.2L CNG',
                    'Mileage: up to 24.08 kmpl (ARAI, diesel)',
                    'Seating: 5',
                    'Safety: 5-Star safety rating',
                    'Transmission: 6MT / 6AMT / 7DCT'
                };
                info.features = new List<String>{
                    '26.03 cm touchscreen with wireless Android Auto & Apple CarPlay',
                    'Air purifier',
                    'Electronic parking brake with auto-hold',
                    '9-speaker audio'
                };
            }
        }

        info.ctaLabel = 'Explore ' + info.modelName;
        info.ctaUrl = 'https://velomotors.example/';

        Velo_ModelCardResponse resp = new Velo_ModelCardResponse();
        resp.result = info;
        return resp;
    }
}
