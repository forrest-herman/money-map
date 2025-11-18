import { usePlaidLink } from "react-plaid-link";
import { useEffect } from "react";
import { useExchangePublicTokenMutation } from "../utils/plaidApi";

export const LaunchLink = ({ token }: { token: string }) => {
    const [exchangeToken] = useExchangePublicTokenMutation();

    const { open, ready } = usePlaidLink({
        token,
        onSuccess: async (public_token) => {
            // send public_token to server
            // Maybe dispatch a thunk instead?
            await exchangeToken({ public_token });
        },
    });

    useEffect(() => {
        ready && open();
    }, [ready, open, token]);

    return null;
};
