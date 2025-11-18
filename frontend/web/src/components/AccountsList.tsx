import { useGetAccountsQuery, useGetInstitutionsQuery } from "../utils/userApi";

export const AccountList = () => {
    const { data: accounts, isLoading: isAccountsLoading } = useGetAccountsQuery();
    const { data: institutions, isLoading: isInstitutionsLoading } = useGetInstitutionsQuery();

    if (isAccountsLoading || isInstitutionsLoading) return <div>Loading...</div>;

    const getBankNameByItemId = (itemId: string) => {
        const bank = institutions?.find((institution) => institution.item_id === itemId);
        return bank.institution_name;
    };

    if (!accounts || accounts?.length === 0) return <div>No accounts found</div>;

    return accounts?.map((account) => {
        return (
            <div>
                <h3>{getBankNameByItemId(account.item_id) + " " + account.official_name}</h3>
                <div key={account.id} style={{ display: "flex", flex: 1, flexDirection: "row", gap: 100 }}>
                    <div>
                        <h5>{account.name}</h5>
                        <h4>{account.type}</h4>
                        <h4>{account.subtype}</h4>
                        <h4>{new Date(account.created_at).toLocaleDateString()}</h4>
                    </div>
                    <div>
                        <h4>Limit ${account.balances.limit}</h4>
                        <h4>Current ${account.balances.current}</h4>
                        <h4>Available ${account.balances.available}</h4>
                        <h4>{new Date(account.updated_at).toLocaleDateString()}</h4>
                    </div>
                </div>
            </div>
        );
    });
};
