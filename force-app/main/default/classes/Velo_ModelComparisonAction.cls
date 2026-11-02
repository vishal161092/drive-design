global class Velo_ModelComparisonAction {

    global class Input {
        @InvocableVariable(required=false description='Comma-separated Velo model keys to compare, e.g. "nova,hawk,spark". Supported: nova, hawk, spark, crest, nova_ev, summit. Defaults to nova,hawk,spark.')
        global String modelsCsv;
    }

    @InvocableMethod(
        label='Compare Velo Models'
        description='Returns a side-by-side comparison card of two or more Velo models (price, fuel, mileage, seating, safety, transmission) for the veloModelComparison lightning type.'
    )
    global static List<Velo_ModelComparisonResponse> compareModels(List<Input> inputs) {
        List<Velo_ModelComparisonResponse> outputList = new List<Velo_ModelComparisonResponse>();
        if (inputs == null || inputs.isEmpty()) {
            outputList.add(buildResponse(null));
            return outputList;
        }
        for (Input inp : inputs) {
            outputList.add(buildResponse(inp));
        }
        return outputList;
    }

    private static final List<String> SPEC_LABELS = new List<String>{
        'Ex-showroom price', 'Fuel', 'Mileage', 'Seating', 'Safety', 'Transmission'
    };

    private static Velo_ModelComparisonResponse buildResponse(Input inp) {
        List<String> keys = new List<String>();
        if (inp != null && String.isNotBlank(inp.modelsCsv)) {
            for (String raw : inp.modelsCsv.split(',')) {
                String k = raw.toLowerCase().trim().replace(' ', '_');
                if (String.isNotBlank(k)) {
                    keys.add(k);
                }
            }
        }
        if (keys.isEmpty()) {
            keys = new List<String>{ 'nova', 'hawk', 'spark' };
        }

        Velo_ModelComparisonInfo info = new Velo_ModelComparisonInfo();
        info.heading = 'Comparing Velo models';
        info.specLabels = SPEC_LABELS.clone();
        info.models = new List<Velo_ComparisonModel>();
        for (String k : keys) {
            info.models.add(buildModel(k));
        }

        Velo_ModelComparisonResponse resp = new Velo_ModelComparisonResponse();
        resp.result = info;
        return resp;
    }

    // specValues are aligned to SPEC_LABELS order:
    // [Ex-showroom price, Fuel, Mileage, Seating, Safety, Transmission]
    private static Velo_ComparisonModel buildModel(String key) {
        Velo_ComparisonModel m = new Velo_ComparisonModel();
        m.ctaUrl = 'https://velomotors.example/';

        switch on key {
            when 'hawk' {
                m.name = 'Velo Hawk';
                m.imageUrl = 'hawk';
                m.price = 'Rs. 13.00-26.05 Lakh';
                m.specValues = new List<String>{
                    'Rs. 13.00-26.05 Lakh', 'Diesel / Petrol', '~16.8 kmpl (diesel)', '5',
                    '5-Star safety rating', '6MT / 6AT'
                };
            }
            when 'spark' {
                m.name = 'Velo Spark';
                m.imageUrl = 'spark';
                m.price = 'Rs. 5.75-10.77 Lakh';
                m.specValues = new List<String>{
                    'Rs. 5.75-10.77 Lakh', 'Petrol / CNG', '~20 km/kg (CNG, est.)', '5',
                    '5-Star safety rating', '5MT / 5AMT'
                };
            }
            when 'crest' {
                m.name = 'Velo Crest';
                m.imageUrl = 'crest';
                m.price = 'Rs. 10.00-19.00 Lakh';
                m.specValues = new List<String>{
                    'Rs. 10.00-19.00 Lakh', 'Petrol / Diesel', '~16-20 kmpl (est.)', '5',
                    '5-Star safety rating', '6MT / 7DCT'
                };
            }
            when 'nova_ev', 'novaev' {
                m.name = 'Velo Nova.ev';
                m.imageUrl = 'nova';
                m.price = 'Rs. 12.49-17.89 Lakh';
                m.specValues = new List<String>{
                    'Rs. 12.49-17.89 Lakh', 'Electric', 'up to 489 km range', '5',
                    '5-Star safety rating', 'Single-speed AT'
                };
            }
            when 'summit' {
                m.name = 'Velo Summit';
                m.imageUrl = 'summit';
                m.price = 'Rs. 11.49-21.29 Lakh';
                m.specValues = new List<String>{
                    'Rs. 11.49-21.29 Lakh', 'Petrol / Diesel', '~16-19 kmpl (est.)', '5',
                    '5-Star safety rating', '6MT / 6AT / 7DCT'
                };
            }
            when else {
                m.name = 'Velo Nova';
                m.imageUrl = 'nova';
                m.price = 'Rs. 7.39-14.52 Lakh';
                m.specValues = new List<String>{
                    'Rs. 7.39-14.52 Lakh', 'Petrol / Diesel / CNG', '17.2-24.1 kmpl', '5',
                    '5-Star safety rating', '6MT / 6AMT / 7DCT'
                };
            }
        }
        return m;
    }
}
