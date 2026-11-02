/**
 * de_CampaignController
 * Data provider for the Partner Hub marketing components:
 *  - Active Campaigns rail (Content Marketplace)
 *  - Campaign detail (header, highlights, members)
 * Standard Campaign / CampaignMember objects.
 */
public with sharing class de_CampaignController {

    @AuraEnabled(cacheable=true)
    public static List<Campaign> getActiveCampaigns(Integer maxRows) {
        Integer lim = (maxRows == null || maxRows <= 0) ? 12 : Math.min(maxRows, 200);
        return [
            SELECT Id, Name, StartDate, EndDate, Type, Status
            FROM Campaign
            WHERE IsActive = true
            ORDER BY StartDate DESC
            LIMIT :lim
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Campaign getCampaign(Id campaignId) {
        if (campaignId == null) { return null; }
        List<Campaign> rows = [
            SELECT Id, Name, Type, Status, StartDate, EndDate,
                   NumberOfContacts, NumberOfLeads, NumberOfResponses, Description
            FROM Campaign
            WHERE Id = :campaignId
            LIMIT 1
        ];
        return rows.isEmpty() ? null : rows[0];
    }

    @AuraEnabled(cacheable=true)
    public static List<CampaignMember> getCampaignMembers(Id campaignId, Integer maxRows) {
        if (campaignId == null) { return new List<CampaignMember>(); }
        Integer lim = (maxRows == null || maxRows <= 0) ? 6 : Math.min(maxRows, 200);
        return [
            SELECT Id, Name, Status, Type, Title, CompanyOrAccount
            FROM CampaignMember
            WHERE CampaignId = :campaignId
            ORDER BY Name
            LIMIT :lim
        ];
    }
}
