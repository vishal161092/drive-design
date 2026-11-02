/**
 * de_PartnerHubController
 * Data provider for the Partner Hub people-centric pages:
 *  - Pipeline & Deal Registration (Leads / Referrals)
 *  - Your Customers & Contacts (Contacts / Leads / Accounts)
 * Standard Lead / Contact / Account objects.
 */
public with sharing class de_PartnerHubController {

    @AuraEnabled(cacheable=true)
    public static List<Lead> getLeads(Integer maxRows) {
        Integer lim = (maxRows == null || maxRows <= 0) ? 50 : Math.min(maxRows, 200);
        return [
            SELECT Id, Name, Phone, Email, Status, Company, LeadSource, CreatedDate, Owner.Name
            FROM Lead
            WHERE IsConverted = false
            ORDER BY CreatedDate DESC
            LIMIT :lim
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts(Integer maxRows) {
        Integer lim = (maxRows == null || maxRows <= 0) ? 50 : Math.min(maxRows, 200);
        return [
            SELECT Id, Name, Title, Email, Phone, Account.Name
            FROM Contact
            ORDER BY CreatedDate DESC
            LIMIT :lim
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Contact> searchContacts(String term) {
        String t = (term == null) ? '' : term.trim();
        if (t.length() == 0) {
            return getContacts(8);
        }
        String pattern = '%' + t + '%';
        return [
            SELECT Id, Name, Title, Email, Phone, Account.Name
            FROM Contact
            WHERE Name LIKE :pattern OR Account.Name LIKE :pattern OR Email LIKE :pattern
            ORDER BY Name
            LIMIT 8
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts(Integer maxRows) {
        Integer lim = (maxRows == null || maxRows <= 0) ? 50 : Math.min(maxRows, 200);
        return [
            SELECT Id, Name, Industry, Type, Phone, BillingCity, BillingState
            FROM Account
            ORDER BY CreatedDate DESC
            LIMIT :lim
        ];
    }
}
