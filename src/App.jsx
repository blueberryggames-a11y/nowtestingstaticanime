import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import Home from './pages/Home.jsx';
import Search from './pages/Search.jsx';
import AnimeDetails from './pages/AnimeDetails.jsx';
import Watch from './pages/Watch.jsx';
import Trending from './pages/Trending.jsx';
import Schedule from './pages/Schedule.jsx';
import Profile from './pages/Profile.jsx';
import Watchlist from './pages/Watchlist.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/anime/:id" element={<AnimeDetails />} />
          <Route path="/watch/:animeId" element={<Watch />} />
          <Route path="/watch/:animeId/:episode" element={<Watch />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </ErrorBoundary>
  );
}