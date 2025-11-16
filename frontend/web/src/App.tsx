import { Login } from "./components/Login";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoute";
import Layout from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { AccountsPage } from "./pages/AccountsPage";
import { TransactionsPage } from "./pages/TransactionsPage";

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
                    <Route path='transactions' element={<TransactionsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
