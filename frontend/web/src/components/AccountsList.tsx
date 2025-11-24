import { useGetAccountsQuery, useGetInstitutionsQuery } from "../utils/userApi";
import { LinkBankButton } from "./LinkBankButton";

export const AccountList = () => {
    const { data: accounts, isLoading: isAccountsLoading } = useGetAccountsQuery();
    const { data: institutions, isLoading: isInstitutionsLoading } = useGetInstitutionsQuery();

    if (isAccountsLoading || isInstitutionsLoading) return <div>Loading...</div>;

    // TODO: use utility
    const getBankNameByItemId = (itemId: string) => {
        const bank = institutions?.find((institution) => institution.item_id === itemId);
        return bank?.institution_name;
    };

    const getInstitutionByItemId = (itemId: string) => {
        return institutions?.find((institution) => institution.item_id === itemId);
    };

    if (!accounts || accounts?.length === 0) return <div>No accounts found</div>;

    return accounts?.map((account) => {
        const { plaid_status: linkStatus, access_token: accessToken } = getInstitutionByItemId(account.item_id) ?? {};

        return (
            <div key={account.id}>
                <h3>{getBankNameByItemId(account.item_id) + " " + account.official_name}</h3>
                {linkStatus && <LinkBankButton accessToken={accessToken} />}
                <div key={account.id} style={{ display: "flex", flex: 1, flexDirection: "row", gap: 100 }}>
                    <div>
                        <h5>{account.name}</h5>
                        <h4>{account.type}</h4>
                        <h4>{account.subtype}</h4>
                        <h4>{new Date(account.created_at ?? "").toLocaleDateString()}</h4>
                    </div>
                    <div>
                        <h4>Limit ${account.balances?.limit}</h4>
                        <h4>Current ${account.balances?.current}</h4>
                        <h4>Available ${account.balances?.available}</h4>
                        <h4>{new Date(account.updated_at).toLocaleDateString()}</h4>
                    </div>
                </div>
            </div>
        );
    });
};
