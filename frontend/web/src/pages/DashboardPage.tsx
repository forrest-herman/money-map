import { LinkBankButton } from "../components/LinkBankButton";
import { Login } from "../components/Login";
import { useGetSessionQuery } from "../utils/supabaseApi";

export const DashboardPage = () => {
    const { data: session } = useGetSessionQuery();

    if (!session) return <Login />;

    const linkedInstitutions = [];

    if (linkedInstitutions.length === 0)
        return (
            <div>
                <h2>Welcome {session.user.email}</h2>
                <p>Link your first account now!</p>
                <LinkBankButton />
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
