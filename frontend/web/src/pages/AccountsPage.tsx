import { AccountList } from "../components/AccountsList";
import { LinkBankButton } from "../components/LinkBankButton";
import { useSyncTransactionsMutation } from "../utils/plaidApi";

export const AccountsPage = () => {
    const [sync, { isLoading }] = useSyncTransactionsMutation();
    return (
        <div>
            <h2>Accounts</h2>
            <p>Link another account</p>
            <LinkBankButton />
            <button onClick={() => sync()} disabled={isLoading}>
                {isLoading ? "Syncing..." : "Sync Data"}
            </button>
            <AccountList />
        </div>
    );
};
