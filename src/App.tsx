import { HashRouter, useRoutes } from "react-router-dom";
import { routes } from "./routes";

/**
 * App root. HashRouter keeps deep links working on GitHub Pages (no server
 * rewrite needed); the route table is defined in {@link routes}.
 */
function AppRoutes(): React.JSX.Element | null {
  return useRoutes(routes);
}

export function App(): React.JSX.Element {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
