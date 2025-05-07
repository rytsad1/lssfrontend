// src/App.jsx

import NavBar from "./components/navBar.jsx";
import AppRouter from "./router.jsx";
import Footer from "./components/footer.jsx";
import { ToastContainer } from "react-toastify";

const App = () => {
    return (
        <>
            <NavBar />
            <AppRouter />
            <Footer />
            <ToastContainer />
        </>
    );
};

export default App;
