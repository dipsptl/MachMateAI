import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import DemoTour from './demo/DemoTour.tsx';
import './index.css';

const isDemo = new URLSearchParams(window.location.search).get('mode') === 'demo';

createRoot(document.getElementById('root')!).render(isDemo ? <DemoTour /> : <App />);
