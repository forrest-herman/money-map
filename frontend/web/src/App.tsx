import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Login } from "./components/Login";
import supabase from "./utils/supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useGetSessionQuery } from "./utils/supabaseApi";
import { useCreateLinkTokenMutation } from "./utils/backendApi";
import { LaunchLink } from "./components/LaunchLink";

function App() {
    const { data: session } = useGetSessionQuery();

    const [createlink_token, { data: linkTokenObj, isLoading }] = useCreateLinkTokenMutation();
    const { link_token } = linkTokenObj ?? {};

    if (!session) return <Login />;
    // <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />;
    else
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
}

export default App;
