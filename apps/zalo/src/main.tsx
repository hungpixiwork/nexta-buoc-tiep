import React from 'react';
import { createRoot } from 'react-dom/client';
import 'zmp-ui/zaui.css';
import './styles.css';
import App from './app';
import appConfig from '../app-config.json';

// zmp-sdk đọc cấu hình app từ window.APP_CONFIG khi chạy dev ngoài Zalo.
if (!window.APP_CONFIG) window.APP_CONFIG = appConfig as unknown as typeof window.APP_CONFIG;

createRoot(document.getElementById('app')!).render(React.createElement(App));
