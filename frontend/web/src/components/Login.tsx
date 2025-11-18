import { useState } from "react";
import supabase from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const handleSignIn = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            alert(error.message);
            return;
        }

        alert("Login successful!");
        navigate("/");
        console.log("Supabase user ID:", data.user?.id);
    };

    const handleSignUp = async () => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) {
            alert(error.message);
            return;
        }

        alert("Sign up successful!");
        navigate("/");
        console.log("Supabase user ID:", data.user?.id);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Email' />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Password' type='password' />
            <button onClick={handleSignIn}>Log In</button>
            <p>No account?</p>
            <button onClick={handleSignUp}>Register</button>
        </div>
    );
};
