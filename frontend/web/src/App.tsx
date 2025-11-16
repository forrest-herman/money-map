import { Login } from "./components/Login";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoute";
import Layout from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { AccountsPage } from "./pages/AccountsPage";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* <Route path='/sign-up' element={<SignupScreen />} /> */}
                <Route path='/sign-in' element={<Login />} />
                <Route
                    path='/*'
                    element={
                        <PrivateRoute>
                            <Layout />
                        </PrivateRoute>
                    }
                >
                    <Route index element={<DashboardPage />} />
                    <Route path='accounts' element={<AccountsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
