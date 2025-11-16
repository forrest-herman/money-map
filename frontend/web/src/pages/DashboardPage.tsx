import { LaunchLink } from "../components/LaunchLink";
import { Login } from "../components/Login";
import { useCreateLinkTokenMutation } from "../utils/plaidApi";
import { useGetSessionQuery } from "../utils/supabaseApi";

export const DashboardPage = () => {
    const { data: session } = useGetSessionQuery();

    const [createlink_token, { data: linkTokenObj, isLoading }] = useCreateLinkTokenMutation();
    const { link_token } = linkTokenObj ?? {};

    console.log("session token", session?.access_token); // TODO: remove

    if (!session) return <Login />;

    const linkedInstitutions = [];

    if (linkedInstitutions.length === 0)
        return (
            <div>
                <h2>Welcome {session.user.email}</h2>
                <button onClick={() => createlink_token()} disabled={isLoading}>
                    Link Bank
                </button>

                {link_token != null && link_token.length > 0 && (
                    // Link will not render unless there is a link token
                    <LaunchLink token={link_token} />
                )}
            </div>
        );

    return (
        <div>
            <h2>Welcome {session.user.email}</h2>

            <p>You have linked {linkedInstitutions.length} banks.</p>
            <h4>Total spending this month: </h4>
            <h2>$1403</h2>

            <h4>Total income this month: </h4>
            <h2>$2513</h2>
        </div>
    );
};
