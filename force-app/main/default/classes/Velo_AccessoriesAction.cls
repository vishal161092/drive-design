global class Velo_AccessoriesAction {

    global class Input {
        @InvocableVariable(required=false description='Velo model key the customer is shopping accessories for, e.g. "summit", "spark", "nova". Defaults to Summit.')
        global String modelKey;
    }

    @InvocableMethod(
        label='Get Accessories'
        description='Returns the rich, interactive accessories catalog card (veloAccessories lightning type) with official product photos, prices, and an in-chat add-to-cart. Call this whenever the customer wants to browse, add, or shop accessories / add-ons for a Velo model.'
    )
    global static List<Velo_AccessoriesResponse> getAccessories(List<Input> inputs) {
        List<Velo_AccessoriesResponse> outputList = new List<Velo_AccessoriesResponse>();
        if (inputs == null || inputs.isEmpty()) {
            outputList.add(buildResponse(null));
            return outputList;
        }
        for (Input inp : inputs) {
            outputList.add(buildResponse(inp));
        }
        return outputList;
    }

    private static Velo_AccessoriesResponse buildResponse(Input inp) {
        String key = (inp != null && String.isNotBlank(inp.modelKey))
            ? inp.modelKey.toLowerCase().trim().replace(' ', '_')
            : 'summit';

        Map<String, String> keyToName = new Map<String, String>{
            'summit'  => 'Velo Summit',
            'spark'   => 'Velo Spark',
            'tern'   => 'Velo Tern',
            'aero'  => 'Velo Aero',
            'pico'    => 'Velo Pico',
            'hawk' => 'Velo Hawk',
            'crest'   => 'Velo Crest',
            'nova'   => 'Velo Nova',
            'nova_ev'=> 'Velo Nova EV'
        };
        String modelName = keyToName.containsKey(key) ? keyToName.get(key) : 'Velo Summit';

        Velo_AccessoriesInfo info = new Velo_AccessoriesInfo();
        info.heading = 'Accessorize your ' + modelName;
        info.modelName = modelName;
        info.currencySymbol = '₹';
        // Official Velo Genuine Accessories are photographed on the Summit; reuse that hero banner.
        info.heroImageKey = 'hero_summit';
        info.items = buildCatalog();

        Velo_AccessoriesResponse resp = new Velo_AccessoriesResponse();
        resp.result = info;
        return resp;
    }

    /**
     * Velo Genuine Accessories catalog. Prices are indicative (INR) and image keys
     * map to files bundled in the veloAccessoryImages static resource.
     * NOTE: refined with official data/photos from the research pass.
     */
    private static List<Velo_AccessoryItem> buildCatalog() {
        List<Velo_AccessoryItem> items = new List<Velo_AccessoryItem>();
        items.add(item('roof_rack', 'Roof Rack', 'Exterior',
            'Sturdy roof-mounted carrier for extra luggage space on your adventures.', 'roof_rack', 6500, true));
        items.add(item('floor_mats', '3D Floor Mats', 'Interior',
            'Contoured, all-weather mats that cushion and protect the cabin floor.', 'floor_mats', 5200, true));
        items.add(item('body_cover', 'Body Cover', 'Protection',
            'Custom-fit cover that shields the car from dust, dirt and weather when parked.', 'body_cover', 2200, true));
        items.add(item('scuff_plates', 'Illuminated Scuff Plates', 'Styling',
            'Lighted, wireless door-sill plates for an elegant, welcoming entry.', 'scuff_plates', 4500, true));
        items.add(item('side_molding', 'Chrome Body Side Molding', 'Styling',
            'Stylish side protection with a sleek chrome finish.', 'side_molding', 2800, false));
        items.add(item('mud_flaps', 'Mud Flaps (Set of 4)', 'Protection',
            'Styled mud-splash guards that keep the body clean on any road.', 'mud_flaps', 1100, false));
        items.add(item('puddle_lamps', 'Puddle Lamps', 'Technology',
            'Projects light onto the ground at the door for safe entry at night.', 'puddle_lamps', 3200, false));
        items.add(item('door_visors', 'Door Visors (Chrome Insert)', 'Exterior',
            'Keeps rain out while elevating the door-edge aesthetics with a chrome insert.', 'door_visors', 2500, false));
        items.add(item('wheel_arch', 'Wheel Arch Cladding', 'Protection',
            'Protects wheel arches from stone-chips while enhancing the SUV stance.', 'wheel_arch', 3800, false));
        items.add(item('sunshades', 'Sunshades', 'Interior',
            'Blocks direct sunlight while maintaining clear driver visibility.', 'sunshades', 1500, false));
        items.add(item('safety_kit', 'Emergency Safety Kit', 'Utility',
            'Essential roadside recovery tools — tyre inflator, jack and wrench — in one kit.', 'safety_kit', 1800, false));
        items.add(item('car_perfume', 'Car Perfume', 'Interior',
            'Infuses the cabin with a refreshing, long-lasting scent.', 'car_perfume', 600, false));
        items.add(item('front_grille', 'Front Grille Add-on', 'Exterior',
            'Bold, sculpted front-grille accent for a stronger road presence.', 'front_grille', 4200, false));
        items.add(item('fast_charger', 'Fast Charger 160W', 'Technology',
            'Delivers rapid in-car charging for multiple devices at once.', 'fast_charger', 1400, false));
        return items;
    }

    private static Velo_AccessoryItem item(String id, String name, String category,
                                           String description, String imageKey,
                                           Decimal price, Boolean recommended) {
        Velo_AccessoryItem a = new Velo_AccessoryItem();
        a.id = id;
        a.name = name;
        a.category = category;
        a.description = description;
        a.imageKey = imageKey;
        a.priceAmount = price;
        a.recommended = recommended;
        return a;
    }
}
