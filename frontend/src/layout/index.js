// Dateiname: src/layout/index.js

// Exportiert alle Komponenten für einfachen Import an anderer Stelle
export { default as Topbar } from './Topbar';
export { default as TopbarMenuItems } from './TopbarMenuItems';
export { default as TopbarDropdownMenu } from './TopbarDropdownMenu';
export { default as useEnvironmentData } from './TopbarEnvironmentHook';
export { 
  defaultDesignOptions,
  traceData,
  financeData,
  wawiData,
  securityData
} from './TopbarConfig';