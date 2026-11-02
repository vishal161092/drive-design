global class Velo_DealerListAction {

    global class Input {
        @InvocableVariable(required=false description='City to find Velo dealers in, e.g. "Mumbai", "Pune", "Delhi". Defaults to Mumbai.')
        global String city;
    }

    @InvocableMethod(
        label='Get Velo Dealers'
        description='Returns a list of nearby Velo dealers (name, category, address, phone, Google Maps link) for the veloDealerList lightning type.'
    )
    global static List<Velo_DealerListResponse> getDealers(List<Input> inputs) {
        List<Velo_DealerListResponse> outputList = new List<Velo_DealerListResponse>();
        if (inputs == null || inputs.isEmpty()) {
            outputList.add(buildResponse(null));
            return outputList;
        }
        for (Input inp : inputs) {
            outputList.add(buildResponse(inp));
        }
        return outputList;
    }

    private static Velo_DealerItem makeDealer(String name, String category, String address, String phone, String city) {
        Velo_DealerItem d = new Velo_DealerItem();
        d.name = name;
        d.category = category;
        d.address = address;
        d.phone = phone;
        String query = EncodingUtil.urlEncode(name + ' ' + city, 'UTF-8');
        d.mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + query;
        return d;
    }

    private static Velo_DealerListResponse buildResponse(Input inp) {
        String city = (inp != null && String.isNotBlank(inp.city))
            ? inp.city.trim()
            : 'Mumbai';

        Velo_DealerListInfo info = new Velo_DealerListInfo();
        info.heading = 'Velo dealers near ' + city;
        info.dealers = new List<Velo_DealerItem>{
            makeDealer(
                'Summit Auto Velo',
                'Sales & Service',
                'Plot 12, Western Express Highway, Andheri East, ' + city,
                '+91 90000 00001',
                city
            ),
            makeDealer(
                'Harbor Velo Motors',
                'Sales, Service & Spares',
                '45 M.G. Road, Near City Mall, ' + city,
                '+91 90000 00002',
                city
            ),
            makeDealer(
                'Metro Velo Arena',
                'New Car Showroom',
                '8 Ring Road, Central Business District, ' + city,
                '+91 90000 00003',
                city
            )
        };

        Velo_DealerListResponse resp = new Velo_DealerListResponse();
        resp.result = info;
        return resp;
    }
}
