global class Velo_BookingOptionsAction {

    global class Input {
        @InvocableVariable(required=false description='Type of options to render: "variant", "color", or "accessory". Defaults to "variant".')
        global String optionType;
    }

    @InvocableMethod(
        label='Get Velo Booking Options'
        description='Returns a set of selectable booking options (variants, colours, or accessories) for a Velo vehicle, rendered by the veloBookingOptions lightning type.'
    )
    global static List<Velo_BookingOptionsResponse> getBookingOptions(List<Input> inputs) {
        List<Velo_BookingOptionsResponse> outputList = new List<Velo_BookingOptionsResponse>();
        if (inputs == null || inputs.isEmpty()) {
            outputList.add(buildResponse(null));
            return outputList;
        }
        for (Input inp : inputs) {
            outputList.add(buildResponse(inp));
        }
        return outputList;
    }

    private static Velo_BookingOptionsResponse buildResponse(Input inp) {
        String type = (inp != null && String.isNotBlank(inp.optionType))
            ? inp.optionType.toLowerCase().trim()
            : 'variant';

        Velo_BookingOptionsInfo info = new Velo_BookingOptionsInfo();

        switch on type {
            when 'color', 'colour' {
                info.heading = 'Choose a colour';
                info.prompt = 'Which colour would you like for your Velo?';
                info.options = new List<Velo_BookingOption>{
                    new Velo_BookingOption('Polar White', 'Classic pearlescent white', 'Polar White'),
                    new Velo_BookingOption('Slate Grey', 'Sporty matte-look grey', 'Slate Grey'),
                    new Velo_BookingOption('Flame Red', 'Vibrant metallic red', 'Flame Red'),
                    new Velo_BookingOption('Calgary White', 'Cool crisp white', 'Calgary White'),
                    new Velo_BookingOption('Onyx Black', 'Deep gloss black', 'Onyx Black'),
                    new Velo_BookingOption('Cosmic Gold', 'Premium champagne gold', 'Cosmic Gold')
                };
            }
            when 'accessory', 'accessories' {
                info.heading = 'Add accessories';
                info.prompt = 'Which accessories would you like to add to your Velo?';
                info.options = new List<Velo_BookingOption>{
                    new Velo_BookingOption('Floor Mats', 'All-weather premium floor mats', 'Floor Mats'),
                    new Velo_BookingOption('Body Cover', 'Custom-fit protective body cover', 'Body Cover'),
                    new Velo_BookingOption('Seat Covers', 'Tailored leatherette seat covers', 'Seat Covers'),
                    new Velo_BookingOption('Roof Rails', 'Functional roof rails for extra luggage', 'Roof Rails'),
                    new Velo_BookingOption('Mud Flaps', 'Front and rear mud flaps', 'Mud Flaps'),
                    new Velo_BookingOption('Ambient Lighting', 'Multi-colour cabin ambient lighting', 'Ambient Lighting')
                };
            }
            when else {
                info.heading = 'Choose a variant';
                info.prompt = 'Which variant would you like to explore?';
                info.options = new List<Velo_BookingOption>{
                    new Velo_BookingOption('Base', 'Essential features, great value', 'Base'),
                    new Velo_BookingOption('Plus', 'Everyday comfort and convenience', 'Plus'),
                    new Velo_BookingOption('Style', 'Style and tech upgrades', 'Style'),
                    new Velo_BookingOption('Signature', 'Premium comfort and safety', 'Signature'),
                    new Velo_BookingOption('Elite', 'Top-of-the-line, fully loaded', 'Elite')
                };
            }
        }

        Velo_BookingOptionsResponse resp = new Velo_BookingOptionsResponse();
        resp.result = info;
        return resp;
    }
}
