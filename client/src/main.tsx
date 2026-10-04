import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import Home from './screens/Home';
import Conversation from './screens/Conversation';
import Phrases from './screens/Phrases';
import Replies from './screens/Replies';
import Teach from './screens/Teach';
import Helper from './screens/Helper';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/talk" element={<Conversation />} />
        <Route path="/phrases" element={<Phrases />} />
        <Route path="/replies" element={<Replies />} />
        <Route path="/teach" element={<Teach />} />
        <Route path="/helper" element={<Helper />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
