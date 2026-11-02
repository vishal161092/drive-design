global class Velo_AccessoriesResponse {
    @InvocableVariable(label='Accessories' description='Rich accessories catalog for the chosen model')
    @AuraEnabled
    global Velo_AccessoriesInfo result;

    public Velo_AccessoriesResponse() {}
}
