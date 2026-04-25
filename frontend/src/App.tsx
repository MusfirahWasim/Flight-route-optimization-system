import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FlightFinderPage from "./flight-route-finder";

function AppRoutes() {
  return (
    <Routes>
      {/* Main flight finder page */}
      <Route path="/" element={<FlightFinderPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
