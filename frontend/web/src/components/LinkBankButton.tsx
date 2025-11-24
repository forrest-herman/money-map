import { useCreateLinkTokenMutation } from "../utils/plaidApi";
import { LaunchLink } from "./LaunchLink";

/**
 * A button component that initiates the process of linking a bank account.
 *
 * When clicked, it calls the `useCreateLinkTokenMutation` hook to generate a Link token.
 * Once the token is received, it renders a `LaunchLink` component to continue the linking flow.
 *
 * @component
 * @returns {JSX.Element} The rendered button and, if available, the `LaunchLink` component.
 *
 * @example
 * <LinkBankButton />
 */
export const LinkBankButton = ({ accessToken }: { accessToken?: string }) => {
    const [createlink_token, { data: linkTokenObj, isLoading }] = useCreateLinkTokenMutation();
    const { link_token } = linkTokenObj ?? {};
    return (
        <div>
            <button onClick={() => createlink_token({ accessToken })} disabled={isLoading}>
                {accessToken ? "Re-link Bank" : "Link Bank"}
            </button>

            {link_token != null && link_token.length > 0 && (
                // Link will not render unless there is a link token
                <LaunchLink token={link_token} isUpdateMode={!!accessToken} />
            )}
        </div>
    );
};
