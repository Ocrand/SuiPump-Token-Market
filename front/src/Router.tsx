import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./components/Board/HomePage.tsx";
import AboutPage from "./About.tsx";

import CreateCoinForm from "./components/CreateCoin/CreateCoin.tsx";

import Profile from "./components/Board/Profile/Profile.tsx";
import TradingApp from "./components/Trade/NewPage.tsx";
// import Query from "./components/QueryEvent.tsx";

export const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<CreateCoinForm />} />
      <Route path="/profile" element={<Profile />} />
      {/* <Route path="/trade/:description" element={<TradingApp />} /> */}
        <Route path="/trade/:hash" element={<TradingApp />} />
      {/*<Route path="/trade/:hash" element={<TradingApp />} />*/}
    </Routes>
  </BrowserRouter>
);
