import { usePlaidLink } from "react-plaid-link";
import { useEffect } from "react";
import { useExchangePublicTokenMutation } from "../utils/plaidApi";

export const LaunchLink = ({ token, isUpdateMode = false }: { token: string; isUpdateMode?: boolean }) => {
    const [exchangeToken] = useExchangePublicTokenMutation();

    const { open, ready } = usePlaidLink({
        token,
        onSuccess: async (public_token) => {
            // send public_token to server
            // Maybe dispatch a thunk instead?

            if (isUpdateMode) console.log("Update mode, refreshed");
            // TODO: invalidate Item & Account Tags for update mode
            else await exchangeToken({ public_token });
        },
    });

    useEffect(() => {
        ready && open();
    }, [ready, open, token]);

    return null;
};
