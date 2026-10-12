import { NavLink, type NavLinkProps } from 'react-router-dom';

/** NavLink có view transition (chuyển trang mượt trên WebView hỗ trợ) — như zaui-doctor. */
export default function TransitionLink(props: NavLinkProps) {
  return <NavLink {...props} viewTransition />;
}
